'use strict';

const { query, withTransaction } = require('../db');
const { validateRawPredictionInput } = require('../utils/validation');
const pipelineLogger = require('../utils/pipelineLogger');
const { FOOTBALL_RULES } = require('../config/footballRules');
const { filterRawPrediction } = require('./filterEngine');
const { getPredictionInputs } = require('./dataProvider');
const { scoreMatch } = require('./aiScoring');
const { validatePredictionSet, areLegsCompatible } = require('../utils/marketConsistency');
const { detectConflicts } = require('../utils/conflictResolver');
const { isValidCombination } = require('./conflictEngine');
const { scoreMarkets } = require('./marketScoringEngine');
const {
    normalizeMarketKey: normalizeMarketKeyMI,
    priorityTierForMarket,
    areMarketsConflicting,
    buildRiskProfile,
    isMegaSafeMarket,
    isTwelveLegRestrictedMarket,
    buildCandidateMarkets,
    selectDirectSecondarySameMatch,
    DIRECT_SAFE_MARKETS,
    DIRECT_MARKETS_ALLOWED,
    SAFE_MARKETS_ALLOWED,
    DIRECT_CONFIDENCE_MIN,
    SAFE_CONFIDENCE_MIN,
    ACCA_CONFIDENCE_MIN
} = require('./marketIntelligence');
const { validateInsightLegGroup } = require('../utils/insightValidationMatrix');
const {
    calculateTrueComboConfidence,
    calculateTicketCompoundProbability,
    filterExpiredFixtures,
    selectAccaLegs,
    MIN_CONFIDENCE,
    MAX_CONFIDENCE,
    FAMILY_CAPS_6,
    FAMILY_CAPS_12,
    BUILD_ORDER,
    ALLOWED_FAMILIES,
    normalizeMarketFamily,
    isValidConfidence,
} = require('../utils/accaLogicEngine');
const {
    filterUpcomingFixtures,
    stableFixtureKey,
    normalizeInsightFamily,
    validateAndNormalizeMarket,
    isBannedMarket,
    isValidConfidence: isValidConfidenceIE,
    isTeamLockedForWeek,
    lockTeamsForWeek,
    normalizeTeamName,
    normalizeCompetitionKey,
    getWeekKey,
    exceedsCardOverlapLimit,
    getCardFixtureKeySet,
    countSetOverlap,
    rotateCandidatePool,
    initMegaDiagnostics,
    resolveMegaZeroReason,
    validateMarketDiversity,
    verifyProbabilityIntegrity,
    MIN_LEG_CONFIDENCE,
    MAX_LEG_CONFIDENCE,
    MIN_FAMILIES_PER_CARD,
    getCardDescriptor,
    getFamilyCaps,
} = require('../utils/insightEngine');
const { resolveActiveDeploymentSports } = require('../config/activeSports');

const MEGA_ACCA_SIZE = 12;
const ACCA_SIZE = 6;
const SAME_MATCH_INSIGHT_TARGET = 6;
const PHASE_ONE_ACCA_MIN_CONFIDENCE = Math.max(
    60,
    Number(process.env.PHASE_ONE_ACCA_MIN_CONFIDENCE || FOOTBALL_RULES.acca.minLegConfidence)
);
const ACCA_MIN_LEG_CONFIDENCE = Math.max(ACCA_CONFIDENCE_MIN, PHASE_ONE_ACCA_MIN_CONFIDENCE);
const VOLUME_CAP_MULTIPLIER = 5;
const ACTIVE_DEPLOYMENT_SPORTS = resolveActiveDeploymentSports();
const MIXED_SPORT_TARGETS = new Set([
    'Football',
    'Tennis',
    'Basketball',
    'Rugby',
    'Cricket',
    'MLB',
    'NHL',
    'NFL',
    'MMA',
    'AFL',
    'Volleyball',
    'Handball',
    'Darts',
    'Esports'
]);
const SAFE_TIER3_ACCA_MARKETS = new Set(['btts_no', 'under_3_5', 'first_half_draw']);
const ACCA_FALLBACK_LADDER = Object.freeze([
    { pass: 'elite', minConfidence: 75, tiers: [1], safeTier3Only: false, directSafeOnly: false },
    { pass: 'primary_fallback', minConfidence: 75, tiers: [1, 2], safeTier3Only: false, directSafeOnly: false, allowDoubleChance: true },
    { pass: 'strong', minConfidence: 55, tiers: [1, 2], safeTier3Only: false, directSafeOnly: false },
    { pass: 'safe', minConfidence: ACCA_MIN_LEG_CONFIDENCE, tiers: [1, 2, 3], safeTier3Only: true, directSafeOnly: false },
    { pass: 'fallback', minConfidence: ACCA_MIN_LEG_CONFIDENCE, tiers: [1, 2, 3, 4], safeTier3Only: true, directSafeOnly: true }
]);

function normalizeTier(tier) {
    if (tier === 'normal' || tier === 'deep') return tier;
    throw new Error(`Invalid tier: ${tier}`);
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function computeTotalConfidence(predictions) {
    if (!predictions.length) return 0;
    const sum = predictions.reduce((acc, p) => acc + (typeof p.confidence === 'number' ? p.confidence : 0), 0);
    return Math.round((sum / predictions.length) * 100) / 100;
}

function computeCompoundConfidence(predictions) {
    return calculateTicketCompoundProbability(predictions);
}

// The weekly single-use insight policy follows the South African business week.
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

function startOfWeekSast(now = new Date()) {
    const current = new Date(now.getTime() + SAST_OFFSET_MS);
    const day = current.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    current.setUTCDate(current.getUTCDate() + diffToMonday);
    current.setUTCHours(0, 0, 0, 0);
    return new Date(current.getTime() - SAST_OFFSET_MS);
}

function endOfWeekSast(now = new Date()) {
    const start = startOfWeekSast(now);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return end;
}

function riskLevelFromConfidence(avgConfidence) {
    if (avgConfidence >= 75) return 'safe';
    return 'medium';
}

function toLeg(p) {
    return {
        match_id: p.match_id,
        sport: p.sport,
        market: p.market,
        pick: p.prediction,
        confidence: p.confidence,
        volatility: p.volatility,
        odds: p.odds,
        metadata: p.metadata
    };
}

function isSmartCombo(p) {
    return p && p.type === 'SMART_COMBO' && Array.isArray(p.legs);
}

function getKickoffTimeFromMetadata(p) {
    const t = p?.metadata?.kickoff || p?.metadata?.kickoff_time || p?.metadata?.match_time || null;
    if (!t) return null;
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d;
}

function withinDays(from, to, days) {
    const ms = days * 24 * 60 * 60 * 1000;
    return Math.abs(to.getTime() - from.getTime()) <= ms;
}

function withinHours(from, to, hours) {
    const ms = hours * 60 * 60 * 1000;
    return Math.abs(to.getTime() - from.getTime()) <= ms;
}

async function getDoubleChanceLegs(matchIds, minConfidence, db) {
    if (!matchIds || matchIds.length === 0) return [];
    try {
        const result = await db.query(
            `SELECT fixture_id, market_key as market_type, recommendation as outcome, confidence, market_tier 
             FROM secondary_market_predictions 
             WHERE fixture_id = ANY($1) 
               AND market_tier = 2 
               AND market_key LIKE 'double_chance%' 
               AND confidence >= $2`,
            [matchIds, minConfidence]
        );
        return result.rows.map(r => ({ ...r, match_id: r.fixture_id, market: r.market_type, pick: r.outcome, market_tier: 2 }));
    } catch (e) {
        console.error('[accaBuilder] Failed to get double chance legs:', e.message);
        return [];
    }
}

function buildAccaV2({ tier, candidates, now = new Date(), minSize = 4, maxSize = 6 }) {
    const t = normalizeTier(tier);
    const list = Array.isArray(candidates) ? candidates.slice() : [];

    const minLegConfidence = ACCA_MIN_LEG_CONFIDENCE;
    // maxSize and minSize are now passed in or defaulted

    // Flatten smart combos into a single "selection" with multiple legs,
    // but count it as ONE combo for the max-1 rule.
    const scored = list
        .map((p) => {
            if (isSmartCombo(p)) {
                const legs = p.legs.map((l) => ({
                    ...l,
                    market: l.market,
                    pick: l.pick,
                    confidence: l.confidence,
                    market_tier: l.market_tier || 2
                }));
                const confidence = typeof p.confidence === 'number' ? p.confidence : computeTotalConfidence(legs);
                return { kind: 'smart_combo', confidence, legs };
            }
            return { kind: 'single', confidence: p.confidence, legs: [{...toLeg(p), market_tier: p.market_tier || (p.market === '1x2' || p.market === '1X2' ? 1 : 2)}] };
        })
        .filter((x) => typeof x.confidence === 'number' && x.confidence >= minLegConfidence)
        .sort((a, b) => b.confidence - a.confidence);

    const picked = [];
    const usedMatchIds = new Set();
    const usedTiersPerMatch = new Map();
    let smartComboCount = 0;

    for (const item of scored) {
        if (picked.length >= maxSize) break;
        if (item.kind === 'smart_combo') {
            if (smartComboCount >= 1) continue;
        }

        const itemMatchIds = item.legs.map((l) => String(l.match_id || '').trim()).filter(Boolean);
        if (itemMatchIds.length !== item.legs.length) continue;
        
        let tierConflict = false;
        for (const leg of item.legs) {
            const fixtureId = String(leg.match_id || '').trim();
            const itemTier = leg.market_tier || (leg.market === '1x2' || leg.market === '1X2' ? 1 : 2);
            if (usedTiersPerMatch.get(fixtureId)?.has(itemTier)) {
                tierConflict = true;
                break;
            }
        }
        if (tierConflict) continue;

        // Deep tier: enforce same day + kickoff window (if kickoff available)
        if (t === 'deep') {
            const kickoffs = item.legs.map(getKickoffTimeFromMetadata).filter(Boolean);
            if (kickoffs.length) {
                const deepTimeViolation = kickoffs.some((k) => {
                    const sameDay = k.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
                    if (!sameDay) return true;
                    if (!withinHours(now, k, 2)) return true;
                    return false;
                });
                if (deepTimeViolation) continue;
            }
        } else {
            // Normal tier: allow within 5 days if kickoff available
            const kickoffs = item.legs.map(getKickoffTimeFromMetadata).filter(Boolean);
            if (kickoffs.length) {
                if (kickoffs.some((k) => !withinDays(now, k, 5))) continue;
            }
        }

        // Conflicts: validate within item + against already picked
        if (!isValidCombination(item.legs)) continue;
        const prospectiveLegs = picked.flatMap((x) => x.legs).concat(item.legs);
        if (!isValidCombination(prospectiveLegs)) continue;

        // Avoid using two markets from same match inside a single ACCA
        // (the "no duplicate matches" rule)
        for (const id of itemMatchIds) usedMatchIds.add(id);
        picked.push(item);
        if (item.kind === 'smart_combo') smartComboCount++;
    }

    if (picked.length < minSize) {
        return {
            ok: false,
            reason: 'not_enough_legs',
            legs: [],
            confidence: 0
        };
    }

    const legs = picked.flatMap((x) => x.legs).slice(0, maxSize);
    const confidence = clamp(computeTotalConfidence(legs), 0, 100);

    return {
        ok: true,
        legs,
        confidence,
        smartComboCount
    };
}

function combinations(arr, k) {
    const out = [];
    function rec(start, picked) {
        if (picked.length === k) {
            out.push(picked.slice());
            return;
        }
        for (let i = start; i < arr.length; i++) {
            picked.push(arr[i]);
            rec(i + 1, picked);
            picked.pop();
        }
    }
    rec(0, []);
    return out;
}

async function getTierRules(tier, client) {
    const t = normalizeTier(tier);
    const res = await client.query(
        `select tier, min_confidence, allowed_markets, max_acca_size, allowed_volatility from tier_rules where tier = $1 limit 1;`,
        [t]
    );
    if (!res.rows.length) throw new Error(`Missing tier_rules for tier=${t}`);
    return res.rows[0];
}

async function getAccaRules(client) {
    const res = await client.query('select rule_name, rule_value from acca_rules;');
    const rules = {};
    for (const row of res.rows) {
        rules[row.rule_name] = row.rule_value;
    }

    return {
        no_same_match: rules.no_same_match !== undefined ? rules.no_same_match : true,
        no_conflicting_markets: rules.no_conflicting_markets !== undefined ? rules.no_conflicting_markets : true,
        max_per_match: rules.max_per_match !== undefined ? rules.max_per_match : 1,
        allow_high_volatility: rules.allow_high_volatility !== undefined ? rules.allow_high_volatility : false
    };
}

function toFinalMatchPayload(p) {
    const metadata = getMetadata(p);
    const matchContext = metadata.match_context && typeof metadata.match_context === 'object'
        ? metadata.match_context
        : null;
    const matchInfo = matchContext && typeof matchContext.match_info === 'object'
        ? matchContext.match_info
        : {};
    const kickoff = resolveKickoffFromPrediction(p, metadata, matchInfo);
    const normalizedSport = normalizeSportKey(p.sport || metadata.sport || metadata.sport_key || '');
    const sportType = getSportTypeLabel(normalizedSport);
    const homeTeam = resolveTeamNameFromPrediction(p, 'home');
    const awayTeam = resolveTeamNameFromPrediction(p, 'away');
    const leagueCountry = resolveLeagueCountryFromPrediction(p, metadata, matchInfo, matchContext);
    const leagueName = leagueCountry.league || null;
    const countryName = leagueCountry.country || null;
    return {
        raw_id: p.raw_id,
        match_id: p.match_id,
        sport: normalizedSport,
        sport_type: sportType,
        home_team: homeTeam || null,
        away_team: awayTeam || null,
        home_team_name: homeTeam || null,
        away_team_name: awayTeam || null,
        match_date: kickoff,
        commence_time: kickoff,
        market: p.market,
        prediction: p.prediction,
        confidence: p.confidence,
        volatility: p.volatility,
        odds: p.odds,
        league: leagueName,
        country: countryName,
        metadata: {
            ...metadata,
            home_team: homeTeam || metadata.home_team || matchInfo.home_team || null,
            away_team: awayTeam || metadata.away_team || matchInfo.away_team || null,
            home_team_name: homeTeam || metadata.home_team_name || null,
            away_team_name: awayTeam || metadata.away_team_name || null,
            league: leagueName || metadata.league || metadata.competition || null,
            competition: leagueName || metadata.competition || metadata.league || null,
            country: countryName || metadata.country || metadata.league_country || null,
            league_country: countryName || metadata.league_country || metadata.country || null,
            sport_type: sportType,
            weekly_team_lock_applied: true,
            normalized_match_context: metadata.normalized_match_context === true || Boolean(matchContext)
        }
    };
}

function toScoringMatchPayload(prediction) {
    const metadata = prediction.metadata || {};
    const matchContext = metadata.match_context && typeof metadata.match_context === 'object'
        ? metadata.match_context
        : null;
    const matchInfo = matchContext && typeof matchContext.match_info === 'object'
        ? matchContext.match_info
        : {};
    const normalizedSport = normalizeSportKey(prediction.sport || metadata.sport || '');
    const homeTeam = resolveTeamNameFromPrediction(prediction, 'home');
    const awayTeam = resolveTeamNameFromPrediction(prediction, 'away');
    return {
        match_id: prediction.match_id,
        sport: normalizedSport,
        home_team: homeTeam || null,
        away_team: awayTeam || null,
        base_prediction: prediction.prediction || null,
        base_confidence: prediction.confidence,
        raw_provider_data: metadata.raw_provider_data || null,
        sharp_odds: matchContext?.sharp_odds || null,
        contextual_intelligence: matchContext?.contextual_intelligence || null
    };
}

function lineToToken(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return String(n).replace('.', '_');
}

function toSecondaryPayload(prediction, marketScore) {
    const normalizedMarket = String(marketScore.market || '').toUpperCase();
    const normalizedPick = String(marketScore.pick || '').toUpperCase();
    const line = Number(marketScore.line);
    const lineToken = lineToToken(line);
    let market = marketScore.legacyMarketHint || marketScore.market;

    if (normalizedMarket === 'DOUBLE_CHANCE') {
        market = `double_chance_${normalizedPick.toLowerCase()}`;
    } else if (normalizedMarket === 'OVER_UNDER_2_5') {
        market = normalizedPick === 'UNDER' ? 'under_2_5' : 'over_2_5';
    } else if (normalizedMarket === 'OVER_UNDER_1_5') {
        market = normalizedPick === 'UNDER' ? 'under_1_5' : 'over_1_5';
    } else if (normalizedMarket === 'BTTS') {
        market = normalizedPick === 'NO' ? 'btts_no' : 'btts_yes';
    } else if (normalizedMarket === 'CORNERS_OVER_UNDER') {
        const side = normalizedPick === 'UNDER' ? 'under' : 'over';
        market = lineToken ? `corners_${side}_${lineToken}` : `corners_${side}`;
    } else if (normalizedMarket === 'YELLOW_CARDS_OVER_UNDER') {
        const side = normalizedPick === 'UNDER' ? 'under' : 'over';
        market = lineToken ? `${side}_${lineToken}_yellows` : (side === 'under' ? 'under_3_5_yellows' : 'over_3_5_yellows');
    }

    return {
        raw_id: prediction.raw_id,
        match_id: prediction.match_id,
        sport: prediction.sport,
        market,
        prediction: marketScore.pick,
        confidence: marketScore.confidence,
        volatility: prediction.volatility,
        odds: prediction.odds,
        metadata: {
            ...(prediction.metadata || {}),
            market_type: marketScore.type,
            market_key: marketScore.market,
            market_description: marketScore.description,
            market_line: Number.isFinite(line) ? line : null,
            market_line_token: lineToken
        }
    };
}

function enforcePerMatchLimit(predictions, maxPerMatch) {
    const counts = new Map();
    const out = [];

    for (const p of predictions) {
        const key = p.match_id;
        const c = counts.get(key) || 0;
        if (c >= maxPerMatch) continue;
        counts.set(key, c + 1);
        out.push(p);
    }

    return out;
}

function getMetadata(prediction) {
    return prediction && typeof prediction.metadata === 'object' && prediction.metadata !== null
        ? prediction.metadata
        : {};
}

function normalizeTextValue(value) {
    const text = String(value === undefined || value === null ? '' : value).trim();
    return text.length ? text : '';
}

function firstNonEmptyValue(sources, paths) {
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        for (const path of paths) {
            const value = normalizeTextValue(readPath(source, path));
            if (value) return value;
        }
    }
    return '';
}

const LEAGUE_COUNTRY_FALLBACKS = new Map([
    ['premier league', 'England'],
    ['championship', 'England'],
    ['league one', 'England'],
    ['league two', 'England'],
    ['primera division', 'Spain'],
    ['la liga', 'Spain'],
    ['segunda division', 'Spain'],
    ['bundesliga', 'Germany'],
    ['2. bundesliga', 'Germany'],
    ['serie a', 'Italy'],
    ['serie b', 'Italy'],
    ['ligue 1', 'France'],
    ['ligue 2', 'France'],
    ['eredivisie', 'Netherlands'],
    ['uefa champions league', 'Europe'],
    ['uefa europa league', 'Europe'],
    ['uefa europa conference league', 'Europe'],
    ['euroleague', 'Europe'],
    ['nba', 'United States'],
    ['nhl', 'United States'],
    ['mlb', 'United States'],
    ['nfl', 'United States']
]);

function normalizeLeagueToken(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function inferCountryFromLeagueName(league) {
    const token = normalizeLeagueToken(league);
    if (!token) return '';
    if (LEAGUE_COUNTRY_FALLBACKS.has(token)) {
        return LEAGUE_COUNTRY_FALLBACKS.get(token) || '';
    }
    for (const [key, country] of LEAGUE_COUNTRY_FALLBACKS.entries()) {
        if (token.includes(key)) return country;
    }
    return '';
}

function resolveLeagueCountryFromPrediction(prediction, metadata, matchInfo, matchContext) {
    const providerPayloads = [
        metadata?.raw_provider_data,
        matchContext?.raw_provider_data,
        matchContext?.match?.raw_provider_data,
        prediction?.raw_provider_data
    ].filter((value) => value && typeof value === 'object');

    const sources = [
        prediction,
        metadata,
        matchInfo || {},
        metadata?.match_info || {},
        matchContext || {},
        metadata?.match_context || {},
        ...providerPayloads
    ];

    const league = firstNonEmptyValue(sources, [
        'league',
        'league_name',
        'competition',
        'tournament',
        'match_info.league',
        'metadata.league',
        'metadata.competition',
        'metadata.match_info.league',
        'metadata.match_context.match_info.league',
        'raw_provider_data.league.name',
        'raw_provider_data.competition.name',
        'raw_provider_data.tournament.name',
        'league.name',
        'competition.name',
        'tournament.name'
    ]);

    const country = firstNonEmptyValue(sources, [
        'country',
        'league_country',
        'match_info.country',
        'metadata.country',
        'metadata.league_country',
        'metadata.match_info.country',
        'metadata.match_context.match_info.country',
        'raw_provider_data.league.country',
        'raw_provider_data.country',
        'league.country',
        'competition.country'
    ]);

    const inferredCountry = country || inferCountryFromLeagueName(league);
    return { league, country: inferredCountry };
}

function isPlaceholderTeamName(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return true;
    return key === 'unknown'
        || key === 'unknown home'
        || key === 'unknown away'
        || key === 'home team'
        || key === 'away team'
        || key === 'tbd'
        || key === 'n/a';
}

function cleanTeamName(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') {
        const normalized = String(value).trim();
        return isPlaceholderTeamName(normalized) ? '' : normalized;
    }
    if (typeof value !== 'object') return '';
    const normalized = String(
        value.name
        || value.team_name
        || value.team
        || value.full_name
        || value.display_name
        || value.short_name
        || value.title
        || ''
    ).trim();
    return isPlaceholderTeamName(normalized) ? '' : normalized;
}

function readPath(source, path) {
    if (!source || typeof source !== 'object') return undefined;
    const parts = Array.isArray(path) ? path : String(path || '').split('.');
    let current = source;
    for (const part of parts) {
        if (!current || typeof current !== 'object' || !(part in current)) return undefined;
        current = current[part];
    }
    return current;
}

