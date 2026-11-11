'use strict';

const pipelineLogger = require('../utils/pipelineLogger');

const SKCS_MARKET_CATEGORIES = Object.freeze({
    core_safe_markets: [
        'home_win',
        'away_win',
        'draw',
        'double_chance_1x',
        'double_chance_x2',
        'double_chance_12',
        'draw_no_bet_home',
        'draw_no_bet_away'
    ],
    goals_markets: [
        'over_0_5',
        'over_1_5',
        'over_2_5',
        'over_3_5',
        'under_2_5',
        'under_3_5',
        'under_4_5',
        'home_over_0_5',
        'away_over_0_5',
        'home_over_1_5',
        'away_over_1_5'
    ],
    btts_markets: [
        'btts_yes',
        'btts_no',
        'btts_over_2_5',
        'btts_under_3_5',
        'home_win_btts_yes',
        'away_win_btts_yes',
        'home_win_btts_no',
        'away_win_btts_no'
    ],
    defensive_markets: [
        'under_4_5',
        'under_3_5',
        'over_1_5',
        'home_over_0_5',
        'away_over_0_5',
        'double_chance_under_3_5',
        'double_chance_over_1_5'
    ],
    elite_combination_markets: [
        'home_win_under_4_5',
        'away_win_under_4_5',
        'home_win_over_1_5',
        'away_win_over_1_5',
        'double_chance_over_1_5',
        'double_chance_under_3_5',
        'win_either_half',
        'team_to_score_first_home',
        'team_to_score_first_away'
    ],
    half_markets: [
        'over_0_5_first_half',
        'under_1_5_first_half',
        'first_half_draw',
        'home_win_either_half',
        'away_win_either_half'
    ],
    ultra_safe_markets: [
        'over_1_5',
        'under_4_5',
        'home_over_0_5',
        'away_over_0_5',
        'double_chance_1x',
        'double_chance_x2',
        'double_chance_12',
        'draw_no_bet_home',
        'draw_no_bet_away',
        'under_3_5'
    ]
});

const MARKET_PRIORITY_TIERS = Object.freeze({
    tier_1: [
        'double_chance_1x',
        'double_chance_x2',
        'double_chance_12',
        'over_1_5',
        'under_4_5',
        'home_over_0_5',
        'away_over_0_5',
        'draw_no_bet_home',
        'draw_no_bet_away'
    ],
    tier_2: [
        'home_win_under_4_5',
        'away_win_under_4_5',
        'home_win_over_1_5',
        'away_win_over_1_5',
        'under_3_5',
        'double_chance_over_1_5',
        'double_chance_under_3_5'
    ],
    tier_3: [
        'btts_yes',
        'btts_no',
        'over_2_5',
        'draw',
        'first_half_draw',
        'team_to_score_first_home',
        'team_to_score_first_away',
        'win_either_half'
    ]
});

const TWELVE_LEG_SAFE_POOL = Object.freeze(new Set([
    'double_chance_1x',
    'double_chance_x2',
    'double_chance_12',
    'draw_no_bet_home',
    'draw_no_bet_away',
    'over_1_5',
    'under_4_5',
    'under_3_5',
    'home_over_0_5',
    'away_over_0_5',
    'double_chance_under_3_5',
    'double_chance_over_1_5'
]));

const AGGRESSIVE_MARKETS = new Set([
    'over_3_5',
    'btts_yes',
    'btts_over_2_5',
    'home_win_btts_yes',
    'away_win_btts_yes'
]);

const VOLATILE_MARKETS_12_LEG = new Set([
    'draw',
    'over_3_5',
    'btts_yes',
    'btts_over_2_5',
    'home_win_btts_yes',
    'away_win_btts_yes',
    'over_0_5_first_half',
    'under_1_5_first_half',
    'first_half_draw',
    'team_to_score_first_home',
    'team_to_score_first_away'
]);

const ALL_MARKETS = Object.freeze(
    Array.from(
        new Set(
            Object.values(SKCS_MARKET_CATEGORIES)
                .flat()
        )
    )
);

const SAFE_TIER3_MARKETS = Object.freeze(new Set([
    'btts_no',
    'under_3_5',
    'first_half_draw'
]));

const BANNED_RED_CARD_MARKETS = Object.freeze(new Set([
    'red_cards_over_0_5',
    'red_cards_under_0_5',
    'red_cards_over_1_5',
    'red_cards_under_1_5'
]));

const STANDARD_SECONDARY_MARKET_POOL = Object.freeze([
    'over_1_5',
    'under_4_5'
]);

function isRedCardMarket(market) {
    const key = normalizeMarketKey(market);
    return BANNED_RED_CARD_MARKETS.has(key);
}

function getStandardSecondaryMarkets(matchContext, primaryPrediction) {
    const homeWin = primaryPrediction === 'home_win';
    const awayWin = primaryPrediction === 'away_win';

    if (homeWin) {
        return [
            { market: 'draw_no_bet_home', prediction: 'home', confidence: 81, source: 'rule_of_4' },
            { market: 'over_1_5', prediction: 'over', confidence: 79, source: 'rule_of_4' },
            { market: 'under_4_5', prediction: 'under', confidence: 78, source: 'rule_of_4' }
        ].filter((item) => !isRedCardMarket(item.market));
    }

    if (awayWin) {
        return [
            { market: 'draw_no_bet_away', prediction: 'away', confidence: 81, source: 'rule_of_4' },
            { market: 'over_1_5', prediction: 'over', confidence: 79, source: 'rule_of_4' },
            { market: 'under_4_5', prediction: 'under', confidence: 78, source: 'rule_of_4' }
        ].filter((item) => !isRedCardMarket(item.market));
    }

    return [
        { market: 'under_3_5', prediction: 'under', confidence: 79, source: 'rule_of_4' },
        { market: 'btts_no', prediction: 'no', confidence: 77, source: 'rule_of_4' }
    ].filter((item) => !isRedCardMarket(item.market));
}

