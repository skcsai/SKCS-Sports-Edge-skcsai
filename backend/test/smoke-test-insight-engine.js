'use strict';

/**
 * SKCS ACCA ENGINE — LAW COMPLIANCE TESTS
 *
 * Run with: node backend/test/smoke-test-skcs-law.js
 */

const {
    filterUpcomingFixtures,
    stableFixtureKey,
    calculateCardProbability,
    calculateAverageLegConfidence,
    verifyProbabilityIntegrity,
    normalizeInsightFamily,
    isBannedMarket,
    validateAndNormalizeMarket,
    isValidConfidence,
    clampConfidence,
    validateMarketDiversity,
    weeklyTeamLock,
    reserveTeamsWeekly,
    extractTeamCompetitionPairs,
    buildAccaCard,
    getCardDescriptor,
    getFamilyCaps,
    MIN_LEG_CONFIDENCE,
    MAX_LEG_CONFIDENCE,
    MIN_FAMILIES_PER_CARD,
    ALLOWED_MARKET_FAMILIES,
    BANNED_MARKET_PATTERNS,
} = require('../utils/insightEngine');

const {
    calculateTicketCompoundProbability,
    filterExpiredFixtures,
    selectAccaLegs,
    normalizeMarketFamily,
    MIN_CONFIDENCE,
    MAX_CONFIDENCE,
    FAMILY_CAPS_6,
    FAMILY_CAPS_12,
} = require('../utils/accaLogicEngine');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  PASS: ${message}`);
        passed++;
    } else {
        console.error(`  FAIL: ${message}`);
        failed++;
    }
}

/* ==========================================================================
   1. ALLOWED MARKET FAMILIES (SECTION 1)
   ========================================================================== */

console.log('\n=== SECTION 1: ALLOWED MARKET FAMILIES ===\n');

assert(normalizeInsightFamily('1x2') === 'result', '1x2 → result');
assert(normalizeInsightFamily('match_result') === 'result', 'match_result → result');
assert(normalizeInsightFamily('draw_no_bet_home') === 'draw_no_bet', 'draw_no_bet → result');
assert(normalizeInsightFamily('double_chance_1x') === 'double_chance', 'double_chance_1x → double_chance');
assert(normalizeInsightFamily('over_under_2_5') === 'totals', 'over_under_2_5 → totals');
assert(normalizeInsightFamily('btts') === 'btts', 'btts → btts');
assert(normalizeInsightFamily('team_total_home_over_1_5') === 'team_goals', 'team_total → team_goals');
assert(normalizeInsightFamily('corners_over_under') === 'corners', 'corners → corners');
assert(normalizeInsightFamily('yellow_cards_over_under') === 'cards', 'yellow_cards → cards');

/* ==========================================================================
   2. BANNED MARKETS (SECTION 2)
   ========================================================================== */

console.log('\n=== SECTION 2: BANNED MARKETS ===\n');

assert(isBannedMarket('exact_score', '2-1') === true, 'exact_score is banned');
assert(isBannedMarket('player_shots', 'over_2_5') === true, 'player_shots is banned');
assert(isBannedMarket('1x2', 'draw') === true, 'standalone draw pick is banned');
assert(isBannedMarket('clean_sheet', 'yes') === true, 'clean_sheet is banned');
assert(isBannedMarket('win_to_nil', 'home') === true, 'win_to_nil is banned');
assert(isBannedMarket('red_card', 'yes') === true, 'red_card is banned');
assert(isBannedMarket('penalty', 'awarded') === true, 'penalty is banned');
assert(isBannedMarket('first_scorer', 'any') === true, 'first_scorer is banned');
assert(isBannedMarket('winning_margin', '2_goals') === true, 'winning_margin is banned');
assert(isBannedMarket('var', 'yes') === true, 'var is banned');

// Allowed markets should NOT be banned
assert(isBannedMarket('1x2', 'home_win') === false, 'home_win is allowed');
assert(isBannedMarket('over_under_2_5', 'over') === false, 'over 2.5 is allowed');
assert(isBannedMarket('btts', 'yes') === false, 'btts yes is allowed');

/* ==========================================================================
   3. FAMILY CAPS (SECTION 3)
   ========================================================================== */

console.log('\n=== SECTION 3: FAMILY CAPS ===\n');

assert(FAMILY_CAPS_6.result === 1, '6-leg: result max 1');
assert(FAMILY_CAPS_6.double_chance === 1, '6-leg: double_chance max 1');
assert(FAMILY_CAPS_6.totals === 2, '6-leg: totals max 2');
assert(FAMILY_CAPS_6.btts === 1, '6-leg: btts max 1');
assert(FAMILY_CAPS_12.result === 2, '12-leg: result max 2');
assert(FAMILY_CAPS_12.double_chance === 2, '12-leg: double_chance max 2');
assert(FAMILY_CAPS_12.totals === 3, '12-leg: totals max 3');
assert(FAMILY_CAPS_12.btts === 2, '12-leg: btts max 2');
assert(FAMILY_CAPS_12.corners === 2, '12-leg: corners max 2');
assert(FAMILY_CAPS_12.cards === 1, '12-leg: cards max 1');

/* ==========================================================================
   4. CONFIDENCE GUARDRAILS (SECTION 8)
   ========================================================================== */

console.log('\n=== SECTION 8: CONFIDENCE GUARDRAILS ===\n');

assert(isValidConfidence(72) === true, '72% is valid (minimum)');
assert(isValidConfidence(97) === true, '97% is valid (maximum)');
assert(isValidConfidence(71) === false, '71% is invalid (below minimum)');
assert(isValidConfidence(98) === false, '98% is invalid (above maximum)');
assert(isValidConfidence(60) === false, '60% is invalid (risky leg)');
assert(isValidConfidence(99) === false, '99% is invalid (fake leg)');
assert(isValidConfidence(85) === true, '85% is valid');

assert(clampConfidence(99) === 97, '99% clamped to 97');
assert(clampConfidence(60) === 72, '60% clamped to 72');
assert(clampConfidence(85) === 85, '85% unchanged');

/* ==========================================================================
   5. PROBABILITY LAW — STRICT MULTIPLICATION (SECTION 6)
   ========================================================================== */

console.log('\n=== SECTION 6: PROBABILITY LAW ===\n');

const sixLegs = Array(6).fill(null).map((_, i) => ({
    fixtureId: `f${i}`,
    matchName: `Team ${i}A vs Team ${i}B`,
    confidence: 94,
}));

const sixLegProb = calculateCardProbability(sixLegs);
console.log(`  6 legs @ 94% → total: ${sixLegProb}% (expected ≈68.99%)`);
assert(sixLegProb <= 70, `6-leg @ 94% <= 70% (got ${sixLegProb}%)`);
assert(sixLegProb >= 68, `6-leg @ 94% >= 68% (got ${sixLegProb}%)`);

const twelveLegs = Array(12).fill(null).map((_, i) => ({
    fixtureId: `f${i}`,
    matchName: `Team ${i}A vs Team ${i}B`,
    confidence: 92,
}));

const twelveLegProb = calculateCardProbability(twelveLegs);
console.log(`  12 legs @ 92% → total: ${twelveLegProb}% (expected ≈36.77%)`);
assert(twelveLegProb <= 40, `12-leg @ 92% <= 40% (got ${twelveLegProb}%)`);
assert(twelveLegProb >= 35, `12-leg @ 92% >= 35% (got ${twelveLegProb}%)`);

// CRITICAL: total must never exceed average
assert(
    verifyProbabilityIntegrity(sixLegs),
    '6-leg card: total <= average (integrity check)'
);
assert(
    verifyProbabilityIntegrity(twelveLegs),
    '12-leg card: total <= average (integrity check)'
);

// accaLogicEngine version
const ticketProb = calculateTicketCompoundProbability(sixLegs);
assert(ticketProb <= 70, `accaLogicEngine 6-leg @ 94% <= 70% (got ${ticketProb}%)`);

/* ==========================================================================
   6. MARKET DIVERSITY (SECTION 7 — MIN 3 FAMILIES)
   ========================================================================== */

console.log('\n=== SECTION 7: MARKET DIVERSITY ===\n');

const diverseLegs = [
    { family: 'result', confidence: 90 },
    { family: 'double_chance', confidence: 88 },
    { family: 'totals', confidence: 85 },
    { family: 'btts', confidence: 82 },
    { family: 'corners', confidence: 80 },
    { family: 'cards', confidence: 78 },
];
assert(validateMarketDiversity(diverseLegs) === true, '6 families = diverse');

const nonDiverseLegs = [
    { family: 'totals', confidence: 90 },
    { family: 'totals', confidence: 88 },
    { family: 'totals', confidence: 85 },
];
assert(validateMarketDiversity(nonDiverseLegs) === false, '1 family = not diverse');

const barelyDiverse = [
    { family: 'result', confidence: 90 },
    { family: 'totals', confidence: 88 },
    { family: 'btts', confidence: 85 },
];
assert(validateMarketDiversity(barelyDiverse) === true, '3 families = minimum diverse');

/* ==========================================================================
   7. WEEKLY TEAM LOCK (SECTION 4)
   ========================================================================== */

console.log('\n=== SECTION 4: WEEKLY TEAM LOCK ===\n');

const usedTeams = new Map();
usedTeams.set('barcelona', new Set(['la_liga']));

// Same team, same competition → REJECT
const sameTeamSameComp = [{
    home_team: 'barcelona',
    away_team: 'getafe',
    metadata: { league: 'la_liga', competition: 'la_liga' },
    competition: 'la_liga',
}];
const lockCheck1 = weeklyTeamLock(sameTeamSameComp, usedTeams);
assert(lockCheck1.valid === false, 'Same team + same competition → rejected');
assert(lockCheck1.rejectedTeams.includes('barcelona'), 'Barcelona flagged as rejected');

// Same team, different competition → ALLOW
const differentComp = [{
    home_team: 'barcelona',
    away_team: 'bayern',
    metadata: { league: 'champions_league', competition: 'champions_league' },
    competition: 'champions_league',
}];
const lockCheck2 = weeklyTeamLock(differentComp, usedTeams);
assert(lockCheck2.valid === true, 'Same team + different competition → allowed');

// Different team → ALLOW
const diffTeam = [{
    home_team: 'real_madrid',
    away_team: 'atletico',
    metadata: { league: 'la_liga', competition: 'la_liga' },
    competition: 'la_liga',
}];
const lockCheck3 = weeklyTeamLock(diffTeam, usedTeams);
assert(lockCheck3.valid === true, 'Different team → allowed');

/* ==========================================================================
   8. CARD BUILDING WITH SKCS LAW
   ========================================================================== */

console.log('\n=== SECTION 9: CARD BUILDING ===\n');

function createFixture(id, home, away, daysFromNow, sport, league, markets) {
    const kickoff = new Date();
    kickoff.setUTCDate(kickoff.getUTCDate() + daysFromNow);
    kickoff.setUTCHours(15, 0, 0, 0);
    return {
        id: String(id),
        fixture_id: String(id),
        name: `${home} vs ${away}`,
        home_team: home,
        away_team: away,
        sport: sport || 'football',
        league: league || 'EPL',
        competition: league || 'EPL',
        kickoff: kickoff.toISOString(),
        scoredMarkets: markets || [
            { type: '1x2', market: '1x2', name: 'Home Win', prediction: 'home_win', confidence: 88 },
            { type: 'double_chance_1x', market: 'Double Chance', prediction: '1x', confidence: 92 },
            { type: 'over_under_2_5', market: 'Over/Under 2.5', prediction: 'over', confidence: 85 },
            { type: 'btts', market: 'BTTS', prediction: 'yes', confidence: 82 },
            { type: 'corners_over_under', market: 'Corners', prediction: 'over', confidence: 78 },
        ],
    };
}

const fixtures = [];
const teams = [
    ['Arsenal', 'Chelsea'], ['Man Utd', 'Liverpool'], ['Tottenham', 'Man City'],
    ['Newcastle', 'Brighton'], ['Aston Villa', 'West Ham'], ['Wolves', 'Fulham'],
    ['Crystal Palace', 'Everton'], ['Brentford', 'Nottingham Forest'],
    ['Bournemouth', 'Sheffield Utd'], ['Luton', 'Burnley'],
    ['Real Madrid', 'Barcelona'], ['Bayern', 'Dortmund'],
];

teams.forEach(([home, away], i) => {
    fixtures.push(createFixture(
        100 + i, home, away, (i % 7) + 1, 'football',
        ['EPL', 'La Liga', 'Bundesliga'][i % 3],
        [
            { type: '1x2', market: '1x2', prediction: 'home_win', confidence: 85 + (i % 10) },
            { type: 'double_chance_1x', market: 'DC', prediction: '1x', confidence: 88 + (i % 7) },
            { type: 'over_under_2_5', market: 'OU', prediction: 'over', confidence: 82 + (i % 12) },
            { type: 'btts', market: 'BTTS', prediction: 'yes', confidence: 80 + (i % 14) },
            { type: 'corners_over_under', market: 'Corners', prediction: 'over', confidence: 75 + (i % 18) },
        ]
    ));
});

const globalUsedKeys = new Set();
const usedTeamsWeekly = new Map();

const card6 = buildAccaCard(fixtures, {
    legCount: 6,
    minConfidence: 72,
    globalUsedFixtureKeys: globalUsedKeys,
    usedTeamsWeekly,
});

assert(card6.displayLabel === '6 MATCH ACCA', `Label: "6 MATCH ACCA" (got "${card6.displayLabel}")`);
assert(card6.legs.length <= 6, `Max 6 legs (got ${card6.legs.length})`);
assert(
    card6.totalCardProbability <= card6.averageLegConfidence,
    `Total (${card6.totalCardProbability}%) <= avg (${card6.averageLegConfidence}%)`
);

// Check diversity
const familyKeys = Object.keys(card6.diversityBreakdown || {});
console.log(`  Family breakdown: ${JSON.stringify(card6.diversityBreakdown)}`);
assert(familyKeys.length >= MIN_FAMILIES_PER_CARD, `Diversity: ${familyKeys.length} families (need >=${MIN_FAMILIES_PER_CARD})`);

// No duplicate fixtures
const fixtureKeysInCard = card6.legs.map(l => l.fixtureKey);
assert(new Set(fixtureKeysInCard).size === fixtureKeysInCard.length, 'No duplicate fixtures in card');

// Build second card with shared global state
const card6b = buildAccaCard(fixtures, {
    legCount: 6,
    minConfidence: 72,
    globalUsedFixtureKeys: globalUsedKeys,
    usedTeamsWeekly,
});

const allFixtureKeys = [...fixtureKeysInCard, ...card6b.legs.map(l => l.fixtureKey)];
assert(new Set(allFixtureKeys).size === allFixtureKeys.length, 'No duplicate fixtures across cards');

/* ==========================================================================
   9. LABELING RULES (SECTION 10)
   ========================================================================== */

console.log('\n=== SECTION 10: LABELING RULES ===\n');

assert(getCardDescriptor(6) === '6 MATCH ACCA', '6 legs → "6 MATCH ACCA"');
assert(getCardDescriptor(12) === '12 MATCH MEGA ACCA', '12 legs → "12 MATCH MEGA ACCA"');
assert(getCardDescriptor(0) === '0 MATCH ACCA', '0 legs → "0 MATCH ACCA"');

/* ==========================================================================
   10. EXPIRED FIXTURE RULE (SECTION 11)
   ========================================================================== */

console.log('\n=== SECTION 11: EXPIRED FIXTURE RULE ===\n');

const expired = [
    { id: '1', kickoff: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }, // 7 days ago
    { id: '2', kickoff: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }, // 1 day ago
    { id: '3', kickoff: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ahead
];
const filtered = filterExpiredFixtures(expired);
assert(filtered.length >= 1, 'At least future fixture kept');
assert(filtered.some(f => f.id === '3'), 'Future fixture (ID 3) kept');

/* ==========================================================================
   SUMMARY
   ========================================================================== */

console.log('\n=== SUMMARY ===\n');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
    console.error('\n  ❌ SOME TESTS FAILED — SKCS LAW NOT FULLY COMPLIANT\n');
    process.exit(1);
} else {
    console.log('\n  ✅ ALL SKCS ACCA ENGINE LAW TESTS PASSED\n');
    process.exit(0);
}