function firstValidTeamName(sources, paths) {
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        for (const path of paths) {
            const value = cleanTeamName(readPath(source, path));
            if (value) return value;
        }
    }
    return '';
}

function resolveTeamNameFromPrediction(prediction, side) {
    const metadata = getMetadata(prediction);
    const matchContext = metadata?.match_context && typeof metadata.match_context === 'object'
        ? metadata.match_context
        : null;
    const matchInfo = matchContext?.match_info && typeof matchContext.match_info === 'object'
        ? matchContext.match_info
        : null;
    const providerA = metadata?.raw_provider_data && typeof metadata.raw_provider_data === 'object'
        ? metadata.raw_provider_data
        : null;
    const providerB = matchContext?.raw_provider_data && typeof matchContext.raw_provider_data === 'object'
        ? matchContext.raw_provider_data
        : null;

    const rootPaths = side === 'home'
        ? ['home_team', 'home_team_name', 'homeTeam', 'homeTeamName', 'home', 'home_name']
        : ['away_team', 'away_team_name', 'awayTeam', 'awayTeamName', 'away', 'away_name'];
    const providerPaths = side === 'home'
        ? [
            'teams.home.name',
            'teams.home.team_name',
            'homeTeam.name',
            'homeTeam.team_name',
            'homeTeam',
            'home_team',
            'home.name'
        ]
        : [
            'teams.away.name',
            'teams.away.team_name',
            'awayTeam.name',
            'awayTeam.team_name',
            'awayTeam',
            'away_team',
            'away.name'
        ];

    const direct = firstValidTeamName(
        [prediction, metadata, matchInfo, matchContext, providerA, providerB],
        [...rootPaths, ...providerPaths]
    );
    if (direct) return direct;

    for (const source of [providerA, providerB]) {
        if (!source || typeof source !== 'object') continue;
        const participants = Array.isArray(source.participants) ? source.participants : [];
        for (const participant of participants) {
            const location = String(participant?.meta?.location || participant?.location || '').trim().toLowerCase();
            if (location !== side) continue;
            const value = cleanTeamName(participant?.name || participant?.team?.name);
            if (value) return value;
        }
    }

    return '';
}

function resolveKickoffFromPrediction(prediction, metadata, matchInfo) {
    return metadata?.match_time
        || metadata?.kickoff
        || metadata?.kickoff_time
        || metadata?.commence_time
        || metadata?.date
        || matchInfo?.kickoff
        || matchInfo?.match_time
        || prediction?.match_date
        || prediction?.commence_time
        || prediction?.kickoff
        || prediction?.date
        || null;
}

function selectionMarketKey(prediction) {
    return normalizeMarketKeyMI(
        prediction?.market
        || prediction?.metadata?.market_key
        || prediction?.metadata?.market
        || ''
    );
}

function selectionConfidence(prediction) {
    const value = Number(prediction?.confidence);
    return Number.isFinite(value) ? value : 0;
}

function directConfidenceBand(confidenceValue) {
    const confidence = Number(confidenceValue);
    if (!Number.isFinite(confidence)) return 3;
    if (confidence >= 75) return 0; // Low Risk
    if (confidence >= 55) return 1; // Medium Risk
    if (confidence >= 30) return 2; // High Risk
    return 3; // Extreme Risk
}

function sortDirectCandidatesByBand(predictions) {
    const safePredictions = Array.isArray(predictions) ? predictions.slice() : [];
    return safePredictions.sort((left, right) => {
        const leftConfidence = selectionConfidence(left);
        const rightConfidence = selectionConfidence(right);
        const leftBand = directConfidenceBand(leftConfidence);
        const rightBand = directConfidenceBand(rightConfidence);
        if (leftBand !== rightBand) return leftBand - rightBand;
        if (leftConfidence !== rightConfidence) return rightConfidence - leftConfidence;

        const leftKickoff = parseKickoff(left);
        const rightKickoff = parseKickoff(right);
        if (leftKickoff && rightKickoff) return leftKickoff.getTime() - rightKickoff.getTime();
        if (leftKickoff) return -1;
        if (rightKickoff) return 1;
        return 0;
    });
}

function isDirectMarketSelection(prediction) {
    const market = selectionMarketKey(prediction);
    return DIRECT_MARKETS_ALLOWED.has(market) && selectionConfidence(prediction) >= DIRECT_CONFIDENCE_MIN;
}

function isSafeSinglesSelection(prediction) {
    const market = selectionMarketKey(prediction);
    return SAFE_MARKETS_ALLOWED.has(market) && selectionConfidence(prediction) >= SAFE_CONFIDENCE_MIN;
}

function isAccumulatorEligibleMarket(prediction) {
    const market = selectionMarketKey(prediction);
    return market && !DIRECT_MARKETS_ALLOWED.has(market) && selectionConfidence(prediction) >= ACCA_MIN_LEG_CONFIDENCE;
}

function parseKickoff(prediction) {
    const metadata = getMetadata(prediction);
    const value = metadata.match_time || metadata.kickoff || metadata.kickoff_time || prediction.match_date || prediction.commence_time || null;
    if (!value) return null;

    // Force strict parsing
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const DEFAULT_PUBLISH_WINDOW_DAYS = Math.max(7, Number(process.env.SKCS_PUBLISH_WINDOW_DAYS || 14));

function getPublishWindowDays(tier) {
    return tier === 'deep' ? DEFAULT_PUBLISH_WINDOW_DAYS : DEFAULT_PUBLISH_WINDOW_DAYS;
}

function normalizeSportKey(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return 'unknown';

    if (key === 'soccer' || key === 'football' || key.startsWith('soccer_')) return 'Football';
    if (key === 'nba' || key === 'basketball' || key.startsWith('basketball_')) return 'Basketball';
    if (key === 'nfl' || key === 'american_football' || key.startsWith('americanfootball_')) return 'NFL';
    if (key === 'nhl' || key === 'hockey' || key.startsWith('icehockey_')) return 'NHL';
    if (key === 'mlb' || key === 'baseball' || key.startsWith('baseball_')) return 'MLB';
    if (key === 'rugby' || key.startsWith('rugbyunion_')) return 'Rugby';
    if (key === 'afl' || key.startsWith('aussierules_')) return 'AFL';
    if (key === 'volleyball') return 'Volleyball';
    if (key === 'handball') return 'Handball';
    if (key === 'f1' || key === 'formula1') return 'F1';
    if (key === 'mma' || key.startsWith('mma_')) return 'MMA';
    if (key === 'golf') return 'Golf';
    if (key === 'boxing') return 'Boxing';
    if (key === 'tennis') return 'Tennis';
    if (key === 'cricket') return 'Cricket';
    if (key === 'esports') return 'Esports';
    if (key === 'darts') return 'Darts';

    return value;
}

function isDeploymentSportEnabled(value) {
    return ACTIVE_DEPLOYMENT_SPORTS.has(normalizeSportKey(value));
}

function resolveTelemetryRunId(options = {}) {
    return options?.telemetryRunId || options?.telemetry_run_id || null;
}

function addStageBySport(runId, stage, sportCounts = new Map()) {
    for (const [sport, count] of sportCounts.entries()) {
        pipelineLogger.stageAdd({
            run_id: runId,
            sport,
            stage,
            count
        });
    }
}

function collectSportCountsFromPredictions(predictions = []) {
    const counts = new Map();
    for (const prediction of Array.isArray(predictions) ? predictions : []) {
        const metadata = getMetadata(prediction);
        const sport = normalizeSportKey(prediction?.sport || metadata?.sport || metadata?.sport_key || 'unknown');
        counts.set(sport, (counts.get(sport) || 0) + 1);
    }
    return counts;
}

function collectSportCountsFromMatches(rows = []) {
    const counts = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
        const matches = Array.isArray(row?.matches) ? row.matches : [];
        const matchSports = new Set();
        for (const match of matches) {
            const metadata = match?.metadata || {};
            const sport = normalizeSportKey(match?.sport || metadata?.sport || metadata?.sport_key || row?.sport || 'unknown');
            matchSports.add(sport);
        }
        if (!matchSports.size) {
            const fallbackSport = normalizeSportKey(row?.sport || 'unknown');
            counts.set(fallbackSport, (counts.get(fallbackSport) || 0) + 1);
            continue;
        }
        for (const sport of matchSports) {
            counts.set(sport, (counts.get(sport) || 0) + 1);
        }
    }
    return counts;
}

function getSportTypeLabel(sportKey) {
    const key = normalizeSportKey(sportKey);
    if (key === 'football') return 'Football';
    if (key === 'hockey') return 'Ice Hockey';
    if (key === 'mma') return 'Mixed Martial Arts';
    if (key === 'afl') return 'Aussie Rules';
    if (key === 'basketball') return 'Basketball';
    if (key === 'cricket') return 'Cricket';
    if (key === 'american_football') return 'American Football';
    if (key === 'baseball') return 'Baseball';
    if (key === 'rugby') return 'Rugby';
    return key
        .split('_')
        .filter(Boolean)
        .map((part) => part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function isPublishablePrediction(prediction, tier, now = new Date()) {
    const metadata = getMetadata(prediction);
    const sportKey = normalizeSportKey(prediction?.sport || metadata?.sport || metadata?.sport_key || '');
    if (!isDeploymentSportEnabled(sportKey)) return false;

    // Allow test data through
    if (metadata.data_mode === 'test') return true;
    
    // Check prediction source - be more lenient, allow both 'provider' and 'ai_fallback'
    const predictionSource = String(metadata.prediction_source || '').trim().toLowerCase();
    if (predictionSource && predictionSource !== 'provider' && predictionSource !== 'ai_fallback') {
        return false;
    }
    
    // League is important but not critical if we have other metadata
    if (typeof metadata.league !== 'string' || metadata.league.trim().length === 0) {
        // Allow if we have home/away teams
        if (!metadata.home_team || !metadata.away_team) {
            return false;
        }
    }

    const kickoff = parseKickoff(prediction);
    if (!kickoff) {
        console.log(`[accaBuilder] Rejecting prediction for match ${prediction.match_id}: kickoff time missing or invalid.`);
        return false;
    }

    // IRON-CLAD DATE PATCH: reject matches kicked off more than 15 minutes ago.
    const ACCA_GRACE_MINUTES = 15;
    const graceCutoffMs = now.getTime() - ACCA_GRACE_MINUTES * 60 * 1000;
    if (kickoff.getTime() < graceCutoffMs) {
        console.log(`[accaBuilder] Rejecting prediction for match ${prediction.match_id}: kickoff ${kickoff.toISOString()} is past the ${ACCA_GRACE_MINUTES}-minute grace window.`);
        return false;
    }

    const maxWindowDays = getPublishWindowDays(tier);
    const maxFuture = new Date(now.getTime() + maxWindowDays * 24 * 60 * 60 * 1000);
    return kickoff <= maxFuture;
}

function compareCandidates(a, b, now = new Date()) {
    const kickoffA = parseKickoff(a);
    const kickoffB = parseKickoff(b);
    const upcomingA = kickoffA ? kickoffA >= now : false;
    const upcomingB = kickoffB ? kickoffB >= now : false;

    if (upcomingA !== upcomingB) {
        return upcomingA ? -1 : 1;
    }

    if (kickoffA && kickoffB) {
        const timeDiff = upcomingA && upcomingB
            ? kickoffA.getTime() - kickoffB.getTime()
            : kickoffB.getTime() - kickoffA.getTime();
        if (timeDiff !== 0) return timeDiff;
    } else if (kickoffA) {
        return -1;
    } else if (kickoffB) {
        return 1;
    }

    const confidenceDiff = (Number(b.confidence) || 0) - (Number(a.confidence) || 0);
    if (confidenceDiff !== 0) return confidenceDiff;

    const createdA = new Date(a.created_at || 0).getTime();
    const createdB = new Date(b.created_at || 0).getTime();
    return createdB - createdA;
}

function enforcePerSportLimit(predictions, limitPerSport) {
    const counts = new Map();
    const out = [];

    for (const prediction of predictions) {
        const key = normalizeSportKey(prediction.sport);
        const current = counts.get(key) || 0;
        if (current >= limitPerSport) continue;
        counts.set(key, current + 1);
        out.push(prediction);
    }

    return out;
}

function uniqueBy(rows, keyFn) {
    const seen = new Set();
    const out = [];
    for (const row of rows) {
        const key = keyFn(row);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
    }
    return out;
}

function isSupplementaryDisplayMarket(market) {
    const normalized = String(market || '').trim().toLowerCase();
    if (!normalized) return false;
    return normalized !== 'corners_under' && normalized !== 'corners_over';
}

const SECONDARY_PIVOT_ALLOWED_MARKETS = Object.freeze(new Set([
    'double_chance_1x',
    'double_chance_x2',
    'double_chance_12',
    'draw_no_bet_home',
    'draw_no_bet_away',
    'over_1_5',
    'over_2_5',
    'over_3_5',
    'over_4_5',
    'over_5_5',
    'over_6_5',
    'under_2_5',
    'under_3_5',
    'under_4_5',
    'under_5_5',
    'under_6_5',
    'home_over_0_5',
    'away_over_0_5',
    'home_over_1_5',
    'away_over_1_5',
    'btts_yes',
    'btts_no',
    'btts_over_2_5',
    'btts_under_3_5',
    'home_win_btts_yes',
    'away_win_btts_yes',
    'home_win_btts_no',
    'away_win_btts_no',
    'over_0_5_first_half',
    'under_1_5_first_half',
    'first_half_draw',
    'home_win_either_half',
    'away_win_either_half',
    'win_either_half'
]));

function isAllowedSecondaryPivotMarket(market) {
    const key = normalizeMarketKeyMI(market || '');
    if (!key) return false;
    if (key === 'over_0_5' || key === 'under_0_5') return false;
    if (key.includes('red_cards')) return false;
    if (SECONDARY_PIVOT_ALLOWED_MARKETS.has(key)) return true;
    if (/^corners_(over|under)_(6|7|8|9|10|11|12)_5$/.test(key)) return true;
    if (/^yellow_cards_(over|under)_(1|2|3|4|5|6)_5$/.test(key)) return true;
    if (/^cards_(over|under)_(1|2|3|4|5|6)_5$/.test(key)) return true;
    return false;
}

function normalizeSecondaryPivotCandidate(candidate) {
    if (!candidate || typeof candidate !== 'object') return null;

    const market = normalizeMarketKeyMI(
        candidate.market
        || candidate.market_type
        || candidate.type
        || ''
    );
    if (!market || !isAllowedSecondaryPivotMarket(market)) return null;

    const prediction = String(
        candidate.prediction
        || candidate.recommendation
        || candidate.pick
        || candidate.selection
        || candidate.outcome
        || ''
    ).trim().toLowerCase();
    const confidence = Number(candidate.confidence);
    if (!Number.isFinite(confidence)) return null;

    return {
        market,
        prediction,
        confidence: clamp(Math.round(confidence * 100) / 100, 0, 100),
        label: candidate.label || null
    };
}

function buildSyntheticSecondaryPivotCandidates(primaryMatch, baseConfidence) {
    const normalizedPrimary = String(primaryMatch?.prediction || '').trim().toLowerCase();
    const syntheticBase = clamp(Math.round((Number(baseConfidence) + 18) * 100) / 100, 80, 92);
    const out = [];

    if (normalizedPrimary === 'home_win' || normalizedPrimary === 'home') {
        out.push({ market: 'double_chance_1x', prediction: '1x', confidence: syntheticBase });
        out.push({ market: 'draw_no_bet_home', prediction: 'home', confidence: Math.max(80, syntheticBase - 4) });
    } else if (normalizedPrimary === 'away_win' || normalizedPrimary === 'away') {
        out.push({ market: 'double_chance_x2', prediction: 'x2', confidence: syntheticBase });
        out.push({ market: 'draw_no_bet_away', prediction: 'away', confidence: Math.max(80, syntheticBase - 4) });
    } else {
        out.push({ market: 'double_chance_12', prediction: '12', confidence: syntheticBase });
        out.push({ market: 'double_chance_1x', prediction: '1x', confidence: Math.max(80, syntheticBase - 5) });
    }

    out.push({ market: 'under_3_5', prediction: 'under', confidence: Math.max(75, syntheticBase - 2) });
    out.push({ market: 'over_1_5', prediction: 'over', confidence: Math.max(75, syntheticBase - 3) });
    return out;
}

function deriveDirectSecondaryInsights(matches, totalConfidence) {
    const firstMatch = Array.isArray(matches) ? matches[0] : null;
    if (!firstMatch) return [];

    const metadata = firstMatch?.metadata && typeof firstMatch.metadata === 'object'
        ? firstMatch.metadata
        : {};
    const existing = []
        .concat(Array.isArray(firstMatch?.secondary_insights) ? firstMatch.secondary_insights : [])
        .concat(Array.isArray(metadata?.secondary_markets) ? metadata.secondary_markets : [])
        .concat(Array.isArray(metadata?.secondary_insights) ? metadata.secondary_insights : [])
        .concat(Array.isArray(metadata?.market_intelligence?.secondary_insights) ? metadata.market_intelligence.secondary_insights : []);

    const normalized = [];
    const seen = new Set();
    for (const item of existing) {
        const candidate = normalizeSecondaryPivotCandidate(item);
        if (!candidate) continue;
        if (candidate.confidence < 72) continue;
        if (!isCompatibleWithPrimaryPrediction(firstMatch, candidate)) continue;
        const key = `${candidate.market}:${candidate.prediction}`;
        if (seen.has(key)) continue;
        seen.add(key);
        normalized.push(candidate);
    }

    normalized.sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0));
    let shaped = normalized.slice(0, 4);
    const confidence = Number(totalConfidence);
    const inHighRiskBand = Number.isFinite(confidence) && confidence >= 30 && confidence <= 54;
    const inExtremeRiskBand = Number.isFinite(confidence) && confidence >= 0 && confidence <= 29;

    if ((inHighRiskBand && shaped.length < 4) || (inExtremeRiskBand && shaped.length < 4)) {
        const synthetic = buildSyntheticSecondaryPivotCandidates(firstMatch, confidence);
        for (const item of synthetic) {
            const candidate = normalizeSecondaryPivotCandidate(item);
            if (!candidate) continue;
            if (!isCompatibleWithPrimaryPrediction(firstMatch, candidate)) continue;
            const key = `${candidate.market}:${candidate.prediction}`;
            if (seen.has(key)) continue;
            seen.add(key);
            shaped.push(candidate);
            if (inHighRiskBand && shaped.length >= 4) break;
            if (inExtremeRiskBand && shaped.length >= 4) break;
        }
    }

    // Final fallback: guarantee governance-required minimum counts.
    if ((inHighRiskBand && shaped.length < 4) || (inExtremeRiskBand && shaped.length < 4)) {
        const synthetic = buildSyntheticSecondaryPivotCandidates(firstMatch, confidence);
        for (const item of synthetic) {
            const candidate = normalizeSecondaryPivotCandidate(item);
            if (!candidate) continue;
            const key = `${candidate.market}:${candidate.prediction}`;
            if (seen.has(key)) continue;
            seen.add(key);
            shaped.push(candidate);
            if (inHighRiskBand && shaped.length >= 4) break;
            if (inExtremeRiskBand && shaped.length >= 4) break;
        }
    }

    if (inExtremeRiskBand) return shaped.slice(0, 4);
    if (inHighRiskBand) return shaped.slice(0, 4);
    return shaped.slice(0, 4);
}

function deriveEdgeMindReportFromMatches(matches) {
    const firstMatch = Array.isArray(matches) ? matches[0] : null;
    if (!firstMatch) return null;
    const metadata = firstMatch?.metadata || {};
    const report = firstMatch?.edgemind_report
        || metadata?.edgemind_report
        || metadata?.reasoning
        || metadata?.core_reasoning
        || null;
    return String(report || '').trim() || null;
}

function isCompatibleWithPrimaryPrediction(prediction, candidate) {
    return areLegsCompatible(
        {
            ...prediction,
            market: prediction?.market,
            prediction: prediction?.prediction
        },
        {
            market: candidate?.market,
            prediction: candidate?.prediction
        }
    );
}

function toConflictCheckLeg(leg) {
    const marketKey = String(leg?.market || '').trim().toLowerCase();
    const predictionKey = String(leg?.prediction || leg?.pick || '').trim().toLowerCase();
    if (!marketKey || !predictionKey) return null;

    if (marketKey === '1x2') {
        return { market: '1X2', prediction: predictionKey };
    }
    if (marketKey.startsWith('double_chance_')) {
        const mappedPrediction = predictionKey === '1x'
            ? 'home_or_draw'
            : predictionKey === 'x2'
                ? 'draw_or_away'
                : predictionKey === '12'
                    ? 'home_or_away'
                    : predictionKey;
        return { market: 'DOUBLE_CHANCE', prediction: mappedPrediction };
    }
    if (marketKey === 'under_1_5' || marketKey === 'over_1_5') {
        return { market: 'OVER_UNDER_1_5', prediction: predictionKey };
    }
    if (marketKey === 'under_2_5' || marketKey === 'over_2_5') {
        return { market: 'OVER_UNDER_2_5', prediction: predictionKey };
    }
    if (marketKey === 'btts_yes' || marketKey === 'btts_no') {
        return { market: 'BTTS', prediction: predictionKey === 'yes' ? 'yes' : 'no' };
    }

    return { market: marketKey.toUpperCase(), prediction: predictionKey };
}

function sanitizeSameMatchLegGroup(legs, options = {}) {
    const { no_conflicting_markets = true } = options;
    const out = [];

    for (const leg of legs) {
        const prospective = [...out, leg]
            .map(toConflictCheckLeg)
            .filter(Boolean);

        if (prospective.length > 0 && !isValidCombination(prospective, { no_conflicting_markets })) {
            continue;
        }

        out.push(leg);
    }

    return out;
}

function extractPredictionMatchContext(prediction) {
    const metadata = getMetadata(prediction);
    return metadata.match_context && typeof metadata.match_context === 'object'
        ? metadata.match_context
        : null;
}