const DIRECT_SAFE_MARKETS = Object.freeze(new Set([
    'double_chance_1x',
    'double_chance_x2',
    'double_chance_12',
    'draw_no_bet_home',
    'draw_no_bet_away',
    'over_0_5',
    'over_1_5',
    'over_2_5',
    'under_4_5',
    'under_3_5',
    'under_2_5',
    'home_over_0_5',
    'away_over_0_5',
    'home_over_1_5',
    'away_over_1_5',
    'btts_yes',
    'btts_no',
    'double_chance_under_3_5',
    'double_chance_over_1_5',
    'team_to_score',
    'team_not_to_score'
]));

const DIRECT_MARKETS_ALLOWED = Object.freeze(new Set([
    '1x2',
    'match_winner',
    'match_result',
    'home_win',
    'draw',
    'away_win'
]));

const SAFE_MARKETS_ALLOWED = Object.freeze(new Set([
    'draw_no_bet_home',
    'draw_no_bet_away',
    'over_0_5',
    'over_1_5',
    'over_2_5',
    'under_3_5',
    'under_2_5',
    'home_over_0_5',
    'away_over_0_5',
    'home_over_1_5',
    'away_over_1_5',
    'btts_yes',
    'btts_no',
    'corners_over_7_5',
    'corners_over_8_5',
    'corners_over_9_5',
    'corners_under_12_5',
    'corners_under_11_5',
    'corners_under_10_5',
    'cards_over_2_5',
    'cards_over_3_5',
    'cards_over_4_5',
    'cards_under_6_5',
    'yellow_cards_over_2_5',
    'yellow_cards_over_3_5',
    'yellow_cards_over_4_5',
    'team_to_score',
    'team_not_to_score'
]));

const DIRECT_CONFIDENCE_MIN = 0;
const SAFE_CONFIDENCE_MIN = 72;
const ACCA_CONFIDENCE_MIN = 75;

const SAFE_MARKET_PATTERNS = Object.freeze([
    /^(over|under)_\d+_\d+_(points|runs|games)$/,
    /^(over|under)_\d+_\d+_(corners|cards)$/,
    /^(corners|cards|yellow_cards|red_cards)_(over|under)_\d+_\d+$/,
    /^total_(points|runs|games)_(over|under)(?:_\d+_\d+)?$/
]);

const MARKET_KEY_ALIASES = Object.freeze({
    dnb_home: 'draw_no_bet_home',
    dnb_away: 'draw_no_bet_away',
    over_7_5_corners: 'corners_over_7_5',
    over_8_5_corners: 'corners_over_8_5',
    over_9_5_corners: 'corners_over_9_5',
    under_12_5_corners: 'corners_under_12_5',
    over_2_5_cards: 'cards_over_2_5',
    over_3_5_cards: 'cards_over_3_5',
    over_4_5_cards: 'cards_over_4_5',
    under_6_5_cards: 'cards_under_6_5'
});

const FALLBACK_LADDER = Object.freeze([
    { pass: 'elite', min_confidence: 75, tiers: [1], safeTier3Only: false, directSafeOnly: false },
    { pass: 'strong', min_confidence: 55, tiers: [1, 2], safeTier3Only: false, directSafeOnly: false },
    { pass: 'safe', min_confidence: 30, tiers: [1, 2, 3], safeTier3Only: true, directSafeOnly: false },
    { pass: 'fallback', min_confidence: 0, tiers: [1, 2, 3, 4], safeTier3Only: true, directSafeOnly: true }
]);

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function toNumber(value, fallback = null) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeProbability(value, fallback = null) {
    const n = toNumber(value, fallback);
    if (n === null) return null;
    if (n > 1 && n <= 100) return clamp(n / 100, 0, 1);
    return clamp(n, 0, 1);
}

function normalizeMarketKey(value) {
    const key = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
    return MARKET_KEY_ALIASES[key] || key;
}

function normalizeRisk(value, fallback = 0) {
    const n = toNumber(value);
    if (!Number.isFinite(n)) return fallback;
    if (n > 1 && n <= 100) return clamp(n / 100, 0, 1);
    return clamp(n, 0, 1);
}

function isSafeMarketAllowed(market) {
    const key = normalizeMarketKey(market);
    if (!key) return false;
    if (SAFE_MARKETS_ALLOWED.has(key)) return true;
    return SAFE_MARKET_PATTERNS.some((pattern) => pattern.test(key));
}

function resolveTelemetry(options = {}, matchContext = {}) {
    const telemetry = options?.telemetry && typeof options.telemetry === 'object' ? options.telemetry : {};
    const rawSport = String(
        telemetry.sport
        || matchContext?.sport
        || matchContext?.match_info?.sport
        || 'unknown'
    ).trim().toLowerCase();

    let sport = rawSport;
    if (rawSport === 'soccer' || rawSport === 'football' || rawSport.startsWith('soccer_')) sport = 'Football';
    else if (rawSport === 'nba' || rawSport === 'basketball' || rawSport.startsWith('basketball_')) sport = 'Basketball';
    else if (rawSport === 'nfl' || rawSport === 'american_football' || rawSport.startsWith('americanfootball_')) sport = 'NFL';
    else if (rawSport === 'nhl' || rawSport === 'hockey' || rawSport.startsWith('icehockey_')) sport = 'NHL';
    else if (rawSport === 'mlb' || rawSport === 'baseball' || rawSport.startsWith('baseball_')) sport = 'MLB';
    else if (rawSport === 'rugby' || rawSport.startsWith('rugbyunion_')) sport = 'Rugby';
    else if (rawSport === 'afl' || rawSport.startsWith('aussierules_')) sport = 'AFL';
    else if (rawSport === 'volleyball') sport = 'Volleyball';
    else if (rawSport === 'handball') sport = 'Handball';
    else if (rawSport === 'f1' || rawSport === 'formula1') sport = 'F1';
    else if (rawSport === 'mma') sport = 'MMA';

    return {
        run_id: telemetry.run_id || null,
        sport: sport
    };
}

