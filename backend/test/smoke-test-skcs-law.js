'use strict';

/**
 * SKCS ACCA ENGINE — FINAL LAW COMPLIANCE TESTS
 * Includes: weekly team lock, card overlap rejection, pool rotation, mega diagnostics
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
    isTeamLockedForWeek,
    lockTeamsForWeek,
    getWeekKey,
    normalizeTeamName,
    normalizeCompetitionKey,
    exceedsCardOverlapLimit,
    getCardFixtureKeySet,
    countSetOverlap,
    rotateCandidatePool,
    initMegaDiagnostics,
    resolveMegaZeroReason,
    buildAccaCard,
    getCardDescriptor,
    getFamilyCaps,
    MIN_LEG_CONFIDENCE,
    MAX_LEG_CONFIDENCE,
    MIN_FAMILIES_PER_CARD,
} = require('../utils/insightEngine');

const {
    calculateTicketCompoundProbability,
    filterExpiredFixtures,
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
   1. ALLOWED MARKET FAMILIES
   ========================================================================== */
console.log('\n=== SECTION 1: ALLOWED MARKET FAMILIES ===\n');
assert(normalizeInsightFamily('1x2') === 'result', '1x2 → result');
assert(normalizeInsightFamily('match_result') === 'result', 'match_result → result');
assert(normalizeInsightFamily('draw_no_bet_home') === 'draw_no_bet', 'draw_no_bet → result');
assert(normalizeInsightFamily('double_chance_1x') === 'double_chance', 'double_chance → double_chance');
assert(normalizeInsightFamily('over_under_2_5') === 'totals', 'over_under → totals');
assert(normalizeInsightFamily('btts') === 'btts', 'btts → btts');
assert(normalizeInsightFamily('team_total_home_over_1_5') === 'team_goals', 'team_total → team_goals');
assert(normalizeInsightFamily('corners_over_under') === 'corners', 'corners → corners');
assert(normalizeInsightFamily('yellow_cards_over_under') === 'cards', 'yellow_cards → cards');

/* ==========================================================================
   2. BANNED MARKETS
   ========================================================================== */
console.log('\n=== SECTION 2: BANNED MARKETS ===\n');
assert(isBannedMarket('exact_score', '2-1') === true, 'exact_score banned');
assert(isBannedMarket('player_shots', 'over') === true, 'player_shots banned');
assert(isBannedMarket('1x2', 'draw') === true, 'standalone draw banned');
assert(isBannedMarket('clean_sheet', 'yes') === true, 'clean_sheet banned');
assert(isBannedMarket('first_scorer', 'any') === true, 'first_scorer banned');
assert(isBannedMarket('1x2', 'home_win') === false, 'home_win allowed');
assert(isBannedMarket('over_under_2_5', 'over') === false, 'over 2.5 allowed');
assert(isBannedMarket('btts', 'yes') === false, 'btts yes allowed');

/* ==========================================================================
   3. CONFIDENCE GUARDRAILS
   ========================================================================== */
console.log('\n=== SECTION 8: CONFIDENCE GUARDRAILS ===\n');
assert(isValidConfidence(72) === true, '72% valid');
assert(isValidConfidence(97) === true, '97% valid');
assert(isValidConfidence(71) === false, '71% invalid');
assert(isValidConfidence(99) === false, '99% invalid');
assert(clampConfidence(99) === 97, '99 clamped to 97');
assert(clampConfidence(60) === 72, '60 clamped to 72');

/* ==========================================================================
   4. PROBABILITY LAW
   ========================================================================== */
console.log('\n=== SECTION 6: PROBABILITY LAW ===\n');
const sixLegs = Array(6).fill(null).map((_, i) => ({ fixtureId: `f${i}`, matchName: `T${i}A vs T${i}B`, confidence: 94 }));
const sixProb = calculateCardProbability(sixLegs);
console.log(`  6 legs @ 94% → ${sixProb}%`);
assert(sixProb >= 68 && sixProb <= 70, `6-leg @ 94% ≈ 68.99% (got ${sixProb}%)`);

const twelveLegs = Array(12).fill(null).map((_, i) => ({ fixtureId: `f${i}`, matchName: `T${i}A vs T${i}B`, confidence: 92 }));
const twelveProb = calculateCardProbability(twelveLegs);
console.log(`  12 legs @ 92% → ${twelveProb}%`);
assert(twelveProb >= 35 && twelveProb <= 40, `12-leg @ 92% ≈ 36.77% (got ${twelveProb}%)`);
assert(verifyProbabilityIntegrity(sixLegs), '6-leg integrity OK');
assert(verifyProbabilityIntegrity(twelveLegs), '12-leg integrity OK');

/* ==========================================================================
   5. WEEKLY TEAM LOCK (EXACT SPEC)
   ========================================================================== */
console.log('\n=== WEEKLY TEAM LOCK ===\n');