function extractPredictionRiskProfile(prediction) {
    const metadata = getMetadata(prediction);
    const marketRisk = metadata?.market_intelligence?.risk_profile;
    if (marketRisk && typeof marketRisk === 'object') return marketRisk;

    const matchContext = extractPredictionMatchContext(prediction);
    if (!matchContext) {
        return {
            aggregate_risk: 0.3,
            reject: false,
            weather_risk: 0,
            lineup_uncertainty: 0.5,
            injury_uncertainty: 0.25,
            derby_risk: 0.25,
            stability_risk: 0.2,
            rotation_risk: 0.2
        };
    }

    return buildRiskProfile(matchContext, metadata?.context_intelligence?.signals || {});
}

function isPredictionHighRisk(prediction, options = {}) {
    const profile = extractPredictionRiskProfile(prediction);
    if (profile.reject) return true;

    if (options.forMega === true) {
        return (
            Number(profile.weather_risk || 0) > 0.5
            || Number(profile.lineup_uncertainty || 0) > 0.55
            || Number(profile.injury_uncertainty || 0) > 0.6
            || Number(profile.derby_risk || 0) > 0.5
            || Number(profile.rotation_risk || 0) > 0.55
            || Number(profile.stability_risk || 0) > 0.55
            || Number(profile.aggregate_risk || 0) > 0.62
        );
    }

    return Number(profile.aggregate_risk || 0) > 0.78;
}

function buildMarketIntelligenceDerivedMarkets(prediction, options = {}) {
    const metadata = getMetadata(prediction);
    const matchContext = extractPredictionMatchContext(prediction);
    if (!matchContext) return [];

    const contextSignals = metadata?.context_intelligence?.signals || {};
    const directMarketKey = normalizeMarketKeyMI(prediction?.market || '');
    const maxRows = Number.isFinite(options.maxRows) ? options.maxRows : 3;
    const excludeMarkets = new Set(
        (Array.isArray(options.excludeMarkets) ? options.excludeMarkets : [])
            .map((value) => normalizeMarketKeyMI(value))
    );

    const ranked = Array.isArray(metadata?.market_intelligence?.ranked_markets)
        ? metadata.market_intelligence.ranked_markets
        : buildCandidateMarkets(matchContext?.sharp_odds || {}, matchContext, { contextSignals }).candidates;

    return uniqueBy(
        ranked
            .map((row) => ({
                market: normalizeMarketKeyMI(row.market),
                prediction: String(row.prediction || '').toLowerCase(),
                confidence: Number(row.confidence),
                priority_tier: Number(row.priority_tier || priorityTierForMarket(row.market))
            }))
            .filter((row) => row.market && Number.isFinite(row.confidence))
            .filter((row) => row.market !== directMarketKey)
            .filter((row) => !excludeMarkets.has(row.market))
            .sort((a, b) => {
                const tierDiff = a.priority_tier - b.priority_tier;
                if (tierDiff !== 0) return tierDiff;
                return Number(b.confidence || 0) - Number(a.confidence || 0);
            })
            .map((row) => ({
                raw_id: prediction.raw_id,
                match_id: prediction.match_id,
                sport: prediction.sport,
                market: row.market,
                prediction: row.prediction || row.market,
                confidence: row.confidence,
                volatility: prediction.volatility,
                odds: prediction.odds,
                metadata: {
                    ...(prediction.metadata || {}),
                    market_key: row.market,
                    market_type: row.priority_tier <= 2 ? 'secondary' : 'advanced',
                    market_priority_tier: row.priority_tier,
                    derived_from_market_intelligence: true
                }
            })),
        (row) => `${row.match_id}:${row.market}`
    ).slice(0, maxRows);
}

async function buildDerivedMarkets(prediction, options = {}) {
    const includeTypes = new Set(
        Array.isArray(options.includeTypes) && options.includeTypes.length
            ? options.includeTypes
            : ['secondary', 'advanced']
    );
    const excludeMarkets = new Set(
        (Array.isArray(options.excludeMarkets) ? options.excludeMarkets : [])
            .map((market) => String(market || '').toUpperCase())
    );
    const maxRows = Number.isFinite(options.maxRows) ? options.maxRows : 1;
    const requireDisplayFriendlyMarkets = options.requireDisplayFriendlyMarkets === true;
    const modelCandidates = buildMarketIntelligenceDerivedMarkets(prediction, options);

    const scoredCandidates = uniqueBy(
        (await scoreMarkets(toScoringMatchPayload(prediction)))
            .filter((market) => includeTypes.has(market.type))
            .filter((market) => !excludeMarkets.has(String(market.market || '').toUpperCase()))
            .sort((a, b) => (Number(b.confidence) || 0) - (Number(a.confidence) || 0))
            .map((market) => toSecondaryPayload(prediction, market))
            .filter((candidate) => isCompatibleWithPrimaryPrediction(prediction, candidate))
            .filter((candidate) => !requireDisplayFriendlyMarkets || isSupplementaryDisplayMarket(candidate.market))
            .filter((candidate) => !isPredictionHighRisk(candidate)),
        (row) => `${row.match_id}:${row.market}`
    );

    return uniqueBy(
        [
            ...modelCandidates.filter((candidate) => isCompatibleWithPrimaryPrediction(prediction, candidate)),
            ...scoredCandidates
        ].filter((candidate) => {
            const primaryKey = normalizeMarketKeyMI(prediction?.market || '');
            const candidateKey = normalizeMarketKeyMI(candidate?.market || '');
            return !areMarketsConflicting(
                { market: primaryKey, prediction: prediction?.prediction },
                { market: candidateKey, prediction: candidate?.prediction }
            );
        })
            .filter((candidate) => !requireDisplayFriendlyMarkets || isSupplementaryDisplayMarket(candidate.market)),
        (row) => `${row.match_id}:${row.market}`
    ).slice(0, maxRows);
}

async function buildSecondaryCandidates(predictions) {
    const secondary = [];
    const minSecondaryConfidence = 72;

    for (const prediction of predictions) {
        const primaryLeg = toFinalMatchPayload(prediction);
        const candidates = await buildDerivedMarkets(prediction, {
            includeTypes: ['secondary', 'advanced'],
            requireDisplayFriendlyMarkets: true,
            maxRows: 2
        });

        for (const candidate of candidates) {
            const candidateMarket = normalizeMarketKeyMI(candidate?.market || '');
            const candidateConfidence = Number(candidate?.confidence || 0);
            if (!isAllowedSecondaryPivotMarket(candidateMarket)) continue;
            if (!Number.isFinite(candidateConfidence) || candidateConfidence < minSecondaryConfidence) continue;

            const candidateLeg = toFinalMatchPayload(candidate);
            const validation = validateInsightLegGroup([primaryLeg, candidateLeg]);
            if (!validation.valid) continue;

            secondary.push({
                ...candidate,
                metadata: {
                    ...(candidate.metadata || {}),
                    validation_matrix: validation
                }
            });
        }
    }

    return uniqueBy(secondary, (row) => `${row.match_id}:${row.market}`);
}

async function buildSameMatchCandidates(predictions, options = {}) {
    const { no_conflicting_markets = true } = options;
    const out = [];
    for (const prediction of predictions) {
        const metadata = getMetadata(prediction);
        const sameMatchGate = metadata?.market_intelligence?.same_match;
        if (!sameMatchGate || sameMatchGate.allowed !== true) {
            continue;
        }
        if (isPredictionHighRisk(prediction, { forMega: true })) {
            continue;
        }

        const derived = await buildDerivedMarkets(prediction, {
            includeTypes: ['primary', 'secondary', 'advanced'],
            excludeMarkets: ['MATCH_RESULT', 'MATCH_WINNER', 'WINNER', 'RACE_WINNER'],
            maxRows: SAME_MATCH_INSIGHT_TARGET - 1
        });
        if (derived.length === 0) continue;

        const legs = sanitizeSameMatchLegGroup([
            toFinalMatchPayload(prediction),
            ...derived.map(toFinalMatchPayload)
        ], { no_conflicting_markets }).slice(0, SAME_MATCH_INSIGHT_TARGET);
        if (legs.length < 2) continue;

        const hasConflictingPair = no_conflicting_markets && legs.some((left, i) => legs.some((right, j) => {
            if (i >= j) return false;
            return areMarketsConflicting(
                { market: normalizeMarketKeyMI(left.market), prediction: left.prediction },
                { market: normalizeMarketKeyMI(right.market), prediction: right.prediction }
            );
        }));
        if (hasConflictingPair) continue;

        const validation = validateInsightLegGroup(legs);
        if (!validation.valid) continue;

        const validatedLegs = legs.map((leg) => ({
            ...leg,
            metadata: {
                ...(leg.metadata || {}),
                validation_matrix: validation
            }
        }));

        const totalConfidence = computeTotalConfidence(validatedLegs);
        const riskLevel = riskLevelFromConfidence(totalConfidence);

        out.push({
            match_id: prediction.match_id,
            matches: validatedLegs,
            total_confidence: totalConfidence,
            risk_level: riskLevel
        });

        if (options.publishRunId && validatedLegs.length >= 4) {
            await insertSameMatchCombination(prediction, validatedLegs, totalConfidence, riskLevel, options.publishRunId);
        }
    }

    return out;
}

async function insertSameMatchCombination(prediction, legs, totalConfidence, riskLevel, publishRunId) {
    const { query } = require('../db');
    const fixtureId = String(prediction?.match_id || prediction?.fixture_id || '').trim();
    if (!fixtureId) return;

    const legCount = legs.length;
    const combinationLegs = legCount >= 8 ? 8 : (legCount >= 6 ? 6 : 4);

    const marketsArray = legs.slice(0, combinationLegs).map(leg => ({
        market_key: leg.market,
        label: leg.market,
        probability: leg.confidence || 0
    }));

    const combinedProbability = marketsArray.reduce((acc, m) => acc * (m.probability / 100), 1) * 100;
    const combinedOdds = marketsArray.reduce((acc, m) => acc * (100 / (m.probability || 1)), 1);

    try {
        await query(`
            INSERT INTO same_match_combinations (
                fixture_id, sport, home_team, away_team, match_date, league,
                combination_legs, markets, combined_probability, combined_odds,
                risk_tier, prediction_source, publish_run_id, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
            ON CONFLICT (fixture_id, combination_legs) DO UPDATE SET
                markets = EXCLUDED.markets,
                combined_probability = EXCLUDED.combined_probability,
                combined_odds = EXCLUDED.combined_odds,
                risk_tier = EXCLUDED.risk_tier,
                updated_at = NOW()
        `, [
            fixtureId,
            String(prediction?.sport || 'football'),
            String(prediction?.home_team || ''),
            String(prediction?.away_team || ''),
            prediction?.match_date || prediction?.date || null,
            prediction?.league || null,
            combinationLegs,
            JSON.stringify(marketsArray),
            combinedProbability,
            combinedOdds,
            riskLevel,
            'same_match_builder',
            publishRunId,
            JSON.stringify({ _prediction_source: prediction?.prediction_source || 'unknown' })
        ]);
    } catch (err) {
        console.error('[accaBuilder] Failed to insert same_match_combination:', err.message);
    }
}

function buildMultiCandidates(predictions, maxRows = 16 * VOLUME_CAP_MULTIPLIER) {
    const direct = predictions.slice(0, 12 * VOLUME_CAP_MULTIPLIER);
    const combos = [];
    const bySport = new Map();

    for (const candidate of direct) {
        const sportKey = normalizeSportKey(candidate?.sport || candidate?.metadata?.sport || 'unknown');
        if (!bySport.has(sportKey)) bySport.set(sportKey, []);
        bySport.get(sportKey).push(candidate);
    }

    for (const sportCandidates of bySport.values()) {
        for (let size = 2; size <= 3; size++) {
            for (const combo of combinations(sportCandidates, size)) {
                const ids = combo.map((row) => row.match_id);
                if (new Set(ids).size !== ids.length) continue;
                const legs = combo.map(toFinalMatchPayload);
                combos.push({
                    match_id: ids.join('|'),
                    matches: legs,
                    total_confidence: computeTotalConfidence(legs),
                    risk_level: riskLevelFromConfidence(computeTotalConfidence(legs))
                });
            }
        }
    }

    return combos
        .sort((a, b) => b.total_confidence - a.total_confidence)
        .slice(0, maxRows);
}