function weatherRisk(context) {
    const weather = context?.weather;
    if (weather && typeof weather === 'object') {
        const direct = normalizeRisk(weather.risk ?? weather.weather_risk, null);
        if (direct !== null) return direct;
        const summary = String(weather.summary || weather.condition || '').toLowerCase();
        if (summary.includes('storm') || summary.includes('heavy rain') || summary.includes('snow')) return 0.75;
        if (summary.includes('rain') || summary.includes('wind')) return 0.45;
        if (summary.includes('clear') || summary.includes('sun')) return 0.1;
    }
    return 0;
}

function lineupUncertainty(context) {
    if (context?.lineup_confirmed === true) return 0;
    if (context?.lineup_confirmed === false) return 0.45;
    return 0.2;
}

function injuryUncertainty(context) {
    const hasInjuries = Array.isArray(context?.injuries);
    const hasSuspensions = Array.isArray(context?.suspensions);
    const injuries = hasInjuries ? context.injuries.length : 0;
    const suspensions = hasSuspensions ? context.suspensions.length : 0;
    if (!hasInjuries && !hasSuspensions) return 0.18;
    const total = injuries + suspensions;
    if (total >= 7) return 0.78;
    if (total >= 4) return 0.55;
    if (total >= 2) return 0.34;
    return 0.12;
}

function marketMovementSignal(context) {
    const movement = context?.market_movement;
    if (!movement) return { contradiction_risk: 0, confirmation_boost: 0 };
    if (typeof movement === 'number') {
        const normalized = normalizeRisk(Math.abs(movement));
        if (movement > 0) return { contradiction_risk: 0, confirmation_boost: normalized * 0.12 };
        return { contradiction_risk: normalized * 0.25, confirmation_boost: 0 };
    }
    if (typeof movement === 'string') {
        const key = movement.toLowerCase();
        if (key.includes('contradict') || key.includes('reverse')) {
            return { contradiction_risk: 0.38, confirmation_boost: 0 };
        }
        if (key.includes('confirm') || key.includes('aligned')) {
            return { contradiction_risk: 0, confirmation_boost: 0.08 };
        }
    }
    if (typeof movement === 'object') {
        const contradicts = Boolean(movement.contradicts_model || movement.contradiction);
        const confirms = Boolean(movement.confirms_model || movement.aligned);
        return {
            contradiction_risk: contradicts ? 0.38 : 0,
            confirmation_boost: confirms ? 0.08 : 0
        };
    }
    return { contradiction_risk: 0, confirmation_boost: 0 };
}

function dataConfidence(matchContext) {
    const sharpOdds = matchContext?.sharp_odds || {};
    const populated = ALL_MARKETS.reduce((count, key) => (
        sharpOdds[key] !== null && sharpOdds[key] !== undefined ? count + 1 : count
    ), 0);
    return clamp(populated / ALL_MARKETS.length, 0, 1);
}

function buildRiskProfile(matchContext = {}, contextSignals = {}) {
    const context = matchContext?.contextual_intelligence || {};
    const weather = Math.max(weatherRisk(context), normalizeRisk(contextSignals.weather_risk, 0));
    const lineup = lineupUncertainty(context);
    const injury = Math.max(injuryUncertainty(context), normalizeRisk(contextSignals.availability_risk, 0));
    const discipline = Math.max(normalizeRisk(context?.discipline_risk, 0), normalizeRisk(contextSignals.discipline_risk, 0));
    const stability = Math.max(
        normalizeRisk(contextSignals.stability_risk, 0),
        context?.coach_conflict ? 0.35 : 0,
        context?.boardroom_instability ? 0.35 : 0,
        Array.isArray(context?.public_incidents) && context.public_incidents.length > 0 ? 0.28 : 0
    );
    const rotation = normalizeRisk(context?.rotation_risk, 0);
    const derby = normalizeRisk(context?.derby_risk, 0);
    const congestion = normalizeRisk(context?.fixture_congestion, 0);
    const travel = normalizeRisk(context?.travel_fatigue, 0);
    const movement = marketMovementSignal(context);
    const confidence = dataConfidence(matchContext);

    const weighted =
        (weather * 0.15) +
        (lineup * 0.16) +
        (injury * 0.14) +
        (discipline * 0.08) +
        (stability * 0.11) +
        (rotation * 0.09) +
        (derby * 0.1) +
        (congestion * 0.08) +
        (travel * 0.05) +
        (movement.contradiction_risk * 0.04);

    const reject = (
        weather >= 0.82
        || lineup >= 0.82
        || injury >= 0.82
        || rotation >= 0.82
        || derby >= 0.82
        || congestion >= 0.82
        || stability >= 0.82
        || movement.contradiction_risk >= 0.7
        || weighted >= 0.78
    );

    return {
        weather_risk: weather,
        lineup_uncertainty: lineup,
        injury_uncertainty: injury,
        discipline_risk: discipline,
        stability_risk: stability,
        rotation_risk: rotation,
        derby_risk: derby,
        fixture_congestion_risk: congestion,
        travel_fatigue_risk: travel,
        odds_movement_risk: movement.contradiction_risk,
        market_confirmation_boost: movement.confirmation_boost,
        data_confidence: confidence,
        aggregate_risk: clamp(weighted, 0, 1),
        reject
    };
}

function priorityTierForMarket(market) {
    const key = normalizeMarketKey(market);
    if (MARKET_PRIORITY_TIERS.tier_1.includes(key)) return 1;
    if (MARKET_PRIORITY_TIERS.tier_2.includes(key)) return 2;
    if (MARKET_PRIORITY_TIERS.tier_3.includes(key)) return 3;
    return 4;
}