const usedTeamsWeekly = new Map();
const now = new Date();

// Lock Arsenal in EPL for current week
const arsenalFixture = {
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    competition: 'Premier League',
    league: 'Premier League',
    startTime: now.toISOString(),
    kickoff: now.toISOString(),
    date: now.toISOString(),
};

lockTeamsForWeek(arsenalFixture, usedTeamsWeekly);

// Same team, same competition → LOCKED
const sameTeamSameComp = {
    home_team: 'Arsenal',
    away_team: 'Brighton',
    homeTeam: 'Arsenal',
    awayTeam: 'Brighton',
    competition: 'Premier League',
    league: 'Premier League',
    startTime: now.toISOString(),
    kickoff: now.toISOString(),
    date: now.toISOString(),
};
assert(isTeamLockedForWeek(sameTeamSameComp, usedTeamsWeekly) === true, 'Arsenal in EPL → locked');

// Same team, different competition → NOT LOCKED
const sameTeamDiffComp = {
    home_team: 'Arsenal',
    away_team: 'Bayern',
    homeTeam: 'Arsenal',
    awayTeam: 'Bayern',
    competition: 'Champions League',
    league: 'Champions League',
    startTime: now.toISOString(),
    kickoff: now.toISOString(),
    date: now.toISOString(),
};
assert(isTeamLockedForWeek(sameTeamDiffComp, usedTeamsWeekly) === false, 'Arsenal in UCL → allowed');

// Different team → NOT LOCKED
const diffTeam = {
    home_team: 'Man Utd',
    away_team: 'Liverpool',
    homeTeam: 'Man Utd',
    awayTeam: 'Liverpool',
    competition: 'Premier League',
    league: 'Premier League',
    startTime: now.toISOString(),
    kickoff: now.toISOString(),
    date: now.toISOString(),
};
assert(isTeamLockedForWeek(diffTeam, usedTeamsWeekly) === false, 'Different teams → allowed');

// Week key generation
const weekKey = getWeekKey(now);
assert(typeof weekKey === 'string' && weekKey.includes('-W'), `Week key format: ${weekKey}`);

/* ==========================================================================
   6. CARD OVERLAP REJECTION
   ========================================================================== */
console.log('\n=== CARD OVERLAP REJECTION ===\n');

const pubCard6 = {
    legs: [
        { fixtureKey: 'a__b__epl__t1', fixtureId: '1', matchName: 'A vs B', confidence: 90, family: 'result' },
        { fixtureKey: 'c__d__epl__t2', fixtureId: '2', matchName: 'C vs D', confidence: 88, family: 'totals' },
        { fixtureKey: 'e__f__laliga__t3', fixtureId: '3', matchName: 'E vs F', confidence: 85, family: 'btts' },
        { fixtureKey: 'g__h__bundesliga__t4', fixtureId: '4', matchName: 'G vs H', confidence: 82, family: 'double_chance' },
        { fixtureKey: 'i__j__ligue1__t5', fixtureId: '5', matchName: 'I vs J', confidence: 80, family: 'corners' },
        { fixtureKey: 'k__l__epl__t6', fixtureId: '6', matchName: 'K vs L', confidence: 78, family: 'result' },
    ],
    displayLabel: '6 MATCH ACCA',
};

// Overlap of 3 → REJECTED (limit is 2 for 6-leg)
const overlap3Card = {
    legs: [
        { fixtureKey: 'a__b__epl__t1', fixtureId: '1', matchName: 'A vs B', confidence: 90, family: 'result' },
        { fixtureKey: 'c__d__epl__t2', fixtureId: '2', matchName: 'C vs D', confidence: 88, family: 'totals' },
        { fixtureKey: 'e__f__laliga__t3', fixtureId: '3', matchName: 'E vs F', confidence: 85, family: 'btts' },
        { fixtureKey: 'm__n__seriea__t7', fixtureId: '7', matchName: 'M vs N', confidence: 82, family: 'result' },
        { fixtureKey: 'o__p__epl__t8', fixtureId: '8', matchName: 'O vs P', confidence: 80, family: 'totals' },
        { fixtureKey: 'q__r__laliga__t9', fixtureId: '9', matchName: 'Q vs R', confidence: 78, family: 'btts' },
    ],
    displayLabel: '6 MATCH ACCA',
};

const result1 = exceedsCardOverlapLimit(overlap3Card, [pubCard6]);
assert(result1.reject === true, `Overlap 3 → rejected for 6-leg`);
assert(result1.overlap === 3, `Overlap count = 3`);

