'use strict';

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { PROOF_FIXTURE_MODE } = require("./fipIntakeService");
const { SCHEMA_VERSION: MANIFEST_SCHEMA } = require("./scoutContextHandoffProof");
const { computeSubmittedBodyHash } = require("./fipIntakeM2MAuthenticator");

const soccerGovernor = require("../governance/soccer-governor/governor");

const RULEBOOK_ID = "SKCS_SHARED_D1_RULEBOOK_V2";
const RULEBOOK_SHA256 = "9aaeccc92f8be4598ac88c6cafb2a7975ce2b0db13c5d816a2855a2af01ad22c";
const RULEBOOK_PATH = path.join(__dirname, "../config/edgeD1Rulebook.v2.json");

function loadRulebook() {
  const text = fs.readFileSync(RULEBOOK_PATH, "utf8").replace(/\r\n/g, "\n");
  const hash = createHash("sha256").update(text).digest("hex");
  if (hash !== RULEBOOK_SHA256) throw new Error("EDGE_D1_RULEBOOK_INTEGRITY_FAILED");
  const rulebook = JSON.parse(text);
  if (rulebook.rulebook_id !== RULEBOOK_ID) throw new Error("EDGE_D1_RULEBOOK_INTEGRITY_FAILED");
  return rulebook;
}

// Keep the calculation in parity with the governed Scout v2 implementation.
function round2(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function normalizeName(value) { return String(value || "").trim().toLowerCase(); }

function formPoints(form) {
  if (!Array.isArray(form)) return null;
  let points = 0;
  for (const raw of form) {
    const result = String(raw || "").trim().toUpperCase();
    if (result === "W") points += 3;
    else if (result === "D") points += 1;
    else if (result !== "L") return null;
  }
  return { matches: form.length, points };
}
function recentFormScore(form) {
  const parsed = formPoints(form);
  if (!parsed || parsed.matches < 1) return null;
  return clamp((2 * (parsed.points / (3 * parsed.matches))) - 1, -1, 1);
}
function seasonMetrics(summary) {
  if (!summary || typeof summary !== "object") return null;
  const won = Number(summary.won), drawn = Number(summary.drawn), lost = Number(summary.lost);
  const goalsFor = Number(summary.goals_for), goalsAgainst = Number(summary.goals_against);
  if (![won, drawn, lost, goalsFor, goalsAgainst].every(Number.isFinite)) return null;
  const played = won + drawn + lost;
  if (played <= 0) return null;
  const points = (won * 3) + drawn;
  return {
    played,
    points_score: clamp((2 * (points / (3 * played))) - 1, -1, 1),
    goal_difference_score: Math.tanh(((goalsFor - goalsAgainst) / played) / 1.5)
  };
}
function h2hSignal(h2h, homeName, awayName) {
  if (!h2h || typeof h2h !== "object") return null;
  const played = Number(h2h.played), won = Number(h2h.won), lost = Number(h2h.lost);
  if (![played, won, lost].every(Number.isFinite) || played < 1) return null;
  const perspective = normalizeName(h2h.perspective_team);
  const home = normalizeName(homeName), away = normalizeName(awayName);
  if (perspective !== home && perspective !== away) return null;
  return { perspective: perspective === home ? "home" : "away", score: clamp((won - lost) / played, -1, 1), played };
}

function softmax(logits) {
  const max = Math.max(...Object.values(logits));
  const exps = Object.fromEntries(Object.entries(logits).map(([key, value]) => [key, Math.exp(value - max)]));
  const total = Object.values(exps).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(exps).map(([key, value]) => [key, value / total]));
}
function roundedProbabilities(probabilities) {
  const rounded = Object.fromEntries(Object.entries(probabilities).map(([key, value]) => [key, round2(value * 100)]));
  const total = Object.values(rounded).reduce((sum, value) => sum + value, 0);
  const top = Object.entries(rounded).sort((a, b) => b[1] - a[1])[0][0];
  rounded[top] = round2(rounded[top] + (100 - total));
  return rounded;
}
function confidenceBand(pct, bands) {
  if (pct >= bands.low_risk_min_pct) return "low_risk";
  if (pct >= bands.medium_risk_min_pct) return "medium_risk";
  if (pct >= bands.high_risk_min_pct) return "high_risk";
  return "extreme_risk";
}
function selectDoubleChance(probabilities, primaryOutcome, primaryConfidence, rulebook) {
  const secondary = rulebook.decision_rules.secondary_double_chance;
  const market = secondary.market_by_primary[primaryOutcome];
  if (!market || !Number.isFinite(primaryConfidence)) return null;

  const probabilityPct = (probabilities[primaryOutcome] + probabilities.draw) * 100;
  const confidencePct = Math.min(round2(probabilityPct), rulebook.safety.uncalibrated_confidence_cap_pct);
  if (probabilityPct < secondary.minimum_confidence_pct || confidencePct <= primaryConfidence) return null;
  return { market, probability_pct: round2(probabilityPct), confidence_pct: confidencePct };
}