function marketCategoryForMarket(market) {
    const key = normalizeMarketKey(market);
    for (const [category, markets] of Object.entries(SKCS_MARKET_CATEGORIES)) {
        if (markets.includes(key)) return category;
    }
    return 'unclassified';
}

function basePredictionForMarket(market) {
    const key = normalizeMarketKey(market);
    if (key === 'home_win') return 'home_win';
    if (key === 'away_win') return 'away_win';
    if (key === 'draw') return 'draw';
    if (key.startsWith('double_chance_')) return key.replace('double_chance_', '');
    if (key.startsWith('draw_no_bet_')) return key.endsWith('_away') ? 'away' : 'home';
    if (key === 'btts_yes') return 'yes';
    if (key === 'btts_no') return 'no';
    if (key.includes('team_to_score_first_home')) return 'home';
    if (key.includes('team_to_score_first_away')) return 'away';
    if (key.includes('first_half_draw')) return 'draw';
    if (key.includes('over')) return 'over';
    if (key.includes('under')) return 'under';
    return key;
}

function inferProbabilityFromDependencies(market, probabilities) {
    const key = normalizeMarketKey(market);
    const home = normalizeProbability(probabilities.home_win, 0.33);
    const away = normalizeProbability(probabilities.away_win, 0.33);
    const draw = normalizeProbability(probabilities.draw, 0.34);
    const over15 = normalizeProbability(probabilities.over_1_5, clamp(Math.max(home, away) + 0.16, 0.55, 0.95));
    const over25 = normalizeProbability(probabilities.over_2_5, clamp(over15 - 0.12, 0.32, 0.9));
    const over35 = normalizeProbability(probabilities.over_3_5, clamp(over25 - 0.14, 0.18, 0.82));
    const under35 = normalizeProbability(probabilities.under_3_5, clamp(1 - over35 + 0.08, 0.2, 0.94));
    const under45 = normalizeProbability(probabilities.under_4_5, clamp(under35 + 0.12, 0.3, 0.97));
    const homeScore = normalizeProbability(probabilities.home_over_0_5, clamp(home + 0.18, 0.52, 0.95));
    const awayScore = normalizeProbability(probabilities.away_over_0_5, clamp(away + 0.16, 0.48, 0.93));
    const bttsYes = normalizeProbability(probabilities.btts_yes, clamp(((homeScore + awayScore) / 2) - 0.05, 0.26, 0.88));
    const dnbHome = normalizeProbability(probabilities.draw_no_bet_home, clamp(home / Math.max(home + away, 0.001), 0, 1));
    const dnbAway = normalizeProbability(probabilities.draw_no_bet_away, clamp(away / Math.max(home + away, 0.001), 0, 1));
    const dc1x = normalizeProbability(probabilities.double_chance_1x, clamp(home + draw, 0, 1));
    const dcx2 = normalizeProbability(probabilities.double_chance_x2, clamp(away + draw, 0, 1));
    const dc12 = normalizeProbability(probabilities.double_chance_12, clamp(home + away, 0, 1));

    const derived = {
        home_win: home,
        away_win: away,
        draw,
        double_chance_1x: dc1x,
        double_chance_x2: dcx2,
        double_chance_12: dc12,
        draw_no_bet_home: dnbHome,
        draw_no_bet_away: dnbAway,
        over_0_5: clamp(over15 + 0.11, 0.75, 0.99),
        over_1_5: over15,
        over_2_5: over25,
        over_3_5: over35,
        under_2_5: clamp(1 - over25, 0.1, 0.93),
        under_3_5: under35,
        under_4_5: under45,
        home_over_0_5: homeScore,
        away_over_0_5: awayScore,
        home_over_1_5: clamp(homeScore - 0.2, 0.14, 0.88),
        away_over_1_5: clamp(awayScore - 0.2, 0.12, 0.82),
        btts_yes: bttsYes,
        btts_no: clamp(1 - bttsYes, 0.12, 0.92),
        btts_over_2_5: clamp(bttsYes * over25, 0.1, 0.85),
        btts_under_3_5: clamp(bttsYes * under35, 0.1, 0.8),
        home_win_btts_yes: clamp(home * bttsYes, 0.08, 0.75),
        away_win_btts_yes: clamp(away * bttsYes, 0.08, 0.72),
        home_win_btts_no: clamp(home * (1 - bttsYes), 0.07, 0.72),
        away_win_btts_no: clamp(away * (1 - bttsYes), 0.06, 0.7),
        home_win_under_4_5: clamp(home * under45, 0.15, 0.93),
        away_win_under_4_5: clamp(away * under45, 0.12, 0.9),
        home_win_over_1_5: clamp(home * over15, 0.15, 0.91),
        away_win_over_1_5: clamp(away * over15, 0.13, 0.88),
        double_chance_over_1_5: clamp(Math.max(dc1x, dcx2, dc12) * over15, 0.3, 0.97),
        double_chance_under_3_5: clamp(Math.max(dc1x, dcx2, dc12) * under35, 0.25, 0.95),
        over_0_5_first_half: clamp(over15 + 0.06, 0.64, 0.95),
        under_1_5_first_half: clamp(under35 + 0.03, 0.48, 0.92),
        first_half_draw: clamp(draw + 0.18, 0.18, 0.72),
        home_win_either_half: clamp(home + 0.12, 0.2, 0.95),
        away_win_either_half: clamp(away + 0.12, 0.18, 0.93),
        win_either_half: clamp(home + away + 0.08, 0.3, 0.98),
        team_to_score_first_home: clamp(homeScore - 0.05, 0.2, 0.9),
        team_to_score_first_away: clamp(awayScore - 0.05, 0.18, 0.86)
    };

    return normalizeProbability(probabilities[key], derived[key]);
}