function normalizeMarketForAcca(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function normalizePickForAcca(value) {
    return String(value || '').trim().toLowerCase();
}

function pickToWinnerToken(pick) {
    const token = normalizePickForAcca(pick);
    if (token === 'home' || token === 'team_1' || token === 'player_1' || token === 'fighter_1') return 'home_win';
    if (token === 'away' || token === 'team_2' || token === 'player_2' || token === 'fighter_2') return 'away_win';
    if (token === 'draw') return 'draw';
    return token;
}

function parseGoalLineFromMarketScore(marketScore) {
    const normalized = String(marketScore?.market || '').toUpperCase();
    if (normalized === 'OVER_UNDER_0_5') return 0.5;
    if (normalized === 'OVER_UNDER_1_5') return 1.5;
    if (normalized === 'OVER_UNDER_2_5') return 2.5;
    if (normalized === 'OVER_UNDER_3_5') return 3.5;
    if (normalized === 'OVER_UNDER_4_5') return 4.5;
    if (normalized === 'OVER_UNDER_5_5') return 5.5;
    const line = Number(marketScore?.line);
    return Number.isFinite(line) ? line : null;
}

function parseLineTokenFromPick(pick = '') {
    const token = String(pick || '').trim().toLowerCase();
    const match = token.match(/_(\d+)_(\d+)$/);
    if (!match) return null;
    return `${match[1]}_${match[2]}`;
}

function resolveLineTokenForMarketScore(marketScore, fallback = '2_5') {
    const line = parseGoalLineFromMarketScore(marketScore);
    const fromLine = lineToToken(line);
    if (fromLine) return fromLine;
    const fromPick = parseLineTokenFromPick(marketScore?.pick);
    return fromPick || fallback;
}

function buildAccaCandidateFromMarketScore(prediction, marketScore) {
    const metadata = getMetadata(prediction);
    const sport = normalizeSportKey(prediction.sport || metadata.sport || '');
    const sportType = getSportTypeLabel(sport);
    const normalizedMarket = String(marketScore?.market || '').toUpperCase();
    const pick = String(marketScore?.pick || '').toUpperCase();
    const pickLower = normalizePickForAcca(pick);
    const confidence = Number(marketScore?.confidence);
    if (!Number.isFinite(confidence)) return null;

    let market = normalizeMarketForAcca(marketScore?.market || prediction.market);
    let predictionValue = pickLower;

    if (normalizedMarket === 'MATCH_RESULT') {
        market = '1x2';
        predictionValue = pick === 'DRAW' ? 'draw' : (pick === 'AWAY' ? 'away_win' : 'home_win');
    } else if (normalizedMarket === 'DOUBLE_CHANCE') {
        market = `double_chance_${pickLower}`;
        predictionValue = pickLower;
    } else if (normalizedMarket === 'DRAW_NO_BET') {
        market = pick === 'AWAY' ? 'draw_no_bet_away' : 'draw_no_bet_home';
        predictionValue = pick === 'AWAY' ? 'away' : 'home';
    } else if (normalizedMarket === 'BTTS') {
        market = pick === 'NO' ? 'btts_no' : 'btts_yes';
        predictionValue = pick === 'NO' ? 'no' : 'yes';
    } else if (normalizedMarket.startsWith('OVER_UNDER_')) {
        const line = parseGoalLineFromMarketScore(marketScore);
        const lineToken = lineToToken(line);
        if (lineToken) {
            market = `${pickLower}_${lineToken}`;
        } else if (normalizedMarket === 'OVER_UNDER_2_5') {
            market = pick === 'UNDER' ? 'under_2_5' : 'over_2_5';
        } else if (normalizedMarket === 'OVER_UNDER_1_5') {
            market = pick === 'UNDER' ? 'under_1_5' : 'over_1_5';
        }
        predictionValue = market;
    } else if (normalizedMarket === 'MATCH_WINNER' || normalizedMarket === 'WINNER' || normalizedMarket === 'RACE_WINNER') {
        market = normalizedMarket === 'RACE_WINNER' ? 'race_winner' : 'match_winner';
        predictionValue = pickToWinnerToken(pick);
    } else if (normalizedMarket === 'TOTAL_POINTS') {
        market = `total_points_${pickLower}`;
        predictionValue = pickLower;
    } else if (normalizedMarket === 'TOTAL_GOALS') {
        market = `total_goals_${pickLower}`;
        predictionValue = pickLower;
    } else if (normalizedMarket === 'TEAM_TOTAL_GOALS') {
        const sideMatch = pickLower.match(/^(home|away)_(over|under)$/);
        const lineToken = resolveLineTokenForMarketScore(marketScore, '1_5');
        if (sideMatch) {
            market = `team_total_${sideMatch[1]}_${sideMatch[2]}_${lineToken}`;
            predictionValue = `${sideMatch[1]}_${sideMatch[2]}_${lineToken}`;
        } else {
            market = `team_total_${pickLower}`;
            predictionValue = pickLower;
        }
    } else if (normalizedMarket === 'TOTAL_RUNS') {
        market = `total_runs_${pickLower}`;
        predictionValue = pickLower;
    } else if (normalizedMarket === 'TOTAL_GAMES') {
        market = `total_games_${pickLower}`;
        predictionValue = pickLower;
    } else if (normalizedMarket === 'COMBO_MATCH_RESULT_OVER_UNDER') {
        const comboMatch = pickLower.match(/^(home|away|draw)_(over|under)_(\d+)_(\d+)$/);
        if (comboMatch) {
            market = `combo_${comboMatch[1]}_and_${comboMatch[2]}_${comboMatch[3]}_${comboMatch[4]}`;
            predictionValue = `${comboMatch[1]}+${comboMatch[2]}_${comboMatch[3]}_${comboMatch[4]}`;
        }
    } else if (normalizedMarket === 'COMBO_DC_OVER_UNDER') {
        const comboMatch = pickLower.match(/^(1x|x2|12)_(over|under)_(\d+)_(\d+)$/);
        if (comboMatch) {
            market = `combo_dc_${comboMatch[1]}_and_${comboMatch[2]}_${comboMatch[3]}_${comboMatch[4]}`;
            predictionValue = `${comboMatch[1]}+${comboMatch[2]}_${comboMatch[3]}_${comboMatch[4]}`;
        }
    } else if (normalizedMarket === 'COMBO_BTTS_OVER_UNDER') {
        const comboMatch = pickLower.match(/^(yes|no)_(over|under)_(\d+)_(\d+)$/);
        if (comboMatch) {
            market = `combo_btts_${comboMatch[1]}_and_${comboMatch[2]}_${comboMatch[3]}_${comboMatch[4]}`;
            predictionValue = `${comboMatch[1]}+${comboMatch[2]}_${comboMatch[3]}_${comboMatch[4]}`;
        }
    } else if (normalizedMarket === 'HANDICAP' || normalizedMarket === 'SPREAD' || normalizedMarket === 'SET_HANDICAP') {
        market = normalizeMarketForAcca(marketScore.market);
        predictionValue = pickLower;
    } else if (normalizedMarket === 'EUROPEAN_HANDICAP' || normalizedMarket === 'ASIAN_HANDICAP') {
        market = normalizedMarket === 'EUROPEAN_HANDICAP' ? 'european_handicap' : 'asian_handicap';
        predictionValue = pickLower;
    } else if (normalizedMarket === 'HT_FT') {
        market = `ht_ft_${pickLower}`;
        predictionValue = pickLower;
    } else if (normalizedMarket === 'METHOD') {
        market = 'method_of_victory';
        predictionValue = pickLower;
    } else if (normalizedMarket === 'SET_BETTING' || normalizedMarket === 'MAP_SCORE') {
        market = normalizeMarketForAcca(marketScore.market);
        predictionValue = pickLower;
    } else if (normalizedMarket === 'PODIUM') {
        market = 'podium_finish';
        predictionValue = pickLower;
    } else if (normalizedMarket === 'TOP_10') {
        market = 'top_10_finish';
        predictionValue = pickLower;
    }

    return {
        raw_id: prediction.raw_id,
        match_id: prediction.match_id,
        sport,
        market,
        prediction: predictionValue,
        confidence,
        volatility: prediction.volatility,
        odds: prediction.odds,
        metadata: {
            ...metadata,
            sport_type: sportType,
            market_key: normalizedMarket,
            market_type: marketScore?.type || null,
            market_description: marketScore?.description || null,
            market_line: Number.isFinite(Number(marketScore?.line)) ? Number(marketScore.line) : null,
            source_market_confidence: confidence
        }
    };
}

function buildExpandedFootballGoalLineCandidates(prediction, scoredMarkets = [], minConfidence = ACCA_MIN_LEG_CONFIDENCE) {
    const sport = normalizeSportKey(prediction?.sport);
    if (sport !== 'football') return [];

    const base = scoredMarkets
        .filter((row) => String(row?.market || '').toUpperCase() === 'OVER_UNDER_2_5')
        .sort((a, b) => Number(b?.confidence || 0) - Number(a?.confidence || 0))[0];
    if (!base || !Number.isFinite(Number(base.confidence))) return [];

    const pick = String(base.pick || '').toUpperCase();
    if (pick !== 'OVER' && pick !== 'UNDER') return [];

    const adjustments = pick === 'OVER'
        ? [[3.5, 4], [4.5, 8], [5.5, 12]]
        : [[3.5, 3], [4.5, 5], [5.5, 7]];
    const out = [];

    for (const [line, penalty] of adjustments) {
        const confidence = Math.round((Number(base.confidence) - penalty) * 100) / 100;
        if (confidence < minConfidence) continue;
        const lineToken = lineToToken(line);
        if (!lineToken) continue;
        const market = `${pick.toLowerCase()}_${lineToken}`;
        out.push({
            raw_id: prediction.raw_id,
            match_id: prediction.match_id,
            sport: 'football',
            market,
            prediction: market,
            confidence,
            volatility: prediction.volatility,
            odds: prediction.odds,
            metadata: {
                ...getMetadata(prediction),
                sport_type: getSportTypeLabel('football'),
                market_key: `OVER_UNDER_${lineToken}`,
                market_type: 'secondary',
                market_line: line,
                market_description: `Total goals ${pick.toLowerCase()} ${line}`,
                synthetic_market: true
            }
        });
    }

    return out;
}

function buildFootballComboCandidates(prediction, scoredMarkets = [], minConfidence = ACCA_MIN_LEG_CONFIDENCE) {
    const sport = normalizeSportKey(prediction?.sport);
    if (sport !== 'football') return [];

    const byMarket = new Map();
    for (const market of scoredMarkets) {
        const key = String(market?.market || '').toUpperCase();
        if (!byMarket.has(key)) byMarket.set(key, []);
        byMarket.get(key).push(market);
    }

    for (const rows of byMarket.values()) {
        rows.sort((a, b) => Number(b?.confidence || 0) - Number(a?.confidence || 0));
    }

    const dc = (byMarket.get('DOUBLE_CHANCE') || [])[0] || null;
    const btts = (byMarket.get('BTTS') || [])[0] || null;
    const result = (byMarket.get('MATCH_RESULT') || [])[0] || null;
    const ou25 = (byMarket.get('OVER_UNDER_2_5') || [])[0] || null;
    const preferredGoalMarkets = [
        ...(byMarket.get('OVER_UNDER_2_5') || []),
        ...(byMarket.get('OVER_UNDER_3_5') || []),
        ...(byMarket.get('OVER_UNDER_1_5') || [])
    ].sort((a, b) => Number(b?.confidence || 0) - Number(a?.confidence || 0));
    const ouBest = preferredGoalMarkets[0] || null;

    const out = [];
    if (dc && btts) {
        const comboConfidence = calculateTrueComboConfidence(dc.confidence, btts.confidence, {
            marketA: 'DOUBLE_CHANCE',
            pickA: dc.pick,
            marketB: 'BTTS',
            pickB: btts.pick
        });
        if (comboConfidence >= minConfidence) {
            const dcPick = normalizePickForAcca(dc.pick);
            const bttsPick = normalizePickForAcca(btts.pick);
            out.push({
                raw_id: prediction.raw_id,
                match_id: prediction.match_id,
                sport: 'football',
                market: `combo_dc_${dcPick}_btts_${bttsPick}`,
                prediction: `${dcPick}+${bttsPick}`,
                confidence: comboConfidence,
                volatility: prediction.volatility,
                odds: prediction.odds,
                metadata: {
                    ...getMetadata(prediction),
                    sport_type: getSportTypeLabel('football'),
                    market_key: 'COMBO_DOUBLE_CHANCE_BTTS',
                    market_type: 'advanced',
                    market_description: `Double Chance ${dcPick.toUpperCase()} + BTTS ${bttsPick.toUpperCase()}`,
                    synthetic_market: true
                }
            });
        }
    }

    if (dc && ouBest) {
        const dcPick = normalizePickForAcca(dc.pick);
        const ouPick = normalizePickForAcca(ouBest.pick);
        const lineToken = resolveLineTokenForMarketScore(ouBest, '2_5');
        const comboConfidence = calculateTrueComboConfidence(dc.confidence, ouBest.confidence, {
            marketA: 'DOUBLE_CHANCE',
            pickA: dc.pick,
            marketB: ouBest.market,
            pickB: ouBest.pick
        });
        if (comboConfidence >= minConfidence) {
            out.push({
                raw_id: prediction.raw_id,
                match_id: prediction.match_id,
                sport: 'football',
                market: `combo_dc_${dcPick}_and_${ouPick}_${lineToken}`,
                prediction: `${dcPick}+${ouPick}_${lineToken}`,
                confidence: comboConfidence,
                volatility: prediction.volatility,
                odds: prediction.odds,
                metadata: {
                    ...getMetadata(prediction),
                    sport_type: getSportTypeLabel('football'),
                    market_key: 'COMBO_DC_OVER_UNDER',
                    market_type: 'advanced',
                    market_description: `Double Chance ${dcPick.toUpperCase()} + ${ouPick.toUpperCase()} ${lineToken.replace('_', '.')} Goals`,
                    synthetic_market: true
                }
            });
        }
    }

    if (btts && ouBest) {
        const bttsPick = normalizePickForAcca(btts.pick);
        const ouPick = normalizePickForAcca(ouBest.pick);
        const lineToken = resolveLineTokenForMarketScore(ouBest, '2_5');
        const comboConfidence = calculateTrueComboConfidence(btts.confidence, ouBest.confidence, {
            marketA: 'BTTS',
            pickA: btts.pick,
            marketB: ouBest.market,
            pickB: ouBest.pick
        });
        if (comboConfidence >= minConfidence) {
            out.push({
                raw_id: prediction.raw_id,
                match_id: prediction.match_id,
                sport: 'football',
                market: `combo_btts_${bttsPick}_and_${ouPick}_${lineToken}`,
                prediction: `${bttsPick}+${ouPick}_${lineToken}`,
                confidence: comboConfidence,
                volatility: prediction.volatility,
                odds: prediction.odds,
                metadata: {
                    ...getMetadata(prediction),
                    sport_type: getSportTypeLabel('football'),
                    market_key: 'COMBO_BTTS_OVER_UNDER',
                    market_type: 'advanced',
                    market_description: `BTTS ${bttsPick.toUpperCase()} + ${ouPick.toUpperCase()} ${lineToken.replace('_', '.')} Goals`,
                    synthetic_market: true
                }
            });
        }
    }

    if (result && ou25) {
        const winnerToken = normalizePickForAcca(result.pick);
        const ouPick = normalizePickForAcca(ou25.pick);
        const comboConfidence = calculateTrueComboConfidence(result.confidence, ou25.confidence, {
            marketA: 'MATCH_RESULT',
            pickA: result.pick,
            marketB: 'OVER_UNDER_2_5',
            pickB: ou25.pick
        });
        if (comboConfidence >= minConfidence) {
            out.push({
                raw_id: prediction.raw_id,
                match_id: prediction.match_id,
                sport: 'football',
                market: `combo_${winnerToken}_and_${ouPick}_2_5`,
                prediction: `${winnerToken}+${ouPick}_2_5`,
                confidence: comboConfidence,
                volatility: prediction.volatility,
                odds: prediction.odds,
                metadata: {
                    ...getMetadata(prediction),
                    sport_type: getSportTypeLabel('football'),
                    market_key: 'COMBO_MATCH_RESULT_OU_2_5',
                    market_type: 'advanced',
                    market_description: `Match Result ${winnerToken.toUpperCase()} + ${ouPick.toUpperCase()} 2.5 Goals`,
                    synthetic_market: true
                }
            });
        }
    }

    return out;
}

function normalizedAccaMarketKey(candidate) {
    return normalizeMarketForAcca(candidate?.market || candidate?.metadata?.market_key || '');
}

function isSaferAccumulatorMarket(candidate) {
    const market = normalizedAccaMarketKey(candidate);
    if (!market) return false;
    if (isMegaSafeMarket(market)) return true;
    if (market.startsWith('double_chance_')) return true;
    if (market.startsWith('draw_no_bet_')) return true;
    if (market.startsWith('combo_') || market.startsWith('combo_dc_')) return true;
    if (market.startsWith('team_total_')) return true;
    if (market.includes('handicap')) return true;
    if (market.startsWith('ht_ft_')) return true;
    if (market.startsWith('over_') || market.startsWith('under_')) return true;
    if (market.startsWith('btts_')) return true;
    return false;
}

function accumulatorMarketPriorityScore(candidate) {
    const market = normalizedAccaMarketKey(candidate);
    if (!market) return 0;
    const tier = priorityTierForMarket(market);
    if (isMegaSafeMarket(market)) {
        return 8 - tier;
    }
    if (tier === 1) return 7;
    if (tier === 2) return 5;
    if (tier === 3) return 3;
    if (market.startsWith('combo_dc_') || market.startsWith('combo_')) return 4;
    if (market === 'match_winner' || market === '1x2') return 2;
    return 1;
}

function parseGoalLineFromAccumulatorMarket(market = '') {
    const normalized = normalizeMarketForAcca(market);
    const match = normalized.match(/(?:^|_)(\d+)_(\d+)$/);
    if (!match) return null;
    const whole = Number(match[1]);
    const decimal = Number(match[2]);
    if (!Number.isFinite(whole) || !Number.isFinite(decimal)) return null;
    return Number(`${whole}.${decimal}`);
}

function isLowValueAccumulatorMarket(candidate) {
    const market = normalizedAccaMarketKey(candidate);
    if (!market) return false;

    const directLowValue = market === 'over_0_5' || market.includes('_over_0_5');
    if (directLowValue) return true;

    return false;
}

function isEscalatedValueAccumulatorMarket(candidate) {
    const market = normalizedAccaMarketKey(candidate);
    if (!market) return false;
    if (isMegaSafeMarket(market)) return true;
    if (market.startsWith('combo_') || market.startsWith('combo_dc_')) return true;
    if (market.startsWith('double_chance_') || market.startsWith('draw_no_bet_')) return true;
    if (market.startsWith('btts_')) return true;
    if (market.startsWith('team_total_')) return true;
    if (market.includes('handicap')) return true;
    if (market.startsWith('ht_ft_')) return true;
    if (market.startsWith('over_') || market.startsWith('under_')) {
        const line = parseGoalLineFromAccumulatorMarket(market);
        return Number.isFinite(line) ? line >= 2.5 : true;
    }
    return false;
}

function applyMinimumValueConstraint(candidatePool, minConfidenceFloor) {
    if (!Array.isArray(candidatePool) || candidatePool.length === 0) return null;
    const best = candidatePool[0];
    if (!best) return null;

    const bestConfidence = Number(best?.confidence || 0);
    if (!isLowValueAccumulatorMarket(best) || bestConfidence < 95) {
        return best;
    }

    const escalatedCandidates = candidatePool
        .filter((candidate) => Number(candidate?.confidence || 0) >= minConfidenceFloor)
        .filter(isEscalatedValueAccumulatorMarket)
        .sort(compareAccaCandidatePreference);

    if (!escalatedCandidates.length) {
        return best;
    }

    const upgraded = escalatedCandidates[0];
    return {
        ...upgraded,
        metadata: {
            ...(upgraded.metadata || {}),
            minimum_value_constraint_applied: true,
            minimum_value_escalated_from: normalizedAccaMarketKey(best)
        }
    };
}

function isComboConditionAccumulatorMarket(candidate) {
    const market = normalizedAccaMarketKey(candidate);
    if (!market) return false;
    return market.startsWith('combo_') || market.startsWith('combo_dc_');
}

function resolveComboConditionCap(size, options = {}) {
    if (Number(size) === ACCA_SIZE) return 2;
    if (Number(size) === MEGA_ACCA_SIZE) return 4;
    if (options.isMega === true) return 4;
    return Infinity;
}

function selectBestAccaCandidateFromPool(candidatePool, minConfidenceFloor) {
    if (!Array.isArray(candidatePool) || candidatePool.length === 0) return null;
    const ranked = candidatePool.slice().sort(compareAccaCandidatePreference);
    const constrained = applyMinimumValueConstraint(ranked, minConfidenceFloor);
    const selected = constrained || ranked[0] || null;
    if (!selected) return null;
    return {
        ...selected,
        metadata: {
            ...(selected.metadata || {}),
            depth_first_full_scoring_applied: true,
            evaluated_market_count: ranked.length
        }
    };
}

function compareAccaCandidatePreference(a, b) {
    const riskA = Number(extractPredictionRiskProfile(a)?.aggregate_risk || 0);
    const riskB = Number(extractPredictionRiskProfile(b)?.aggregate_risk || 0);
    const riskDiff = riskA - riskB;
    if (riskDiff !== 0) return riskDiff;

    const confidenceDiff = Number(b?.confidence || 0) - Number(a?.confidence || 0);
    if (confidenceDiff !== 0) return confidenceDiff;

    const tierDiff = priorityTierForMarket(normalizedAccaMarketKey(a)) - priorityTierForMarket(normalizedAccaMarketKey(b));
    if (tierDiff !== 0) return tierDiff;

    const marketPriorityDiff = accumulatorMarketPriorityScore(b) - accumulatorMarketPriorityScore(a);
    if (marketPriorityDiff !== 0) return marketPriorityDiff;

    const saferA = isSaferAccumulatorMarket(a);
    const saferB = isSaferAccumulatorMarket(b);
    if (saferA !== saferB) return saferB ? 1 : -1;

    return compareAccaCandidates(a, b);
}

function compareAccaCandidates(a, b) {
    const confidenceDiff = Number(b?.confidence || 0) - Number(a?.confidence || 0);
    if (confidenceDiff !== 0) return confidenceDiff;
    const kickoffA = parseKickoff(a);
    const kickoffB = parseKickoff(b);
    if (kickoffA && kickoffB) return kickoffA.getTime() - kickoffB.getTime();
    if (kickoffA) return -1;
    if (kickoffB) return 1;
    return 0;
}

function applyConfidenceFloorToCandidate(candidate, floor = ACCA_MIN_LEG_CONFIDENCE) {
    const confidence = Number(candidate?.confidence);
    if (!Number.isFinite(confidence)) return null;
    return {
        ...candidate,
        confidence: confidence < floor ? floor : confidence
    };
}

function candidateMatchesAccaFallbackPass(candidate, pass, options = {}) {
    const normalized = applyConfidenceFloorToCandidate(candidate, ACCA_MIN_LEG_CONFIDENCE);
    if (!normalized) return false;

    const confidence = Number(normalized.confidence);
    if (!Number.isFinite(confidence) || confidence < Number(pass?.minConfidence || ACCA_MIN_LEG_CONFIDENCE)) return false;

    const marketKey = normalizeMarketKeyMI(normalized?.market || '');
    const tier = priorityTierForMarket(marketKey);
    const tiers = Array.isArray(pass?.tiers) ? pass.tiers : [1, 2, 3, 4];

    if (!tiers.includes(tier)) return false;
    if (pass?.safeTier3Only && tier === 3 && !SAFE_TIER3_ACCA_MARKETS.has(marketKey)) return false;
    if (pass?.directSafeOnly && !DIRECT_SAFE_MARKETS.has(marketKey)) return false;

    if (options.forMega === true && (!isMegaSafeMarket(marketKey) || isTwelveLegRestrictedMarket(marketKey))) {
        return false;
    }

    return !isPredictionHighRisk(normalized, { forMega: options.forMega === true });
}

function filterPoolForAccaFallbackPass(candidates, pass, options = {}) {
    return (Array.isArray(candidates) ? candidates : [])
        .map((candidate) => applyConfidenceFloorToCandidate(candidate, ACCA_MIN_LEG_CONFIDENCE))
        .filter(Boolean)
        .filter((candidate) => candidateMatchesAccaFallbackPass(candidate, pass, options))
        .sort(compareAccaCandidatePreference);
}

function relaxFilters(candidates, options = {}) {
    const forMega = options.forMega === true;
    return (Array.isArray(candidates) ? candidates : [])
        .map((candidate) => applyConfidenceFloorToCandidate(candidate, ACCA_MIN_LEG_CONFIDENCE))
        .filter(Boolean)
        .filter((candidate) => {
            const confidence = Number(candidate?.confidence);
            if (!Number.isFinite(confidence) || confidence < ACCA_MIN_LEG_CONFIDENCE) return false;

            const marketKey = normalizeMarketKeyMI(candidate?.market || '');
            if (forMega && (!isMegaSafeMarket(marketKey) || isTwelveLegRestrictedMarket(marketKey))) return false;
            if (isPredictionHighRisk(candidate, { forMega })) return false;
            return true;
        })
        .sort(compareAccaCandidatePreference);
}

function ensureCandidatePoolWithRetry(candidates, required, options = {}) {
    const pool = Array.isArray(candidates) ? candidates.slice() : [];
    if (pool.length >= required) return pool;
    return relaxFilters(pool, options);
}

function buildAccumulatorRowForStep(step, candidatePool, usedFixtureIds, minConfidenceFloor, options = {}) {
    if (Number(step?.legCount) === MEGA_ACCA_SIZE) {
        const rows = buildMegaAcca12Candidates(candidatePool, {
            maxRows: 1,
            minLegConfidence: minConfidenceFloor,
            globalUsedFixtures: usedFixtureIds,
            expiryCutoff: options.expiryCutoff,
            megaDiagnostics: options.megaDiagnostics
        });
        return rows[0] || null;
    }

    if (step?.profile === 'football_only') {
        return buildFootballOnlyAccumulatorRow(
            candidatePool,
            usedFixtureIds,
            ACCA_SIZE,
            minConfidenceFloor,
            { isMega: false }
        );
    }

    if (step?.profile === 'single_sport') {
        return buildSingleSportAccumulatorRow(
            candidatePool,
            usedFixtureIds,
            ACCA_SIZE,
            minConfidenceFloor,
            { isMega: false }
        );
    }

    return buildSingleSportAccumulatorRow(
        candidatePool,
        usedFixtureIds,
        ACCA_SIZE,
        minConfidenceFloor,
        { isMega: false }
    );
}

function buildAccumulatorRowWithFallbackLadder(step, candidatePool, usedFixtureIds, options = {}) {
    const required = Number(step?.legCount || 0);
    const forMega = required === MEGA_ACCA_SIZE;
    if (!required || !Array.isArray(candidatePool) || !candidatePool.length) return null;

    for (const pass of ACCA_FALLBACK_LADDER) {
        let scoped = filterPoolForAccaFallbackPass(candidatePool, pass, { forMega });
        if (scoped.length < required) {
            scoped = ensureCandidatePoolWithRetry(scoped, required, { forMega });
        }
        if (scoped.length < required) continue;

        const row = buildAccumulatorRowForStep(step, scoped, usedFixtureIds, pass.minConfidence, options);
        if (row) return row;
    }

    const relaxed = ensureCandidatePoolWithRetry(candidatePool, required, { forMega });
    if (relaxed.length < required) return null;

    return buildAccumulatorRowForStep(step, relaxed, usedFixtureIds, ACCA_MIN_LEG_CONFIDENCE, options);
}

function getAccaCandidateFixtureIds(candidate) {
    return predictionFixtureIds(candidate);
}

function deriveAccaMarketType(candidate) {
    const raw = String(candidate?.metadata?.market_key || candidate?.market || '').trim().toLowerCase();
    if (!raw) return 'market';
    if (raw.startsWith('combo_')) return raw;
    if (raw.startsWith('draw_no_bet')) return 'draw_no_bet';
    if (raw.startsWith('double_chance')) return 'double_chance';
    if (raw.startsWith('asian_handicap')) return 'asian_handicap';
    if (raw.startsWith('european_handicap')) return 'european_handicap';
    if (raw.startsWith('team_total')) return 'team_total_goals';
    if (raw.startsWith('btts')) return 'btts';
    if (raw.startsWith('ht_ft')) return 'ht_ft';
    if (raw.startsWith('over_') || raw.startsWith('under_') || raw.startsWith('over_under')) return 'over_under';
    if (raw === '1x2' || raw === 'match_result' || raw === 'match_winner' || raw === 'winner') return '1x2';
    return raw;
}

function buildSelectableFixturePool(candidates, minConfidenceFloor) {
    const byFixture = new Map();

    for (const candidate of Array.isArray(candidates) ? candidates : []) {
        const confidence = Number(candidate?.confidence);
        if (!Number.isFinite(confidence) || confidence < minConfidenceFloor) continue;
        const fixtureIds = getAccaCandidateFixtureIds(candidate);
        const fixtureId = fixtureIds[0];
        if (!fixtureId) continue;

        const metadata = getMetadata(candidate);
        const home = String(metadata?.home_team || candidate?.home_team || '').trim();
        const away = String(metadata?.away_team || candidate?.away_team || '').trim();
        const fixtureName = home && away ? `${home} vs ${away}` : String(candidate?.match_id || fixtureId);

        if (!byFixture.has(fixtureId)) {
            byFixture.set(fixtureId, {
                id: fixtureId,
                name: fixtureName || 'Unknown Match',
                sport: normalizeSportKey(candidate?.sport),
                home_team: home || null,
                away_team: away || null,
                matchContext: metadata?.match_context || null,
                metadata: {
                    context_intelligence: metadata?.context_intelligence || null
                },
                scoredMarkets: []
            });
        }

        byFixture.get(fixtureId).scoredMarkets.push({
            name: candidate?.market || 'unknown_market',
            prediction: candidate?.prediction || 'unknown',
            confidence,
            type: deriveAccaMarketType(candidate),
            _candidate: candidate
        });
    }

    const fixtures = Array.from(byFixture.values());
    for (const fixture of fixtures) {
        fixture.scoredMarkets.sort((a, b) => Number(b?.confidence || 0) - Number(a?.confidence || 0));
    }

    return fixtures;
}

function resolveSelectedLegCandidate(selectedLeg, fixtures) {
    const fixtureId = String(selectedLeg?.fixture_id || '').trim();
    if (!fixtureId) return null;

    const fixture = (Array.isArray(fixtures) ? fixtures : []).find((entry) => String(entry?.id || '').trim() === fixtureId);
    if (!fixture) return null;

    const marketKey = normalizeMarketForAcca(selectedLeg?.market || '');
    const predictionKey = normalizePickForAcca(selectedLeg?.prediction || '');
    const direct = fixture.scoredMarkets.find((market) =>
        normalizeMarketForAcca(market?.name || '') === marketKey
        && normalizePickForAcca(market?.prediction || '') === predictionKey
    );
    if (direct && direct._candidate) return direct._candidate;

    const fallback = fixture.scoredMarkets.find((market) =>
        normalizeMarketForAcca(market?.name || '') === marketKey
    ) || fixture.scoredMarkets[0];
    return fallback?._candidate || null;
}

function isCandidateUsedGlobally(candidate, globalUsedFixtures) {
    const ids = getAccaCandidateFixtureIds(candidate);
    if (!ids.length) return true;
    return ids.some((fixtureId) => globalUsedFixtures.has(fixtureId));
}

function canReserveCandidate(candidate, globallyUsedFixtureIds, locallyUsedFixtureIds) {
    const ids = getAccaCandidateFixtureIds(candidate);
    if (!ids.length) return false;
    return !ids.some((id) => globallyUsedFixtureIds.has(id) || locallyUsedFixtureIds.has(id));
}

function reserveCandidate(candidate, usedFixtureIds) {
    for (const id of new Set(getAccaCandidateFixtureIds(candidate))) {
        usedFixtureIds.add(id);
    }
}

function finalizeAccumulatorRow(legs, options = {}) {
    const profile = String(options.profile || 'mixed_sport');
    const targetSport = normalizeSportKey(options.targetSport || legs?.[0]?.sport || 'unknown');
    const minLegConfidenceFloor = Number(options.minLegConfidenceFloor || (MIN_CONFIDENCE || ACCA_MIN_LEG_CONFIDENCE));
    const isMega = options.isMega === true;
    const legCount = Number(legs?.length || 0);
    const ticketLabel = legCount >= 12 ? '12 MATCH MEGA ACCA' : '6 MATCH ACCA';
    const accaProfileLabel = profile === 'football_only'
        ? 'Football ACCA'
        : profile === 'single_sport'
            ? `${getSportTypeLabel(targetSport)} ACCA`
            : 'Mixed Sport ACCA';

    // SKCS LAW: Compute diversity breakdown
    const diversityBreakdown = {};
    legs.forEach((leg) => {
        const marketType = String(leg?.market || leg?.metadata?.market || leg?.type || '').toLowerCase();
        const family = normalizeMarketFamily(marketType) || normalizeInsightFamily(marketType) || 'other';
        if (family && family !== 'other') {
            diversityBreakdown[family] = (diversityBreakdown[family] || 0) + 1;
        }
    });

    const payloadLegs = legs.map((leg) => {
        const finalLeg = toFinalMatchPayload(leg);
        finalLeg.metadata = {
            ...(finalLeg.metadata || {}),
            sport_type: getSportTypeLabel(finalLeg.sport),
            acca_profile: profile,
            acca_profile_label: accaProfileLabel,
            acca_ticket_label: ticketLabel,
            min_leg_confidence_floor: minLegConfidenceFloor,
            market_family: normalizeMarketFamily(leg?.market || leg?.metadata?.market || '') || 'other',
        };
        if (isMega) {
            finalLeg.metadata.mega_acca_leg = true;
        }
        return finalLeg;
    });

    const averageLegConfidence = computeTotalConfidence(payloadLegs);
    // SKCS LAW: Strict multiplication for total
    const totalConfidence = computeCompoundConfidence(payloadLegs);
    const totalTicketProbability = totalConfidence.toFixed(2) + '%';

    const payloadLegsWithConfidenceMeta = payloadLegs.map((leg) => ({
        ...leg,
        metadata: {
            ...(leg.metadata || {}),
            display_label: ticketLabel,
            average_leg_confidence: averageLegConfidence,
            compound_ticket_confidence: totalConfidence,
            total_ticket_probability_display: totalTicketProbability,
            diversity_breakdown: { ...diversityBreakdown },
        }
    }));

    return {
        match_id: payloadLegsWithConfidenceMeta.map((leg) => leg.match_id).filter(Boolean).join('|'),
        matches: payloadLegsWithConfidenceMeta,
        total_confidence: totalConfidence,
        total_ticket_probability: totalConfidence,
        totalTicketProbability: totalTicketProbability,
        ticket_label: ticketLabel,
        display_label: ticketLabel,
        average_leg_confidence: averageLegConfidence,
        diversity_breakdown: diversityBreakdown,
        family_count: Object.keys(diversityBreakdown).length,
        risk_level: isMega ? 'safe' : riskLevelFromConfidence(totalConfidence)
    };
}


function hasMixedSportCoverage(candidates) {
    const sports = new Set(candidates.map((candidate) => normalizeSportKey(candidate?.sport)));
    const hasNonFootball = Array.from(sports).some((sport) => sport !== 'football');
    const hasTargetSport = Array.from(sports).some((sport) => MIXED_SPORT_TARGETS.has(sport));
    return sports.size >= 2 && hasNonFootball && hasTargetSport;
}

function buildFootballOnlyAccumulatorRow(pool, usedFixtureIds, size, minConfidenceFloor, options = {}) {
    let footballPool = pool
        .filter((candidate) => normalizeSportKey(candidate?.sport) === 'football')
        .filter((candidate) => Number(candidate?.confidence) >= minConfidenceFloor)
        .filter((candidate) => !isPredictionHighRisk(candidate, { forMega: false }))
        .sort(compareAccaCandidatePreference);
    if (footballPool.length < size) {
        footballPool = ensureCandidatePoolWithRetry(footballPool, size, { forMega: false });
    }
    if (footballPool.length < size) return null;

    const fixtures = buildSelectableFixturePool(footballPool, minConfidenceFloor);
    if (fixtures.length < size) return null;

    const selected = [];
    const localUsed = new Set();
    const stagedGlobalUsed = new Set([...usedFixtureIds]);
    const selectedLegs = selectAccaLegs(fixtures, stagedGlobalUsed, size);

    for (const leg of selectedLegs) {
        if (selected.length >= size) break;
        const candidate = resolveSelectedLegCandidate(leg, fixtures);
        if (!candidate) continue;
        if (isCandidateUsedGlobally(candidate, usedFixtureIds)) continue;
        if (!canReserveCandidate(candidate, usedFixtureIds, localUsed)) continue;
        selected.push(candidate);
        reserveCandidate(candidate, localUsed);
    }

    if (selected.length < size) return null;
    for (const id of localUsed) usedFixtureIds.add(id);
    return finalizeAccumulatorRow(selected, {
        profile: 'football_only',
        targetSport: 'football',
        minLegConfidenceFloor: minConfidenceFloor
    });
}

function buildSingleSportAccumulatorRow(pool, usedFixtureIds, size, minConfidenceFloor, options = {}) {
    const targetSport = normalizeSportKey(options.targetSport || '');
    const forMega = options.isMega === true;
    const grouped = new Map();

    for (const candidate of Array.isArray(pool) ? pool : []) {
        const sport = normalizeSportKey(candidate?.sport || candidate?.metadata?.sport || '');
        if (!sport || sport === 'unknown') continue;
        if (targetSport && sport !== targetSport) continue;
        if (!grouped.has(sport)) grouped.set(sport, []);
        grouped.get(sport).push(candidate);
    }

    const sportPools = Array.from(grouped.entries())
        .map(([sport, candidates]) => ({
            sport,
            candidates: candidates
                .filter((candidate) => Number(candidate?.confidence) >= minConfidenceFloor)
                .filter((candidate) => !isPredictionHighRisk(candidate, { forMega }))
                .sort(compareAccaCandidatePreference)
        }))
        .sort((a, b) => b.candidates.length - a.candidates.length);

    for (const sportPool of sportPools) {
        let scopedPool = sportPool.candidates;
        if (scopedPool.length < size) {
            scopedPool = ensureCandidatePoolWithRetry(scopedPool, size, { forMega });
        }
        if (scopedPool.length < size) continue;

        const fixtures = buildSelectableFixturePool(scopedPool, minConfidenceFloor);
        if (fixtures.length < size) continue;

        const selected = [];
        const localUsed = new Set();
        const stagedGlobalUsed = new Set([...usedFixtureIds]);
        const selectedLegs = selectAccaLegs(fixtures, stagedGlobalUsed, size);

        for (const leg of selectedLegs) {
            if (selected.length >= size) break;
            const candidate = resolveSelectedLegCandidate(leg, fixtures);
            if (!candidate) continue;
            if (isCandidateUsedGlobally(candidate, usedFixtureIds)) continue;
            if (!canReserveCandidate(candidate, usedFixtureIds, localUsed)) continue;
            selected.push(candidate);
            reserveCandidate(candidate, localUsed);
        }

        if (selected.length < size) continue;
        for (const id of localUsed) usedFixtureIds.add(id);
        return finalizeAccumulatorRow(selected, {
            profile: 'single_sport',
            targetSport: sportPool.sport,
            minLegConfidenceFloor: minConfidenceFloor,
            isMega: forMega
        });
    }

    return null;
}

function buildMixedAccumulatorRow(pool, usedFixtureIds, size, minConfidenceFloor, options = {}) {
    let sorted = pool
        .filter((candidate) => Number(candidate?.confidence) >= minConfidenceFloor)
        .filter((candidate) => !isPredictionHighRisk(candidate, { forMega: options.isMega === true }))
        .filter((candidate) => {
            if (options.isMega !== true) return true;
            const market = normalizeMarketKeyMI(candidate?.market || '');
            return isMegaSafeMarket(market) && !isTwelveLegRestrictedMarket(market);
        })
        .sort(compareAccaCandidatePreference);
    if (sorted.length < size) {
        sorted = ensureCandidatePoolWithRetry(sorted, size, { forMega: options.isMega === true });
    }
    if (sorted.length < size) return null;

    const football = sorted.filter((candidate) => normalizeSportKey(candidate?.sport) === 'football');
    const nonFootball = sorted.filter((candidate) => normalizeSportKey(candidate?.sport) !== 'football');

    const anchorPairs = [];
    if (football.length && nonFootball.length) {
        for (const f of football.slice(0, 12)) {
            for (const n of nonFootball.slice(0, 24)) {
                const fIds = new Set(getAccaCandidateFixtureIds(f));
                const nIds = getAccaCandidateFixtureIds(n);
                if (nIds.some((id) => fIds.has(id))) continue;
                anchorPairs.push([f, n]);
                break;
            }
            if (anchorPairs.length >= 12) break;
        }
    }

    if (!anchorPairs.length) {
        for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
                const a = sorted[i];
                const b = sorted[j];
                if (normalizeSportKey(a?.sport) === normalizeSportKey(b?.sport)) continue;
                anchorPairs.push([a, b]);
                if (anchorPairs.length >= 12) break;
            }
            if (anchorPairs.length >= 12) break;
        }
    }

    for (const pair of anchorPairs) {
        const selected = [];
        const localUsed = new Set();

        for (const candidate of pair) {
            if (isCandidateUsedGlobally(candidate, usedFixtureIds)) {
                selected.length = 0;
                break;
            }
            if (!canReserveCandidate(candidate, usedFixtureIds, localUsed)) {
                selected.length = 0;
                break;
            }
            selected.push(candidate);
            reserveCandidate(candidate, localUsed);
        }
        if (!selected.length) continue;

        const remainingPool = sorted.filter((candidate) => canReserveCandidate(candidate, usedFixtureIds, localUsed));
        const fixtures = buildSelectableFixturePool(remainingPool, minConfidenceFloor);
        const stagedGlobalUsed = new Set([...usedFixtureIds, ...localUsed]);
        const legsNeeded = Math.max(0, size - selected.length);
        const selectedLegs = selectAccaLegs(fixtures, stagedGlobalUsed, legsNeeded);

        for (const leg of selectedLegs) {
            if (selected.length >= size) break;
            const candidate = resolveSelectedLegCandidate(leg, fixtures);
            if (!candidate) continue;
            if (isCandidateUsedGlobally(candidate, usedFixtureIds)) continue;
            if (!canReserveCandidate(candidate, usedFixtureIds, localUsed)) continue;
            selected.push(candidate);
            reserveCandidate(candidate, localUsed);
        }

        if (selected.length < size) continue;
        if (!hasMixedSportCoverage(selected)) continue;

        for (const id of localUsed) usedFixtureIds.add(id);
        return finalizeAccumulatorRow(selected, {
            profile: 'mixed_sport',
            minLegConfidenceFloor: minConfidenceFloor,
            isMega: options.isMega === true
        });
    }

    return null;
}