function abstain(reason, details = {}) {
  return { status: "ABSTAIN", outcome: null, confidence_pct: null,
    confidence_band: null, probabilities_pct: null, reason, details };
}

function scoreVerifiedFacts(input, rb) {
  const fixture = input.fixture || {};
  if (fixture.sport !== rb.scope.sport || fixture.competition_id !== rb.scope.competition_id ||
      fixture.competition !== rb.scope.competition) return abstain("UNSUPPORTED_SCOPE");
  const homeName = fixture.home_team?.name, awayName = fixture.away_team?.name;
  if (!fixture.canonical_fixture_id || !homeName || !awayName) return abstain("MISSING_FIXTURE_IDENTITY");
  const homeForm = formPoints(input.team_form?.home?.current_form);
  const awayForm = formPoints(input.team_form?.away?.current_form);
  const homeSeason = seasonMetrics(input.team_form?.home?.season_summary);
  const awaySeason = seasonMetrics(input.team_form?.away?.season_summary);
  const minForm = rb.evidence_requirements.minimum_recent_form_matches;
  const minSeason = rb.evidence_requirements.minimum_season_matches;
  if (!homeForm || !awayForm || homeForm.matches < minForm || awayForm.matches < minForm || !homeSeason || !awaySeason || homeSeason.played < minSeason || awaySeason.played < minSeason) {
    return abstain("INSUFFICIENT_GOVERNED_EVIDENCE", { minimum_recent_form_matches: minForm, minimum_season_matches: minSeason });
  }
  const w = rb.feature_weights;
  const homeRecent = recentFormScore(input.team_form.home.current_form);
  const awayRecent = recentFormScore(input.team_form.away.current_form);
  let homeStrength = (w.recent_form * homeRecent) + (w.season_points * homeSeason.points_score) + (w.goal_difference * homeSeason.goal_difference_score) + w.home_advantage;
  let awayStrength = (w.recent_form * awayRecent) + (w.season_points * awaySeason.points_score) + (w.goal_difference * awaySeason.goal_difference_score);
  const h2h = h2hSignal(input.h2h, homeName, awayName);
  if (h2h) {
    const contribution = w.h2h * h2h.score;
    if (h2h.perspective === "home") { homeStrength += contribution; awayStrength -= contribution; }
    else { awayStrength += contribution; homeStrength -= contribution; }
  }
  const delta = homeStrength - awayStrength;
  const probabilities = softmax({ home_win: delta, draw: 0.15 - (0.8 * Math.abs(delta)), away_win: -delta });
  const ordered = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const outcome = ordered[0][0];
  const rawTopPct = ordered[0][1] * 100;
  const confidencePct = Math.min(round2(rawTopPct), rb.safety.uncalibrated_confidence_cap_pct);
  if (rawTopPct < rb.safety.minimum_prediction_confidence_pct) {
    return abstain("BELOW_MINIMUM_CONFIDENCE", { raw_top_probability_pct: round2(rawTopPct) });
  }
  if (!rb.decision_rules.primary_eligible_outcomes.includes(outcome)) {
    return abstain("STANDALONE_DRAW_INELIGIBLE");
  }
  return {
    status: "PREDICTION_READY",
    outcome,
    confidence_pct: confidencePct,
    raw_top_probability_pct: round2(rawTopPct),
    confidence_band: confidenceBand(confidencePct, rb.safety.confidence_bands),
    probabilities_pct: roundedProbabilities(probabilities),
    secondary_double_chance: selectDoubleChance(probabilities, outcome, confidencePct, rb),
    reason: null
  };
}