function applyContextAdjustments(baseProbability, market, matchContext, riskProfile) {
    const key = normalizeMarketKey(market);
    const context = matchContext?.contextual_intelligence || {};
    let adjusted = normalizeProbability(baseProbability, 0.5);

    const weather = riskProfile.weather_risk;
    if (weather >= 0.55 && (
        key === 'over_2_5' || key === 'over_3_5' || key === 'btts_yes' || key === 'btts_over_2_5'
    )) {
        adjusted *= 0.82;
    }
    if (weather >= 0.55 && (
        key === 'under_3_5' || key === 'under_4_5' || key.startsWith('double_chance_') || key.startsWith('draw_no_bet_')
    )) {
        adjusted *= 1.08;
    }

    const injuries = Array.isArray(context.injuries) ? context.injuries : [];
    const suspensions = Array.isArray(context.suspensions) ? context.suspensions : [];
    const missingStrikers = injuries.concat(suspensions).filter((row) => {
        const role = String(row?.position || row?.role || row?.type || '').toLowerCase();
        return role.includes('striker') || role.includes('forward') || role.includes('attacker');
    }).length;
    const missingCenterBacks = injuries.concat(suspensions).filter((row) => {
        const role = String(row?.position || row?.role || row?.type || '').toLowerCase();
        return role.includes('center') && role.includes('back');
    }).length;
    const missingGoalkeepers = injuries.concat(suspensions).filter((row) => {
        const role = String(row?.position || row?.role || row?.type || '').toLowerCase();
        return role.includes('goalkeeper') || role.includes('keeper');
    }).length;

    if (missingStrikers > 0 && (key.startsWith('over_') || key.startsWith('btts') || key.includes('score_first'))) {
        adjusted *= 0.86;
    }
    if (missingCenterBacks > 0 && (key === 'btts_yes' || key === 'over_1_5' || key === 'over_2_5')) {
        adjusted *= 1.06;
    }
    if (missingGoalkeepers > 0 && (key.startsWith('over_') || key.startsWith('btts'))) {
        adjusted *= 1.04;
    }

    if (!context.lineup_confirmed && (
        SKCS_MARKET_CATEGORIES.elite_combination_markets.includes(key)
        || SKCS_MARKET_CATEGORIES.half_markets.includes(key)
    )) {
        adjusted *= 0.84;
    }

    if (riskProfile.rotation_risk >= 0.5 && (
        key === 'home_win' || key === 'away_win' || key.endsWith('_over_1_5')
    )) {
        adjusted *= 0.86;
    }

    if (riskProfile.stability_risk >= 0.45 && (key === 'home_win' || key === 'away_win')) {
        adjusted *= 0.83;
    }

    if (riskProfile.travel_fatigue_risk >= 0.45 && (
        key === 'away_win' || key === 'away_win_over_1_5' || key === 'team_to_score_first_away'
    )) {
        adjusted *= 0.82;
    }

    if (riskProfile.fixture_congestion_risk >= 0.45 && (
        key === 'over_2_5' || key === 'over_3_5' || key === 'home_win' || key === 'away_win'
    )) {
        adjusted *= 0.88;
    }

    if (riskProfile.derby_risk >= 0.4 && AGGRESSIVE_MARKETS.has(key)) {
        adjusted *= 0.8;
    }
    if (riskProfile.derby_risk >= 0.4 && (key.startsWith('double_chance_') || key.startsWith('draw_no_bet_') || key.startsWith('under_'))) {
        adjusted *= 1.05;
    }

    adjusted += riskProfile.market_confirmation_boost;
    adjusted -= riskProfile.odds_movement_risk * 0.08;

    return clamp(adjusted, 0.01, 0.99);
}

function oddsSanityScore(probability) {
    if (probability >= 0.94) return 0.9;
    if (probability >= 0.86) return 0.82;
    if (probability >= 0.76) return 0.7;
    if (probability >= 0.62) return 0.58;
    if (probability >= 0.5) return 0.46;
    return 0.3;
}

function correlationRiskScore(market) {
    const key = normalizeMarketKey(market);
    if (key === 'draw') return 0.62;
    if (VOLATILE_MARKETS_12_LEG.has(key)) return 0.74;
    if (AGGRESSIVE_MARKETS.has(key)) return 0.58;
    if (SKCS_MARKET_CATEGORIES.half_markets.includes(key)) return 0.52;
    if (SKCS_MARKET_CATEGORIES.elite_combination_markets.includes(key)) return 0.48;
    return 0.25;
}

function accaSuitability(market, options = {}) {
    const key = normalizeMarketKey(market);
    const forMega = options.forMega === true;
    if (forMega) {
        if (TWELVE_LEG_SAFE_POOL.has(key)) return 1;
        if (VOLATILE_MARKETS_12_LEG.has(key)) return 0;
        return 0.45;
    }
    if (SKCS_MARKET_CATEGORIES.ultra_safe_markets.includes(key)) return 1;
    if (SKCS_MARKET_CATEGORIES.defensive_markets.includes(key)) return 0.85;
    if (SKCS_MARKET_CATEGORIES.elite_combination_markets.includes(key)) return 0.65;
    if (AGGRESSIVE_MARKETS.has(key)) return 0.3;
    return 0.55;
}