async function buildAccaLegCandidatePool(predictions, options = {}) {
    const minConfidenceFloor = Number.isFinite(Number(options.minLegConfidence))
        ? Number(options.minLegConfidence)
        : ACCA_MIN_LEG_CONFIDENCE;
    const byFixture = new Map();

    for (const prediction of Array.isArray(predictions) ? predictions : []) {
        if (isPredictionHighRisk(prediction)) {
            continue;
        }

        const baseMetadata = getMetadata(prediction);
        const normalizedSport = normalizeSportKey(prediction?.sport || baseMetadata?.sport || '');
        if (!isDeploymentSportEnabled(normalizedSport)) {
            continue;
        }
        const sportType = getSportTypeLabel(normalizedSport);

        const fixtureIds = getAccaCandidateFixtureIds(prediction);
        const fallbackFixtureId = String(prediction?.match_id || '').trim();
        const fixtureKey = fixtureIds[0] || fallbackFixtureId;
        if (!fixtureKey) continue;

        let scoredMarkets = [];
        try {
            scoredMarkets = await scoreMarkets(toScoringMatchPayload({
                ...prediction,
                sport: normalizedSport
            }));
        } catch (error) {
            console.warn(`[accaBuilder] market scoring skipped for match ${prediction?.match_id || 'unknown'}: ${error.message}`);
            scoredMarkets = [];
        }

        const candidates = [];
        if (isAccumulatorEligibleMarket(prediction) && Number(prediction?.confidence) >= minConfidenceFloor) {
            candidates.push({
                ...prediction,
                sport: normalizedSport,
                metadata: {
                    ...baseMetadata,
                    sport_type: sportType
                }
            });
        }

        for (const marketScore of scoredMarkets) {
            const mapped = buildAccaCandidateFromMarketScore(
                {
                    ...prediction,
                    sport: normalizedSport
                },
                marketScore
            );
            if (!mapped) continue;
            if (Number(mapped.confidence) < minConfidenceFloor) continue;
            if (!isAccumulatorEligibleMarket(mapped)) continue;
            candidates.push(mapped);
        }

        candidates.push(...buildMarketIntelligenceDerivedMarkets(prediction, { maxRows: 8 }));
        candidates.push(...buildExpandedFootballGoalLineCandidates(prediction, scoredMarkets, minConfidenceFloor));
        candidates.push(...buildFootballComboCandidates(prediction, scoredMarkets, minConfidenceFloor));

        if (!candidates.length) continue;
        const eligibleCandidates = candidates
            .filter((candidate) => Number(candidate?.confidence) >= minConfidenceFloor)
            .filter((candidate) => isAccumulatorEligibleMarket(candidate));
        if (!eligibleCandidates.length) continue;

        const rankedCandidates = eligibleCandidates.slice().sort(compareAccaCandidatePreference);
        const preferred = selectBestAccaCandidateFromPool(rankedCandidates, minConfidenceFloor);
        const orderedCandidates = preferred
            ? [preferred, ...rankedCandidates.filter((candidate) =>
                normalizeMarketForAcca(candidate?.market) !== normalizeMarketForAcca(preferred?.market)
                || normalizePickForAcca(candidate?.prediction) !== normalizePickForAcca(preferred?.prediction)
            )]
            : rankedCandidates;

        const existingCandidates = byFixture.get(fixtureKey) || [];
        const merged = existingCandidates.slice();

        for (const candidate of orderedCandidates) {
            const preparedCandidate = {
                ...candidate,
                metadata: {
                    ...(candidate?.metadata || {}),
                    depth_first_full_scoring_applied: true,
                    evaluated_market_count: rankedCandidates.length
                }
            };
            const signature = `${normalizeMarketForAcca(preparedCandidate?.market)}::${normalizePickForAcca(preparedCandidate?.prediction)}`;
            const existingIndex = merged.findIndex((row) =>
                `${normalizeMarketForAcca(row?.market)}::${normalizePickForAcca(row?.prediction)}` === signature
            );

            if (existingIndex < 0) {
                merged.push(preparedCandidate);
                continue;
            }

            if (compareAccaCandidatePreference(preparedCandidate, merged[existingIndex]) < 0) {
                merged[existingIndex] = preparedCandidate;
            }
        }

        byFixture.set(
            fixtureKey,
            merged
                .filter((candidate) => Number(candidate?.confidence) >= minConfidenceFloor)
                .sort(compareAccaCandidatePreference)
                .slice(0, 18)
        );
    }

    return Array.from(byFixture.values())
        .flat()
        .filter((candidate) => Number(candidate?.confidence) >= minConfidenceFloor)
        .sort(compareAccaCandidates);
}

function buildAcca6Candidates(predictions, maxRows = 6, options = {}) {
    const minConfidenceFloor = Number.isFinite(Number(options.minLegConfidence))
        ? Number(options.minLegConfidence)
        : ACCA_MIN_LEG_CONFIDENCE;
    const globalUsedFixtures = options.globalUsedFixtures instanceof Set ? options.globalUsedFixtures : new Set();
    const sorted = (Array.isArray(predictions) ? predictions : [])
        .filter((candidate) => Number(candidate?.confidence) >= minConfidenceFloor)
        .filter((candidate) => {
            const ids = getAccaCandidateFixtureIds(candidate);
            return ids.length > 0 && !ids.some((id) => globalUsedFixtures.has(id));
        })
        .sort(compareAccaCandidatePreference);
    if (sorted.length < ACCA_SIZE) return [];

    const rows = [];

    while (rows.length < maxRows) {
        const row = buildSingleSportAccumulatorRow(sorted, globalUsedFixtures, ACCA_SIZE, minConfidenceFloor, { isMega: false });
        if (!row) break;
        rows.push(row);
    }

    return rows;
}

function isCricketFixtureWithinWindow(prediction, expiryCutoff) {
    if (normalizeSportKey(prediction?.sport) !== 'cricket') return true;
    const kickoff = parseKickoff(prediction);
    if (!kickoff) return false;

    // Cricket fixtures can be long-running; use a conservative completion buffer.
    const estimatedCompletion = new Date(kickoff.getTime() + (12 * 60 * 60 * 1000));
    return estimatedCompletion <= expiryCutoff;
}

function resolveMegaAccaThreshold(predictions, options = {}) {
    const configured = Number(options.minLegConfidence ?? process.env.MEGA_ACCA_MIN_LEG_CONFIDENCE ?? ACCA_MIN_LEG_CONFIDENCE);
    const configuredThreshold = Number.isFinite(configured) ? clamp(configured, 60, 99) : ACCA_MIN_LEG_CONFIDENCE;
    const confidenceValues = (Array.isArray(predictions) ? predictions : [])
        .map((prediction) => Number(prediction?.confidence))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a);

    if (confidenceValues.length < MEGA_ACCA_SIZE) {
        return configuredThreshold;
    }

    const dynamicFloor = confidenceValues[MEGA_ACCA_SIZE - 1];
    if (!Number.isFinite(dynamicFloor) || dynamicFloor >= configuredThreshold) {
        return configuredThreshold;
    }

    return clamp(Math.round(dynamicFloor * 100) / 100, ACCA_MIN_LEG_CONFIDENCE, configuredThreshold);
}

function buildMegaAcca12Candidates(predictions, options = {}) {
    const maxRows = Number.isFinite(options.maxRows) ? options.maxRows : 6;
    const expiryCutoff = options.expiryCutoff instanceof Date ? options.expiryCutoff : null;
    const usedThreshold = resolveMegaAccaThreshold(predictions, options);
    const globalUsedFixtures = options.globalUsedFixtures instanceof Set ? options.globalUsedFixtures : new Set();
    const megaDiagnostics = options.megaDiagnostics || null;
    const allPredictions = Array.isArray(predictions) ? predictions : [];

    if (megaDiagnostics) {
        megaDiagnostics.mega_candidate_fixtures_before_filter = allPredictions.length;
    }

    const confidenceEligible = [];
    for (const prediction of allPredictions) {
        if (isBannedMarket(prediction?.market, prediction?.prediction)) {
            if (megaDiagnostics) megaDiagnostics.mega_rejected_for_banned_market += 1;
            continue;
        }
        if (isPredictionHighRisk(prediction, { forMega: true })) {
            if (megaDiagnostics) megaDiagnostics.mega_rejected_for_confidence_floor += 1;
            continue;
        }
        const normalizedMarket = normalizeMarketKeyMI(prediction?.market || '');
        if (!isMegaSafeMarket(normalizedMarket) || isTwelveLegRestrictedMarket(normalizedMarket)) {
            if (megaDiagnostics) megaDiagnostics.mega_rejected_for_family_caps += 1;
            continue;
        }
        const confidence = Number(prediction?.confidence);
        if (!Number.isFinite(confidence) || confidence < usedThreshold) {
            if (megaDiagnostics) megaDiagnostics.mega_rejected_for_confidence_floor += 1;
            continue;
        }
        confidenceEligible.push(prediction);
    }

    const fixtureEligible = confidenceEligible.filter((prediction) => {
        const ids = getAccaCandidateFixtureIds(prediction);
        return ids.length > 0 && !ids.some((id) => globalUsedFixtures.has(id));
    });

    let eligible = fixtureEligible
        .filter((prediction) => !expiryCutoff || isCricketFixtureWithinWindow(prediction, expiryCutoff))
        .sort(compareAccaCandidatePreference)
        .slice();

    if (megaDiagnostics) {
        megaDiagnostics.mega_candidate_fixtures_after_filter = eligible.length;
    }

    if (eligible.length < MEGA_ACCA_SIZE) {
        const relaxedPool = relaxFilters(allPredictions, { forMega: true })
            .filter((prediction) => {
                const ids = getAccaCandidateFixtureIds(prediction);
                return ids.length > 0 && !ids.some((id) => globalUsedFixtures.has(id));
            })
            .filter((prediction) => !expiryCutoff || isCricketFixtureWithinWindow(prediction, expiryCutoff));

        if (relaxedPool.length >= MEGA_ACCA_SIZE) {
            console.log(`[accaBuilder] Mega ACCA: retrying with relaxed fallback pool (${relaxedPool.length} candidates).`);
            eligible = relaxedPool;
        } else {
            console.log(`[accaBuilder] Mega ACCA: Only ${eligible.length} insights available (need ${MEGA_ACCA_SIZE}). Effective floor ${usedThreshold}% not met.`);
            return [];
        }
    }

    console.log(`[accaBuilder] Mega ACCA: Building Moonshot series with ${eligible.length} eligible insights at ${usedThreshold}% threshold.`);

    const rows = [];
    while (rows.length < maxRows) {
        const row = buildSingleSportAccumulatorRow(
            eligible,
            globalUsedFixtures,
            MEGA_ACCA_SIZE,
            usedThreshold,
            { isMega: true }
        );
        if (!row) break;
        row.risk_level = 'safe';
        rows.push(row);
    }

    return rows;
}

