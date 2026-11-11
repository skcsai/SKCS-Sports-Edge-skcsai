"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const REGISTRY_SHA256 = "404f8af407f8e0f03d75bd35973c3a062edf13d09d9ea1f4b4bb12a7654bc668";
const bytes = fs.readFileSync(path.join(__dirname, "registry.v1.json"), "utf8").replace(/\r\n/g, "\n");
if (crypto.createHash("sha256").update(bytes).digest("hex") !== REGISTRY_SHA256) {
  throw new Error("SOCCER_GOVERNOR_REGISTRY_INTEGRITY_FAILED");
}
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const registry = freeze(JSON.parse(bytes));
const identity = freeze({ id: registry.registry_id, version: registry.rule_version, sha256: REGISTRY_SHA256 });

function key(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isPremierLeague(context) {
  const scope = [context?.soccer_scope, context?.fixture, context?.metadata?.fixture, context, context?.metadata]
    .find(value => value?.sport !== undefined || value?.competition_id !== undefined || value?.league_id !== undefined);
  return ["football", "soccer"].includes(key(scope?.sport)) &&
    Number(scope?.competition_id ?? scope?.league_id) === registry.scope.competition_id &&
    (scope?.period === undefined || scope.period === registry.scope.period);
}

function normalizeSelection(selection) {
  const item = typeof selection === "string" ? { market: selection } : selection;
  if (!item || typeof item !== "object") return null;
  const market = key(item.market ?? item.market_type);
  const pick = key(item.pick ?? item.prediction);
  if (!market || (item.period !== undefined && item.period !== registry.scope.period)) return null;

  let result;
  if (["1x2", "match_result", "match_winner", "full_time_result"].includes(market)) {
    result = registry.aliases[pick];
    if (!["home_win", "draw", "away_win"].includes(result)) return null;
  } else if (market === "double_chance") {
    result = registry.aliases[pick];
    if (!result?.startsWith("double_chance_")) return null;
  } else if (["draw_no_bet", "dnb"].includes(market)) {
    result = ["home", "home_win", "1"].includes(pick) ? "draw_no_bet_home"
      : ["away", "away_win", "2"].includes(pick) ? "draw_no_bet_away" : null;
    if (!result) return null;
  } else {
    result = registry.aliases[market];
    if (result && pick && registry.aliases[pick] && registry.aliases[pick] !== result) return null;
  }
  if (result) return { family: "result", result };

  const binary = (family, expected) => {
    const choice = expected || pick;
    if (!["yes", "no"].includes(choice)) return null;
    if (expected && pick && ![expected, market].includes(pick)) return null;
    return { family, choice };
  };
  if (market === "btts") return binary("btts");
  if (["btts_yes", "btts_no"].includes(market)) return binary("btts", market.slice(5));

  const scoring = market.match(/^(?:(home|away)(?:_team)?_to_score|team_to_score_(home|away)|clean_sheet_(home|away)|(home|away)_clean_sheet)$/);
  if (scoring) {
    const value = binary("scoring");
    if (!value) return null;
    const side = scoring[1] || scoring[2] || (scoring[3] === "home" || scoring[4] === "home" ? "away" : "home");
    return { ...value, side, choice: scoring[3] || scoring[4] ? (value.choice === "yes" ? "no" : "yes") : value.choice };
  }
  if (["only_home_scores", "only_home_to_score", "only_away_scores", "only_away_to_score", "neither_scores", "neither_team_to_score"].includes(market)) {
    return { family: "scoring_pair", home: market.startsWith("only_home") ? "yes" : "no",
      away: market.startsWith("only_away") ? "yes" : "no" };
  }

  const encoded = market.match(/^(over|under)_(\d+)_(\d)$/);
  const generic = market.match(/^(?:over_under|goals_over_under)_(\d+)_(\d)$/);
  const explicit = ["total_goals", "goals_over_under", "over_under"].includes(market);
  if (encoded || generic || explicit) {
    const choice = encoded ? encoded[1] : pick;
    const line = encoded ? Number(encoded[2] + "." + encoded[3])
      : generic ? Number(generic[1] + "." + generic[2]) : Number(item.line ?? item.market_line);
    if (!["over", "under"].includes(choice) || !Number.isFinite(line) || line < 0 ||
        line > Number.MAX_SAFE_INTEGER - 3 || !Number.isInteger(line * 2) ||
        (explicit && item.line == null && item.market_line == null) ||
        (encoded && pick && ![choice, market].includes(pick))) return null;
    return { family: "total", choice, line };
  }
  return null;
}

function settles(selection, home, away) {
  const total = home + away;
  if (selection.family === "result") {
    const result = home > away ? "H" : home < away ? "A" : "D";
    if (!registry.result_sets[selection.result].includes(result)) return "LOSS";
    return selection.result.startsWith("draw_no_bet_") && result === "D" ? "PUSH" : "WIN";
  }
  if (selection.family === "total") {
    if (total === selection.line) return "PUSH";
    return (selection.choice === "over" ? total > selection.line : total < selection.line) ? "WIN" : "LOSS";
  }
  if (selection.family === "btts") return ((home > 0 && away > 0) === (selection.choice === "yes")) ? "WIN" : "LOSS";
  if (selection.family === "scoring") {
    return (((selection.side === "home" ? home : away) > 0) === (selection.choice === "yes")) ? "WIN" : "LOSS";
  }
  return ((home > 0) === (selection.home === "yes") && (away > 0) === (selection.away === "yes")) ? "WIN" : "LOSS";
}

// These representatives cover each threshold interval, draw parity, and zero/nonzero side.
// No score cap or probability model is involved in the satisfiability check.
function scoreRepresentatives(selections) {
  const totals = new Set([0, 1, 2, 3]);
  for (const selection of selections) {
    if (selection.family === "total") {
      const floor = Math.floor(selection.line);
      for (const offset of [-1, 0, 1, 2]) if (floor + offset >= 0) totals.add(floor + offset);
    }
  }
  return [...totals].sort((a, b) => a - b).flatMap(total => {
    const homes = new Set([0, total, Math.floor(total / 2), Math.ceil(total / 2)]);
    if (total > 0) { homes.add(1); homes.add(total - 1); }
    return [...homes].map(home => [home, total - home]);
  });
}

function evaluateSelections(scope, selections) {
  const review = reason => ({ status: "REVIEW_REQUIRED", compatible: false, reason, governor: identity });
  if (!isPremierLeague(scope)) return review("UNSUPPORTED_SOCCER_SCOPE");
  if (!Array.isArray(selections) || selections.length === 0) return review("EMPTY_SELECTION_SET");
  const normalized = selections.map(normalizeSelection);
  if (normalized.some(selection => !selection)) return review("UNSUPPORTED_OR_INVALID_SELECTION");
  let refundWitness = null;
  for (const [home, away] of scoreRepresentatives(normalized)) {
    const settlements = normalized.map(selection => settles(selection, home, away));
    const witness = { home_goals: home, away_goals: away, settlements };
    if (settlements.every(settlement => settlement === "WIN")) {
      return { status: "COMPATIBLE", compatible: true, governor: identity, witness };
    }
    if (settlements.every(settlement => settlement !== "LOSS")) refundWitness = witness;
  }
  if (refundWitness) return { ...review("REFUND_ONLY_SELECTION_SET"), witness: refundWitness };
  return { status: "CONTRADICTION", compatible: false, reason: "NO_NON_LOSING_SCORELINE", governor: identity };
}

function reviewDifferences(differences) {
  const policy = registry.comparison;
  const gapExceeded = value => typeof value !== "number" || !Number.isFinite(value) || value < 0;
  const probabilities = differences?.probabilities_gap_pct;
  if (!differences || typeof differences.outcome_matches !== "boolean" ||
      typeof differences.secondary_market_matches !== "boolean" ||
      gapExceeded(differences.confidence_gap_pct) || !probabilities ||
      !["home_win", "draw", "away_win"].every(outcome => !gapExceeded(probabilities[outcome]))) {
    return { policy_id: policy.policy_id, verdict: "RED", reason: "INVALID_COMPARISON", action: policy.hold_action };
  }
  const valuesMatch = differences.confidence_gap_pct <= policy.confidence_tolerance_pct &&
    Object.values(probabilities).every(value => value <= policy.probability_tolerance_pct) &&
    differences.secondary_market_matches &&
    (differences.secondary_confidence_gap_pct === null || (!gapExceeded(differences.secondary_confidence_gap_pct) &&
      differences.secondary_confidence_gap_pct <= policy.secondary_tolerance_pct)) &&
    (differences.secondary_probability_gap_pct === null || (!gapExceeded(differences.secondary_probability_gap_pct) &&
      differences.secondary_probability_gap_pct <= policy.secondary_tolerance_pct));
  const verdict = !differences.outcome_matches ? policy.outcome_mismatch : valuesMatch ? "GREEN" : policy.any_detail_mismatch;
  return { policy_id: policy.policy_id, verdict,
    reason: !differences.outcome_matches ? "OUTRIGHT_PICK_MISMATCH" : valuesMatch ? "EXACT_MATCH" : "PREDICTION_DETAILS_DIFFER",
    action: verdict === "GREEN" ? "PASS" : policy.hold_action };
}

module.exports = { registry, identity, isPremierLeague, normalizeSelection, evaluateSelections, reviewDifferences };