function buildCandidateMarkets(probabilitiesInput = {}, matchContext = {}, options = {}) {
    const riskProfile = buildRiskProfile(matchContext, options.contextSignals || {});
    const candidates = [];

    const hasWeatherContext = Boolean(matchContext?.contextual_intelligence?.weather);

    for (const market of ALL_MARKETS) {
        if (isRedCardMarket(market)) continue;

        const base = inferProbabilityFromDependencies(market, probabilitiesInput);
        if (base === null) continue;
        const adjusted = applyContextAdjustments(base, market, matchContext, riskProfile);
        const tier = priorityTierForMarket(market);
        const category = marketCategoryForMarket(market);
        const lineupCertainty = matchContext?.contextual_intelligence?.lineup_confirmed ? 1 : 0.55;
        const contextSafety = 1 - clamp(riskProfile.aggregate_risk, 0, 1);
        const volatility = clamp(
            (riskProfile.derby_risk * 0.45)
            + (riskProfile.weather_risk * 0.3)
            + (riskProfile.rotation_risk * 0.25),
            0,
            1
        );
        const corrRisk = correlationRiskScore(market);
        const suitability = accaSuitability(market, { forMega: options.forMega === true });
        const sanity = oddsSanityScore(adjusted);
        const tierBonus = tier === 1 ? 0.14 : tier === 2 ? 0.09 : tier === 3 ? 0.04 : 0;

        const score =
            (adjusted * 0.38)
            + (contextSafety * 0.17)
            + (lineupCertainty * 0.11)
            + ((1 - volatility) * 0.09)
            + ((1 - corrRisk) * 0.08)
            + (sanity * 0.08)
            + (suitability * 0.06)
            + tierBonus;

        const missingContextPenaltyPct = hasWeatherContext ? 0 : 1;
        const rawConfidence = Math.round(clamp((adjusted * 100) - missingContextPenaltyPct, 1, 99) * 100) / 100;
        const confidence = Math.round(clamp(rawConfidence, 1, 99) * 100) / 100;

        candidates.push({
            market,
            prediction: basePredictionForMarket(market),
            probability: adjusted,
            confidence,
            score: Math.round(clamp(score, 0, 1.5) * 10000) / 10000,
            priority_tier: tier,
            category,
            context_safety: contextSafety,
            lineup_certainty: lineupCertainty,
            volatility_risk: volatility,
            correlation_risk: corrRisk,
            odds_sanity: sanity,
            acca_suitability: suitability
        });
    }

    return {
        candidates: candidates
            .sort((a, b) => (b.score - a.score) || (b.probability - a.probability)),
        risk_profile: riskProfile
    };
}

function applyFallbackLadder(candidates, options = {}) {
    const requireCount = Number.isFinite(Number(options.requireCount)) ? Number(options.requireCount) : 1;
    const normalized = Array.isArray(candidates) ? candidates.slice() : [];
    const telemetry = resolveTelemetry(options);

    if (!normalized.length) {
        pipelineLogger.recordFallback({
            run_id: telemetry.run_id,
            sport: telemetry.sport,
            pre_fallback_count: 0,
            post_fallback_count: 0,
            post_validation_after_fallback_count: 0
        });
        return { pass: 'none', candidates: [] };
    }

    for (const pass of FALLBACK_LADDER) {
        const subset = normalized.filter((candidate) => {
            const tier = Number(candidate?.priority_tier || priorityTierForMarket(candidate?.market));
            const confidence = Number(candidate?.confidence || 0);
            const market = normalizeMarketKey(candidate?.market || '');
            if (confidence < pass.min_confidence) return false;
            if (!pass.tiers.includes(tier)) return false;
            if (pass.safeTier3Only && tier === 3 && !SAFE_TIER3_MARKETS.has(market)) return false;
            if (pass.directSafeOnly && !DIRECT_SAFE_MARKETS.has(market)) return false;
            return true;
        });

        if (subset.length >= requireCount) {
            const lowConfidenceDrops = normalized.filter((candidate) =>
                Number(candidate?.confidence || 0) < pass.min_confidence
            ).length;
            if (lowConfidenceDrops > 0) {
                pipelineLogger.rejectionAdd({
                    run_id: telemetry.run_id,
                    sport: telemetry.sport,
                    bucket: 'low_confidence',
                    count: lowConfidenceDrops
                });
            }
            pipelineLogger.recordFallback({
                run_id: telemetry.run_id,
                sport: telemetry.sport,
                pre_fallback_count: normalized.length,
                post_fallback_count: subset.length,
                post_validation_after_fallback_count: subset.length
            });
            return {
                pass: pass.pass,
                candidates: subset
            };
        }
    }

    const fallbackDirectSafe = normalized.filter((candidate) => DIRECT_SAFE_MARKETS.has(normalizeMarketKey(candidate?.market || '')));
    if (fallbackDirectSafe.length >= requireCount) {
        const lowConfidenceDrops = normalized.filter((candidate) => Number(candidate?.confidence || 0) < ACCA_CONFIDENCE_MIN).length;
        if (lowConfidenceDrops > 0) {
            pipelineLogger.rejectionAdd({
                run_id: telemetry.run_id,
                sport: telemetry.sport,
                bucket: 'low_confidence',
                count: lowConfidenceDrops
            });
        }
        pipelineLogger.recordFallback({
            run_id: telemetry.run_id,
            sport: telemetry.sport,
            pre_fallback_count: normalized.length,
            post_fallback_count: fallbackDirectSafe.length,
            post_validation_after_fallback_count: fallbackDirectSafe.length
        });
        return {
            pass: 'forced_safe_pool',
            candidates: fallbackDirectSafe.map((candidate) => ({
                ...candidate,
                confidence: Number(candidate?.confidence || 0) < ACCA_CONFIDENCE_MIN ? ACCA_CONFIDENCE_MIN : candidate.confidence
            }))
        };
    }

    const forcedTop = normalized
        .slice(0, Math.max(requireCount, 1))
        .map((candidate) => ({
            ...candidate,
            confidence: Number(candidate?.confidence || 0) < ACCA_CONFIDENCE_MIN ? ACCA_CONFIDENCE_MIN : candidate.confidence
        }));
    pipelineLogger.recordFallback({
        run_id: telemetry.run_id,
        sport: telemetry.sport,
        pre_fallback_count: normalized.length,
        post_fallback_count: forcedTop.length,
        post_validation_after_fallback_count: forcedTop.length
    });
    return {
        pass: 'forced_top',
        candidates: forcedTop
    };
}