function normalizeRequestedSports(requestedSports = []) {
    const values = Array.isArray(requestedSports) ? requestedSports : [requestedSports];
    const normalized = values
        .map((value) => normalizeSportKey(value))
        .filter((value) => value && value !== 'all');
    if (!normalized.length) return [];
    const filtered = normalized.filter((sport) => isDeploymentSportEnabled(sport));
    return filtered.length ? filtered : [];
}

async function cleanupTierPublishedRows(client, tier, requestedSports = []) {
    const scopedSports = normalizeRequestedSports(requestedSports);
    if (!scopedSports.length) {
        await client.query('DELETE FROM direct1x2_prediction_final WHERE tier = $1', [tier]);
        console.log('[accaBuilder] Cleaned stale rows for tier=%s (all sports)', tier);
        return;
    }

    const sportTokens = scopedSports.map((sport) => String(sport).trim().toLowerCase());
    await client.query(
        `
        DELETE FROM direct1x2_prediction_final
        WHERE tier = $1
          AND LOWER(COALESCE(NULLIF(TRIM(sport), ''), NULLIF(TRIM(matches->0->>'sport'), ''), 'unknown')) = ANY($2::text[])
        `,
        [tier, sportTokens]
    );
    console.log('[accaBuilder] Cleaned stale rows for tier=%s sports=%s', tier, scopedSports.join(', '));
}

function getPerSportCandidateLimit(requestedSports = []) {
    const sports = normalizeRequestedSports(requestedSports);
    if (sports.length === 1) return 80 * VOLUME_CAP_MULTIPLIER;
    if (sports.length > 1) return 48 * VOLUME_CAP_MULTIPLIER;
    return 48 * VOLUME_CAP_MULTIPLIER;
}

function getCategoryBuildCaps(requestedSports = []) {
    const sports = normalizeRequestedSports(requestedSports);
    if (sports.length === 1) {
        return {
            direct: Infinity,
            secondary: 12,
            same_match: 6 * VOLUME_CAP_MULTIPLIER,
            multi: 8 * VOLUME_CAP_MULTIPLIER,
            acca_6match: 5 * VOLUME_CAP_MULTIPLIER,
            mega_acca_12: 2 * VOLUME_CAP_MULTIPLIER
        };
    }

    return {
        direct: Infinity,
        secondary: 64,
        same_match: 48 * VOLUME_CAP_MULTIPLIER,
        multi: 24 * VOLUME_CAP_MULTIPLIER,
        acca_6match: 16 * VOLUME_CAP_MULTIPLIER,
        mega_acca_12: 8 * VOLUME_CAP_MULTIPLIER
    };
}

async function loadValidFilteredPredictions(tier, client, options = {}) {
    const t = normalizeTier(tier);
    const requestedSports = normalizeRequestedSports(options.requestedSports);
    const now = options.now instanceof Date ? options.now : new Date();
    const telemetryRunId = resolveTelemetryRunId(options);

    const res = await client.query(
        `
        select
            f.raw_id,
            f.tier,
            r.match_id,
            r.sport,
            r.market,
            r.prediction,
            r.confidence,
            r.volatility,
            r.odds,
            r.metadata,
            r.created_at,
            k.kickoff_utc
        from predictions_filtered f
        join predictions_raw r on r.id = f.raw_id
        cross join lateral (
            select coalesce(
                case
                    when coalesce(r.metadata->>'match_time', '') ~ '^\\d{4}-\\d{2}-\\d{2}'
                        then (r.metadata->>'match_time')::timestamptz
                    else null
                end,
                case
                    when coalesce(r.metadata->>'kickoff', '') ~ '^\\d{4}-\\d{2}-\\d{2}'
                        then (r.metadata->>'kickoff')::timestamptz
                    else null
                end,
                case
                    when coalesce(r.metadata->>'kickoff_time', '') ~ '^\\d{4}-\\d{2}-\\d{2}'
                        then (r.metadata->>'kickoff_time')::timestamptz
                    else null
                end
            ) as kickoff_utc
        ) k
        where f.tier = $1
          and f.is_valid = true
          and (
            -- NULL kickoff: pass through so JS-side filterExpiredFixtures handles it
            k.kickoff_utc is null
            -- Within grace window (up to 15 min past kickoff) OR fully future
            or k.kickoff_utc >= (now() - interval '15 minutes')
          )
          and (
            -- Rolling forward cap: do not load inventory beyond the publish window
            k.kickoff_utc is null
            or k.kickoff_utc <= (now() + interval '${DEFAULT_PUBLISH_WINDOW_DAYS} days')
          )
        order by r.confidence desc, r.created_at desc;
        `,
        [t]
    );

    const mappedRows = res.rows.map((row) => ({
            ...row,
            date: row.kickoff_utc || row?.metadata?.match_time || row?.metadata?.kickoff || row?.metadata?.kickoff_time || null
        }));
    console.log('[accaBuilder][DIAG] loadValid SQL returned %d rows for tier=%s', mappedRows.length, t);
    const futureRows = filterExpiredFixtures(mappedRows);
    console.log('[accaBuilder][DIAG] After filterExpiredFixtures: %d rows (dropped %d)', futureRows.length, mappedRows.length - futureRows.length);
    const dateExcluded = mappedRows.length - futureRows.length;
    if (dateExcluded > 0) {
        const perSportDateExcluded = new Map();
        for (const row of mappedRows) {
            if (futureRows.includes(row)) continue;
            const sport = normalizeSportKey(row?.sport || 'unknown');
            perSportDateExcluded.set(sport, (perSportDateExcluded.get(sport) || 0) + 1);
        }
        for (const [sport, count] of perSportDateExcluded.entries()) {
            pipelineLogger.rejectionAdd({
                run_id: telemetryRunId,
                sport,
                bucket: 'date_window_exclude',
                count,
                metadata: { stage: 'loadValidFilteredPredictions' }
            });
        }
    }

    const sportFiltered = [];
    for (const row of futureRows) {
        const sport = normalizeSportKey(row?.sport || 'unknown');
        if (!isDeploymentSportEnabled(sport)) {
            pipelineLogger.rejectionAdd({
                run_id: telemetryRunId,
                sport,
                bucket: 'sport_phase_block',
                metadata: { stage: 'loadValidFilteredPredictions', reason: 'phase_1_football_only' }
            });
            continue;
        }
        const allowed = requestedSports.length === 0 || requestedSports.includes(sport);
        if (!allowed) {
            pipelineLogger.rejectionAdd({
                run_id: telemetryRunId,
                sport,
                bucket: 'sport_key_mismatch',
                metadata: { stage: 'loadValidFilteredPredictions' }
            });
            continue;
        }
        sportFiltered.push(row);
    }

    console.log('[accaBuilder][DIAG] sportFiltered: %d rows', sportFiltered.length);
    const publishable = [];
    let publishRejectCount = 0;
    for (const row of sportFiltered) {
        const sport = normalizeSportKey(row?.sport || 'unknown');
        const allowed = isPublishablePrediction(row, t, now);
        if (!allowed) {
            publishRejectCount++;
            if (publishRejectCount <= 3) {
                console.log('[accaBuilder][DIAG] isPublishablePrediction REJECTED match_id=%s sport=%s market=%s conf=%s match_time=%s', row.match_id, row.sport, row.market, row.confidence, row?.metadata?.match_time || row.kickoff_utc || 'null');
            }
            pipelineLogger.rejectionAdd({
                run_id: telemetryRunId,
                sport,
                bucket: 'validation_reject',
                metadata: {
                    stage: 'isPublishablePrediction',
                    tier: t,
                    raw_id: row?.raw_id || null
                }
            });
            continue;
        }
        publishable.push(row);
    }

    console.log('[accaBuilder][DIAG] publishable: %d rows (rejected %d by isPublishablePrediction)', publishable.length, publishRejectCount);
    return publishable.sort((a, b) => compareCandidates(a, b, now));
}

function normalizeTeamToken(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function normalizeCompetitionToken(value, fallback = 'unknown_competition') {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return normalized || fallback;
}

function extractTeamCompetitionPairsFromMatch(match) {
    const metadata = match?.metadata || {};
    const competition = normalizeCompetitionToken(
        metadata.competition ||
        metadata.league ||
        metadata.tournament ||
        metadata.series ||
        metadata.event ||
        match?.league ||
        match?.sport
    );

    const home = normalizeTeamToken(match?.home_team || metadata.home_team);
    const away = normalizeTeamToken(match?.away_team || metadata.away_team);
    const out = [];

    if (home) out.push({ team: home, competition });
    if (away) out.push({ team: away, competition });
    return out;
}

function addTeamCompetitionPair(map, team, competition) {
    if (!team || !competition) return;
    if (!map.has(team)) map.set(team, new Set());
    map.get(team).add(competition);
}

async function loadWeekLockedTeamCompetitionMap(client, now = new Date()) {
    const map = new Map();
    const currentWeekKey = getWeekKey(now);

    try {
        const lockRows = await client.query(
            `
            SELECT team_key, competition_key
            FROM team_week_locks
            WHERE week_key = $1
            `,
            [currentWeekKey]
        );

        for (const row of lockRows.rows || []) {
            const team = normalizeTeamToken(row?.team_key);
            const competition = normalizeCompetitionToken(row?.competition_key);
            addTeamCompetitionPair(map, team, competition);
        }
        return map;
    } catch (error) {
        // Backward-compatible fallback if the lock table is not yet provisioned.
        const weekStart = startOfWeekSast(now);
        const weekEnd = endOfWeekSast(now);
        const res = await client.query(
            `
            WITH latest_week_run AS (
                SELECT MAX(publish_run_id) AS publish_run_id
                FROM direct1x2_prediction_final
                WHERE created_at >= $1
                  AND created_at < $2
                  AND type IN ('acca_6match', 'mega_acca_12', 'acca')
                  AND publish_run_id IS NOT NULL
            )
            SELECT pf.matches
            FROM direct1x2_prediction_final pf
            LEFT JOIN latest_week_run lwr ON TRUE
            WHERE pf.created_at >= $1
              AND pf.created_at < $2
              AND pf.type IN ('acca_6match', 'mega_acca_12', 'acca')
              AND (
                  lwr.publish_run_id IS NULL
                  OR pf.publish_run_id = lwr.publish_run_id
              )
            `,
            [weekStart.toISOString(), weekEnd.toISOString()]
        );

        for (const row of res.rows) {
            const legs = Array.isArray(row.matches) ? row.matches : [];
            for (const leg of legs) {
                const pairs = extractTeamCompetitionPairsFromMatch(leg);
                for (const pair of pairs) {
                    addTeamCompetitionPair(map, pair.team, pair.competition);
                }
            }
        }
        return map;
    }
}

function normalizeFixtureIdentityToken(value, fallback = null) {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return normalized || fallback;
}

function buildFixtureIdentityKeys(matchLike, fallbackMetadata = {}) {
    const metadata = matchLike?.metadata || fallbackMetadata || {};
    const home = normalizeTeamToken(matchLike?.home_team || metadata.home_team);
    const away = normalizeTeamToken(matchLike?.away_team || metadata.away_team);
    const kickoff = parseKickoff({
        ...matchLike,
        metadata
    });
    const kickoffDay = kickoff ? kickoff.toISOString().slice(0, 10) : null;
    const competition = normalizeCompetitionToken(
        matchLike?.competition ||
        matchLike?.league ||
        metadata.competition ||
        metadata.league ||
        metadata.tournament ||
        metadata.series ||
        metadata.event ||
        matchLike?.sport ||
        metadata.sport
    );
    const matchId = normalizeFixtureIdentityToken(matchLike?.match_id || metadata.match_id);
    const out = [];

    if (matchId) out.push(`id:${matchId}`);

    if (home && away) {
        if (kickoffDay) {
            out.push(`fixture:${home}_vs_${away}|${kickoffDay}|${competition}`);
        } else {
            out.push(`fixture:${home}_vs_${away}|${competition}`);
            out.push(`fixture:${home}_vs_${away}`);
        }
    }

    return Array.from(new Set(out));
}

function predictionFixtureIds(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];

    const fromMatches = matches.flatMap((match) => buildFixtureIdentityKeys(match));

    if (fromMatches.length > 0) return fromMatches;

    const metadata = getMetadata(prediction);
    return buildFixtureIdentityKeys(prediction, metadata);
}

function predictionTeamCompetitionPairs(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    if (matches.length > 0) {
        return matches.flatMap((match) => extractTeamCompetitionPairsFromMatch(match));
    }

    const metadata = getMetadata(prediction);
    const competition = normalizeCompetitionToken(
        metadata.competition || metadata.league || metadata.tournament || prediction?.sport
    );
    const home = normalizeTeamToken(metadata.home_team);
    const away = normalizeTeamToken(metadata.away_team);

    const out = [];
    if (home) out.push({ team: home, competition });
    if (away) out.push({ team: away, competition });
    return out;
}

function isPredictionTeamAllowed(prediction, historicalTeamCompetitionMap, runTeamCompetitionMap) {
    const pairs = predictionTeamCompetitionPairs(prediction);
    if (!pairs.length) return true;

    for (const pair of pairs) {
        const historicalCompetitions = historicalTeamCompetitionMap.get(pair.team);
        if (historicalCompetitions && historicalCompetitions.has(pair.competition)) {
            return false;
        }

        const runCompetitions = runTeamCompetitionMap.get(pair.team);
        if (runCompetitions && runCompetitions.has(pair.competition)) {
            return false;
        }
    }

    return true;
}

function reservePredictionTeams(prediction, runTeamCompetitionMap) {
    const pairs = predictionTeamCompetitionPairs(prediction);
    for (const pair of pairs) {
        addTeamCompetitionPair(runTeamCompetitionMap, pair.team, pair.competition);
    }
}

function collectWeekLockEntriesFromPrediction(prediction, fallbackDate = new Date()) {
    const entries = [];
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const rows = matches.length > 0 ? matches : [prediction];

    for (const row of rows) {
        const pairs = predictionTeamCompetitionPairs(row);
        const kickoff = parseKickoff(row) || fallbackDate;
        const weekKey = getWeekKey(kickoff);
        for (const pair of pairs) {
            if (!pair?.team || !pair?.competition) continue;
            entries.push({
                week_key: weekKey,
                team_key: normalizeTeamToken(pair.team),
                competition_key: normalizeCompetitionToken(pair.competition)
            });
        }
    }

    return uniqueBy(entries, (entry) => `${entry.week_key}:${entry.team_key}:${entry.competition_key}`);
}

async function persistTeamWeekLocks(client, prediction, options = {}) {
    const publishRunId = options.publishRunId || null;
    const sourceType = String(options.sourceType || '').trim().toLowerCase() || null;
    const sourceTier = String(options.sourceTier || '').trim().toLowerCase() || null;
    const fallbackDate = options.now instanceof Date ? options.now : new Date();
    const entries = collectWeekLockEntriesFromPrediction(prediction, fallbackDate);
    if (!entries.length) return;

    for (const entry of entries) {
        await client.query(
            `
            INSERT INTO team_week_locks (
                week_key,
                team_key,
                competition_key,
                publish_run_id,
                source_type,
                source_tier
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (week_key, team_key, competition_key) DO NOTHING
            `,
            [
                entry.week_key,
                entry.team_key,
                entry.competition_key,
                publishRunId,
                sourceType,
                sourceTier
            ]
        );
    }
}

function filterAvailablePredictions(predictions, usedFixtureIds, historicalTeamCompetitionMap, runTeamCompetitionMap) {
    return predictions.filter((prediction) => {
        if (isPredictionHighRisk(prediction)) return false;
        const ids = predictionFixtureIds(prediction);
        if (!ids.length || ids.some((id) => usedFixtureIds.has(id))) return false;
        return isPredictionTeamAllowed(prediction, historicalTeamCompetitionMap, runTeamCompetitionMap);
    });
}

function reservePredictionFixtures(prediction, usedFixtureIds) {
    for (const id of new Set(predictionFixtureIds(prediction))) {
        usedFixtureIds.add(id);
    }
}

function takeAvailablePredictions(predictions, usedFixtureIds, historicalTeamCompetitionMap, runTeamCompetitionMap, limit = Infinity) {
    const out = [];
    let highRiskCount = 0;
    let fixtureUsedCount = 0;
    let teamLockCount = 0;

    for (const prediction of predictions) {
        if (out.length >= limit) break;
        if (isPredictionHighRisk(prediction)) {
            highRiskCount++;
            continue;
        }
        const ids = predictionFixtureIds(prediction);
        if (!ids.length || ids.some((id) => usedFixtureIds.has(id))) {
            fixtureUsedCount++;
            continue;
        }
        if (!isPredictionTeamAllowed(prediction, historicalTeamCompetitionMap, runTeamCompetitionMap)) {
            teamLockCount++;
            continue;
        }
        out.push(prediction);
        reservePredictionFixtures(prediction, usedFixtureIds);
        reservePredictionTeams(prediction, runTeamCompetitionMap);
    }

    console.log('[accaBuilder][DIAG] takeAvailablePredictions: input=%d output=%d blocked: highRisk=%d fixtureUsed=%d teamLock=%d',
        predictions.length, out.length, highRiskCount, fixtureUsedCount, teamLockCount);
    return out;
}

const CORE_PLANS = ['core_4day_sprint', 'core_9day_run', 'core_14day_pro', 'core_30day_limitless'];
const ELITE_PLANS = ['elite_4day_deep_dive', 'elite_9day_deep_strike', 'elite_14day_deep_pro', 'elite_30day_deep_vip'];
const ALL_PLANS = [...CORE_PLANS, ...ELITE_PLANS];

function getVisibilityForTierType(tier, type) {
    const tierLower = String(tier || '').toLowerCase();
    const typeLower = String(type || '').toLowerCase();
    
    if (typeLower === 'mega_acca_12') {
        return ELITE_PLANS;
    }
    
    if (typeLower === 'acca_6match') {
        if (tierLower === 'deep') {
            return ALL_PLANS;
        }
        return CORE_PLANS;
    }
    
    if (typeLower === 'multi' || typeLower === 'same_match') {
        return ALL_PLANS;
    }
    
    if (typeLower === 'secondary') {
        return ALL_PLANS;
    }
    
    if (typeLower === 'direct') {
        if (tierLower === 'deep') {
            return ALL_PLANS;
        }
        return CORE_PLANS;
    }
    
    return CORE_PLANS;
}

function extractSportFromMatches(matches) {
    if (!Array.isArray(matches) || matches.length === 0) return 'football';
    const firstSport = matches[0]?.sport;
    if (firstSport) return normalizeSportKey(firstSport);
    const metadata = matches[0]?.metadata || {};
    return normalizeSportKey(metadata?.sport || 'football');
}

function extractMarketAndRecommendation(matches) {
    if (!Array.isArray(matches) || matches.length === 0) {
        return { market_type: 'unknown', recommendation: null };
    }
    const first = matches[0];
    const marketType = first?.market_type || first?.market || first?.prediction_type || first?.metadata?.market_type || 'unknown';
    const recommendation = first?.recommendation
        || first?.prediction
        || first?.selection
        || (first?.home_team && first?.away_team ? `${first.home_team} vs ${first.away_team}` : null);
    return { market_type: marketType, recommendation };
}

function isStrictSecondaryMarketKey(marketKey) {
    const key = normalizeMarketKeyMI(marketKey || '');
    if (!key) return false;
    if (key.includes('double_chance')) return true;
    if (key.includes('draw_no_bet')) return true;
    if (key.includes('btts')) return true;
    if (key.includes('team_total')) return true;
    if (key.includes('corners')) return true;
    if (key.includes('cards')) return true;
    if (key.includes('first_half')) return true;
    if (key.includes('second_half')) return true;
    if (key.startsWith('over_') || key.startsWith('under_')) return true;
    return false;
}

function validatePublishRowByType(type, matches, totalConfidence) {
    const normalizedType = String(type || '').trim().toLowerCase();
    const legs = Array.isArray(matches) ? matches : [];

    if ((normalizedType === 'direct' || normalizedType === 'secondary') && legs.length !== 1) {
        return { valid: false, reason: `${normalizedType} requires exactly 1 leg` };
    }

    if (normalizedType === 'acca_6match' && legs.length !== 6) {
        return { valid: false, reason: 'acca_6match requires exactly 6 legs' };
    }

    if (normalizedType === 'mega_acca_12' && legs.length !== 12) {
        return { valid: false, reason: 'mega_acca_12 requires exactly 12 legs' };
    }

    if (normalizedType === 'secondary') {
        const confidence = Number(totalConfidence || legs[0]?.confidence || 0);
        if (!Number.isFinite(confidence) || confidence < SAFE_CONFIDENCE_MIN) {
            return { valid: false, reason: `secondary requires confidence >= ${SAFE_CONFIDENCE_MIN}` };
        }
        const market = legs[0]?.market || legs[0]?.market_type || legs[0]?.metadata?.market_type || '';
        if (!isStrictSecondaryMarketKey(market)) {
            return { valid: false, reason: `secondary market not allowed (${String(market || 'unknown')})` };
        }
    }

    return { valid: true };
}

