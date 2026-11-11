"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isEdge = fs.existsSync(path.join(root, "backend/governance/soccer-governor/governor.js"));
const localPath = isEdge ? "backend/governance/soccer-governor" : "scout/governance/soccer-governor";
const governor = require(path.join(root, localPath, "governor.js"));
const scope = { sport: "football", competition_id: 39 };
const leg = (market, prediction) => ({ market, prediction });

test("canonical artifact and evaluator are identical in both independent consumers", () => {
  const otherRoot = isEdge ? process.env.SKCS_SOCCER_SCOUT_ROOT : process.env.SKCS_SOCCER_EDGE_ROOT;
  assert.ok(otherRoot, "Set the counterpart root for the joint governor proof");
  const otherPath = isEdge ? "scout/governance/soccer-governor" : "backend/governance/soccer-governor";
  for (const file of ["registry.v1.json", "governor.js"]) {
    assert.deepEqual(fs.readFileSync(path.join(root, localPath, file)), fs.readFileSync(path.join(otherRoot, otherPath, file)));
  }
  assert.equal(governor.identity.version, "1.0.0");
  assert.equal(governor.registry.governance_owner, "SOCCER-GOV-001 / Soccer Governor");
  assert.ok(Object.isFrozen(governor.registry.result_sets.home_win));
});

test("valid scorelines correct legacy false contradictions", () => {
  for (const selections of [
    [leg("1X2", "draw"), leg("BTTS", "yes")],
    [leg("1X2", "home_win"), leg("DOUBLE_CHANCE", "home_or_draw")],
    [leg("1X2", "away_win"), leg("DOUBLE_CHANCE", "draw_or_away")],
    [leg("1X2", "home_win"), leg("DRAW_NO_BET", "home")],
    [leg("over_2_5"), leg("btts_no")],
    [leg("under_2_5"), leg("btts_yes")],
    [leg("1X2", "home_win"), leg("away_to_score", "yes")],
    [leg("1X2", "home_win"), leg("over_1_5")],
  ]) assert.equal(governor.evaluateSelections(scope, selections).status, "COMPATIBLE", JSON.stringify(selections));
});

test("impossible outcomes are contradictions across all supported families", () => {
  for (const selections of [
    [leg("1X2", "home_win"), leg("DOUBLE_CHANCE", "draw_or_away")],
    [leg("over_2_5"), leg("under_1_5")],
    [leg("over_2_5"), leg("under_2_5")],
    [leg("BTTS", "yes"), leg("over_under_1_5", "under")],
    [leg("BTTS", "yes"), leg("CLEAN_SHEET_HOME", "yes")],
    [leg("BTTS", "no"), leg("home_to_score", "yes"), leg("away_to_score", "yes")],
    [leg("only_home_scores"), leg("away_to_score", "yes")],
    [leg("neither_scores"), leg("1X2", "home_win")],
    [leg("DOUBLE_CHANCE", "1X"), leg("DOUBLE_CHANCE", "X2"), leg("DOUBLE_CHANCE", "12")],
  ]) assert.equal(governor.evaluateSelections(scope, selections).status, "CONTRADICTION", JSON.stringify(selections));
});

test("DNB and integer total refunds are explicit and goal lines have no arbitrary score cap", () => {
  const dnb = governor.evaluateSelections(scope, [leg("1X2", "draw"), leg("DRAW_NO_BET", "home")]);
  assert.deepEqual(dnb.witness.settlements, ["WIN", "PUSH"]);
  assert.equal(dnb.status, "REVIEW_REQUIRED");
  const total = governor.evaluateSelections(scope, [
    { market: "total_goals", prediction: "over", line: 2 },
    { market: "total_goals", prediction: "under", line: 2 }
  ]);
  assert.deepEqual(total.witness.settlements, ["PUSH", "PUSH"]);
  assert.equal(total.status, "REVIEW_REQUIRED");
  const high = governor.evaluateSelections(scope, [
    { market: "total_goals", prediction: "over", line: 100.5 }, leg("btts_yes"), leg("1X2", "draw")
  ]);
  assert.equal(high.status, "COMPATIBLE");
  assert.ok(high.witness.home_goals + high.witness.away_goals > 100.5);
});

test("market compatibility matches an independent exhaustive score truth table", () => {
  const cases = [
    [leg("home_win"), (h, a) => h > a],
    [leg("draw"), (h, a) => h === a],
    [leg("away_win"), (h, a) => h < a],
    [leg("double_chance_1x"), (h, a) => h >= a],
    [leg("double_chance_x2"), (h, a) => h <= a],
    [leg("double_chance_12"), (h, a) => h !== a],
    [leg("btts_yes"), (h, a) => h > 0 && a > 0],
    [leg("btts_no"), (h, a) => h === 0 || a === 0],
    [leg("under_2_5"), (h, a) => h + a < 2.5],
    [leg("over_2_5"), (h, a) => h + a > 2.5],
    [leg("home_clean_sheet", "yes"), (h, a) => a === 0],
    [leg("away_to_score", "yes"), (h, a) => a > 0],
    [leg("only_home_scores"), (h, a) => h > 0 && a === 0],
  ];
  for (const first of cases) for (const second of cases) for (const third of cases) {
    const choices = [first, second, third];
    let expected = false;
    for (let home = 0; home <= 6; home++) for (let away = 0; away <= 6; away++) {
      if (choices.every(choice => choice[1](home, away))) expected = true;
    }
    const selections = choices.map(choice => choice[0]);
    assert.equal(governor.evaluateSelections(scope, selections).compatible, expected, JSON.stringify(selections));
  }
});