function marketSemanticKey(market) {
    const key = normalizeMarketKey(market);
    if (key.startsWith('double_chance_')) return key;
    if (key.startsWith('draw_no_bet_')) return key;
    if (key.startsWith('over_') || key.startsWith('under_')) return key;
    if (key.startsWith('home_over_') || key.startsWith('away_over_')) return key;
    if (key.startsWith('btts_')) return key;
    if (key === 'home_win' || key === 'away_win' || key === 'draw') return key;
    if (key.includes('team_to_score_first')) return key;
    if (key.includes('win_either_half')) return key;
    return key;
}

function byHomeBias(market) {
    const key = normalizeMarketKey(market);
    return key === 'home_win'
        || key === 'draw_no_bet_home'
        || key === 'double_chance_1x'
        || key === 'home_win_over_1_5'
        || key === 'home_win_under_4_5'
        || key === 'home_win_btts_yes'
        || key === 'home_win_btts_no'
        || key === 'team_to_score_first_home';
}

function byAwayBias(market) {
    const key = normalizeMarketKey(market);
    return key === 'away_win'
        || key === 'draw_no_bet_away'
        || key === 'double_chance_x2'
        || key === 'away_win_over_1_5'
        || key === 'away_win_under_4_5'
        || key === 'away_win_btts_yes'
        || key === 'away_win_btts_no'
        || key === 'team_to_score_first_away';
}

function conflictPairKey(marketA, marketB) {
    return [normalizeMarketKey(marketA), normalizeMarketKey(marketB)].sort().join('::');
}

const HARD_MARKET_CONFLICT_PAIRS = Object.freeze(new Set([
    conflictPairKey('home_win', 'draw'),
    conflictPairKey('home_win', 'away_win'),
    conflictPairKey('home_win', 'double_chance_1x'),
    conflictPairKey('home_win', 'double_chance_12'),
    conflictPairKey('home_win', 'draw_no_bet_home'),
    conflictPairKey('away_win', 'draw'),
    conflictPairKey('away_win', 'double_chance_x2'),
    conflictPairKey('away_win', 'double_chance_12'),
    conflictPairKey('away_win', 'draw_no_bet_away'),
    conflictPairKey('draw', 'double_chance_12'),
    conflictPairKey('double_chance_1x', 'double_chance_x2'),
    conflictPairKey('double_chance_1x', 'double_chance_12'),
    conflictPairKey('double_chance_x2', 'double_chance_12'),
    conflictPairKey('btts_yes', 'btts_no'),
    conflictPairKey('over_2_5', 'under_2_5'),
    conflictPairKey('over_3_5', 'under_3_5')
]));

const soccerGovernor = require('../governance/soccer-governor/governor');

function areMarketsConflicting(selectionA, selectionB, scope) {
    const context = soccerGovernor.isPremierLeague(scope) ? scope : soccerGovernor.isPremierLeague(selectionA) ? selectionA : selectionB;
    if (soccerGovernor.isPremierLeague(context)) {
        return !soccerGovernor.evaluateSelections(context, [selectionA, selectionB]).compatible;
    }
    const a = normalizeMarketKey(selectionA?.market || selectionA);
    const b = normalizeMarketKey(selectionB?.market || selectionB);
    if (!a || !b) return false;
    if (a === b) return true;
    if (marketSemanticKey(a) === marketSemanticKey(b)) return true;

    if (HARD_MARKET_CONFLICT_PAIRS.has(conflictPairKey(a, b))) {
        return true;
    }

    const overMatchA = a.match(/^over_(\d+)_(\d+)$/);
    const underMatchA = a.match(/^under_(\d+)_(\d+)$/);
    const overMatchB = b.match(/^over_(\d+)_(\d+)$/);
    const underMatchB = b.match(/^under_(\d+)_(\d+)$/);
    if (overMatchA && underMatchB) {
        const overLine = Number(`${overMatchA[1]}.${overMatchA[2]}`);
        const underLine = Number(`${underMatchB[1]}.${underMatchB[2]}`);
        if (overLine >= underLine) return true;
    }
    if (overMatchB && underMatchA) {
        const overLine = Number(`${overMatchB[1]}.${overMatchB[2]}`);
        const underLine = Number(`${underMatchA[1]}.${underMatchA[2]}`);
        if (overLine >= underLine) return true;
    }

    return false;
}

function filterConflictingCandidates(candidates, seedSelections = [], options = {}) {
    const maxVolatile = Number.isFinite(Number(options.maxVolatile)) ? Number(options.maxVolatile) : 2;
    const locked = Array.isArray(seedSelections) ? seedSelections.slice() : [];
    const out = [];
    const telemetry = resolveTelemetry(options);
    const usedMatchIds = new Set(
        locked
            .map((row) => String(row?.match_id || row?.metadata?.match_id || '').trim())
            .filter(Boolean)
    );
    let volatileCount = locked.filter((row) => VOLATILE_MARKETS_12_LEG.has(normalizeMarketKey(row?.market))).length;
    let conflictRejectCount = 0;

    for (const candidate of Array.isArray(candidates) ? candidates : []) {
        const key = normalizeMarketKey(candidate?.market);
        if (!key) continue;
        const matchId = String(candidate?.match_id || candidate?.metadata?.match_id || '').trim();
        if (matchId && usedMatchIds.has(matchId)) {
            conflictRejectCount += 1;
            continue;
        }
        if (VOLATILE_MARKETS_12_LEG.has(key) && volatileCount >= maxVolatile) {
            conflictRejectCount += 1;
            continue;
        }
        const hasConflict = locked.concat(out).some((row) => areMarketsConflicting(candidate, row));
        if (hasConflict) {
            conflictRejectCount += 1;
            continue;
        }
        out.push(candidate);
        if (matchId) usedMatchIds.add(matchId);
        if (VOLATILE_MARKETS_12_LEG.has(key)) volatileCount += 1;
    }

    if (conflictRejectCount > 0) {
        pipelineLogger.rejectionAdd({
            run_id: telemetry.run_id,
            sport: telemetry.sport,
            bucket: 'conflict_reject',
            count: conflictRejectCount
        });
    }

    return out;
}