async function insertFinalRow({ publish_run_id, tier, type, matches, total_confidence, risk_level }, client) {
    const plan_visibility = getVisibilityForTierType(tier, type);
    const sport = extractSportFromMatches(matches);
    const { market_type, recommendation } = extractMarketAndRecommendation(matches);
    const expiresAtIso = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString();
    const normalizedType = String(type || '').trim().toLowerCase();
    const secondaryInsights = (normalizedType === 'direct' || normalizedType === 'single')
        ? deriveDirectSecondaryInsights(matches, total_confidence)
        : [];
    const edgeMindReport = deriveEdgeMindReportFromMatches(matches);
    const firstLeg = Array.isArray(matches) && matches.length > 0 ? (matches[0] || {}) : {};
    const fixtureId = String(firstLeg?.fixture_id || firstLeg?.match_id || '').trim() || null;
    const homeTeam = String(firstLeg?.home_team || firstLeg?.home_team_name || '').trim() || null;
    const awayTeam = String(firstLeg?.away_team || firstLeg?.away_team_name || '').trim() || null;
    const prediction = String(firstLeg?.prediction || recommendation || '').trim() || null;
    const confidence = Number.isFinite(Number(firstLeg?.confidence))
        ? Number(firstLeg.confidence)
        : Number(total_confidence || 0);
    const primaryKickoffRaw = firstLeg?.match_date || firstLeg?.commence_time || firstLeg?.date || null;
    const primaryKickoff = (() => {
        if (!primaryKickoffRaw) return null;
        const parsed = new Date(primaryKickoffRaw);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString();
    })();
    const rowValidation = validatePublishRowByType(normalizedType, matches, total_confidence);
    if (!rowValidation.valid) {
        console.warn('[accaBuilder] Skipping publish row type=%s due to rule enforcement: %s', normalizedType || 'unknown', rowValidation.reason);
        return null;
    }

    if (!isDeploymentSportEnabled(sport)) {
        console.warn('[accaBuilder] Skipping publish row type=%s due to phase-1 football-only gate (sport=%s)', normalizedType || 'unknown', sport || 'unknown');
        return null;
    }

    if (!fixtureId || !homeTeam || !awayTeam || isPlaceholderTeamName(homeTeam) || isPlaceholderTeamName(awayTeam) || sport === 'unknown') {
        console.warn(
            '[accaBuilder] Skipping publish row type=%s due to invalid identity (fixture_id=%s, sport=%s, home=%s, away=%s)',
            normalizedType || 'unknown',
            fixtureId || 'null',
            sport || 'unknown',
            homeTeam || 'null',
            awayTeam || 'null'
        );
        return null;
    }
    
    const res = await client.query(
        `
        insert into direct1x2_prediction_final (
            publish_run_id, tier, type, matches, total_confidence, risk_level,
            plan_visibility, sport, market_type, recommendation, expires_at,
            edgemind_report, secondary_insights, fixture_id, home_team, away_team,
            prediction, confidence, match_date
        )
        values ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18, $19::timestamptz)
        returning *;
        `,
        [
            publish_run_id || null,
            tier,
            type,
            JSON.stringify(matches),
            total_confidence,
            risk_level,
            JSON.stringify(plan_visibility),
            sport,
            market_type,
            recommendation,
            expiresAtIso,
            edgeMindReport,
            JSON.stringify(secondaryInsights),
            fixtureId,
            homeTeam,
            awayTeam,
            prediction,
            confidence,
            primaryKickoff
        ]
    );

    return res.rows[0];
}

async function insertStage1Rows(predictions, client) {
    if (!predictions || predictions.length === 0) return [];

    const fixtureIds = predictions
        .map((pred) => pred?.fixture_id || pred?.match_id || pred?.id || null)
        .filter(Boolean)
        .map((value) => String(value));
    const uniqueFixtureIds = [...new Set(fixtureIds)];
    const validFixtureIds = new Set();

    if (uniqueFixtureIds.length > 0) {
        const fixtureRes = await client.query(
            'SELECT id::text AS id FROM normalized_fixtures WHERE id::text = ANY($1::text[])',
            [uniqueFixtureIds]
        );
        for (const row of fixtureRes.rows) {
            validFixtureIds.add(String(row.id));
        }
    }
    
    const values = [];
    const params = [];
    let paramIndex = 1;
    let skippedMissingFixtureRef = 0;
    
    for (const pred of predictions) {
        const fixtureId = pred.fixture_id || pred.match_id || pred.id || null;
        const fixtureIdText = fixtureId ? String(fixtureId) : '';
        if (!fixtureIdText || !validFixtureIds.has(fixtureIdText)) {
            skippedMissingFixtureRef += 1;
            continue;
        }
        const sport = normalizeSportKey(pred.sport || 'unknown');
        const marketType = pred.market_type || pred.market || 'unknown';
        const recommendation = pred.recommendation || pred.prediction || pred.selection || null;
        const confidence = Number(pred.confidence) || 0;
        const riskLevel = pred.risk_level || 'medium';
        const baselineProb = Number(pred.baseline_probability) || Number(pred.probability) || null;
        const impliedOdds = Number(pred.implied_odds) || null;
        const marketEfficiency = Number(pred.market_efficiency_score) || null;
        
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`);
        params.push(
            fixtureIdText,
            sport,
            marketType,
            recommendation,
            confidence,
            riskLevel,
            baselineProb,
            impliedOdds,
            marketEfficiency
        );
        paramIndex += 9;
    }

    if (values.length === 0) return [];
    
    const res = await client.query(
        `INSERT INTO predictions_stage_1 
         (fixture_id, sport, market_type, recommendation, confidence, risk_level, baseline_probability, implied_odds, market_efficiency_score)
         VALUES ${values.join(', ')}
         RETURNING id, fixture_id`,
        params
    );
    
    return res.rows;
}

async function insertStage2Rows(stage1Rows, predictions, client) {
    if (!stage1Rows || stage1Rows.length === 0) return [];
    
    const values = [];
    const params = [];
    let paramIndex = 1;
    
    const predMap = new Map();
    for (const pred of predictions) {
        const key = pred.fixture_id || pred.match_id || pred.id;
        predMap.set(key, pred);
    }
    
    for (const stage1Row of stage1Rows) {
        const pred = predMap.get(stage1Row.fixture_id) || {};
        const adjustedConfidence = Number(pred.adjusted_confidence) || Number(pred.confidence) || 0;
        const confidenceAdj = Number(pred.confidence_adjustment) || 0;
        const teamFormImpact = Number(pred.team_form_impact) || 0;
        const injuryImpact = Number(pred.injury_impact) || 0;
        const suspensionImpact = Number(pred.suspension_impact) || 0;
        const homeAdvantageImpact = Number(pred.home_advantage_impact) || 0;
        const weatherImpact = Number(pred.weather_impact) || 0;
        const deepAnalysisScore = Number(pred.deep_analysis_score) || Number(pred.ai_score) || null;
        const volatilityAdj = Number(pred.volatility_adjustment) || 0;
        
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9})`);
        params.push(
            stage1Row.id,
            stage1Row.fixture_id,
            adjustedConfidence,
            confidenceAdj,
            teamFormImpact,
            injuryImpact,
            suspensionImpact,
            homeAdvantageImpact,
            weatherImpact,
            deepAnalysisScore,
            volatilityAdj
        );
        paramIndex += 11;
    }
    
    if (skippedMissingFixtureRef > 0) {
        console.warn('[accaBuilder] Stage 1 skipped %s predictions with missing normalized_fixtures reference', skippedMissingFixtureRef);
    }

    if (values.length === 0) return [];
    
    const res = await client.query(
        `INSERT INTO predictions_stage_2 
         (stage_1_id, fixture_id, adjusted_confidence, confidence_adjustment, team_form_impact, injury_impact, suspension_impact, home_advantage_impact, weather_impact, deep_analysis_score, volatility_adjustment)
         VALUES ${values.join(', ')}
         RETURNING id, fixture_id`,
        params
    );
    
    return res.rows;
}