async function runEdgeD1Proof(intake, manifest, context, beforeScoring) {
  if (context?.governedMode !== PROOF_FIXTURE_MODE || manifest?.schema_version !== MANIFEST_SCHEMA) {
    return { decision: abstain("EDGE_D1_PROOF_MODE_REQUIRED") };
  }
  const receipt = await intake.receiveValidatedFip(manifest, context);
  const handoff = receipt?.context_handoff;
  if (receipt?.accepted !== true || !handoff || receipt.idempotency_key !== manifest.evidence_sha256 ||
      handoff.handoff_sha256 !== manifest.handoff_sha256 ||
      handoff.source_package_sha256 !== manifest.source_package_sha256) {
    return { decision: abstain("EDGE_D1_VERIFIED_SCOUT_FACTS_REQUIRED",
      { rejection_code: receipt?.rejection_code ?? null }) };
  }

  let rulebook;
  try {
    rulebook = loadRulebook();
  } catch {
    return { decision: abstain("EDGE_D1_RULEBOOK_INTEGRITY_FAILED") };
  }

  // Feed the model only the factual feature groups required by v2.
  const facts = { fixture: handoff.fixture, team_form: handoff.context?.team_form, h2h: handoff.context?.h2h };
  const fixture = Object.freeze({
    fixture_id: facts.fixture?.canonical_fixture_id ?? null,
    kickoff_at: facts.fixture?.kickoff_at ?? null,
    home_team: facts.fixture?.home_team?.name ?? null,
    away_team: facts.fixture?.away_team?.name ?? null
  });
  if (beforeScoring && !await beforeScoring(fixture)) {
    return { decision: abstain("EDGE_D1_PREMATCH_FIXTURE_REQUIRED") };
  }
  let decision = scoreVerifiedFacts(facts, rulebook);
  if (decision.status === "PREDICTION_READY") {
    const selections = [{ market: "1X2", prediction: decision.outcome }];
    if (decision.secondary_double_chance) selections.push({ market: decision.secondary_double_chance.market });
    const coherence = soccerGovernor.evaluateSelections(facts.fixture, selections);
    if (!coherence.compatible) decision = abstain(coherence.reason);
  }
  return {
    soccer_governor: soccerGovernor.identity,
    scope: "LOCAL_HISTORICAL_PROOF_ONLY",
    fixture_id: fixture.fixture_id,
    fixture,
    provenance: { source_package_sha256: handoff.source_package_sha256,
      handoff_sha256: handoff.handoff_sha256, evidence_sha256: receipt.idempotency_key },
    rulebook: { id: RULEBOOK_ID, sha256: RULEBOOK_SHA256 },
    decision
  };
}

const SEAL_VERSION = "edge-d1-prediction-seal-v1";
const COMMITMENT_ID = /^[a-f0-9]{64}$/;

function snapshotJson(value) {
  return JSON.parse(JSON.stringify(value, (_, field) => {
    if (["undefined", "function", "symbol"].includes(typeof field) ||
        (typeof field === "number" && !Number.isFinite(field))) {
      throw new TypeError("EDGE_D1_SEAL_REQUIRES_JSON");
    }
    return field;
  }));
}

function freezeJson(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freezeJson);
    Object.freeze(value);
  }
  return value;
}

async function runSealedEdgeD1Proof(intake, manifest, context, clock, { beforeScoring, recommendationMarket } = {}) {
  const prediction = await runEdgeD1Proof(intake, manifest, context, beforeScoring);
  if (prediction.decision.status !== "PREDICTION_READY") return { prediction, seal: null };

  if (recommendationMarket !== undefined && recommendationMarket !== "1X2" &&
      recommendationMarket !== prediction.decision.secondary_double_chance?.market) {
    return { prediction: { decision: abstain("EDGE_D1_RECOMMENDATION_NOT_ELIGIBLE") }, seal: null };
  }

  const timestamp = clock?.now();
  if (typeof timestamp !== "string" || !Number.isFinite(Date.parse(timestamp))) {
    throw new TypeError("EDGE_D1_SEAL_INVALID_COMMITMENT_TIME");
  }
  if (!(Date.parse(timestamp) < Date.parse(prediction.fixture.kickoff_at))) {
    return { prediction: { decision: abstain("EDGE_D1_PREMATCH_FIXTURE_REQUIRED") }, seal: null };
  }
  const payload = freezeJson(snapshotJson({
    schema_version: SEAL_VERSION,
    committed_at: new Date(timestamp).toISOString(),
    ...(recommendationMarket === undefined ? {} : { recommendation_market: recommendationMarket }),
    prediction
  }));
  const seal = Object.freeze({ commitment_id: computeSubmittedBodyHash(payload), payload });
  return { prediction: payload.prediction, seal };
}