function strictSameMatchGate(matchContext, riskProfile) {
    const context = matchContext?.contextual_intelligence || {};
    return (
        context.lineup_confirmed === true
        && riskProfile.weather_risk <= 0.32
        && riskProfile.injury_uncertainty <= 0.55
        && riskProfile.derby_risk <= 0.4
        && riskProfile.stability_risk <= 0.45
        && riskProfile.rotation_risk <= 0.45
        && riskProfile.reject !== true
    );
}

function isDirectMarketCandidate(candidate) {
    const market = normalizeMarketKey(candidate?.market || '');
    const confidence = Number(candidate?.confidence || 0);
    return DIRECT_MARKETS_ALLOWED.has(market) && confidence >= DIRECT_CONFIDENCE_MIN;
}

function isSafeSinglesCandidate(candidate) {
    const market = normalizeMarketKey(candidate?.market || '');
    const confidence = Number(candidate?.confidence || 0);
    return isSafeMarketAllowed(market) && confidence >= SAFE_CONFIDENCE_MIN;
}

function selectDirectSecondarySameMatch(candidates, matchContext = {}, options = {}) {
    const telemetry = resolveTelemetry(options, matchContext);
    const riskProfile = options.riskProfile || buildRiskProfile(matchContext, options.contextSignals || {});
    const ranked = Array.isArray(candidates) ? candidates.slice() : [];
    const directPool = ranked.filter(isDirectMarketCandidate);
    const safeSinglesPool = ranked.filter(isSafeSinglesCandidate);

    const directFiltered = filterConflictingCandidates(directPool, [], {
        maxVolatile: 0,
        telemetry
    });
    const direct = directFiltered[0] || null;

    const safeFiltered = filterConflictingCandidates(safeSinglesPool, direct ? [direct] : [], {
        maxVolatile: options.forMega ? 1 : 2,
        telemetry
    });
    const secondary = safeFiltered.find((candidate) => {
        if (!direct) return true;
        if (candidate.market === direct.market) return false;
        if (areMarketsConflicting(direct, candidate)) return false;
        if (marketSemanticKey(candidate.market) === marketSemanticKey(direct.market)) return false;
        return true;
    }) || null;

    pipelineLogger.recordFallback({
        run_id: telemetry.run_id,
        sport: telemetry.sport,
        pre_fallback_count: 0,
        post_fallback_count: 0,
        post_validation_after_fallback_count: (direct ? 1 : 0) + (secondary ? 1 : 0)
    });

    const sameMatchAllowed = Boolean(
        direct
        && secondary
        && strictSameMatchGate(matchContext, riskProfile)
        && direct.confidence >= SAFE_CONFIDENCE_MIN
        && secondary.confidence >= SAFE_CONFIDENCE_MIN
        && !areMarketsConflicting(direct, secondary)
    );
    if (!direct && ranked.length > 0) {
        pipelineLogger.rejectionAdd({
            run_id: telemetry.run_id,
            sport: telemetry.sport,
            bucket: 'publish_skip',
            metadata: {
                reason: 'no_direct_after_conflict_and_fallback',
                ranked_count: ranked.length,
                filtered_count: directFiltered.length
            }
        });
    }

    return {
        direct,
        secondary,
        rule_of_4_markets: getStandardSecondaryMarkets(matchContext, direct?.prediction || null),
        same_match: {
            allowed: sameMatchAllowed,
            legs: sameMatchAllowed ? [direct, secondary] : [],
            gate: {
                lineup_confirmed: matchContext?.contextual_intelligence?.lineup_confirmed === true,
                weather_ok: riskProfile.weather_risk <= 0.32,
                injury_ok: riskProfile.injury_uncertainty <= 0.55,
                derby_ok: riskProfile.derby_risk <= 0.4,
                stability_ok: riskProfile.stability_risk <= 0.45
            }
        },
        risk_profile: riskProfile
    };
}

function isMegaSafeMarket(market) {
    return TWELVE_LEG_SAFE_POOL.has(normalizeMarketKey(market));
}

function isTwelveLegRestrictedMarket(market) {
    return VOLATILE_MARKETS_12_LEG.has(normalizeMarketKey(market));
}

module.exports = {
    ALL_MARKETS,
    SKCS_MARKET_CATEGORIES,
    MARKET_PRIORITY_TIERS,
    TWELVE_LEG_SAFE_POOL,
    BANNED_RED_CARD_MARKETS,
    STANDARD_SECONDARY_MARKET_POOL,
    normalizeMarketKey,
    priorityTierForMarket,
    marketCategoryForMarket,
    marketSemanticKey,
    areMarketsConflicting,
    buildRiskProfile,
    buildCandidateMarkets,
    isRedCardMarket,
    getStandardSecondaryMarkets,
    FALLBACK_LADDER,
    DIRECT_SAFE_MARKETS,
    DIRECT_MARKETS_ALLOWED,
    SAFE_MARKETS_ALLOWED,
    DIRECT_CONFIDENCE_MIN,
    SAFE_CONFIDENCE_MIN,
    ACCA_CONFIDENCE_MIN,
    applyFallbackLadder,
    filterConflictingCandidates,
    selectDirectSecondarySameMatch,
    isMegaSafeMarket,
    isTwelveLegRestrictedMarket
};