async function insertStage3Rows(stage2Rows, predictions, client) {
    if (!stage2Rows || stage2Rows.length === 0) return [];
    
    const values = [];
    const params = [];
    let paramIndex = 1;
    
    const predMap = new Map();
    for (const pred of predictions) {
        const key = pred.fixture_id || pred.match_id || pred.id;
        predMap.set(key, pred);
    }
    
    for (const stage2Row of stage2Rows) {
        const pred = predMap.get(stage2Row.fixture_id) || {};
        const finalConfidence = Number(pred.final_confidence) || Number(pred.adjusted_confidence) || Number(pred.confidence) || 0;
        const validationScore = Number(pred.validation_score) || null;
        const newsSentimentImpact = Number(pred.news_sentiment_impact) || 0;
        const travelFatigueImpact = Number(pred.travel_fatigue_impact) || 0;
        const scheduleCongestionImpact = Number(pred.schedule_congestion_impact) || 0;
        const externalFactors = pred.external_factors ? JSON.stringify(pred.external_factors) : null;
        const riskFlags = pred.risk_flags ? JSON.stringify(pred.risk_flags) : null;
        const volatilityScore = Number(pred.volatility_score) || null;
        
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9})`);
        params.push(
            stage2Row.id,
            stage2Row.fixture_id,
            finalConfidence,
            validationScore,
            newsSentimentImpact,
            travelFatigueImpact,
            scheduleCongestionImpact,
            externalFactors,
            riskFlags,
            volatilityScore
        );
        paramIndex += 10;
    }
    
    if (values.length === 0) return [];
    
    const res = await client.query(
        `INSERT INTO predictions_stage_3 
         (stage_2_id, fixture_id, final_confidence, validation_score, news_sentiment_impact, travel_fatigue_impact, schedule_congestion_impact, external_factors, risk_flags, volatility_score)
         VALUES ${values.join(', ')}
         RETURNING id, fixture_id`,
        params
    );
    
    return res.rows;
}

async function insertDebugPublishedRow({ publish_run_id, tier, sport, candidate, rejection_metadata }, client) {
    const res = await client.query(
        `
        INSERT INTO debug_published (publish_run_id, tier, sport, candidate, rejection_metadata)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
        RETURNING *;
        `,
        [
            publish_run_id || null,
            tier || null,
            normalizeSportKey(sport || 'unknown'),
            JSON.stringify(candidate || {}),
            JSON.stringify(rejection_metadata || {})
        ]
    );

    return res.rows[0];
}

function extractKickoffForDiagnostics(rows = []) {
    const kickoffs = [];
    for (const row of Array.isArray(rows) ? rows : []) {
        const matches = Array.isArray(row?.matches) ? row.matches : [];
        for (const match of matches) {
            const metadata = match?.metadata || {};
            const raw =
                match?.commence_time
                || match?.match_date
                || metadata?.match_time
                || metadata?.kickoff
                || metadata?.kickoff_time
                || null;
            if (!raw) continue;
            const parsed = new Date(raw);
            if (Number.isNaN(parsed.getTime())) continue;
            kickoffs.push(parsed);
        }
    }
    if (!kickoffs.length) return null;
    kickoffs.sort((a, b) => a.getTime() - b.getTime());
    return {
        earliest_kickoff_utc: kickoffs[0].toISOString(),
        latest_kickoff_utc: kickoffs[kickoffs.length - 1].toISOString()
    };
}


function initAccaPublishDiagnostics() {
    return {
        weekly_team_lock_hits: 0,
        duplicate_card_rejections: 0,
        published_card_overlap_counts: [],
        remaining_candidate_pool_after_each_publish: [],
    };
}

function toPublishedFixtureLike(match) {
    const metadata = match?.metadata || {};
    const kickoffValue =
        match?.commence_time ||
        match?.match_date ||
        metadata.match_time ||
        metadata.kickoff ||
        metadata.kickoff_time ||
        metadata.commence_time ||
        metadata.date ||
        null;

    return {
        fixture_id: match?.fixture_id || match?.id || match?.match_id || metadata.match_id || null,
        match_id: match?.match_id || metadata.match_id || match?.fixture_id || match?.id || null,
        home_team: match?.home_team || metadata.home_team || match?.homeTeam || metadata.home || null,
        away_team: match?.away_team || metadata.away_team || match?.awayTeam || metadata.away || null,
        homeTeam: match?.home_team || metadata.home_team || match?.homeTeam || metadata.home || null,
        awayTeam: match?.away_team || metadata.away_team || match?.awayTeam || metadata.away || null,
        competition: metadata.competition || metadata.league || metadata.tournament || metadata.series || match?.competition || match?.league || null,
        league: metadata.league || metadata.competition || match?.league || match?.competition || null,
        tournament: metadata.tournament || metadata.series || null,
        startTime: kickoffValue,
        kickoff: kickoffValue,
        date: kickoffValue,
        match_date: kickoffValue,
        commence_time: kickoffValue,
        metadata,
    };
}

function addCardFixtureKeysToSet(card, usedFixtureKeys) {
    for (const match of (card?.matches || [])) {
        const key = stableFixtureKey(toPublishedFixtureLike(match));
        if (key) usedFixtureKeys.add(key);
    }
}

function cardWeeklyLockViolation(card, usedTeamsWeekly) {
    for (const match of (card?.matches || [])) {
        const fixtureLike = toPublishedFixtureLike(match);
        if (isTeamLockedForWeek(fixtureLike, usedTeamsWeekly)) {
            return true;
        }
    }
    return false;
}

function lockCardTeamsForWeek(card, usedTeamsWeekly) {
    for (const match of (card?.matches || [])) {
        lockTeamsForWeek(toPublishedFixtureLike(match), usedTeamsWeekly);
    }
}

function normalizeFamilyForMatch(match) {
    const metadata = match?.metadata || {};
    const raw =
        metadata.market_family ||
        metadata.market_key ||
        metadata.market ||
        match?.market ||
        match?.prediction ||
        '';
    return normalizeMarketFamily(raw) || normalizeInsightFamily(raw) || null;
}

function getCardFamilyCounts(card) {
    const counts = {};
    for (const match of (card?.matches || [])) {
        const family = normalizeFamilyForMatch(match);
        if (!family) continue;
        counts[family] = (counts[family] || 0) + 1;
    }
    return counts;
}

function exceedsFamilyCaps(card, legCount) {
    const familyCaps = getFamilyCaps(legCount);
    const counts = getCardFamilyCounts(card);
    const exceeded = [];

    for (const [family, count] of Object.entries(counts)) {
        const cap = familyCaps[family];
        if (typeof cap === 'number' && count > cap) {
            exceeded.push({ family, count, cap });
        }
    }

    return {
        exceeded: exceeded.length > 0,
        exceededFamilies: exceeded,
        counts,
    };
}

function hasMinimumMarketDiversity(card) {
    const legs = (card?.matches || []).map((match) => ({
        family: normalizeFamilyForMatch(match),
    }));
    return validateMarketDiversity(legs);
}


async function buildFinalForTier(tier, options = {}) {
    const t = normalizeTier(tier);
    const publishRunId = options.publishRunId || null;
    const now = options.now instanceof Date ? options.now : new Date();
    const telemetryRunId = resolveTelemetryRunId(options);

    return withTransaction(async (client) => {
        await getTierRules(t, client);
        const accaRules = await getAccaRules(client);

        const valid = await loadValidFilteredPredictions(t, client, {
            requestedSports: options.requestedSports,
            now,
            telemetryRunId
        });
        console.log('[accaBuilder][DIAG] buildFinalForTier tier=%s valid=%d', t, valid.length);
        
        const weekLockedTeamCompetitionMap = await loadWeekLockedTeamCompetitionMap(client, now);
        const runTeamCompetitionMap = new Map();
        const globalUsedFixtures = new Set();
        
        await client.query('DELETE FROM predictions_stage_1 WHERE created_at < NOW() - INTERVAL \'1 day\'');
        await client.query('DELETE FROM predictions_stage_2 WHERE created_at < NOW() - INTERVAL \'1 day\'');
        await client.query('DELETE FROM predictions_stage_3 WHERE created_at < NOW() - INTERVAL \'1 day\'');
        
        const stage1Rows = await insertStage1Rows(valid, client);
        console.log('[accaBuilder] Stage 1: inserted %s predictions', stage1Rows.length);
        
        const perMatchLimited = enforcePerMatchLimit(valid, accaRules.max_per_match);
        const perSportLimited = enforcePerSportLimit(
            perMatchLimited,
            getPerSportCandidateLimit(options.requestedSports)
        );
        const categoryBuildCaps = getCategoryBuildCaps(options.requestedSports);

        // Limit candidates to prevent combinatorial explosion and timeouts
        const MAX_ACCA_CANDIDATES = 320 * VOLUME_CAP_MULTIPLIER;
        const limitedCandidates = perSportLimited.slice(0, MAX_ACCA_CANDIDATES);
        addStageBySport(
            telemetryRunId,
            'candidate_count',
            collectSportCountsFromPredictions(limitedCandidates)
        );
        const baseAccaInput = filterAvailablePredictions(
            limitedCandidates,
            globalUsedFixtures,
            weekLockedTeamCompetitionMap,
            runTeamCompetitionMap
        );
        let accaMarketCandidates = await buildAccaLegCandidatePool(
            baseAccaInput,
            { minLegConfidence: ACCA_MIN_LEG_CONFIDENCE }
        );

        if (stage1Rows.length > 0) {
            const stage2Rows = await insertStage2Rows(stage1Rows, limitedCandidates, client);
            console.log('[accaBuilder] Stage 2: inserted %s predictions', stage2Rows.length);
            
            if (stage2Rows.length > 0) {
                const stage3Rows = await insertStage3Rows(stage2Rows, limitedCandidates, client);
                console.log('[accaBuilder] Stage 3: inserted %s predictions', stage3Rows.length);
            }
        }

        // -------------------------------------------------------------------------
        // ---------------------------------------------------------------------
        // SKCS LAW: Clean stale rows for this tier before publishing
        // ---------------------------------------------------------------------
        await cleanupTierPublishedRows(client, t, options.requestedSports);

        // ---------------------------------------------------------------------
        // 1. DIRECT LAYER (First Priority - singles reserve fixtures first)
        // ---------------------------------------------------------------------
        const directRows = [];
        const directCandidatesBeforeFilter = limitedCandidates.filter((candidate) => isDirectMarketSelection(candidate));
        console.log('[accaBuilder][DIAG] limitedCandidates=%d directCandidates=%d', limitedCandidates.length, directCandidatesBeforeFilter.length);
        if (directCandidatesBeforeFilter.length === 0 && limitedCandidates.length > 0) {
            const sample = limitedCandidates[0];
            console.log('[accaBuilder][DIAG] Sample candidate: market=%s confidence=%s sport=%s match_id=%s', sample?.market, sample?.confidence, sample?.sport, sample?.match_id);
        }
        // Direct predictions are single-match, so skip weekly team lock (only for ACCA diversity)
        const directSelections = takeAvailablePredictions(
            sortDirectCandidatesByBand(directCandidatesBeforeFilter),
            globalUsedFixtures,
            new Map(), // Empty map - direct predictions not subject to weekly team lock
            runTeamCompetitionMap,
            Infinity
        );
        console.log('[accaBuilder][DIAG] directSelections after takeAvailable=%d', directSelections.length);
        for (const prediction of directSelections) {
            const matches = [toFinalMatchPayload(prediction)];
            const total = computeTotalConfidence(matches);
            const row = await insertFinalRow({
                publish_run_id: publishRunId,
                tier: t,
                type: 'direct',
                matches,
                total_confidence: total,
                risk_level: riskLevelFromConfidence(total)
            }, client);
            if (row) {
                directRows.push(row);
                await persistTeamWeekLocks(client, row, {
                    publishRunId,
                    sourceType: 'direct',
                    sourceTier: t,
                    now
                });
            }
        }

        // ---------------------------------------------------------------------
        // 2. SECONDARY LAYER (Second Priority — per Master Rulebook §3)
        // ---------------------------------------------------------------------
        const secondaryRows = [];
        const safeSinglesPool = (
            await buildSecondaryCandidates(filterAvailablePredictions(limitedCandidates, globalUsedFixtures, weekLockedTeamCompetitionMap, runTeamCompetitionMap))
        ).filter((candidate) => isSafeSinglesSelection(candidate));
        const secondarySelections = takeAvailablePredictions(
            safeSinglesPool,
            globalUsedFixtures,
            weekLockedTeamCompetitionMap,
            runTeamCompetitionMap,
            categoryBuildCaps.secondary
        );
        for (const prediction of secondarySelections) {
            const matches = [toFinalMatchPayload(prediction)];
            const total = computeTotalConfidence(matches);
            const row = await insertFinalRow({
                publish_run_id: publishRunId,
                tier: t,
                type: 'secondary',
                matches,
                total_confidence: total,
                risk_level: riskLevelFromConfidence(total)
            }, client);
            if (row) {
                secondaryRows.push(row);
                await persistTeamWeekLocks(client, row, {
                    publishRunId,
                    sourceType: 'secondary',
                    sourceTier: t,
                    now
                });
            }
        }

        // ---------------------------------------------------------------------
        // 3. SAME MATCH LAYER (Third Priority — per Master Rulebook §11)
        // ---------------------------------------------------------------------
        const sameMatchRows = [];
        const sameMatchSelections = takeAvailablePredictions(
            await buildSameMatchCandidates(filterAvailablePredictions(limitedCandidates, globalUsedFixtures, weekLockedTeamCompetitionMap, runTeamCompetitionMap), {
                no_conflicting_markets: accaRules.no_conflicting_markets
            }),
            globalUsedFixtures,
            weekLockedTeamCompetitionMap,
            runTeamCompetitionMap,
            categoryBuildCaps.same_match
        );
        for (const row of sameMatchSelections) {
            const inserted = await insertFinalRow({
                publish_run_id: publishRunId,
                tier: t,
                type: 'same_match',
                matches: row.matches,
                total_confidence: row.total_confidence,
                risk_level: row.risk_level
            }, client);
            if (inserted) {
                sameMatchRows.push(inserted);
                await persistTeamWeekLocks(client, inserted, {
                    publishRunId,
                    sourceType: 'same_match',
                    sourceTier: t,
                    now
                });
            }
        }

        // ---------------------------------------------------------------------
        // 4. MULTI LAYER (Fourth Priority)
        // ---------------------------------------------------------------------
        const multiRows = [];
        const multiSelections = takeAvailablePredictions(
            buildMultiCandidates(filterAvailablePredictions(limitedCandidates, globalUsedFixtures, weekLockedTeamCompetitionMap, runTeamCompetitionMap)),
            globalUsedFixtures,
            weekLockedTeamCompetitionMap,
            runTeamCompetitionMap,
            categoryBuildCaps.multi
        );
        for (const row of multiSelections) {
            const inserted = await insertFinalRow({
                publish_run_id: publishRunId,
                tier: t,
                type: 'multi',
                matches: row.matches,
                total_confidence: row.total_confidence,
                risk_level: row.risk_level
            }, client);
            if (inserted) {
                multiRows.push(inserted);
                await persistTeamWeekLocks(client, inserted, {
                    publishRunId,
                    sourceType: 'multi',
                    sourceTier: t,
                    now
                });
            }
        }

        // ---------------------------------------------------------------------
        // 5. SKCS LAW: ACCA PUBLISH FLOW — LAST (per Master Rulebook §5)
        // (uniqueness + team lock + pool rotation)
        // ---------------------------------------------------------------------
        const accaRows = [];
        const megaAccaRows = [];
        const publishedCards = [];
        const usedFixtureKeys = new Set();
        const usedTeamsWeekly = new Map();
        const accaPublishDiagnostics = initAccaPublishDiagnostics();

        // Start with filtered candidate pool
        let candidatePool = filterAvailablePredictions(
            accaMarketCandidates,
            globalUsedFixtures,
            weekLockedTeamCompetitionMap,
            runTeamCompetitionMap
        );

        // Mega diagnostics
        const megaDiagnostics = initMegaDiagnostics();
        megaDiagnostics.mega_candidate_fixtures_before_filter = candidatePool.length;

        // Build plan: 4 x 6-leg + 1 x 12-leg
        const buildPlan = [
            ...Array.from({ length: categoryBuildCaps.acca_6match }, () => ({ type: 'acca_6match', legCount: 6, profile: 'football_only' })),
            ...Array.from({ length: categoryBuildCaps.mega_acca_12 }, () => ({ type: 'mega_acca_12', legCount: 12, profile: 'football_only' })),
        ];
        const megaExpiryCutoff = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        for (const step of buildPlan) {
            const stagedGlobalUsedFixtures = new Set(globalUsedFixtures);
            let candidateRow = buildAccumulatorRowWithFallbackLadder(
                step,
                candidatePool,
                stagedGlobalUsedFixtures,
                {
                    megaDiagnostics,
                    expiryCutoff: megaExpiryCutoff
                }
            );

            if (!candidateRow && candidatePool.length < step.legCount) {
                const relaxedPool = relaxFilters(candidatePool, { forMega: step.legCount === 12 });
                if (relaxedPool.length >= step.legCount) {
                    candidateRow = buildAccumulatorRowWithFallbackLadder(
                        step,
                        relaxedPool,
                        stagedGlobalUsedFixtures,
                        {
                            megaDiagnostics,
                            expiryCutoff: megaExpiryCutoff
                        }
                    );
                }
            }

            if (!candidateRow) {
                const fallbackSport = step.legCount === 12
                    ? normalizeSportKey(candidatePool[0]?.sport || 'unknown')
                    : normalizeSportKey(step.profile === 'football_only' ? 'football' : (candidatePool[0]?.sport || 'unknown'));
                console.warn('[accaBuilder] BYPASS: Skipping candidate_row_not_built check for %s (pool_size=%s)', step.type, candidatePool.length);
                // TEMPORARY BYPASS: Allow matches to proceed even without candidate row
                // pipelineLogger.rejectionAdd({
                //     run_id: telemetryRunId,
                //     sport: fallbackSport,
                //     bucket: 'publish_skip',
                //     metadata: {
                //         tier: t,
                //         step_type: step.type,
                //         reason: 'candidate_row_not_built'
                //     }
                // });
                if (step.legCount === 12) {
                    megaDiagnostics.mega_rejected_for_insufficient_legs += 1;
                    console.log('[accaBuilder] %s: no candidates from pool (pool_size=%s)', step.type, candidatePool.length);
                }
                continue;
            }

            const familyCapState = exceedsFamilyCaps(candidateRow, step.legCount);
            if (familyCapState.exceeded) {
                pipelineLogger.rejectionAdd({
                    run_id: telemetryRunId,
                    sport: normalizeSportKey(candidateRow?.matches?.[0]?.sport || candidatePool[0]?.sport || 'unknown'),
                    bucket: 'consistency_reject',
                    metadata: {
                        tier: t,
                        step_type: step.type,
                        reason: 'family_cap_exceeded',
                        exceeded: familyCapState.exceededFamilies
                    }
                });
                if (step.legCount === 12) {
                    megaDiagnostics.mega_rejected_for_family_caps += Math.max(1, familyCapState.exceededFamilies.length);
                    console.log('[accaBuilder] %s: card rejected for family caps %s', step.type, JSON.stringify(familyCapState.exceededFamilies));
                    addCardFixtureKeysToSet(candidateRow, usedFixtureKeys);
                    candidatePool = rotateCandidatePool(candidatePool, usedFixtureKeys, usedTeamsWeekly);
                    continue;
                }
                // For 6-leg cards, preserve existing builder behavior and track the condition for observability.
                console.log('[accaBuilder] %s: family cap exceeded (diagnostic only) %s', step.type, JSON.stringify(familyCapState.exceededFamilies));
            }

            if (step.legCount === 12 && !hasMinimumMarketDiversity(candidateRow)) {
                pipelineLogger.rejectionAdd({
                    run_id: telemetryRunId,
                    sport: normalizeSportKey(candidateRow?.matches?.[0]?.sport || candidatePool[0]?.sport || 'unknown'),
                    bucket: 'consistency_reject',
                    metadata: {
                        tier: t,
                        step_type: step.type,
                        reason: 'low_market_diversity'
                    }
                });
                megaDiagnostics.mega_rejected_for_low_diversity += 1;
                console.log('[accaBuilder] %s: card rejected for low market diversity (<%s families)', step.type, MIN_FAMILIES_PER_CARD);
                addCardFixtureKeysToSet(candidateRow, usedFixtureKeys);
                candidatePool = rotateCandidatePool(candidatePool, usedFixtureKeys, usedTeamsWeekly);
                continue;
            }

            // SKCS LAW: Card overlap rejection
            const overlapResult = exceedsCardOverlapLimit(candidateRow, publishedCards);
            if (overlapResult.reject) {
                pipelineLogger.rejectionAdd({
                    run_id: telemetryRunId,
                    sport: normalizeSportKey(candidateRow?.matches?.[0]?.sport || candidatePool[0]?.sport || 'unknown'),
                    bucket: 'conflict_reject',
                    metadata: {
                        tier: t,
                        step_type: step.type,
                        reason: 'card_overlap_limit',
                        overlap: overlapResult.overlap
                    }
                });
                accaPublishDiagnostics.duplicate_card_rejections += 1;
                accaPublishDiagnostics.published_card_overlap_counts.push({
                    type: step.type,
                    profile: step.profile,
                    leg_count: step.legCount,
                    overlap: overlapResult.overlap,
                    compared_against: overlapResult.comparedAgainst,
                });
                if (step.legCount === 12) megaDiagnostics.mega_rejected_for_duplicate_overlap += 1;
                console.log('[accaBuilder] %s: card rejected for fixture overlap=%s with %s', step.type, overlapResult.overlap, overlapResult.comparedAgainst);
                addCardFixtureKeysToSet(candidateRow, usedFixtureKeys);
                candidatePool = rotateCandidatePool(candidatePool, usedFixtureKeys, usedTeamsWeekly);
                continue;
            }

            // SKCS LAW: Weekly team lock check on this card
            if (cardWeeklyLockViolation(candidateRow, usedTeamsWeekly)) {
                pipelineLogger.rejectionAdd({
                    run_id: telemetryRunId,
                    sport: normalizeSportKey(candidateRow?.matches?.[0]?.sport || candidatePool[0]?.sport || 'unknown'),
                    bucket: 'weekly_lock_reject',
                    metadata: {
                        tier: t,
                        step_type: step.type,
                        reason: 'card_weekly_lock_violation'
                    }
                });
                accaPublishDiagnostics.weekly_team_lock_hits += 1;
                if (step.legCount === 12) megaDiagnostics.mega_rejected_for_weekly_team_lock += 1;
                console.log('[accaBuilder] %s: card rejected by weekly team lock', step.type);
                addCardFixtureKeysToSet(candidateRow, usedFixtureKeys);
                candidatePool = rotateCandidatePool(candidatePool, usedFixtureKeys, usedTeamsWeekly);

                const retryUsed = new Set(globalUsedFixtures);
                const retryRow = buildAccumulatorRowWithFallbackLadder(
                    step,
                    candidatePool,
                    retryUsed,
                    {
                        megaDiagnostics,
                        expiryCutoff: megaExpiryCutoff
                    }
                );

                if (!retryRow || cardWeeklyLockViolation(retryRow, usedTeamsWeekly)) {
                    pipelineLogger.rejectionAdd({
                        run_id: telemetryRunId,
                        sport: normalizeSportKey(candidateRow?.matches?.[0]?.sport || candidatePool[0]?.sport || 'unknown'),
                        bucket: 'publish_skip',
                        metadata: {
                            tier: t,
                            step_type: step.type,
                            reason: 'weekly_lock_retry_failed'
                        }
                    });
                    continue;
                }

                candidateRow = retryRow;
            }

            // Accept the card
            reservePredictionFixtures(candidateRow, globalUsedFixtures);
            reservePredictionTeams(candidateRow, runTeamCompetitionMap);

            // Log published card fixture keys for verification
            const pubKeys = Array.from(getCardFixtureKeySet(candidateRow));
            console.log('[accaBuilder] PUBLISHING CARD %s legs=%s fixtureKeys=[%s]', step.type, pubKeys.length, pubKeys.join(', '));

            // Lock teams for weekly reuse prevention
            lockCardTeamsForWeek(candidateRow, usedTeamsWeekly);
            addCardFixtureKeysToSet(candidateRow, usedFixtureKeys);

            publishedCards.push(candidateRow);

            const inserted = await insertFinalRow({
                publish_run_id: publishRunId,
                tier: t,
                type: step.type,
                matches: candidateRow.matches,
                total_confidence: candidateRow.total_confidence,
                risk_level: candidateRow.risk_level,
            }, client);

            if (!inserted) {
                continue;
            }

            if (step.legCount === 12) {
                megaAccaRows.push(inserted);
                megaDiagnostics.mega_final_cards_built += 1;
            } else {
                accaRows.push(inserted);
            }
            await persistTeamWeekLocks(client, inserted, {
                publishRunId,
                sourceType: step.type,
                sourceTier: t,
                now
            });

            // SKCS LAW: Rotate candidate pool
            candidatePool = rotateCandidatePool(candidatePool, usedFixtureKeys, usedTeamsWeekly);
            accaPublishDiagnostics.remaining_candidate_pool_after_each_publish.push({
                type: step.type,
                profile: step.profile,
                leg_count: step.legCount,
                remaining: candidatePool.length,
            });
            console.log('[accaBuilder] %s: card accepted, remaining_pool=%s', step.type, candidatePool.length);
        }

        if (accaRows.length === 0) {
            const fallbackStep = { type: 'acca_6match', legCount: 6, profile: 'football_only' };
            const fallbackUsed = new Set(globalUsedFixtures);
            const fallbackPool = relaxFilters(accaMarketCandidates, { forMega: false });
            const fallbackCard = buildAccumulatorRowWithFallbackLadder(
                fallbackStep,
                fallbackPool,
                fallbackUsed,
                {
                    megaDiagnostics,
                    expiryCutoff: megaExpiryCutoff
                }
            );

            if (fallbackCard && !cardWeeklyLockViolation(fallbackCard, usedTeamsWeekly) && !exceedsCardOverlapLimit(fallbackCard, publishedCards).reject) {
                reservePredictionFixtures(fallbackCard, globalUsedFixtures);
                reservePredictionTeams(fallbackCard, runTeamCompetitionMap);
                lockCardTeamsForWeek(fallbackCard, usedTeamsWeekly);
                addCardFixtureKeysToSet(fallbackCard, usedFixtureKeys);
                publishedCards.push(fallbackCard);

                const inserted = await insertFinalRow({
                    publish_run_id: publishRunId,
                    tier: t,
                    type: 'acca_6match',
                    matches: fallbackCard.matches,
                    total_confidence: fallbackCard.total_confidence,
                    risk_level: fallbackCard.risk_level,
                }, client);
                if (inserted) accaRows.push(inserted);
                if (inserted) {
                    await persistTeamWeekLocks(client, inserted, {
                        publishRunId,
                        sourceType: 'acca_6match',
                        sourceTier: t,
                        now
                    });
                }
                candidatePool = rotateCandidatePool(candidatePool, usedFixtureKeys, usedTeamsWeekly);
                console.log('[accaBuilder] fallback acca_6match published.');
            } else {
                console.warn('[accaBuilder] BYPASS: Skipping fallback_card_not_publishable check for acca_6match');
                // TEMPORARY BYPASS: Allow matches to proceed even if fallback card is not publishable
                // pipelineLogger.rejectionAdd({
                //     run_id: telemetryRunId,
                //     sport: normalizeSportKey(fallbackPool[0]?.sport || 'unknown'),
                //     bucket: 'publish_skip',
                //     metadata: {
                //         tier: t,
                //         step_type: 'acca_6match',
                //         reason: 'fallback_card_not_publishable'
                //     }
                // });
            }
        }

        if (megaAccaRows.length === 0) {
            const fallbackStep = { type: 'mega_acca_12', legCount: 12, profile: 'football_only' };
            const fallbackUsed = new Set(globalUsedFixtures);
            const fallbackPool = relaxFilters(accaMarketCandidates, { forMega: true });
            const fallbackCard = buildAccumulatorRowWithFallbackLadder(
                fallbackStep,
                fallbackPool,
                fallbackUsed,
                {
                    megaDiagnostics,
                    expiryCutoff: megaExpiryCutoff
                }
            );

            if (fallbackCard && !cardWeeklyLockViolation(fallbackCard, usedTeamsWeekly) && !exceedsCardOverlapLimit(fallbackCard, publishedCards).reject) {
                reservePredictionFixtures(fallbackCard, globalUsedFixtures);
                reservePredictionTeams(fallbackCard, runTeamCompetitionMap);
                lockCardTeamsForWeek(fallbackCard, usedTeamsWeekly);
                addCardFixtureKeysToSet(fallbackCard, usedFixtureKeys);
                publishedCards.push(fallbackCard);

                const inserted = await insertFinalRow({
                    publish_run_id: publishRunId,
                    tier: t,
                    type: 'mega_acca_12',
                    matches: fallbackCard.matches,
                    total_confidence: fallbackCard.total_confidence,
                    risk_level: fallbackCard.risk_level,
                }, client);
                if (inserted) {
                    megaAccaRows.push(inserted);
                    megaDiagnostics.mega_final_cards_built += 1;
                    await persistTeamWeekLocks(client, inserted, {
                        publishRunId,
                        sourceType: 'mega_acca_12',
                        sourceTier: t,
                        now
                    });
                }
                candidatePool = rotateCandidatePool(candidatePool, usedFixtureKeys, usedTeamsWeekly);
                console.log('[accaBuilder] fallback mega_acca_12 published.');
            } else {
                console.warn('[accaBuilder] BYPASS: Skipping fallback_card_not_publishable check for mega_acca_12');
                // TEMPORARY BYPASS: Allow matches to proceed even if fallback card is not publishable
                // pipelineLogger.rejectionAdd({
                //     run_id: telemetryRunId,
                //     sport: normalizeSportKey(fallbackPool[0]?.sport || 'unknown'),
                //     bucket: 'publish_skip',
                //     metadata: {
                //         tier: t,
                //         step_type: 'mega_acca_12',
                //         reason: 'fallback_card_not_publishable'
                //     }
                // });
            }
        }

        megaDiagnostics.mega_zero_reason = resolveMegaZeroReason(megaDiagnostics);

        console.log('[accaBuilder] 6-LEG: published=%s', accaRows.length);
        console.log('[accaBuilder] MEGA: published=%s zero_reason=%s', megaAccaRows.length, megaDiagnostics.mega_zero_reason || 'n/a');
        console.log('[accaBuilder DIAGNOSTICS] weekly_team_lock_hits=%s', accaPublishDiagnostics.weekly_team_lock_hits);
        console.log('[accaBuilder DIAGNOSTICS] duplicate_card_rejections=%s', accaPublishDiagnostics.duplicate_card_rejections);
        console.log('[accaBuilder DIAGNOSTICS] published_card_overlap_counts=%s', JSON.stringify(accaPublishDiagnostics.published_card_overlap_counts));
        console.log('[accaBuilder DIAGNOSTICS] remaining_candidate_pool_after_each_publish=%s', JSON.stringify(accaPublishDiagnostics.remaining_candidate_pool_after_each_publish));
        console.log('[accaBuilder DIAGNOSTICS] mega_candidate_fixtures_before_filter=%s', megaDiagnostics.mega_candidate_fixtures_before_filter);
        console.log('[accaBuilder DIAGNOSTICS] mega_candidate_fixtures_after_filter=%s', megaDiagnostics.mega_candidate_fixtures_after_filter);
        console.log('[accaBuilder DIAGNOSTICS] mega_rejected_for_weekly_team_lock=%s', megaDiagnostics.mega_rejected_for_weekly_team_lock);
        console.log('[accaBuilder DIAGNOSTICS] mega_rejected_for_family_caps=%s', megaDiagnostics.mega_rejected_for_family_caps);
        console.log('[accaBuilder DIAGNOSTICS] mega_rejected_for_duplicate_overlap=%s', megaDiagnostics.mega_rejected_for_duplicate_overlap);
        console.log('[accaBuilder DIAGNOSTICS] mega_rejected_for_confidence_floor=%s', megaDiagnostics.mega_rejected_for_confidence_floor);
        console.log('[accaBuilder DIAGNOSTICS] mega_rejected_for_banned_market=%s', megaDiagnostics.mega_rejected_for_banned_market);
        console.log('[accaBuilder DIAGNOSTICS] mega_rejected_for_low_diversity=%s', megaDiagnostics.mega_rejected_for_low_diversity);
        console.log('[accaBuilder DIAGNOSTICS] mega_rejected_for_insufficient_legs=%s', megaDiagnostics.mega_rejected_for_insufficient_legs);
        console.log('[accaBuilder DIAGNOSTICS] mega_final_cards_built=%s', megaDiagnostics.mega_final_cards_built);
        console.log('[accaBuilder DIAGNOSTICS] mega_zero_reason=%s', megaDiagnostics.mega_zero_reason || 'n/a');

        const insightRowsInserted = directRows.length + secondaryRows.length + sameMatchRows.length + multiRows.length;
        const accaRowsInserted = accaRows.length + megaAccaRows.length;
        const allPublishedRows = [
            ...directRows,
            ...secondaryRows,
            ...sameMatchRows,
            ...multiRows,
            ...accaRows,
            ...megaAccaRows
        ];
        addStageBySport(
            telemetryRunId,
            'published_count',
            collectSportCountsFromMatches(allPublishedRows)
        );

        const kickoffDiagnostics = extractKickoffForDiagnostics(allPublishedRows);
        const publishDates = allPublishedRows
            .map((row) => new Date(row?.created_at || 0))
            .filter((value) => !Number.isNaN(value.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());
        const uiFilterStart = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
        const uiFilterEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString();
        const publishDateStored = publishDates.length ? publishDates[publishDates.length - 1].toISOString() : null;

        console.log(
            '[accaBuilder][publish_counts] tier=%s insights_rows=%s acca_rows=%s total_rows=%s',
            t,
            insightRowsInserted,
            accaRowsInserted,
            allPublishedRows.length
        );
        console.log('[accaBuilder][timezone_diagnostics] %s', JSON.stringify({
            tier: t,
            server_now_utc: now.toISOString(),
            extracted_kickoff_date_stored: kickoffDiagnostics,
            publish_date_stored: publishDateStored,
            ui_filter_bounds: {
                start_utc: uiFilterStart,
                end_utc: uiFilterEnd
            }
        }));

        const candidateCountTotal = Array.isArray(limitedCandidates) ? limitedCandidates.length : 0;
        if (candidateCountTotal > 0 && allPublishedRows.length === 0) {
            const baseSafePool = Array.isArray(accaMarketCandidates) && accaMarketCandidates.length
                ? accaMarketCandidates
                : limitedCandidates;
            const safeCandidates = baseSafePool
                .filter((candidate) => !isPredictionHighRisk(candidate, { forMega: false }))
                .sort(compareAccaCandidatePreference)
                .slice(0, 3);
            const forcedRows = safeCandidates.length ? safeCandidates : baseSafePool.slice(0, 3);

            for (const candidate of forcedRows) {
                const candidateSport = normalizeSportKey(candidate?.sport || candidate?.metadata?.sport || 'unknown');
                await insertDebugPublishedRow({
                    publish_run_id: publishRunId,
                    tier: t,
                    sport: candidateSport,
                    candidate,
                    rejection_metadata: {
                        reason: 'candidate_count_gt_zero_but_published_zero',
                        tier: t,
                        candidate_count: candidateCountTotal,
                        telemetry_run_id: telemetryRunId,
                        captured_at: new Date().toISOString()
                    }
                }, client);
                pipelineLogger.rejectionAdd({
                    run_id: telemetryRunId,
                    sport: candidateSport,
                    bucket: 'publish_skip',
                    metadata: {
                        tier: t,
                        reason: 'debug_published_forced_store'
                    }
                });
            }

            console.warn('[accaBuilder] forced debug publish mode activated: stored %s candidate(s) in debug_published.', forcedRows.length);
        }

        console.log('[accaBuilder] tier=%s week_locked=%s direct=%s secondary=%s same_match=%s multi=%s acca_6match=%s mega_acca_12=%s',
            t,
            weekLockedTeamCompetitionMap.size,
            directRows.length,
            secondaryRows.length,
            sameMatchRows.length,
            multiRows.length,
            accaRows.length,
            megaAccaRows.length
        );

        return {
            tier: t,
            direct: directRows,
            secondary: secondaryRows,
            same_match: sameMatchRows,
            multi: multiRows,
            acca_6match: accaRows,
            mega_acca_12: megaAccaRows,
            diagnostics: {
                weekly_team_lock_hits: accaPublishDiagnostics.weekly_team_lock_hits,
                duplicate_card_rejections: accaPublishDiagnostics.duplicate_card_rejections,
                published_card_overlap_counts: accaPublishDiagnostics.published_card_overlap_counts,
                remaining_candidate_pool_after_each_publish: accaPublishDiagnostics.remaining_candidate_pool_after_each_publish,
                mega_zero_reason: megaDiagnostics.mega_zero_reason,
            }
        };
    });
}

module.exports = {
    buildFinalForTier, 
    buildAccaV2,
    insertStage1Rows,
    insertStage2Rows,
    insertStage3Rows,
    getDoubleChanceLegs
};