// Overlap of 2 → ACCEPTED
const overlap2Card = {
    legs: [
        { fixtureKey: 'a__b__epl__t1', fixtureId: '1', matchName: 'A vs B', confidence: 90, family: 'result' },
        { fixtureKey: 'c__d__epl__t2', fixtureId: '2', matchName: 'C vs D', confidence: 88, family: 'totals' },
        { fixtureKey: 'm__n__seriea__t7', fixtureId: '7', matchName: 'M vs N', confidence: 85, family: 'result' },
        { fixtureKey: 'o__p__epl__t8', fixtureId: '8', matchName: 'O vs P', confidence: 82, family: 'totals' },
        { fixtureKey: 'q__r__laliga__t9', fixtureId: '9', matchName: 'Q vs R', confidence: 80, family: 'btts' },
        { fixtureKey: 's__t__bundesliga__t10', fixtureId: '10', matchName: 'S vs T', confidence: 78, family: 'double_chance' },
    ],
    displayLabel: '6 MATCH ACCA',
};

const result2 = exceedsCardOverlapLimit(overlap2Card, [pubCard6]);
assert(result2.reject === false, `Overlap 2 → accepted for 6-leg`);

// 12-leg: overlap of 5 → REJECTED (limit is 4)
const pubCard12 = { legs: Array(12).fill(null).map((_, i) => ({ fixtureKey: `f${i}`, fixtureId: `${i}`, matchName: `T${i}A vs T${i}B`, confidence: 90, family: 'totals' })), displayLabel: '12 MATCH MEGA ACCA' };
const overlap5Card12 = { legs: [...Array(5).fill(null).map((_, i) => ({ fixtureKey: `f${i}`, fixtureId: `${i}`, matchName: `T${i}A vs T${i}B`, confidence: 90, family: 'totals' })), ...Array(7).fill(null).map((_, i) => ({ fixtureKey: `z${i}`, fixtureId: `z${i}`, matchName: `Z${i}A vs Z${i}B`, confidence: 90, family: 'result' }))], displayLabel: '12 MATCH MEGA ACCA' };

const result3 = exceedsCardOverlapLimit(overlap5Card12, [pubCard12]);
assert(result3.reject === true, `12-leg overlap 5 → rejected`);
assert(result3.overlap === 5, `12-leg overlap count = 5`);

/* ==========================================================================
   7. MEGA DIAGNOSTICS
   ========================================================================== */
console.log('\n=== MEGA DIAGNOSTICS ===\n');

const megaDiag = initMegaDiagnostics();
assert(megaDiag.mega_final_cards_built === 0, 'Initial mega cards = 0');
assert(megaDiag.mega_zero_reason === null, 'Initial zero_reason = null');

megaDiag.mega_rejected_for_weekly_team_lock = 5;
megaDiag.mega_rejected_for_family_caps = 2;
const reason1 = resolveMegaZeroReason(megaDiag);
assert(reason1 === 'weekly_team_lock', `Top rejection reason: ${reason1}`);

megaDiag.mega_final_cards_built = 1;
const reason2 = resolveMegaZeroReason(megaDiag);
assert(reason2 === null, 'Zero reason null when cards built');

/* ==========================================================================
   8. CANDIDATE POOL ROTATION
   ========================================================================== */
console.log('\n=== CANDIDATE POOL ROTATION ===\n');

const pool = [
    { id: '1', fixture_id: '1', home_team: 'A', away_team: 'B', competition: 'EPL', startTime: now.toISOString() },
    { id: '2', fixture_id: '2', home_team: 'C', away_team: 'D', competition: 'EPL', startTime: now.toISOString() },
    { id: '3', fixture_id: '3', home_team: 'E', away_team: 'F', competition: 'LaLiga', startTime: now.toISOString() },
];

const usedKeys = new Set(['1', '2']);
const usedTeams = new Map();
lockTeamsForWeek({ home_team: 'A', away_team: 'B', competition: 'EPL', league: 'EPL', startTime: now.toISOString() }, usedTeams);
lockTeamsForWeek({ home_team: 'C', away_team: 'D', competition: 'EPL', league: 'EPL', startTime: now.toISOString() }, usedTeams);

const rotated = rotateCandidatePool(pool, usedKeys, usedTeams);
assert(rotated.length === 1, `Pool reduced from 3 to 1 after rotation (got ${rotated.length})`);
assert(rotated[0].id === '3', 'Remaining fixture is E vs F');

/* ==========================================================================
   9. LABELING RULES
   ========================================================================== */
console.log('\n=== LABELING RULES ===\n');
assert(getCardDescriptor(6) === '6 MATCH ACCA', '6 legs label');
assert(getCardDescriptor(12) === '12 MATCH MEGA ACCA', '12 legs label');

/* ==========================================================================
   SUMMARY
   ========================================================================== */
console.log('\n=== SUMMARY ===\n');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
    console.error('\n  ❌ SOME TESTS FAILED\n');
    process.exit(1);
} else {
    console.log('\n  ✅ ALL SKCS ACCA ENGINE LAW TESTS PASSED\n');
    process.exit(0);
}