// The caller must pin the original ID before Scout comparison. The submitted seal
// cannot nominate the ID it is checked against.
function verifyEdgeD1Seal(seal, expectedCommitmentId) {
  if (typeof expectedCommitmentId !== "string" || !COMMITMENT_ID.test(expectedCommitmentId) ||
      seal?.commitment_id !== expectedCommitmentId) return null;
  try {
    const payload = snapshotJson(seal.payload);
    if (payload?.schema_version !== SEAL_VERSION || computeSubmittedBodyHash(payload) !== expectedCommitmentId) {
      return null;
    }
    return freezeJson(payload);
  } catch {
    return null;
  }
}

const OUTCOMES = ["home_win", "draw", "away_win"];
const REVIEW_POLICY_ID = "EDGE_D1_EXACT_MATCH_V1";

function isPercent(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function isComparableDecision(decision) {
  if (decision?.status !== "PREDICTION_READY" ||
      !["home_win", "away_win"].includes(decision.outcome) || !isPercent(decision.confidence_pct)) return false;

  const probabilities = decision.probabilities_pct;
  if (!probabilities || Object.keys(probabilities).length !== OUTCOMES.length ||
      !OUTCOMES.every(outcome => isPercent(probabilities[outcome])) ||
      round2(OUTCOMES.reduce((total, outcome) => total + probabilities[outcome], 0)) !== 100) return false;

  const secondary = decision.secondary_double_chance;
  return secondary === null || (["double_chance_1x", "double_chance_x2"].includes(secondary?.market) &&
    isPercent(secondary.confidence_pct) && isPercent(secondary.probability_pct));
}

// The trusted local proof caller retains the original ID before obtaining the Scout result.
function createEdgeD1ComparisonProof(originalCommitmentId, readScoutShadow) {
  if (typeof originalCommitmentId !== "string" || !COMMITMENT_ID.test(originalCommitmentId) ||
      typeof readScoutShadow !== "function") throw new TypeError("EDGE_D1_COMPARISON_INPUT_REQUIRED");

  return async function compare(submittedSeal) {
    const blocked = reason => freezeJson({
      status: "COMPARISON_BLOCKED", commitment_id: originalCommitmentId, reason,
      review: { policy_id: REVIEW_POLICY_ID, verdict: "RED", reason, action: "REVIEW_REQUIRED" }
    });
    const verified = verifyEdgeD1Seal(submittedSeal, originalCommitmentId);
    const edge = verified?.prediction;
    if (edge?.scope !== "LOCAL_HISTORICAL_PROOF_ONLY" || !edge.fixture_id ||
        edge.rulebook?.id !== RULEBOOK_ID || edge.rulebook.sha256 !== RULEBOOK_SHA256 ||
        !COMMITMENT_ID.test(edge.provenance?.source_package_sha256) ||
        !isComparableDecision(edge.decision)) return blocked("EDGE_D1_ORIGINAL_SEAL_REQUIRED");

    if (!Object.keys(soccerGovernor.identity).every(key => edge.soccer_governor?.[key] === soccerGovernor.identity[key])) return blocked("SOCCER_GOVERNOR_VERSION_MISMATCH");
    const sourcePackageHash = edge.provenance.source_package_sha256;
    let scout;
    try {
      scout = await readScoutShadow(Object.freeze({
        fixture_id: edge.fixture_id, source_package_sha256: sourcePackageHash,
        rulebook_id: RULEBOOK_ID, rulebook_sha256: RULEBOOK_SHA256
      }));
    } catch {
      return blocked("SCOUT_SHADOW_UNAVAILABLE");
    }
    if (scout?.visibility !== "PRIVATE_QC_ONLY" || !isComparableDecision(scout.decision)) {
      return blocked("SCOUT_SHADOW_UNAVAILABLE");
    }
    if (scout.fixture?.canonical_fixture_id !== edge.fixture_id ||
        scout.provenance?.source_package_sha256 !== sourcePackageHash ||
        scout.rulebook?.id !== RULEBOOK_ID || scout.rulebook.sha256 !== RULEBOOK_SHA256 ||
        scout.provenance?.edge_prediction_seen !== false || scout.provenance?.scout_facts_only !== true) {
      return blocked("SCOUT_SHADOW_BINDING_MISMATCH");
    }

    if (!Object.keys(soccerGovernor.identity).every(key => scout.soccer_governor?.[key] === soccerGovernor.identity[key])) return blocked("SOCCER_GOVERNOR_VERSION_MISMATCH");
    const primary = edge.decision;
    const shadow = scout.decision;
    const gap = (left, right) => round2(Math.abs(round2(left) - round2(right)));
    const primarySecondary = primary.secondary_double_chance;
    const shadowSecondary = shadow.secondary_double_chance;
    const differences = {
      outcome_matches: primary.outcome === shadow.outcome,
      confidence_gap_pct: gap(primary.confidence_pct, shadow.confidence_pct),
      probabilities_gap_pct: Object.fromEntries(OUTCOMES.map(outcome => [outcome,
        gap(primary.probabilities_pct[outcome], shadow.probabilities_pct[outcome])])),
      secondary_market_matches: primarySecondary?.market === shadowSecondary?.market,
      secondary_confidence_gap_pct: primarySecondary && shadowSecondary
        ? gap(primarySecondary.confidence_pct, shadowSecondary.confidence_pct) : null,
      secondary_probability_gap_pct: primarySecondary && shadowSecondary
        ? gap(primarySecondary.probability_pct, shadowSecondary.probability_pct) : null
    };
    const canonicalReview = soccerGovernor.reviewDifferences(differences);

    return freezeJson({
      status: "COMPARISON_COMPLETE",
      commitment_id: originalCommitmentId,
      fixture_id: edge.fixture_id,
      source_package_sha256: sourcePackageHash,
      rulebook: { id: RULEBOOK_ID, sha256: RULEBOOK_SHA256 },
      differences,
      review: canonicalReview,
      soccer_governor: soccerGovernor.identity
    });
  };
}

const SAST_FIXTURE_DATE = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit"
});