test("unsupported scope, invalid picks, unsupported periods, corners and cards require review", () => {
  for (const selections of [
    [], [leg("mystery", "yes")], [leg("1X2", "unknown")],
    [leg("BTTS", "unknown")], [leg("corners_over_9_5")], [leg("yellow_cards_over_3_5")],
    [{ market: "total_goals", prediction: "over" }],
    [{ market: "total_goals", prediction: "over", line: 2.25 }],
    [{ market: "home_win", prediction: "away_win" }],
    [{ market: "btts", prediction: "yes", period: "FIRST_HALF" }],
  ]) assert.equal(governor.evaluateSelections(scope, selections).status, "REVIEW_REQUIRED");
  for (const context of [{}, { sport: "football", competition_id: 40 }, { sport: "cricket", competition_id: 39 }]) {
    assert.equal(governor.evaluateSelections(context, [leg("home_win")]).status, "REVIEW_REQUIRED");
  }
  assert.equal(governor.isPremierLeague({ ...scope, metadata: { id: "saved-row" } }), true);
});

test("existing exact-match thresholds produce explicit holds for disagreements", () => {
  const differences = { outcome_matches: true, confidence_gap_pct: 0,
    probabilities_gap_pct: { home_win: 0, draw: 0, away_win: 0 },
    secondary_market_matches: true, secondary_confidence_gap_pct: 0, secondary_probability_gap_pct: 0 };
  assert.equal(governor.reviewDifferences(differences).action, "PASS");
  assert.equal(governor.reviewDifferences({ ...differences, confidence_gap_pct: 0.01 }).action, "REVIEW_REQUIRED");
  const major = governor.reviewDifferences({ ...differences, outcome_matches: false, confidence_gap_pct: 30 });
  assert.equal(major.verdict, "RED");
  assert.equal(major.action, "REVIEW_REQUIRED");
  assert.equal(governor.reviewDifferences({}).action, "REVIEW_REQUIRED");
});

if (isEdge) {
  const contradiction = require("../backend/services/contradictionGovernance");
  const consistency = require("../backend/utils/marketConsistency");
  const { isValidCombination } = require("../backend/services/conflictEngine");
  const { areMarketsConflicting } = require("../backend/services/marketIntelligence");

  test("normal Edge governor entry points use the canonical Premier League rule definitions", () => {
    const main = leg("1X2", "draw"), btts = leg("BTTS", "yes");
    assert.equal(contradiction.isCompatibleWithMain(btts, "X", scope), true);
    assert.equal(consistency.areLegsCompatible(main, btts, scope), true);
    assert.equal(areMarketsConflicting(main, btts, scope), false);
    assert.equal(isValidCombination([main, btts], { scope, no_same_match: false }), true);
    const home = { ...scope, ...leg("1X2", "home_win"), match_id: "one" };
    const dc = { ...scope, ...leg("DOUBLE_CHANCE", "1X"), match_id: "one" };
    assert.equal(consistency.areLegsCompatible(home, dc), true);
    assert.equal(isValidCombination([home, dc], { no_same_match: false }), true);
    assert.equal(isValidCombination([home, dc]), false); // Existing one-leg-per-fixture portfolio policy.
    const invalid = contradiction.validateSMBCLegs([leg("under_1_5"), btts], "X", scope);
    assert.equal(invalid.legs.length, 1);
    assert.equal(invalid.removed.length, 1);
    assert.equal(invalid.removed[0].governor_status, "CONTRADICTION");
    assert.equal(contradiction.filterMarketsByMainPick([btts], "X", scope).length, 1);
    const separateFixtures = consistency.validatePredictionSet([
      { ...scope, ...leg("1X2", "home_win"), match_id: "first" },
      { ...scope, ...leg("1X2", "away_win"), match_id: "second" }
    ]);
    assert.equal(separateFixtures.is_valid, true);
    const sameFixture = consistency.validatePredictionSet([
      { ...scope, ...leg("BTTS", "no"), match_id: "first" },
      { ...scope, ...leg("home_to_score", "yes"), match_id: "first" },
      { ...scope, ...leg("away_to_score", "yes"), match_id: "first" }
    ]);
    assert.equal(sameFixture.is_valid, false);

  });
}