async function checkUpcomingFixture(fixture, clock, readVerifiedFixture) {
  const kickoff = Date.parse(fixture.kickoff_at);
  if (!fixture.fixture_id || !fixture.home_team || !fixture.away_team ||
      !(Date.parse(clock.now()) < kickoff)) return null;

  let current;
  try {
    current = await readVerifiedFixture(fixture.fixture_id);
  } catch {
    return null;
  }
  const checkedAt = clock.now();
  if (current?.fixture_id !== fixture.fixture_id || current.status !== "scheduled" ||
      Date.parse(current.kickoff_at) !== kickoff || !(Date.parse(checkedAt) < kickoff)) return null;
  return new Date(checkedAt).toISOString();
}

// This isolated handoff prepares products. The governed writer assigns real final IDs
// and rechecks the fixture cutoff within the publication transaction.
async function runPendingEdgeD1Proof(intake, manifest, context,
  { clock, readVerifiedFixture, readScoutShadow, recommendationMarket }) {
  const blocked = reason => Object.freeze({ status: "PENDING_HANDOFF_BLOCKED", reason });
  if (typeof recommendationMarket !== "string" || !recommendationMarket) {
    return blocked("EDGE_D1_OFFICIAL_RECOMMENDATION_REQUIRED");
  }
  const checkUpcoming = fixture => checkUpcomingFixture(fixture, clock, readVerifiedFixture);
  const { prediction, seal } = await runSealedEdgeD1Proof(intake, manifest, context, clock,
    { beforeScoring: checkUpcoming, recommendationMarket });
  if (!seal) return blocked(prediction.decision.reason);

  const compare = createEdgeD1ComparisonProof(seal.commitment_id, readScoutShadow);
  const comparison = await compare(seal);
  if (comparison.review.verdict !== "GREEN") return blocked(comparison.review.reason);

  const preparedAt = await checkUpcoming(prediction.fixture);
  if (!preparedAt) return blocked("EDGE_D1_PREMATCH_FIXTURE_REQUIRED");

  const { fixture, decision } = prediction;
  const common = {
    event_id: fixture.fixture_id, sport: "football", prediction_tier: "normal",
    prediction_match_index: 0, home_team: fixture.home_team, away_team: fixture.away_team,
    fixture_date: SAST_FIXTURE_DATE.format(new Date(fixture.kickoff_at)),
    event_status: "pending", resolution_status: "pending", is_correct: null
  };
  const market = seal.payload.recommendation_market;
  const secondary = decision.secondary_double_chance;
  const product = market === "1X2" ? {
    ...common, prediction_type: "direct", market,
    predicted_outcome: decision.outcome, confidence: decision.confidence_pct
  } : {
    ...common, prediction_type: "secondary", market,
    predicted_outcome: market === "double_chance_1x" ? "1x" : "x2",
    confidence: secondary.confidence_pct
  };

  return freezeJson({
    status: "PENDING_HANDOFF_READY", commitment_id: seal.commitment_id,
    review_policy_id: REVIEW_POLICY_ID, prepared_at: preparedAt, cutoff_at: fixture.kickoff_at,
    seal, products: [product]
  });
}

module.exports = {
  runEdgeD1Proof, runSealedEdgeD1Proof, verifyEdgeD1Seal, createEdgeD1ComparisonProof, runPendingEdgeD1Proof
};
