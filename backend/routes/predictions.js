'use strict';

const express = require('express');
const { query } = require('../db');
const { rebuildFinalOutputs } = require('../services/aiPipeline');
const { requireRole } = require('../utils/auth');
const { executeOperation } = require('../core/executionPipeline');
const { requirePredictionsUser, requireActiveSubscription } = require('../middleware/supabaseJwt');
const config = require('../config');
const { createClient } = require('@supabase/supabase-js');
const moment = require('moment-timezone');
const { isValidCombination } = require('../services/conflictEngine');
const { getPlan, normalizePlanId } = require('../config/subscriptionPlans');

const { getPlanCapabilities, filterPredictionsForPlan, calculateDailyAllocations, getMegaAccaDailyAllocation } = require('../config/subscriptionMatrix');
const { getPredictionWindow } = require('../utils/dateNormalization');
const { areLegsCompatible } = require('../utils/marketConsistency');
const { getCardDescriptor } = require('../utils/insightEngine');
const { buildContextInsightsFromMetadata } = require('../utils/contextInsights');
const { enrichWithWeather } = require('../utils/weather');
const { enrichWithAvailability } = require('../utils/availability');
// insightUsage utility removed - unused dead code (per-format tracking not needed)
// ACCA-specific restrictions are correctly implemented in team_week_locks table
const { getRiskColor, getRiskTierLabel } = require('../services/masterRulebookRiskClassification');
const { filterMarketsByMainPick, validateSMBCLegs } = require('../services/contradictionGovernance');
const { getLatestRunSnapshot } = require('../utils/pipelineLogger');
const verificationController = require('../core/verificationController');

const router = express.Router();
const ACTIVE_DEPLOYMENT_SPORT = 'Football';

function getSystemHealthSnapshot() {
    return verificationController.getSnapshot();
}

function attachSystemHealth(res) {
    const systemHealth = getSystemHealthSnapshot();
    res.set('X-System-State', String(systemHealth.state || 'UNKNOWN'));
    return systemHealth;
}

const SPORT_FILTER_MAP = {
    Football: [
        'Football',
        'football',
        'soccer',
        'soccer_epl',
        'soccer_england_efl_cup',
        'soccer_uefa_champs_league',
        'soccer_spain_la_liga',
        'soccer_germany_bundesliga',
        'soccer_italy_serie_a',
        'soccer_france_ligue_one',
        'soccer_uefa_europa_league'
    ],
    Basketball: ['Basketball', 'basketball', 'nba', 'basketball_nba', 'basketball_euroleague'],
    NFL: ['NFL', 'nfl', 'american_football', 'americanfootball_nfl'],
    Rugby: ['Rugby', 'rugby', 'rugbyunion_international', 'rugbyunion_six_nations'],
    NHL: ['NHL', 'nhl', 'hockey', 'icehockey_nhl'],
    MLB: ['MLB', 'mlb', 'baseball', 'baseball_mlb'],
    AFL: ['AFL', 'afl', 'aussierules_afl'],
    MMA: ['MMA', 'mma', 'mma_mixed_martial_arts'],
    F1: ['F1', 'formula1'],
    Handball: ['Handball', 'handball'],
    Volleyball: ['Volleyball', 'volleyball'],
    Cricket: ['Cricket', 'cricket'],
    Esports: ['Esports', 'esports']
};

// IRON-CLAD DATE PATCH: 15-minute grace — matches more than 15 min past kickoff are rejected.
const DEFAULT_UPCOMING_GRACE_MINUTES = 15;
const DEFAULT_ACCA_STARTED_LOOKBACK_HOURS = 72;
const DEFAULT_ACCA_WINDOW_LOOKBACK_HOURS = 168;
const ELITE_CONFIDENCE_FLOOR = 75;
const EDGE_MIND_PLACEHOLDER_PATTERNS = [
    'passed stages 1-4',
    'suitable for multi construction',
    'full elite pipeline and low-volatility kill-switch',
    'processing data for this fixture',
    'baseline probability against',
    'reality check indicates moderate volatility',
    'proceed with standard stake on 1x2'
];
const PLACEHOLDER_TEAM_LABELS = new Set([
    'unknown',
    'unknown home',
    'unknown away',
    'home team',
    'away team',
    'tbd',
    'n/a'
]);
const PREDICTION_ROW_QUALITY_SQL = `
    pf.home_team IS NOT NULL
    AND pf.away_team IS NOT NULL
    AND LOWER(pf.home_team) NOT IN ('unknown', 'unknown home', 'unknown away', 'home team', 'away team', 'tbd', 'n/a')
    AND LOWER(pf.away_team) NOT IN ('unknown', 'unknown home', 'unknown away', 'home team', 'away team', 'tbd', 'n/a')
    AND COALESCE(pf.sport, 'Football') <> 'unknown'
    AND pf.match_date > NOW()
`;

function parseBoundedInt(value, fallback, min, max) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function isPlaceholderTeamLabel(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return true;
    return PLACEHOLDER_TEAM_LABELS.has(key);
}

function isPredictionIdentityValid(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const firstMatch = matches[0] || {};
    const homeTeam = resolveMatchTeamName(firstMatch, 'home') || extractTeamNameValue(prediction?.home_team);
    const awayTeam = resolveMatchTeamName(firstMatch, 'away') || extractTeamNameValue(prediction?.away_team);
    const sportKey = normalizePredictionSportKey(
        prediction?.sport
        || firstMatch?.sport
        || firstMatch?.metadata?.sport
        || firstMatch?.metadata?.sport_type
        || ''
    );

    if (!homeTeam || !awayTeam) return false;
    if (isPlaceholderTeamLabel(homeTeam) || isPlaceholderTeamLabel(awayTeam)) return false;
    return Boolean(sportKey && sportKey !== 'unknown');
}

const UPCOMING_GRACE_MINUTES = parseBoundedInt(
    process.env.PREDICTION_UPCOMING_GRACE_MINUTES,
    DEFAULT_UPCOMING_GRACE_MINUTES,
    0,
    120
);

const ACCA_STARTED_LOOKBACK_HOURS = parseBoundedInt(
    process.env.PREDICTION_ACCA_STARTED_LOOKBACK_HOURS,
    DEFAULT_ACCA_STARTED_LOOKBACK_HOURS,
    1,
    168
);

const ACCA_WINDOW_LOOKBACK_HOURS = parseBoundedInt(
    process.env.PREDICTION_ACCA_WINDOW_LOOKBACK_HOURS,
    DEFAULT_ACCA_WINDOW_LOOKBACK_HOURS,
    1,
    336
);

function startOfWeekUtc(now = new Date()) {
    const current = new Date(now);
    const day = current.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    current.setUTCDate(current.getUTCDate() + diffToMonday);
    current.setUTCHours(0, 0, 0, 0);
    return current;
}

function normalizePredictionSportKey(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return 'unknown';
    if (key === 'soccer' || key === 'football' || key.startsWith('football_') || key.startsWith('soccer_')) return 'Football';
    if (key === 'nba' || key.startsWith('basketball_')) return 'Basketball';
    if (key === 'nfl' || key.startsWith('american_football') || key.startsWith('americanfootball_')) return 'NFL';
    if (key === 'nhl' || key.startsWith('hockey') || key.startsWith('icehockey_')) return 'NHL';
    if (key === 'mlb' || key.startsWith('baseball') || key.startsWith('baseball_')) return 'MLB';
    if (key === 'rugby' || key.startsWith('rugbyunion_')) return 'Rugby';
    if (key === 'afl' || key.startsWith('aussierules_')) return 'AFL';
    if (key === 'mma' || key.startsWith('mma_')) return 'MMA';
    if (key === 'f1' || key.startsWith('formula1')) return 'F1';
    if (key === 'handball') return 'Handball';
    if (key === 'volleyball') return 'Volleyball';
    if (key === 'golf') return 'Golf';
    if (key === 'boxing') return 'Boxing';
    if (key === 'tennis') return 'Tennis';
    if (key === 'cricket') return 'Cricket';
    if (key === 'esports') return 'Esports';
    if (key === 'darts') return 'Darts';
    return key;
}

function normalizeTierLabel(value) {
    const tier = String(value || '').trim().toLowerCase();
    if (!tier) return 'normal';
    if (tier === 'elite') return 'deep';
    if (tier === 'core') return 'normal';
    return tier;
}

function getSportFilterValues(sport) {
    const key = normalizePredictionSportKey(String(sport || ACTIVE_DEPLOYMENT_SPORT).trim().toLowerCase());
    return SPORT_FILTER_MAP[key] || [key];
}

function getStrictSportFilterValue(sport) {
    return normalizePredictionSportKey(String(sport || ACTIVE_DEPLOYMENT_SPORT).trim().toLowerCase());
}

function normalizeInsightTierLabel(value) {
    const tier = String(value || '').trim().toLowerCase();
    if (!tier) return null;
    if (tier === 'core' || tier === 'normal') return 'core';
    if (tier === 'elite' || tier === 'deep') return 'elite';
    if (tier === 'vip') return 'vip';
    return null;
}

function normalizeAccessTokenToTier(value) {
    const token = String(value || '').trim().toLowerCase();
    if (!token) return null;

    if (
        token === 'vip'
        || token === 'vip_30day'
        || token.includes('deep_vip')
        || token.endsWith('_vip')
    ) {
        return 'vip';
    }
    if (
        token === 'elite'
        || token === 'deep'
        || token === 'pro'
        || token === 'strike'
        || token === 'deep_dive'
        || token === 'deep_pro'
        || token === 'deep_strike'
        || token.startsWith('elite_')
    ) {
        return 'elite';
    }
    if (
        token === 'core'
        || token === 'normal'
        || token === 'core_free'
        || token.startsWith('core_')
    ) {
        return 'core';
    }
    return null;
}

function extractRawPredictionTierAccess(prediction) {
    const out = new Set();
    const rowTier = normalizeInsightTierLabel(prediction?.tier);
    if (rowTier) out.add(rowTier);

    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    for (const match of matches) {
        const access = match?.metadata?.tier_access;
        if (!Array.isArray(access)) continue;
        for (const token of access) {
            const normalized = normalizeAccessTokenToTier(token);
            if (normalized) out.add(normalized);
        }
    }
    return out;
}

function inferPredictionOutputTier(prediction) {
    const raw = extractRawPredictionTierAccess(prediction);
    if (raw.has('vip')) return 'vip';
    if (raw.has('elite')) return 'elite';
    return 'core';
}

function inferPredictionOutputSection(prediction) {
    const sectionType = inferSectionType(prediction);
    if (sectionType === 'mega_acca_12') return 'mega';
    if (sectionType === 'acca_6match') return 'acca';
    if (sectionType === 'direct') return 'direct';
    return 'singles';
}

function inferPredictionOutputSport(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const first = matches[0] || {};
    return normalizePredictionSportKey(
        first?.sport
        || first?.metadata?.sport
        || first?.metadata?.sport_type
        || prediction?.sport
        || 'unknown'
    );
}

function inferPredictionOutputConfidence(prediction) {
    const total = Number(prediction?.total_confidence);
    if (Number.isFinite(total)) return roundConfidence(Math.max(0, Math.min(100, total)));
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const first = matches[0] || {};
    const firstConfidence = Number(first?.confidence);
    if (Number.isFinite(firstConfidence)) return roundConfidence(Math.max(0, Math.min(100, firstConfidence)));
    return 0;
}

function extractPredictionPrimaryMatchId(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const first = matches[0] || {};
    return String(first?.match_id || prediction?.match_id || '').trim() || null;
}

function extractPredictionPrimaryMarket(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const first = matches[0] || {};
    return normalizeMarketKey(first?.market || prediction?.market || '') || null;
}

function shapePredictionOutputContract(prediction) {
    const conf = inferPredictionOutputConfidence(prediction);
    return {
        ...prediction,
        source_tier: String(prediction?.tier || '').trim().toLowerCase() || null,
        source_section_type: inferSectionType(prediction),
        tier: inferPredictionOutputTier(prediction),
        section: inferPredictionOutputSection(prediction),
        sport: inferPredictionOutputSport(prediction),
        confidence: conf,
        risk_label_ui: getRiskTierLabel(conf),
        risk_color_ui: getRiskColor(conf),
        match_id: extractPredictionPrimaryMatchId(prediction),
        market: extractPredictionPrimaryMarket(prediction)
    };
}

function resolveHighestAccessTier(user) {
    if (user?.is_admin === true || user?.isAdmin === true || user?.is_test_user === true) {
        return 'vip';
    }

    const access = new Set(
        (Array.isArray(user?.access_tiers) ? user.access_tiers : [])
            .map(normalizeAccessTokenToTier)
            .filter(Boolean)
    );
    if (!access.size) {
        const fallback = normalizeAccessTokenToTier(user?.plan_id);
        if (fallback) access.add(fallback);
    }

    if (access.has('vip')) return 'vip';
    if (access.has('elite')) return 'elite';
    if (access.has('core')) return 'core';
    return null;
}

function resolveRequestedSubscriptionViewTier(req, user) {
    const requested = String(
        req.query?.view_tier
        || req.query?.tier_tab
        || req.query?.subscription_tier
        || req.query?.tier
        || ''
    ).trim().toLowerCase();

    if (requested === 'core' || requested === 'elite' || requested === 'vip') {
        return requested;
    }

    return resolveHighestAccessTier(user) || 'core';
}

function canAccessSubscriptionViewTier(user, viewTier) {
    const requested = String(viewTier || '').trim().toLowerCase();
    if (!requested) return false;
    if (user?.is_admin === true || user?.isAdmin === true || user?.is_test_user === true) return true;

    const highest = resolveHighestAccessTier(user);
    if (!highest) return requested === 'core';
    if (requested === 'core') return highest === 'core' || highest === 'elite' || highest === 'vip';
    if (requested === 'elite') return highest === 'elite' || highest === 'vip';
    return requested === 'vip' ? highest === 'vip' : false;
}

function isTierVisibleForView(predictionTier, viewTier) {
    const rank = { core: 1, elite: 2, vip: 3 };
    const predictionRank = rank[normalizeInsightTierLabel(predictionTier)] || 1;
    const viewRank = rank[normalizeInsightTierLabel(viewTier)] || 1;
    return predictionRank <= viewRank;
}

// FIX 3: ACCA CLASSIFICATION - Trust explicit DB types and check team pairs
function inferSectionType(prediction) {
    const explicit = String(prediction?.section_type || prediction?.type || '').trim().toLowerCase();
    if (explicit && explicit !== 'prediction') return explicit;

    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    
    if (matches.length >= 12) return 'mega_acca_12';
    if (matches.length >= 6) return 'acca_6match';
    if (matches.length >= 2) {
        // Distinguish Same Match vs ACCA
        const teamPairs = new Set(matches.map(m => {
            const h = normalizeTeamSignaturePart(resolveMatchTeamName(m, 'home'));
            const a = normalizeTeamSignaturePart(resolveMatchTeamName(m, 'away'));
            return `${h}_${a}`;
        }));
        if (teamPairs.size === 1) return 'same_match';
        return 'multi';
    }

    const firstMarket = String(matches[0]?.market || '').trim().toLowerCase();
    if (matches.length === 1 && firstMarket && firstMarket !== '1x2' && firstMarket !== 'match_result') {
        return 'secondary';
    }
    return 'direct';
}

function predictionMatchesSport(prediction, sportFilterValues) {
    if (!Array.isArray(sportFilterValues) || sportFilterValues.length === 0) return true;
    const allowed = new Set(sportFilterValues.map(normalizePredictionSportKey));
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    if (matches.length === 0) return false;

    // STRICT FIX: Always check the PRIMARY (first) match for sport
    // This prevents ACCAs with mixed sports from appearing in wrong sport tabs
    const primaryMatch = matches[0];
    if (!primaryMatch) return false;

    const primarySport = normalizePredictionSportKey(
        primaryMatch?.sport || 
        primaryMatch?.metadata?.sport || 
        primaryMatch?.metadata?.sport_type || 
        ''
    );

    // Primary match must be in the allowed set
    if (!allowed.has(primarySport)) return false;

    // For ACCA/multi: all matches should ideally be the same sport
    // But we primarily check the first match for sport tab filtering
    const sectionType = inferSectionType(prediction);
    if (sectionType.includes('acca') || sectionType === 'multi') {
        // Strict: ALL matches in ACCA should match the sport
        return matches.every((match) => {
            const matchSport = normalizePredictionSportKey(
                match?.sport || 
                match?.metadata?.sport || 
                match?.metadata?.sport_type || 
                ''
            );
            return allowed.has(matchSport);
        });
    }

    return true;
}

function extractTeamNames(predictions) {
    const names = new Set();
    for (const row of predictions) {
        const matches = Array.isArray(row.matches) ? row.matches : [];
        for (const m of matches) {
            const home = resolveMatchTeamName(m, 'home');
            const away = resolveMatchTeamName(m, 'away');
            if (home) names.add(home);
            if (away) names.add(away);
        }
    }
    return Array.from(names);
}

function buildPlayersByTeam(rows) {
    const map = new Map();
    for (const row of rows) {
        if (!map.has(row.team_id)) map.set(row.team_id, []);
        const list = map.get(row.team_id);
        if (list.length >= 3) continue;
        list.push({
            id: row.id,
            name: row.name,
            position: row.position,
            number: row.number,
            age: row.age,
            photo: row.photo
        });
    }
    return map;
}

function formatUtcDateTime(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const year = String(parsed.getUTCFullYear()).slice(-2);
    const hours = String(parsed.getUTCHours()).padStart(2, '0');
    const minutes = String(parsed.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function humanizeToken(value) {
    return String(value || '')
        .trim()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractTeamNameValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') {
        const normalized = String(value).trim();
        const lowered = normalized.toLowerCase();
        if (!normalized) return '';
        if (lowered === 'unknown' || lowered === 'unknown home' || lowered === 'unknown away') return '';
        return normalized;
    }
    if (typeof value !== 'object') return '';

    const candidate =
        value.name
        || value.team_name
        || value.team
        || value.full_name
        || value.display_name
        || value.short_name
        || value.title
        || '';

    const normalized = String(candidate || '').trim();
    const lowered = normalized.toLowerCase();
    if (!normalized) return '';
    if (lowered === 'unknown' || lowered === 'unknown home' || lowered === 'unknown away') return '';
    return normalized;
}

function resolveMatchTeamName(match, side) {
    const directKeys = side === 'home'
        ? ['home_team', 'home', 'homeTeam', 'homeTeamName', 'home_team_name', 'home_name', 'team_home', 'teamHome', 'player1']
        : ['away_team', 'away', 'awayTeam', 'awayTeamName', 'away_team_name', 'away_name', 'team_away', 'teamAway', 'player2'];
    const metadataKeys = side === 'home'
        ? ['home_team', 'home', 'homeTeam', 'homeTeamName', 'home_team_name', 'home_name']
        : ['away_team', 'away', 'awayTeam', 'awayTeamName', 'away_team_name', 'away_name'];

    for (const key of directKeys) {
        const value = extractTeamNameValue(match?.[key]);
        if (value) return value;
    }

    const fromTeams = side === 'home'
        ? extractTeamNameValue(match?.teams?.home || match?.teams?.homeTeam || match?.teams?.team_home)
        : extractTeamNameValue(match?.teams?.away || match?.teams?.awayTeam || match?.teams?.team_away);
    if (fromTeams) return fromTeams;

    for (const key of metadataKeys) {
        const value = extractTeamNameValue(match?.metadata?.[key]);
        if (value) return value;
    }

    const fromMetadataTeams = side === 'home'
        ? extractTeamNameValue(match?.metadata?.teams?.home || match?.metadata?.teams?.homeTeam || match?.metadata?.team_home)
        : extractTeamNameValue(match?.metadata?.teams?.away || match?.metadata?.teams?.awayTeam || match?.metadata?.team_away);
    if (fromMetadataTeams) return fromMetadataTeams;

    const fromMatchInfo = side === 'home'
        ? extractTeamNameValue(
            match?.match_info?.home_team
            || match?.match_info?.home
            || match?.match_info?.homeTeam
            || match?.metadata?.match_info?.home_team
            || match?.metadata?.match_info?.home
            || match?.metadata?.match_info?.homeTeam
            || match?.metadata?.match_context?.match_info?.home_team
            || match?.metadata?.match_context?.match_info?.home
            || match?.metadata?.match_context?.match_info?.homeTeam
        )
        : extractTeamNameValue(
            match?.match_info?.away_team
            || match?.match_info?.away
            || match?.match_info?.awayTeam
            || match?.metadata?.match_info?.away_team
            || match?.metadata?.match_info?.away
            || match?.metadata?.match_info?.awayTeam
            || match?.metadata?.match_context?.match_info?.away_team
            || match?.metadata?.match_context?.match_info?.away
            || match?.metadata?.match_context?.match_info?.awayTeam
        );
    if (fromMatchInfo) return fromMatchInfo;

    const labelSource = String(
        match?.match_name
        || match?.fixture_name
        || match?.event_name
        || match?.metadata?.match_name
        || match?.metadata?.fixture_name
        || match?.metadata?.event_name
        || match?.metadata?.header_info
        || ''
    ).trim();
    if (labelSource) {
        const parts = labelSource.split(/\s+vs\s+|\s+v\s+/i).map((x) => x.trim()).filter(Boolean);
        if (parts.length >= 2) return side === 'home' ? parts[0] : parts[1];
    }

    return '';
}

function normalizeTeamSignaturePart(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function normalizeTextValue(value) {
    const text = String(value === undefined || value === null ? '' : value).trim();
    return text.length ? text : '';
}

function readObjectPath(source, path) {
    if (!source || typeof source !== 'object') return undefined;
    const parts = Array.isArray(path) ? path : String(path || '').split('.');
    let current = source;
    for (const part of parts) {
        if (!current || typeof current !== 'object' || !(part in current)) return undefined;
        current = current[part];
    }
    return current;
}

function firstNonEmptyString(sources, paths) {
    for (const source of sources) {
        if (!source || typeof source !== 'object') continue;
        for (const path of paths) {
            const value = normalizeTextValue(readObjectPath(source, path));
            if (value) return value;
        }
    }
    return '';
}

function resolveLeagueCountryForMatch(match = {}, prediction = {}) {
    const metadata = match?.metadata && typeof match.metadata === 'object' ? match.metadata : {};
    const sources = [
        match,
        metadata,
        match?.match_info || {},
        metadata?.match_info || {},
        metadata?.match_context || {},
        metadata?.match_context?.match_info || {},
        prediction
    ];

    const league = firstNonEmptyString(sources, [
        'league',
        'league_name',
        'competition',
        'tournament',
        'metadata.league',
        'metadata.competition',
        'match_info.league',
        'league.name',
        'competition.name',
        'tournament.name'
    ]);

    const country = firstNonEmptyString(sources, [
        'country',
        'league_country',
        'metadata.country',
        'metadata.league_country',
        'match_info.country',
        'league.country',
        'competition.country'
    ]);

    return { league, country };
}

function parseLooseDateTime(value) {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'number') {
        const fromNumber = new Date(value);
        return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const nativeParsed = new Date(raw);
    if (!Number.isNaN(nativeParsed.getTime())) return nativeParsed;

    const slashMatch = raw.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:[ T](\d{1,2})(?::(\d{2}))?(?::(\d{2}))?)?(?:\s*(Z|[+-]\d{2}:?\d{2}))?$/i
    );
    if (slashMatch) {
        const day = Number(slashMatch[1]);
        const month = Number(slashMatch[2]);
        const yearRaw = Number(slashMatch[3]);
        const hours = Number(slashMatch[4] || 0);
        const minutes = Number(slashMatch[5] || 0);
        const seconds = Number(slashMatch[6] || 0);
        const tz = String(slashMatch[7] || '').trim();

        const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
        if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;

        if (tz) {
            const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${tz === 'Z' ? 'Z' : tz.includes(':') ? tz : `${tz.slice(0, 3)}:${tz.slice(3)}`}`;
            const parsedIso = new Date(iso);
            return Number.isNaN(parsedIso.getTime()) ? null : parsedIso;
        }

        const fromParts = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
        return Number.isNaN(fromParts.getTime()) ? null : fromParts;
    }

    const dashedMatch = raw.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2})(?::(\d{2}))?(?::(\d{2}))?)?$/
    );
    if (dashedMatch) {
        const year = Number(dashedMatch[1]);
        const month = Number(dashedMatch[2]);
        const day = Number(dashedMatch[3]);
        const hours = Number(dashedMatch[4] || 0);
        const minutes = Number(dashedMatch[5] || 0);
        const seconds = Number(dashedMatch[6] || 0);
        const fromParts = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
        return Number.isNaN(fromParts.getTime()) ? null : fromParts;
    }

    return null;
}

function normalizeMarketKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/_+/g, '_');
}

function isDirectOutcomeToken(value) {
    const token = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
    return token === 'home' || token === 'home_win' || token === '1'
        || token === 'draw' || token === 'x'
        || token === 'away' || token === 'away_win' || token === '2';
}

function isDirect1X2Market(value) {
    const key = normalizeMarketKey(value);
    if (!key) return false;
    if (key.includes('double_chance')) return false;
    if (key === '1x2' || key === '1_x_2') return true;
    if (key === 'match_result' || key === 'full_time_result' || key === 'fulltime_result') return true;
    if (key === 'matchwinner' || key === 'match_winner' || key === 'winner') return true;
    if (key === 'moneyline' || key === 'h2h' || key === 'three_way') return true;
    if (key.includes('1x2')) return true;
    return false;
}

function extractPrimaryMatch(prediction) {
    return Array.isArray(prediction?.matches) && prediction.matches[0] ? prediction.matches[0] : null;
}

function shouldCountAsDirectMarket(prediction) {
    const firstMatch = extractPrimaryMatch(prediction);
    if (!firstMatch) return false;
    if (Array.isArray(prediction?.matches) && prediction.matches.length !== 1) return false;

    const market = firstMatch.market || firstMatch.market_type || firstMatch?.metadata?.market || firstMatch?.metadata?.market_type || '';
    if (isDirect1X2Market(market)) return true;

    const sectionType = inferSectionType(prediction);
    if (sectionType !== 'direct' && sectionType !== 'single') return false;

    const outcome = firstMatch.recommendation
        || firstMatch.prediction
        || firstMatch.pick
        || firstMatch.selection
        || firstMatch.outcome
        || firstMatch?.metadata?.recommendation
        || firstMatch?.metadata?.prediction
        || firstMatch?.metadata?.pick
        || firstMatch?.metadata?.selection
        || firstMatch?.metadata?.predicted_outcome
        || '';
    return isDirectOutcomeToken(outcome);
}

function buildDirectMarketCountsSnapshot(predictions) {
    const bySport = {};
    let total = 0;

    for (const prediction of Array.isArray(predictions) ? predictions : []) {
        if (!shouldCountAsDirectMarket(prediction)) continue;
        const firstMatch = extractPrimaryMatch(prediction) || {};
        const sportKey = normalizePredictionSportKey(
            firstMatch.sport
            || firstMatch?.metadata?.sport
            || firstMatch?.metadata?.sport_type
            || prediction?.sport
            || ''
        );
        bySport[sportKey] = Number(bySport[sportKey] || 0) + 1;
        total += 1;
    }

    return { total, by_sport: bySport };
}

function humanizePredictionLabel(prediction, market) {
    const normalized = String(prediction || '').trim().toLowerCase();
    const marketKey = normalizeMarketKey(market);
    const explicit = {
        home_win: 'HOME WIN',
        away_win: 'AWAY WIN',
        draw: 'DRAW',
        over: 'OVER',
        under: 'UNDER',
        yes: 'YES',
        no: 'NO',
        '1x': 'DOUBLE CHANCE - 1X',
        x2: 'DOUBLE CHANCE - X2',
        '12': 'DOUBLE CHANCE - 12'
    };

    const goalLineMatch = marketKey.match(/^(over|under)_(\d+)_(\d+)$/);
    const cornersLineMatch = marketKey.match(/^corners_(over|under)_(\d+)_(\d+)$/);
    const yellowsLineMatch = marketKey.match(/^(over|under)_(\d+)_(\d+)_yellows$/);
    const comboDcBttsMatch = marketKey.match(/^combo_dc_(1x|x2|12)_btts_(yes|no)$/);
    const comboWinnerOuMatch = marketKey.match(/^combo_(home|away|draw)_and_(over|under)_2_5$/);
    const comboDcOuMatch = marketKey.match(/^combo_dc_(1x|x2|12)_and_(over|under)_(\d+)_(\d+)$/);
    const comboBttsOuMatch = marketKey.match(/^combo_btts_(yes|no)_and_(over|under)_(\d+)_(\d+)$/);
    const teamTotalMatch = marketKey.match(/^team_total_(home|away)_(over|under)_(\d+)_(\d+)$/);
    const htFtMatch = marketKey.match(/^ht_ft_(home|draw|away)_(home|draw|away)$/);
    if (goalLineMatch) {
        return `${goalLineMatch[1].toUpperCase()} ${goalLineMatch[2]}.${goalLineMatch[3]} GOALS`;
    }
    if (cornersLineMatch) {
        return `TOTAL CORNERS ${cornersLineMatch[1].toUpperCase()} ${cornersLineMatch[2]}.${cornersLineMatch[3]}`;
    }
    if (yellowsLineMatch) {
        return `YELLOW CARDS ${yellowsLineMatch[1].toUpperCase()} ${yellowsLineMatch[2]}.${yellowsLineMatch[3]}`;
    }
    if (comboDcBttsMatch) {
        return `DOUBLE CHANCE ${comboDcBttsMatch[1].toUpperCase()} + BTTS ${comboDcBttsMatch[2].toUpperCase()}`;
    }
    if (comboWinnerOuMatch) {
        return `${comboWinnerOuMatch[1].toUpperCase()} WIN + ${comboWinnerOuMatch[2].toUpperCase()} 2.5 GOALS`;
    }
    if (comboDcOuMatch) {
        return `DOUBLE CHANCE ${comboDcOuMatch[1].toUpperCase()} + ${comboDcOuMatch[2].toUpperCase()} ${comboDcOuMatch[3]}.${comboDcOuMatch[4]} GOALS`;
    }
    if (comboBttsOuMatch) {
        return `BTTS ${comboBttsOuMatch[1].toUpperCase()} + ${comboBttsOuMatch[2].toUpperCase()} ${comboBttsOuMatch[3]}.${comboBttsOuMatch[4]} GOALS`;
    }
    if (teamTotalMatch) {
        return `${teamTotalMatch[1].toUpperCase()} TEAM ${teamTotalMatch[2].toUpperCase()} ${teamTotalMatch[3]}.${teamTotalMatch[4]} GOALS`;
    }
    if (htFtMatch) {
        return `HT/FT ${htFtMatch[1].toUpperCase()}-${htFtMatch[2].toUpperCase()}`;
    }
    if (marketKey === 'btts_yes') return 'BTTS - YES';
    if (marketKey === 'btts_no') return 'BTTS - NO';
    if (marketKey.startsWith('draw_no_bet_')) return `DRAW NO BET - ${marketKey.replace('draw_no_bet_', '').toUpperCase()}`;
    if (marketKey === 'asian_handicap') return `ASIAN HANDICAP - ${String(prediction || '').toUpperCase()}`;
    if (marketKey === 'european_handicap') return `EUROPEAN HANDICAP - ${String(prediction || '').toUpperCase()}`;
    if (marketKey === 'corners_under') return 'TOTAL CORNERS UNDER';
    if (marketKey === 'corners_over') return 'TOTAL CORNERS OVER';
    if (marketKey.startsWith('double_chance_')) {
        return `DOUBLE CHANCE - ${marketKey.replace('double_chance_', '').toUpperCase()}`;
    }
    if (explicit[normalized]) return explicit[normalized];
    if (marketKey.includes('double_chance')) return `DOUBLE CHANCE - ${String(prediction || '').toUpperCase()}`;
    return String(prediction || '').toUpperCase();
}

function buildSecondaryMarketDescription(market, fallbackDescription = '') {
    const marketKey = normalizeMarketKey(market);
    const description = String(fallbackDescription || '').trim();
    if (marketKey === 'corners_under' || marketKey === 'corners_over') {
        return description || 'Total corners line unavailable from source';
    }
    return description;
}

function isDisplayFriendlySecondaryMarket(market) {
    const marketKey = normalizeMarketKey(market);
    return marketKey !== '1x2' && marketKey !== 'match_result' && marketKey !== 'full_time_result';
}

function isCompatibleSecondaryMarket(primaryMatch, secondaryMarket) {
    return areLegsCompatible(
        {
            market: primaryMatch?.market,
            prediction: primaryMatch?.prediction
        },
        {
            market: secondaryMarket?.market,
            prediction: secondaryMarket?.prediction
        }
    );
}

function dedupeSecondaryMarkets(items) {
    const seen = new Set();
    const out = [];

    for (const item of items) {
        const marketKey = normalizeMarketKey(item?.market);
        const predictionKey = String(item?.prediction || '').trim().toLowerCase();
        const key = `${marketKey}:${predictionKey}`;
        if (!marketKey || seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }

    return out;
}

function normalizeSecondaryPredictionToken(market, prediction) {
    const marketKey = normalizeMarketKey(market);
    const value = String(prediction || '').trim().toLowerCase();
    if (value) return value;
    if (marketKey.startsWith('double_chance_')) return marketKey.replace('double_chance_', '');
    if (marketKey === 'draw_no_bet_home') return 'home';
    if (marketKey === 'draw_no_bet_away') return 'away';
    if (marketKey.startsWith('over_')) return 'over';
    if (marketKey.startsWith('under_')) return 'under';
    if (marketKey === 'btts_no') return 'no';
    if (marketKey === 'btts_yes') return 'yes';
    return '';
}

function resolvePrimaryOutcomeToken(firstMatch) {
    const raw = String(
        firstMatch?.prediction
        || firstMatch?.recommendation
        || firstMatch?.pick
        || firstMatch?.selection
        || firstMatch?.outcome
        || firstMatch?.metadata?.prediction
        || firstMatch?.metadata?.recommendation
        || ''
    ).trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (raw === 'home' || raw === '1') return 'home_win';
    if (raw === 'away' || raw === '2') return 'away_win';
    if (raw === 'x') return 'draw';
    return raw || 'home_win';
}

function fallbackSecondaryMarketsForOutcome(outcome) {
    const normalized = resolvePrimaryOutcomeToken({ prediction: outcome });
    if (normalized === 'away_win') {
        return [
            { market: 'double_chance_x2', prediction: 'x2', confidence: 84, label: 'DOUBLE CHANCE - X2', description: 'draw-cover alternative' },
            { market: 'draw_no_bet_away', prediction: 'away', confidence: 82, label: 'DRAW NO BET - AWAY', description: 'draw-cover alternative' },
            { market: 'over_1_5', prediction: 'over', confidence: 80, label: 'OVER 1.5 GOALS', description: 'lower-variance alternative' },
            { market: 'under_4_5', prediction: 'under', confidence: 79, label: 'UNDER 4.5 GOALS', description: 'lower-variance alternative' }
        ];
    }
    if (normalized === 'draw') {
        return [
            { market: 'double_chance_1x', prediction: '1x', confidence: 83, label: 'DOUBLE CHANCE - 1X', description: 'draw-cover alternative' },
            { market: 'double_chance_x2', prediction: 'x2', confidence: 83, label: 'DOUBLE CHANCE - X2', description: 'draw-cover alternative' },
            { market: 'under_3_5', prediction: 'under', confidence: 80, label: 'UNDER 3.5 GOALS', description: 'lower-variance alternative' },
            { market: 'btts_no', prediction: 'no', confidence: 78, label: 'BTTS - NO', description: 'lower-variance alternative' }
        ];
    }
    return [
        { market: 'double_chance_1x', prediction: '1x', confidence: 84, label: 'DOUBLE CHANCE - 1X', description: 'draw-cover alternative' },
        { market: 'draw_no_bet_home', prediction: 'home', confidence: 82, label: 'DRAW NO BET - HOME', description: 'draw-cover alternative' },
        { market: 'over_1_5', prediction: 'over', confidence: 80, label: 'OVER 1.5 GOALS', description: 'lower-variance alternative' },
        { market: 'under_4_5', prediction: 'under', confidence: 79, label: 'UNDER 4.5 GOALS', description: 'lower-variance alternative' }
    ];
}

function normalizeSecondarySummaryItem(item) {
    if (!item || typeof item !== 'object') return null;
    const market = normalizeMarketKey(item.market || item.market_type || item.type || '');
    if (!market || !isDisplayFriendlySecondaryMarket(market)) return null;
    const prediction = normalizeSecondaryPredictionToken(market, item.prediction || item.recommendation || item.pick || item.selection || item.outcome);
    if (!prediction) return null;
    const confidence = normalizeConfidence(item.confidence ?? item.probability ?? item.score ?? 0);
    return {
        market,
        prediction,
        confidence,
        description: buildSecondaryMarketDescription(market, item.description || item.market_description || ''),
        label: humanizePredictionLabel(prediction, market)
    };
}

function ensureFourSecondaryMarketsForDirect(firstMatch, prediction, relatedSecondaryMarkets = []) {
    const metadata = firstMatch?.metadata && typeof firstMatch.metadata === 'object' ? firstMatch.metadata : {};
    const fromPrediction = Array.isArray(prediction?.secondary_insights) ? prediction.secondary_insights : [];
    const fromMetadata = Array.isArray(metadata?.secondary_markets) ? metadata.secondary_markets : [];
    const fromMarketIntel = Array.isArray(metadata?.market_intelligence?.secondary_insights)
        ? metadata.market_intelligence.secondary_insights
        : [];
    const base = dedupeSecondaryMarkets(
        [
            ...fromPrediction,
            ...fromMetadata,
            ...fromMarketIntel,
            ...relatedSecondaryMarkets
        ]
            .map(normalizeSecondarySummaryItem)
            .filter(Boolean)
            .filter((item) => isCompatibleSecondaryMarket(firstMatch, item))
    );

    const fallback = fallbackSecondaryMarketsForOutcome(resolvePrimaryOutcomeToken(firstMatch))
        .map(normalizeSecondarySummaryItem)
        .filter(Boolean)
        .filter((item) => isCompatibleSecondaryMarket(firstMatch, item));

    return dedupeSecondaryMarkets([...base, ...fallback]).slice(0, 4);
}

// FIX 1: CROSSOVER BUG - Hard bind signatures to team names so generic API IDs never collide
function getFixtureSignature(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const firstMatch = matches[0] || {};
    
    const matchId = String(firstMatch?.match_id || prediction?.match_id || '').trim();
    const home = normalizeTeamSignaturePart(resolveMatchTeamName(firstMatch, 'home') || extractTeamNameValue(prediction?.home_team));
    const away = normalizeTeamSignaturePart(resolveMatchTeamName(firstMatch, 'away') || extractTeamNameValue(prediction?.away_team));
    
    if (home && away && matchId) return `${matchId}_${home}_${away}`;
    if (home && away) return `no_id_${home}_${away}`;
    
    return matchId ? `id_only_${matchId}` : `unknown_${Math.random()}`;
}

function buildSecondaryMarketSummaryItem(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const firstMatch = matches[0] || {};
    return {
        market: firstMatch?.market || '',
        prediction: firstMatch?.prediction || '',
        confidence: normalizeConfidence(firstMatch?.confidence ?? prediction?.total_confidence ?? 0),
        description: buildSecondaryMarketDescription(firstMatch?.market, firstMatch?.metadata?.market_description || ''),
        label: humanizePredictionLabel(firstMatch?.prediction, firstMatch?.market)
    };
}

function buildSameMatchBuilder(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    return matches.slice(0, 6).map((match, index) => ({
        index: index + 1,
        market: humanizeToken(match?.market || ''),
        prediction: humanizePredictionLabel(match?.prediction, match?.market),
        confidence: normalizeConfidence(match?.confidence || 0)
    }));
}

function buildFallbackReasoning(prediction, relatedSecondaryMarkets = []) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const firstMatch = matches[0] || {};
    const leagueCountry = resolveLeagueCountryForMatch(firstMatch, prediction);
    const homeTeam = resolveMatchTeamName(firstMatch, 'home') || 'Home Team';
    const awayTeam = resolveMatchTeamName(firstMatch, 'away') || 'Away Team';
    const leagueLabel = [leagueCountry.country, leagueCountry.league].filter(Boolean).join(' • ')
        || humanizeToken(firstMatch?.sport || '');
    const outcome = humanizePredictionLabel(firstMatch?.prediction, firstMatch?.market);
    const confidence = normalizeConfidence(firstMatch?.confidence ?? prediction?.total_confidence ?? 0);
    const backupSummary = relatedSecondaryMarkets
        .slice(0, 3)
        .map((market) => `${market.label} (${market.confidence}%)`)
        .join(', ');

    if (backupSummary) {
        return `${homeTeam} vs ${awayTeam} leans ${outcome} at ${confidence}% confidence in ${leagueLabel}. Secondary coverage currently favours ${backupSummary}.`;
    }

    return `${homeTeam} vs ${awayTeam} leans ${outcome} at ${confidence}% confidence in ${leagueLabel}.`;
}

function buildFallbackPipelineData(prediction, relatedSecondaryMarkets = []) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const firstMatch = matches[0] || {};
    const leagueCountry = resolveLeagueCountryForMatch(firstMatch, prediction);
    const homeTeam = resolveMatchTeamName(firstMatch, 'home') || 'Home Team';
    const awayTeam = resolveMatchTeamName(firstMatch, 'away') || 'Away Team';
    const competition = [leagueCountry.country, leagueCountry.league].filter(Boolean).join(' • ')
        || humanizeToken(firstMatch?.sport || '');
    const outcome = humanizePredictionLabel(firstMatch?.prediction, firstMatch?.market);
    const confidence = normalizeConfidence(firstMatch?.confidence ?? prediction?.total_confidence ?? 0);
    const volatility = humanizeToken(firstMatch?.volatility || prediction?.risk_level || 'medium');
    const backupSummary = relatedSecondaryMarkets
        .slice(0, 3)
        .map((market) => market.label)
        .join(', ');
    const fallbackCoverage = backupSummary || 'draw-cover and lower-variance alternatives are attached on this direct card';

    return {
        elite_6_stage: {
            stage_1_collection: `${competition} market inputs collected for ${homeTeam} vs ${awayTeam}.`,
            stage_2_baseline: `${outcome} is the leading baseline edge at ${confidence}% confidence.`,
            stage_3_context: `Related secondary coverage is available: ${fallbackCoverage}.`,
            stage_4_reality: `${volatility} volatility profile on the published market set.`,
            stage_5_decision: `Primary market retained as ${outcome}.`,
            stage_6_final: `Final published edge remains ${outcome}.`
        },
        core_4_stage: {
            stage_1_baseline: `${outcome} is the leading baseline edge at ${confidence}% confidence.`,
            stage_2_context: `Secondary coverage is available: ${fallbackCoverage}.`,
            stage_3_reality: `${volatility} volatility profile on the published market set.`,
            stage_4_final: `Final published edge remains ${outcome}.`
        }
    };
}

function attachRelatedPredictionArtifacts(predictions) {
    const secondaryBySig = new Map();
    const sameMatchBySig = new Map();

    for (const prediction of predictions) {
        const sig = getFixtureSignature(prediction);
        if (!sig || sig.startsWith('unknown_')) continue; 

        const sectionType = inferSectionType(prediction);
        if (sectionType === 'secondary') {
            if (!secondaryBySig.has(sig)) {
                secondaryBySig.set(sig, []);
            }
            secondaryBySig.get(sig).push(buildSecondaryMarketSummaryItem(prediction));
        } else if (sectionType === 'same_match') {
            sameMatchBySig.set(sig, buildSameMatchBuilder(prediction));
        }
    }

    return predictions.map((prediction) => {
        const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
        if (!matches.length) return prediction;

        const sectionType = inferSectionType(prediction);
        const sig = getFixtureSignature(prediction);
        const firstMatch = matches[0] || {};
        const remainingMatches = matches.slice(1);
        
        const relatedSecondaryMarkets = dedupeSecondaryMarkets(
            (secondaryBySig.get(sig) || [])
                .filter((market) => isCompatibleSecondaryMarket(firstMatch, market))
                .filter((market) => isDisplayFriendlySecondaryMarket(market.market))
        ).slice(0, 4);
        
        const relatedSameMatchBuilder = sameMatchBySig.get(sig) || [];
        const metadata = {
            ...(firstMatch?.metadata || {})
        };

        if (sectionType === 'direct') {
            metadata.secondary_markets = ensureFourSecondaryMarketsForDirect(firstMatch, prediction, relatedSecondaryMarkets);
            if (!Array.isArray(metadata.same_match_builder) || metadata.same_match_builder.length === 0) {
                metadata.same_match_builder = relatedSameMatchBuilder;
            }
        }

        if (!String(metadata.reasoning || '').trim()) {
            metadata.reasoning = buildFallbackReasoning(prediction, relatedSecondaryMarkets);
        }

        if (!metadata.pipeline_data || typeof metadata.pipeline_data !== 'object') {
            metadata.pipeline_data = buildFallbackPipelineData(prediction, relatedSecondaryMarkets);
        }

        return {
            ...prediction,
            matches: [
                {
                    ...firstMatch,
                    metadata
                },
                ...remainingMatches
            ]
        };
    });
}

function normalizeConfidence(confidence) {
    if (typeof confidence !== 'number' || Number.isNaN(confidence)) return 0;
    return Math.max(0, Math.min(100, Math.round(confidence)));
}

function toConfidencePercent(value, fallback = 0) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    const normalized = n > 0 && n <= 1 ? n * 100 : n;
    return Math.max(0, Math.min(100, normalized));
}

function roundConfidence(value) {
    if (!Number.isFinite(Number(value))) return 0;
    return Math.round(Number(value) * 100) / 100;
}

function computeAverageLegConfidence(matches = []) {
    const values = (Array.isArray(matches) ? matches : [])
        .map((match) => Number(match?.confidence))
        .filter((value) => Number.isFinite(value));
    if (!values.length) return 0;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return roundConfidence(Math.max(0, Math.min(100, avg)));
}

function resolveAverageLegConfidence(prediction) {
    const explicit = Number(prediction?.average_leg_confidence);
    if (Number.isFinite(explicit)) {
        return roundConfidence(Math.max(0, Math.min(100, explicit)));
    }

    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    if (matches.length > 0) {
        const fromMetadata = Number(matches[0]?.metadata?.average_leg_confidence);
        if (Number.isFinite(fromMetadata)) {
            return roundConfidence(Math.max(0, Math.min(100, fromMetadata)));
        }
    }

    return computeAverageLegConfidence(matches);
}

function getPredictionConfidencePercent(prediction) {
    const fromTotal = toConfidencePercent(prediction?.total_confidence, NaN);
    if (Number.isFinite(fromTotal) && fromTotal > 0) return roundConfidence(fromTotal);

    const fromFinal = toConfidencePercent(
        prediction?.final_recommendation?.confidence
        ?? prediction?.matches?.[0]?.final_recommendation?.confidence,
        NaN
    );
    if (Number.isFinite(fromFinal) && fromFinal > 0) return roundConfidence(fromFinal);

    const fromFirstMatch = toConfidencePercent(prediction?.matches?.[0]?.confidence, NaN);
    if (Number.isFinite(fromFirstMatch) && fromFirstMatch > 0) return roundConfidence(fromFirstMatch);

    const fromAverage = toConfidencePercent(resolveAverageLegConfidence(prediction), NaN);
    if (Number.isFinite(fromAverage)) return roundConfidence(fromAverage);

    return 0;
}

function planRequiresEliteConfidenceFloor(planId, planCapabilities) {
    const tier = String(planCapabilities?.tier || '').trim().toLowerCase();
    if (tier === 'elite') return true;

    const key = String(planId || '').trim().toLowerCase();
    if (!key) return false;
    return key.includes('elite') || key.includes('vip') || key.includes('deep');
}

function normalizeOdds(odds) {
    if (typeof odds !== 'number' || Number.isNaN(odds)) return null;
    return Math.max(1.01, Math.round(odds * 100) / 100);
}

function enrichMatchMetadata(match, prediction) {
    const sectionType = inferSectionType(prediction);
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const legCount = matches.length;

    // Use the standardized card descriptor for proper labeling
    const defaultTicketLabel = getCardDescriptor(legCount);
    const rawOutcome = String(prediction?.prediction || prediction?.label || '').trim();

    // Replace UNKNOWN or empty labels with the proper card descriptor
    const fallbackOutcome = !rawOutcome || rawOutcome.toUpperCase() === 'UNKNOWN' || rawOutcome.toUpperCase() === 'UNKNOWN PREDICTION'
        ? defaultTicketLabel
        : rawOutcome.toUpperCase();
    const fallbackReasoning = String(prediction?.reasoning || prediction?.model_reasoning || '').trim();
    const contextInsights = buildContextInsightsFromMetadata(match?.metadata?.context_intelligence || null);
    const routerMeta = match?.metadata?.market_router || {};
    const engineLog = Array.isArray(routerMeta.engine_log) ? routerMeta.engine_log : [];
    const matchConfidence = normalizeConfidence(match?.confidence ?? prediction?.total_confidence ?? 0);
    const finalRecommendation = routerMeta?.final_recommendation || {
        market: humanizePredictionLabel(match?.prediction, match?.market),
        confidence: matchConfidence
    };
    const leagueCountry = resolveLeagueCountryForMatch(match, prediction);
    const metadata = match?.metadata && typeof match.metadata === 'object' ? match.metadata : {};
    const leagueName = leagueCountry.league || null;
    const countryName = leagueCountry.country || null;
    const enrichedMetadata = {
        ...metadata,
        league: leagueName || metadata.league || metadata.competition || null,
        competition: leagueName || metadata.competition || metadata.league || null,
        country: countryName || metadata.country || metadata.league_country || null,
        league_country: countryName || metadata.league_country || metadata.country || null
    };
    const insights = routerMeta?.insights || {
        weather: contextInsights?.chips?.weather || 'Unavailable',
        availability: contextInsights?.chips?.injuries_bans || 'No major absences',
        stability: contextInsights?.chips?.stability || 'Unknown'
    };

    return {
        ...match,
        league: leagueName,
        country: countryName,
        metadata: enrichedMetadata,
        context_insights: contextInsights,
        final_recommendation: finalRecommendation,
        engine_log: engineLog,
        insights,
        prediction_details: {
            outcome: fallbackOutcome,
            reasoning: fallbackReasoning,
            card_label: defaultTicketLabel,
        }
    };
}

function parseMatchKickoff(match) {
    const value =
        match?.commence_time ||
        match?.match_date ||
        match?.metadata?.match_time ||
        match?.metadata?.kickoff ||
        match?.metadata?.kickoff_time ||
        null;

    if (!value) return null;
    return parseLooseDateTime(value);
}

function isAccumulatorLikePrediction(prediction) {
    const sectionType = inferSectionType(prediction);
    return sectionType.includes('acca') || sectionType === 'multi';
}

function computePredictionKickoffStats(prediction, now = new Date()) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const kickoffs = matches.map(parseMatchKickoff).filter(Boolean);
    const nowMs = now.getTime();
    const graceCutoffMs = nowMs - (UPCOMING_GRACE_MINUTES * 60 * 1000);
    const accaLookbackCutoffMs = nowMs - (ACCA_STARTED_LOOKBACK_HOURS * 60 * 60 * 1000);
    const createdAt = new Date(prediction?.created_at || 0);
    const createdAtMs = Number.isNaN(createdAt.getTime()) ? null : createdAt.getTime();
    const isAccumulator = isAccumulatorLikePrediction(prediction);

    const kickoffMs = kickoffs.map((kickoff) => kickoff.getTime());
    const latestKickoffMs = kickoffMs.length ? Math.max(...kickoffMs) : null;
    const earliestKickoffMs = kickoffMs.length ? Math.min(...kickoffMs) : null;
    const hasUpcomingOrGrace = kickoffMs.some((value) => value >= graceCutoffMs);
    const allUpcomingOrGrace = kickoffMs.length > 0 && kickoffMs.every((value) => value >= graceCutoffMs);
    const recentlyPublished = createdAtMs !== null && createdAtMs >= accaLookbackCutoffMs;

    return {
        hasKickoffs: kickoffMs.length > 0,
        isAccumulator,
        latestKickoffMs,
        earliestKickoffMs,
        hasUpcomingOrGrace,
        allUpcomingOrGrace,
        recentlyPublished,
        graceCutoffMs,
        accaLookbackCutoffMs
    };
}

function getMatchTimingState(kickoff, now = new Date()) {
    if (!kickoff) return { state: 'unknown', label: 'Unknown' };
    const nowMs = now.getTime();
    const kickoffMs = kickoff.getTime();
    const graceCutoffMs = nowMs - (UPCOMING_GRACE_MINUTES * 60 * 1000);
    const accaLookbackCutoffMs = nowMs - (ACCA_STARTED_LOOKBACK_HOURS * 60 * 60 * 1000);

    if (kickoffMs >= nowMs) return { state: 'upcoming', label: 'Upcoming' };
    if (kickoffMs >= graceCutoffMs) return { state: 'live_locked', label: 'Live/Locked' };
    if (kickoffMs >= accaLookbackCutoffMs) return { state: 'started_locked', label: 'Started/Locked' };
    return { state: 'stale', label: 'Stale' };
}

function decoratePredictionWithTiming(prediction, now = new Date()) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    if (!matches.length) return prediction;

    const enrichedMatches = matches.map((match) => {
        const kickoff = parseMatchKickoff(match);
        const timing = getMatchTimingState(kickoff, now);
        const metadata = match?.metadata && typeof match.metadata === 'object' ? match.metadata : {};
        return {
            ...match,
            match_state: timing.state,
            match_state_label: timing.label,
            metadata: {
                ...metadata,
                match_state: timing.state,
                match_state_label: timing.label
            }
        };
    });

    const states = new Set(enrichedMatches.map((match) => String(match.match_state || '').toLowerCase()));
    const predictionState = states.has('upcoming')
        ? 'upcoming'
        : (states.has('live_locked') || states.has('started_locked'))
            ? 'live_locked'
            : states.has('stale')
                ? 'stale'
                : 'unknown';

    return {
        ...prediction,
        prediction_state: predictionState,
        prediction_state_label: predictionState === 'live_locked'
            ? 'Live/Locked'
            : predictionState === 'upcoming'
                ? 'Upcoming'
                : predictionState === 'stale'
                    ? 'Stale'
                    : 'Unknown',
        timing_policy: {
            upcoming_grace_minutes: UPCOMING_GRACE_MINUTES,
            acca_started_lookback_hours: ACCA_STARTED_LOOKBACK_HOURS
        },
        matches: enrichedMatches
    };
}

// FIX 2: OLD DATES BUG - Eject unparseable dates instead of blindly allowing them
function predictionMatchesWindow(prediction, windowStart, windowEnd) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    if (matches.length === 0) return false;

    let kickoffs = matches.map(parseMatchKickoff).filter(Boolean);

    if (kickoffs.length === 0) {
        // Fallback to record creation time if match date is completely missing
        const fallbackDate = new Date(prediction.created_at);
        if (isNaN(fallbackDate.getTime())) return false; // Strictly drop records with no valid timeframe
        kickoffs = [fallbackDate];
    }

    if (isAccumulatorLikePrediction(prediction)) {
        const accaWindowStart = new Date(windowStart.getTime() - (ACCA_WINDOW_LOOKBACK_HOURS * 60 * 60 * 1000));
        const inKickoffRange = kickoffs.some((kickoff) => kickoff >= accaWindowStart && kickoff <= windowEnd);
        if (inKickoffRange) return true;
        const createdAt = new Date(prediction?.created_at || 0);
        return !Number.isNaN(createdAt.getTime());
    }

    const strictWindowPass = kickoffs.every((kickoff) => kickoff >= windowStart && kickoff <= windowEnd);
    if (strictWindowPass) return true;

    const createdAt = new Date(prediction?.created_at || 0);
    return !Number.isNaN(createdAt.getTime());
}

// IRON-CLAD DATE PATCH: reject any prediction whose kickoff is older than UPCOMING_GRACE_MINUTES.
// No recentlyPublished bypass — date lock is absolute.
function predictionIsNotStale(prediction, now = new Date()) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    if (matches.length === 0) return false;

    const kickoffStats = computePredictionKickoffStats(prediction, now);
    if (!kickoffStats.hasKickoffs) {
        // No parseable kickoff dates — reject outright (cannot verify timing).
        return false;
    }

    if (kickoffStats.isAccumulator) {
        // For ACCAs: at least the latest leg must be within the grace window.
        return kickoffStats.latestKickoffMs !== null && kickoffStats.latestKickoffMs >= kickoffStats.graceCutoffMs;
    }

    // Singles: the earliest (soonest) leg must still be within the grace window.
    return kickoffStats.earliestKickoffMs !== null && kickoffStats.earliestKickoffMs >= kickoffStats.graceCutoffMs;
}

// IRON-CLAD DATE PATCH: strictly enforce the grace window — no recentlyPublished bypass.
function predictionHasOnlyUpcomingKickoffs(prediction, now = new Date()) {
    const kickoffStats = computePredictionKickoffStats(prediction, now);
    if (!kickoffStats.hasKickoffs) return false;

    if (kickoffStats.isAccumulator) {
        // For ACCAs: at least one leg must still be within the grace window.
        return (
            kickoffStats.hasUpcomingOrGrace
            || (kickoffStats.latestKickoffMs !== null && kickoffStats.latestKickoffMs >= kickoffStats.graceCutoffMs)
        );
    }

    // Singles / secondary / same-match: ALL legs must be within the grace window.
    return kickoffStats.allUpcomingOrGrace;
}

function getPredictionPrimaryKickoff(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const kickoffs = matches
        .map((match) => parseMatchKickoff(match))
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime());

    return kickoffs[0] || null;
}

function comparePredictionsForDisplay(a, b, now = new Date()) {
    const kickoffA = getPredictionPrimaryKickoff(a);
    const kickoffB = getPredictionPrimaryKickoff(b);
    const upcomingA = kickoffA ? kickoffA >= now : false;
    const upcomingB = kickoffB ? kickoffB >= now : false;

    if (upcomingA !== upcomingB) {
        return upcomingA ? -1 : 1;
    }

    if (kickoffA && kickoffB) {
        if (upcomingA && upcomingB) {
            return kickoffA.getTime() - kickoffB.getTime();
        }
        return kickoffB.getTime() - kickoffA.getTime();
    }

    const createdA = new Date(a.created_at || 0).getTime();
    const createdB = new Date(b.created_at || 0).getTime();
    return createdB - createdA;
}

function isPlaceholderEdgeMindReport(value) {
    const text = String(value || '').trim();
    if (!text) return true;
    const lowered = text.toLowerCase();
    return EDGE_MIND_PLACEHOLDER_PATTERNS.some((pattern) => lowered.includes(pattern));
}

function buildDynamicEdgeMindAnalysis(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const firstMatch = matches[0] || {};
    const metadata = firstMatch?.metadata || {};
    const homeTeam = resolveMatchTeamName(firstMatch, 'home') || 'Home Team';
    const awayTeam = resolveMatchTeamName(firstMatch, 'away') || 'Away Team';
    const competition = String(
        metadata?.league
        || metadata?.competition
        || firstMatch?.league
        || humanizeToken(firstMatch?.sport || prediction?.sport || 'fixture')
    ).trim();
    const market = humanizePredictionLabel(firstMatch?.prediction, firstMatch?.market || firstMatch?.market_type);
    const confidence = normalizeConfidence(
        firstMatch?.confidence
        ?? prediction?.total_confidence
        ?? prediction?.final_recommendation?.confidence
        ?? 0
    );
    return `${homeTeam} vs ${awayTeam} (${competition || 'Live Fixture'}): ${market} projects at ${confidence}% confidence after form, availability, and market-structure checks.`;
}

function resolveEdgeMindAnalysis(prediction) {
    const candidates = [
        prediction?.edgeMindAnalysis,
        prediction?.edgemind_report,
        prediction?.prediction_details?.reasoning,
        prediction?.matches?.[0]?.metadata?.reasoning
    ];

    for (const candidate of candidates) {
        const text = String(candidate || '').trim();
        if (!text) continue;
        if (!isPlaceholderEdgeMindReport(text)) return text;
    }

    return buildDynamicEdgeMindAnalysis(prediction);
}

function resolveReasoningForDisplay(prediction, fallbackReasoning) {
    const text = String(fallbackReasoning || '').trim();
    if (text && !isPlaceholderEdgeMindReport(text)) return text;
    return resolveEdgeMindAnalysis(prediction);
}

function enrichPredictionDetails(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const firstMatch = matches[0] || {};
    const firstMetadata = firstMatch?.metadata || {};
    const matchDetails = firstMatch?.prediction_details || {};
    const sectionType = inferSectionType(prediction);

    const fallbackOutcome =
        matchDetails.outcome ||
        firstMatch?.prediction ||
        prediction?.prediction ||
        sectionType ||
        prediction?.type ||
        '';
    const defaultTicketLabel = sectionType === 'mega_acca_12'
        ? '12 MATCH MEGA ACCA'
        : sectionType === 'acca_6match'
            ? '6 MATCH ACCA'
            : 'PREDICTION';
    const resolvedOutcome = String(fallbackOutcome || '').trim();
    const finalOutcome = !resolvedOutcome || resolvedOutcome.toUpperCase() === 'UNKNOWN'
        ? defaultTicketLabel
        : resolvedOutcome;

    const fallbackReasoning =
        matchDetails.reasoning ||
        firstMetadata.reasoning ||
        firstMetadata.model_reasoning ||
        prediction?.reasoning ||
        prediction?.model_reasoning ||
        '';
    const contextInsights = firstMatch?.context_insights || buildContextInsightsFromMetadata(firstMetadata?.context_intelligence || null);
    const engineLog = Array.isArray(firstMatch?.engine_log)
        ? firstMatch.engine_log
        : (Array.isArray(firstMetadata?.market_router?.engine_log) ? firstMetadata.market_router.engine_log : []);
    const finalRecommendation = firstMatch?.final_recommendation || firstMetadata?.market_router?.final_recommendation || {
        market: humanizePredictionLabel(firstMatch?.prediction, firstMatch?.market),
        confidence: normalizeConfidence(firstMatch?.confidence ?? prediction?.total_confidence ?? 0)
    };
    const insights = firstMatch?.insights || firstMetadata?.market_router?.insights || {
        weather: contextInsights?.chips?.weather || 'Unavailable',
        availability: contextInsights?.chips?.injuries_bans || 'No major absences',
        stability: contextInsights?.chips?.stability || 'Unknown'
    };
    const edgeMindAnalysis = resolveEdgeMindAnalysis(prediction);
    const resolvedReasoning = resolveReasoningForDisplay(prediction, fallbackReasoning);

    return {
        ...prediction,
        section_type: sectionType,
        ticket_label: defaultTicketLabel,
        average_leg_confidence: resolveAverageLegConfidence(prediction),
        context_insights: contextInsights,
        final_recommendation: finalRecommendation,
        edgeMindAnalysis,
        edgemind_report: String(prediction?.edgemind_report || '').trim() || edgeMindAnalysis,
        engine_log: engineLog,
        insights,
        prediction_details: {
            ...(prediction?.prediction_details || {}),
            outcome: finalOutcome,
            reasoning: resolvedReasoning,
            context_status: contextInsights?.status || 'unavailable'
        }
    };
}

// FIX 3: ACCA WIPE BUG - Include team names so dedupe doesn't destroy un-ID'd accumulators
function buildPredictionSignature(prediction) {
    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    const legs = matches.map((match) => {
        const h = normalizeTeamSignaturePart(resolveMatchTeamName(match, 'home'));
        const a = normalizeTeamSignaturePart(resolveMatchTeamName(match, 'away'));
        return `${h}_${a}_${normalizeMarketKey(match?.market)}_${String(match?.prediction || '').trim().toLowerCase()}`;
    }).join('|');

    return [
        String(prediction?.tier || '').trim().toLowerCase(),
        inferSectionType(prediction),
        legs
    ].join('::');
}

function dedupePredictions(predictions) {
    const seen = new Set();
    const out = [];

    for (const prediction of predictions) {
        const signature = buildPredictionSignature(prediction);
        if (!signature || seen.has(signature)) continue;
        seen.add(signature);
        out.push(prediction);
    }

    return out;
}

function filterConflictingSecondaryPredictions(predictions) {
    const directBySig = new Map();

    for (const prediction of predictions) {
        if (inferSectionType(prediction) !== 'direct') continue;
        const sig = getFixtureSignature(prediction);
        const firstMatch = Array.isArray(prediction?.matches) ? prediction.matches[0] : null;
        if (!sig || !firstMatch) continue;
        directBySig.set(sig, firstMatch);
    }

    return predictions.filter((prediction) => {
        if (inferSectionType(prediction) !== 'secondary') return true;
        const sig = getFixtureSignature(prediction);
        const firstMatch = Array.isArray(prediction?.matches) ? prediction.matches[0] : null;
        const directMatch = directBySig.get(sig);
        if (!sig || !firstMatch || !directMatch) return true;
        return isCompatibleSecondaryMarket(directMatch, firstMatch);
    });
}

function toConflictCheckLeg(match) {
    const marketKey = normalizeMarketKey(match?.market);
    const predictionKey = String(match?.prediction || '').trim().toLowerCase();
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

function sanitizeSameMatchMatchesForDisplay(matches) {
    const out = [];

    for (const match of matches) {
        const prospective = [...out, match]
            .map(toConflictCheckLeg)
            .filter(Boolean);

        if (prospective.length > 0 && !isValidCombination(prospective)) {
            continue;
        }

        out.push(match);
    }

    return out;
}

function buildDisplayFixtureKey(match) {
    const matchId = String(match?.match_id || match?.metadata?.match_id || '').trim();
    if (matchId) return `id:${matchId}`;

    const home = normalizeTeamSignaturePart(resolveMatchTeamName(match, 'home'));
    const away = normalizeTeamSignaturePart(resolveMatchTeamName(match, 'away'));
    const kickoff = String(
        match?.commence_time
        || match?.match_date
        || match?.metadata?.match_time
        || match?.metadata?.kickoff
        || match?.metadata?.kickoff_time
        || ''
    ).trim();
    if (home || away || kickoff) return `fallback:${home}:${away}:${kickoff}`;

    const market = normalizeMarketKey(match?.market || match?.market_type || '');
    const prediction = String(match?.prediction || match?.recommendation || '').trim().toLowerCase();
    return `fallback:${home}:${away}:${kickoff}:${market}:${prediction}`;
}

function sanitizeAccumulatorMatchesForDisplay(matches, minimumLegs = 2) {
    const out = [];
    const seen = new Set();

    for (const match of (Array.isArray(matches) ? matches : [])) {
        const key = buildDisplayFixtureKey(match);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(match);
    }

    if (out.length === 0) return Array.isArray(matches) ? matches : [];
    if (out.length < minimumLegs) return out;
    return out;
}

function sanitizePredictionForDisplay(prediction) {
    const sectionType = inferSectionType(prediction);

    if (sectionType === 'same_match') {
        const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
        const sanitizedMatches = sanitizeSameMatchMatchesForDisplay(matches);
        if (!sanitizedMatches.length) return prediction;

        return {
            ...prediction,
            matches: sanitizedMatches
        };
    }

    const matches = Array.isArray(prediction?.matches) ? prediction.matches : [];
    if (sectionType === 'multi' || sectionType === 'acca_6match' || sectionType === 'mega_acca_12' || sectionType.includes('acca')) {
        const minLegs = sectionType === 'mega_acca_12' ? 8 : sectionType === 'acca_6match' || sectionType.includes('acca') ? 4 : 2;
        const sanitizedMatches = sanitizeAccumulatorMatchesForDisplay(matches, minLegs);
        return {
            ...prediction,
            matches: sanitizedMatches
        };
    }

    return prediction;
}

async function getLatestRelevantPublishRunId(requestedSport) {
    const sportKey = normalizePredictionSportKey(requestedSport || '');

    if (!sportKey) {
        const latestRunRes = await query(
            `
            SELECT id
            FROM prediction_publish_runs
            WHERE status = 'completed'
              AND (
                requested_sports IS NULL
                OR cardinality(requested_sports) = 0
                OR 'all' = ANY(requested_sports)
              )
            ORDER BY id DESC
            LIMIT 1
            `
        );
        return latestRunRes.rows[0]?.id || null;
    }

    const latestRunRes = await query(
        `
        SELECT id
        FROM prediction_publish_runs
        WHERE status = 'completed'
          AND (
            requested_sports IS NULL
            OR cardinality(requested_sports) = 0
            OR 'all' = ANY(requested_sports)
            OR $1 = ANY(requested_sports)
          )
        ORDER BY
          CASE
            WHEN requested_sports IS NOT NULL AND $1 = ANY(requested_sports) THEN 0
            WHEN requested_sports IS NULL OR cardinality(requested_sports) = 0 OR 'all' = ANY(requested_sports) THEN 1
            ELSE 2
          END,
          id DESC
        LIMIT 1
        `,
        [sportKey]
    );
    return latestRunRes.rows[0]?.id || null;
}

async function getLatestPublishRunIdFromFinalTable() {
    const fallbackRunRes = await query(
        `
        SELECT publish_run_id
        FROM direct1x2_prediction_final pf
        WHERE publish_run_id IS NOT NULL
          AND pf.home_team IS NOT NULL
          AND pf.away_team IS NOT NULL
          AND LOWER(pf.home_team) NOT IN ('unknown', 'unknown home', 'unknown away', 'home team', 'away team', 'tbd', 'n/a')
          AND LOWER(pf.away_team) NOT IN ('unknown', 'unknown home', 'unknown away', 'home team', 'away team', 'tbd', 'n/a')
          AND LOWER(COALESCE(pf.sport, 'football')) <> 'unknown'
        ORDER BY publish_run_id DESC, created_at DESC
        LIMIT 1
        `
    );

    return fallbackRunRes.rows[0]?.publish_run_id || null;
}

async function loadReadPathDbCounts(now = new Date()) {
    try {
        const res = await query(
            `
            WITH raw_kickoff AS (
                SELECT
                    r.id AS raw_id,
                    COALESCE(
                        CASE
                            WHEN COALESCE(r.metadata->>'match_time', '') ~ '^\\d{4}-\\d{2}-\\d{2}'
                                THEN (r.metadata->>'match_time')::timestamptz
                            ELSE NULL
                        END,
                        CASE
                            WHEN COALESCE(r.metadata->>'kickoff', '') ~ '^\\d{4}-\\d{2}-\\d{2}'
                                THEN (r.metadata->>'kickoff')::timestamptz
                            ELSE NULL
                        END,
                        CASE
                            WHEN COALESCE(r.metadata->>'kickoff_time', '') ~ '^\\d{4}-\\d{2}-\\d{2}'
                                THEN (r.metadata->>'kickoff_time')::timestamptz
                            ELSE NULL
                        END
                    ) AS kickoff_utc
                FROM predictions_raw r
            )
            SELECT
                (SELECT COUNT(*)::int FROM predictions_raw) AS predictions_raw_count,
                (SELECT COUNT(*)::int FROM predictions_filtered WHERE is_valid = true) AS predictions_filtered_valid_count,
                (
                    SELECT COUNT(*)::int
                    FROM predictions_filtered f
                    JOIN raw_kickoff rk ON rk.raw_id = f.raw_id
                    WHERE f.is_valid = true
                      AND rk.kickoff_utc > $1::timestamptz
                ) AS predictions_filtered_future_count,
                (SELECT COUNT(*)::int FROM direct1x2_prediction_final) AS predictions_final_count
            `,
            [now.toISOString()]
        );

        return res.rows[0] || {
            predictions_raw_count: 0,
            predictions_filtered_valid_count: 0,
            predictions_filtered_future_count: 0,
            predictions_final_count: 0
        };
    } catch (err) {
        console.warn('[predictions] failed to load read-path DB counts:', err.message);
        return {
            predictions_raw_count: null,
            predictions_filtered_valid_count: null,
            predictions_filtered_future_count: null,
            predictions_final_count: null
        };
    }
}

function resolveQueryTiers(planCapabilities, includeAll = false) {
    const tiers = (Array.isArray(planCapabilities?.tiers) ? planCapabilities.tiers : [])
        .map((tier) => normalizeTierLabel(tier));

    // Availability fallback: when elite/deep inventory is thin, allow normal/core
    // inventory to prevent near-empty payloads for paid users.
    if (!includeAll && String(planCapabilities?.tier || '').toLowerCase() === 'elite') {
        tiers.push('normal', 'core');
    }

    return Array.from(new Set(tiers));
}

// Helper: Check if a plan is in the visibility array
function planVisibilityCheck(planId, visibilityArray) {
    if (!planId) return false;
    if (!Array.isArray(visibilityArray) || visibilityArray.length === 0) return false;
    
    // Direct match
    if (visibilityArray.includes(planId)) return true;
    
    // Check tier-based access
    const normalizedPlan = normalizePlanId(planId);
    if (!normalizedPlan) return false;
    
    // Elite plans see everything
    if (normalizedPlan.includes('elite') || normalizedPlan.includes('deep')) {
        return true; // Elite sees all predictions
    }
    
    // Core plans: check if visibility allows core plans
    if (normalizedPlan.includes('core') || normalizedPlan.includes('normal')) {
        return visibilityArray.some(v => 
            v.includes('core') || v.includes('normal') || v.includes('4day') || v.includes('9day') || v.includes('14day') || v.includes('30day')
        );
    }
    
    // Admin bypass - admins can see everything
    if (normalizedPlan.includes('admin')) return true;
    
    return false;
}

// Helper: Filter predictions by visibility based on user's plan
function filterByVisibility(predictions, planId, isAdmin = false) {
    if (isAdmin || !planId || planId.includes('admin')) {
        return predictions; // Admin sees everything
    }
    
    return predictions.filter(pred => {
        const visibility = pred.plan_visibility;
        
        // No visibility set means visible to all (legacy data)
        if (!visibility || !Array.isArray(visibility) || visibility.length === 0) {
            return true;
        }
        
        // Check if user's plan is in visibility
        return planVisibilityCheck(planId, visibility);
    });
}


function planRank(planId) {
    const normalized = normalizePlanId(planId);
    if (!normalized) return 0;
    const plan = getPlan(normalized);
    if (!plan) return 0;

    let tierWeight = 0;
    if (normalized.includes('deep_vip') || normalized === 'vip_30day') {
        tierWeight = 3;
    } else if (plan.tier === 'elite') {
        tierWeight = 2;
    } else if (plan.tier === 'core') {
        tierWeight = 1;
    }
    return (tierWeight * 1000) + Number(plan.days || 0);
}

function resolveBestKnownPlanId(user) {
    const fromSubscriptions = (Array.isArray(user?.subscription_plan_ids) ? user.subscription_plan_ids : [])
        .map((planId) => normalizePlanId(planId))
        .filter(Boolean)
        .sort((a, b) => planRank(b) - planRank(a));

    if (fromSubscriptions.length > 0) return fromSubscriptions[0];

    const fromProfile = normalizePlanId(user?.plan_id);
    if (fromProfile) return fromProfile;

    const highestAccess = resolveHighestAccessTier(user);
    if (highestAccess === 'vip') return 'elite_30day_deep_vip';
    if (highestAccess === 'elite') return 'elite_14day_deep_pro';
    return 'core_30day_limitless';
}

function resolveRequestedPlanId(req) {
    const fromQuery = String(req.query?.plan_id || '').trim();
    const requested = normalizePlanId(fromQuery);
    if (requested) return requested;
    return resolveBestKnownPlanId(req.user);
}

function canUserAccessPlan(user, requestedPlanId) {
    if (!user || !requestedPlanId) return false;
    if (user.is_admin === true || user.isAdmin === true) return true;

    const requestedPlan = getPlan(requestedPlanId);
    if (!requestedPlan) return false;

    const access = new Set(
        (Array.isArray(user?.access_tiers) ? user.access_tiers : [])
            .map(normalizeAccessTokenToTier)
            .filter(Boolean)
    );

    if (!access.size) {
        const fallbackPlan = normalizePlanId(user?.plan_id);
        const fallbackPlanMeta = fallbackPlan ? getPlan(fallbackPlan) : null;
        if (fallbackPlanMeta) {
            if (fallbackPlan.includes('deep_vip') || fallbackPlan === 'vip_30day') {
                access.add('vip');
            } else {
                access.add(fallbackPlanMeta.tier === 'elite' ? 'elite' : 'core');
            }
        }
    }

    if (!access.size) {
        access.add('core');
    }

    if (requestedPlanId.includes('deep_vip') || requestedPlanId === 'vip_30day') {
        return access.has('vip');
    }
    if (requestedPlan.tier === 'elite') {
        return access.has('elite') || access.has('vip');
    }
    return access.has('core') || access.has('elite') || access.has('vip');
}

const DEFAULT_PREDICTIONS_SOURCE = config.USE_RELATIONAL_TABLES ? 'direct1x2_prediction_final_unified' : 'direct1x2_prediction_final';

function sendPredictionsSuccess(res, payload = {}, statusCode = 200) {
    const predictions = Array.isArray(payload?.predictions) ? payload.predictions : [];
    const count = Number.isFinite(payload?.count) ? payload.count : predictions.length;
    const sport = String(payload?.sport || ACTIVE_DEPLOYMENT_SPORT || 'football');
    const source = String(payload?.source || DEFAULT_PREDICTIONS_SOURCE);
    const systemHealth = attachSystemHealth(res);

    return res.status(statusCode).json({
        ...payload,
        ok: true,
        sport,
        source,
        count,
        predictions,
        system_health: systemHealth
    });
}

function sendPredictionsError(res, statusCode, errorMessage, payload = {}) {
    const sport = String(payload?.sport || ACTIVE_DEPLOYMENT_SPORT || 'football');
    const source = String(payload?.source || DEFAULT_PREDICTIONS_SOURCE);
    const systemHealth = attachSystemHealth(res);

    return res.status(statusCode).json({
        ...payload,
        ok: false,
        sport,
        source,
        predictions: [],
        count: 0,
        error: String(errorMessage || 'Request failed'),
        system_health: systemHealth
    });
}

// GET /api/predictions
// Default tier = deep (elite pool); subscription limits use /api/user/predictions
router.get('/', requirePredictionsUser, requireActiveSubscription, async (req, res) => {
    try {
        // DIAGNOSTIC: Log user info
        console.log('[DIAG] req.user:', JSON.stringify({
            id: req.user?.id,
            email: req.user?.email,
            subscription_plan_ids: req.user?.subscription_plan_ids,
            access_tiers: req.user?.access_tiers
        }));

        const isAdminUser =
            req.user?.is_admin === true
            || req.user?.isAdmin === true;

        let planId = resolveRequestedPlanId(req);
        if (!planId) {
            return sendPredictionsError(res, 400, 'Invalid plan ID');
        }
        if (!canUserAccessPlan(req.user, planId)) {
            const fallbackPlanId = resolveBestKnownPlanId(req.user);
            if (!fallbackPlanId || !canUserAccessPlan(req.user, fallbackPlanId)) {
                return sendPredictionsError(res, 403, 'Plan access denied for user');
            }
            planId = fallbackPlanId;
        }

        const requestedSport = req.query.sport;
        let sport = ACTIVE_DEPLOYMENT_SPORT;
        if (requestedSport) {
            const normalizedSport = normalizePredictionSportKey(requestedSport);
            if (normalizedSport && normalizedSport !== 'unknown') {
                sport = normalizedSport;
            }
        }
        const isAdminAudit = isAdminUser;
        const subscriptionViewTier = resolveRequestedSubscriptionViewTier(req, req.user);
        if (!canAccessSubscriptionViewTier(req.user, subscriptionViewTier)) {
            return sendPredictionsError(res, 403, 'Tier tab access denied for user');
        }

        const includeAllRequested = ['1', 'true'].includes(String(req.query.include_all || '').trim().toLowerCase());
        // Require explicit include_all request; do not auto-enable full-history mode for admins.
        const includeAll = includeAllRequested && (isAdminAudit || req.user?.is_test_user === true);
        const sportFilterValues = getSportFilterValues(sport);
        const strictSportFilterValue = getStrictSportFilterValue(sport);
        
        let historyWindowDays = Number(req.query.history_days);
        if (isNaN(historyWindowDays)) {
            // Default: strict 24 hour history window to block old matches (e.g. 5 days old)
            historyWindowDays = 1; 
        } else {
            historyWindowDays = Math.max(0, Math.min(14, historyWindowDays));
        }
        
        const futureWindowDays = Math.max(1, Math.min(14, Number(req.query.window_days) || 7));

        console.log(
            `[PREDICTIONS] Request for Plan: ${planId}, Sport: ${sport || 'all'}, include_all=${includeAll ? '1' : '0'}, ` +
            `view_tier=${subscriptionViewTier}, admin_audit=${isAdminAudit ? '1' : '0'}`
        );

        // Get plan capabilities from subscription matrix
        const planCapabilities = getPlanCapabilities(planId);
        if (!planCapabilities) {
            return sendPredictionsError(res, 400, 'Invalid plan ID');
        }
        const queryTiers = resolveQueryTiers(planCapabilities, includeAll);

        const now = new Date();
        const readPathDbCounts = await loadReadPathDbCounts(now);
        let latestPublishRunId = null;
        let publishRunSource = includeAll ? 'include_all_bypass' : 'completed_publish_run';
        if (!includeAll) {
            latestPublishRunId = await getLatestRelevantPublishRunId(sport);
            if (!latestPublishRunId) {
                latestPublishRunId = await getLatestPublishRunIdFromFinalTable();
                if (latestPublishRunId) {
                    publishRunSource = 'predictions_final_fallback';
                    console.warn('[predictions] No completed publish run found; using latest direct1x2_prediction_final publish_run_id:', latestPublishRunId);
                }
            }
        }
        let predictions = [];
        try {
            // include_all bypass: return wide historical set for UI stress testing.
            // But still filter by sport when sport parameter is provided.
            let queryStr = '';
            let queryParams = [];
            if (includeAll) {
                // Even in include_all mode, respect sport filtering when specified
                if (strictSportFilterValue) {
                    queryStr = `
                        SELECT DISTINCT ON (pf.id) pf.id, pf.publish_run_id, pf.tier, pf.type, pf.matches, pf.total_confidence, pf.risk_level, pf.risk_tier, pf.prediction, pf.created_at,
                               pf.plan_visibility, pf.sport, pf.market_type, pf.recommendation, pf.expires_at,
                               pf.edgemind_report, pf.secondary_insights
                        FROM direct1x2_prediction_final pf
                        WHERE LOWER(COALESCE(pf.sport, '')) = LOWER($1)
                          AND ${PREDICTION_ROW_QUALITY_SQL}
                        ORDER BY pf.id, pf.created_at DESC
                        LIMIT 2500;
                    `;
                    // Sport column is included in SELECT for frontend filtering
                    queryParams = [strictSportFilterValue];
                } else {
                    // No sport filter - return all
                    queryStr = `
                        SELECT DISTINCT ON (pf.id) pf.id, pf.publish_run_id, pf.tier, pf.type, pf.matches, pf.total_confidence, pf.risk_level, pf.risk_tier, pf.prediction, pf.created_at,
                               pf.plan_visibility, pf.sport, pf.market_type, pf.recommendation, pf.expires_at,
                               pf.edgemind_report, pf.secondary_insights
                        FROM direct1x2_prediction_final pf
                        WHERE ${PREDICTION_ROW_QUALITY_SQL}
                        ORDER BY pf.id, pf.created_at DESC
                        LIMIT 2500;
                    `;
                }
            } else {
                // Query ALL predictions with matching tier (don't restrict by publish_run_id).
                // The date windowing and subscription filtering below handles what the user sees.
                queryStr = `
                    SELECT DISTINCT ON (pf.id) pf.id, pf.publish_run_id, pf.tier, pf.type, pf.matches, pf.total_confidence, pf.risk_level, pf.risk_tier, pf.prediction, pf.created_at,
                           pf.plan_visibility, pf.sport, pf.market_type, pf.recommendation, pf.expires_at,
                           pf.edgemind_report, pf.secondary_insights
                    FROM direct1x2_prediction_final pf
                    WHERE LOWER(COALESCE(pf.tier, 'normal')) = ANY($1::text[])
                      AND LOWER(COALESCE(pf.sport, '')) = LOWER($2)
                      AND ${PREDICTION_ROW_QUALITY_SQL}
                    ORDER BY pf.id, pf.created_at DESC
                    LIMIT 2000;
                `;
                queryParams = [queryTiers, strictSportFilterValue];
            }

            const dbRes = await query(queryStr, queryParams);
            predictions = filterByVisibility(dbRes.rows || [], planId, isAdminAudit);
        } catch (dbErr) {
            console.error('[predictions] primary DB query failed, falling back to Supabase:', dbErr.message);
        }

        // Enforce strict fixture-level deduplication using JavaScript Map
        // Keep only the latest prediction per fixture based on created_at
        const originalLength = predictions.length;
        const fixtureMap = new Map();
        for (const prediction of predictions) {
            const matches = Array.isArray(prediction.matches) ? prediction.matches : [];
            if (matches.length === 0) continue;

            const firstMatch = matches[0];
            const fixtureId = firstMatch.fixture_id || firstMatch.match_id || firstMatch.id || `${firstMatch.home_team}_${firstMatch.away_team}_${firstMatch.commence_time || firstMatch.match_date}`;

            const existing = fixtureMap.get(fixtureId);
            if (!existing || new Date(prediction.created_at) > new Date(existing.created_at)) {
                fixtureMap.set(fixtureId, prediction);
            }
        }
        predictions = Array.from(fixtureMap.values());
        console.log('[predictions] Fixture-level deduplication:', `before=${originalLength}, after=${predictions.length}`);

        // PHASE 3: Fetch watchlist items from predictions_filtered table
        let watchlistItems = [];
        try {
            const sportFilterValues = getSportFilterValues(sport);
            if (sportFilterValues.length > 0) {
                const sportPlaceholders = sportFilterValues.map((_, i) => `$${i + 2}`).join(', ');
                const watchlistQuery = `
                    SELECT pr.*, pf.is_watchlist, pf.reject_reason
                    FROM predictions_filtered pf
                    JOIN predictions_raw pr ON pf.raw_id = pr.id
                    WHERE pf.is_watchlist = true
                      AND LOWER(COALESCE(pf.tier, 'normal')) = ANY($1::text[])
                      AND LOWER(COALESCE(pr.metadata->>'sport', 'football')) IN (${sportPlaceholders})
                    ORDER BY pr.created_at DESC
                    LIMIT 50;
                `;
                const watchlistParams = [queryTiers, ...sportFilterValues.map(s => s.toLowerCase())];
                const watchlistRes = await query(watchlistQuery, watchlistParams);
                watchlistItems = watchlistRes.rows || [];
                console.log('[predictions] Fetched watchlist items:', watchlistItems.length);
            }
        } catch (watchlistErr) {
            console.warn('[predictions] Failed to fetch watchlist items:', watchlistErr.message);
        }

        // If DB returned no predictions, attempt Supabase fallback (useful when Supabase is the source)
        try {
            if ((!predictions || predictions.length === 0) && config.supabase && config.supabase.url && config.supabase.anonKey) {
                console.log('[predictions] DB empty - attempting Supabase fallback');
                const sb = createClient(config.supabase.url, config.supabase.anonKey);
                const strictSportFilterValue = getStrictSportFilterValue(sport);

                if (includeAll) {
                    let query = sb
                        .from('direct1x2_prediction_final')
                        .select('*')
                        .gt('match_date', new Date().toISOString())
                        .order('created_at', { ascending: false })
                        .limit(2500);

                    // Apply sport filter even in includeAll mode
                    if (strictSportFilterValue) {
                        query = query.ilike('sport', strictSportFilterValue);
                    }

                    const { data, error } = await query;

                    if (!error && Array.isArray(data) && data.length > 0) {
                        const qualityRows = data.filter(isPredictionIdentityValid);
                        predictions = filterByVisibility(qualityRows, planId, includeAll);
                    } else if (error) {
                        console.warn('[predictions] Supabase include_all fallback error:', error.message || error);
                    }
                } else {
                    const { data: runs, error: runsError } = await sb
                        .from('prediction_publish_runs')
                        .select('id, requested_sports')
                        .eq('status', 'completed')
                        .order('id', { ascending: false })
                        .limit(50);

                    const latestSupabaseRun = !runsError && Array.isArray(runs)
                        ? runs.find((row) => {
                            const requested = Array.isArray(row.requested_sports) ? row.requested_sports.map(normalizePredictionSportKey) : [];
                            if (!sport) return requested.length === 0 || requested.includes('all');
                            return requested.length === 0 || requested.includes('all') || requested.includes(normalizePredictionSportKey(sport));
                        })
                        : null;

                    const { data, error } = latestSupabaseRun
                        ? await sb
                            .from('direct1x2_prediction_final')
                            .select('*')
                            .eq('publish_run_id', latestSupabaseRun.id)
                            .ilike('sport', strictSportFilterValue)
                            .gt('match_date', new Date().toISOString())
                            .order('created_at', { ascending: false })
                            .limit(2000)
                        : await sb
                            .from('direct1x2_prediction_final')
                            .select('*')
                            .ilike('sport', strictSportFilterValue)
                            .gt('match_date', new Date().toISOString())
                            .order('created_at', { ascending: false })
                            .limit(2000);

                    if (!latestSupabaseRun) {
                        console.warn('[predictions] Supabase has no completed publish run; using latest direct1x2_prediction_final rows');
                    }

                    if (!error && Array.isArray(data) && data.length > 0) {
                        const qualityRows = data.filter(isPredictionIdentityValid);
                        // Filter Supabase rows by plan capabilities.
                        const allowedTiers = new Set(queryTiers);
                        const filtered = qualityRows.filter((r) => {
                            try {
                                const rowTier = normalizeTierLabel(r.tier);
                                if (!allowedTiers.has(rowTier)) return false;
                                return true;
                            } catch (_e) {
                                return false;
                            }
                        });
                        predictions = filterByVisibility(filtered, planId, isAdminAudit);
                    } else if (error) {
                        console.warn('[predictions] Supabase fallback error:', error.message || error);
                    }
                }
            }
        } catch (fbErr) {
            console.warn('[predictions] Supabase fallback failed:', fbErr.message || fbErr);
        }

        const teamNames = extractTeamNames(predictions).map(n => n.toLowerCase());
        const teamInfoByName = new Map();

        if (teamNames.length > 0) {
            try {
                const teamRes = await query(
                    `
                    SELECT
                        t.id,
                        t.name,
                        NULL::text AS logo,
                        t.country AS country,
                        l.id AS league_id,
                        l.name AS league_name,
                        NULL::text AS league_country,
                        NULL::text AS league_season,
                        l.sport AS sport_id,
                        l.sport AS sport_slug,
                        INITCAP(l.sport) AS sport_name
                    FROM teams t
                    LEFT JOIN leagues l ON l.id = t.league_id
                    WHERE LOWER(t.name) = ANY($1::text[])
                    `,
                    [teamNames]
                );

                const teamIds = [];
                for (const row of teamRes.rows) {
                    teamIds.push(row.id);
                }

                const playersByTeam = new Map();
                if (teamIds.length > 0) {
                    const playersRes = await query(
                        `
                        SELECT id, team_id, full_name AS name, NULL::int AS age, NULL::int AS number, position, NULL::text AS photo
                        FROM players
                        WHERE team_id = ANY($1::int[])
                        ORDER BY team_id, name ASC
                        `,
                        [teamIds]
                    );
                    const grouped = buildPlayersByTeam(playersRes.rows);
                    for (const [teamId, players] of grouped.entries()) {
                        playersByTeam.set(teamId, players);
                    }
                }

                for (const row of teamRes.rows) {
                    teamInfoByName.set(String(row.name).toLowerCase(), {
                        id: row.id,
                        name: row.name,
                        logo: row.logo,
                        country: row.country,
                        league: {
                            id: row.league_id,
                            name: row.league_name,
                            country: row.league_country,
                            season: row.league_season
                        },
                        sport: {
                            id: row.sport_id,
                            slug: row.sport_slug,
                            name: row.sport_name
                        },
                        players: playersByTeam.get(row.id) || []
                    });
                }
            } catch (enrichErr) {
                console.warn('[predictions] enrichment skipped:', enrichErr.message);
            }
        }

        const enrichedPredictions = predictions.map((row) => {
            const matches = Array.isArray(row.matches) ? row.matches : [];
            const predictionSport = row.sport || 'unknown';
            const enrichedMatches = matches.map((m) => {
                const homeName = resolveMatchTeamName(m, 'home');
                const awayName = resolveMatchTeamName(m, 'away');
                const homeKey = homeName ? String(homeName).toLowerCase() : null;
                const awayKey = awayName ? String(awayName).toLowerCase() : null;
                return {
                    ...enrichMatchMetadata(m, row),
                    sport: predictionSport,
                    home_team: homeName || null,
                    away_team: awayName || null,
                    home_team_name: homeName || m?.home_team_name || m?.home_name || '',
                    away_team_name: awayName || m?.away_team_name || m?.away_name || '',
                    home_team_info: homeKey ? (teamInfoByName.get(homeKey) || null) : null,
                    away_team_info: awayKey ? (teamInfoByName.get(awayKey) || null) : null
                };
            });
            return {
                ...row,
                sport: predictionSport,
                matches: enrichedMatches
            };
        }).map(enrichPredictionDetails);
        const hydratedPredictions = attachRelatedPredictionArtifacts(
            enrichedPredictions.map(sanitizePredictionForDisplay)
        );

        const windowStart = new Date(now.getTime() - historyWindowDays * 24 * 60 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + futureWindowDays * 24 * 60 * 60 * 1000);

        const stageCounts = {
            source_rows: predictions.length,
            enriched_rows: enrichedPredictions.length,
            hydrated_rows: hydratedPredictions.length,
            sport_filtered_rows: 0,
            display_filtered_rows: 0,
            upcoming_gate_rows: 0,
            stale_gate_rows: 0,
            window_gate_rows: 0,
            scoped_rows: 0,
            plan_filtered_rows: 0,
            elite_floor_rows: 0,
            subscription_tier_filtered_rows: 0
        };

        const sportFilteredPredictions = hydratedPredictions.filter((prediction) => predictionMatchesSport(prediction, sportFilterValues));
        stageCounts.sport_filtered_rows = sportFilteredPredictions.length;

        const displayFilteredPredictions = sportFilteredPredictions.filter((prediction) => {
            const sectionType = inferSectionType(prediction);
            if (sectionType === 'secondary') {
                const firstMatch = Array.isArray(prediction?.matches) ? prediction.matches[0] : null;
                return isDisplayFriendlySecondaryMarket(firstMatch?.market);
            }
            if (sectionType === 'direct') {
                return getPredictionConfidencePercent(prediction) >= 30;
            }
            return true;
        });
        stageCounts.display_filtered_rows = displayFilteredPredictions.length;
        const directMarketCountsSnapshot = buildDirectMarketCountsSnapshot(displayFilteredPredictions);

        let upcomingGatePredictions = displayFilteredPredictions;
        let staleGatePredictions = displayFilteredPredictions;
        let windowGatePredictions = displayFilteredPredictions;

        if (!includeAll) {
            upcomingGatePredictions = displayFilteredPredictions.filter((prediction) => predictionHasOnlyUpcomingKickoffs(prediction, now));
            staleGatePredictions = upcomingGatePredictions.filter((prediction) => predictionIsNotStale(prediction, now));
            windowGatePredictions = staleGatePredictions.filter((prediction) => predictionMatchesWindow(prediction, windowStart, windowEnd));
        }

        stageCounts.upcoming_gate_rows = upcomingGatePredictions.length;
        stageCounts.stale_gate_rows = staleGatePredictions.length;
        stageCounts.window_gate_rows = windowGatePredictions.length;

        const scopedPredictions = (includeAll ? displayFilteredPredictions : windowGatePredictions).sort((a, b) => includeAll
            ? (new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
            : comparePredictionsForDisplay(a, b, now));
        stageCounts.scoped_rows = scopedPredictions.length;

        const scopedWithTiming = scopedPredictions.map((prediction) => decoratePredictionWithTiming(prediction, now));

        const planFilteredPredictions = (includeAll || isAdminAudit)
            ? scopedWithTiming.slice(0, 2500)
            : filterPredictionsForPlan(
                scopedWithTiming,
                planId,
                now,
                {
                    enforceUniqueAssetWindow: false,
                    subscriptionStart: req.user?.official_start_time || null
                }
            );
        stageCounts.plan_filtered_rows = planFilteredPredictions.length;

        // SKCS RULE UPDATE: Allow 0-100% 1X2 matches through to trigger UI warnings.
        const enforceEliteFloor = false; // Disabled by Admin
        const eliteFloorPredictions = enforceEliteFloor
            ? planFilteredPredictions.filter((prediction) => {
                const sectionType = inferSectionType(prediction);
                if (sectionType === 'direct') return true;
                return getPredictionConfidencePercent(prediction) >= ELITE_CONFIDENCE_FLOOR;
            })
            : planFilteredPredictions;
        stageCounts.elite_floor_rows = eliteFloorPredictions.length;

        const contractShapedPredictions = eliteFloorPredictions.map((p) => {
            const shaped = shapePredictionOutputContract(p);
            if (shaped.section === 'secondary') {
                const rawPred = String(shaped?.matches?.[0]?.prediction || shaped?.prediction || '').trim().toLowerCase();
                let mainPickToken = null;
                if (rawPred === '1' || rawPred.includes('home')) mainPickToken = '1';
                else if (rawPred === 'x' || rawPred.includes('draw')) mainPickToken = 'X';
                else if (rawPred === '2' || rawPred.includes('away')) mainPickToken = '2';

                const markets = Array.isArray(shaped?.matches) ? shaped.matches : [];
                if (mainPickToken) {
                    const verdict = validateSMBCLegs(markets, mainPickToken);
                    const out = { ...shaped, matches: verdict.legs };
                    if (isAdminAudit || includeAll) {
                        out.secondary_removed = verdict.removed;
                    }
                    return out;
                }
                return { ...shaped, matches: markets };
            }
            return shaped;
        });
        const subscriptionTierFilteredPredictions = (isAdminAudit || includeAll)
            ? contractShapedPredictions
            : contractShapedPredictions.filter((prediction) => isTierVisibleForView(prediction.tier, subscriptionViewTier));
        stageCounts.subscription_tier_filtered_rows = subscriptionTierFilteredPredictions.length;

        const predictionsWithWeather = await enrichWithWeather(subscriptionTierFilteredPredictions);
        const predictionsEnriched = await enrichWithAvailability(predictionsWithWeather);

        const megaAccaDailyAllocation = getMegaAccaDailyAllocation(planId, now, {
            subscriptionStart: req.user?.official_start_time || null,
            predictions: scopedWithTiming
        });
        const todayName = moment.tz('Africa/Johannesburg').format('dddd').toLowerCase();
        const dailyLimits = calculateDailyAllocations(planId, todayName);

        const dropCounts = {
            sport_filter_excluded: Math.max(0, stageCounts.hydrated_rows - stageCounts.sport_filtered_rows),
            display_filter_excluded: Math.max(0, stageCounts.sport_filtered_rows - stageCounts.display_filtered_rows),
            upcoming_gate_excluded: Math.max(0, stageCounts.display_filtered_rows - stageCounts.upcoming_gate_rows),
            stale_gate_excluded: Math.max(0, stageCounts.upcoming_gate_rows - stageCounts.stale_gate_rows),
            date_window_excluded: Math.max(0, stageCounts.stale_gate_rows - stageCounts.window_gate_rows),
            plan_filter_excluded: Math.max(0, stageCounts.scoped_rows - stageCounts.plan_filtered_rows),
            elite_floor_excluded: Math.max(0, stageCounts.plan_filtered_rows - stageCounts.elite_floor_rows),
            subscription_tier_excluded: Math.max(0, stageCounts.elite_floor_rows - stageCounts.subscription_tier_filtered_rows)
        };

        // Translation Layer: Group predictions into categories for frontend (smh-hub.js)
        const categories = {
            direct: [],
            analytical_insights: [],
            multi: [],
            same_match: [],
            acca_6match: [],
            mega_acca_12: [],
            watchlist: []
        };

        for (const prediction of predictionsEnriched) {
            const sectionType = inferSectionType(prediction);
            if (sectionType === 'direct') {
                categories.direct.push(prediction);
            } else if (sectionType === 'secondary') {
                categories.analytical_insights.push(prediction);
            } else if (sectionType === 'multi') {
                categories.multi.push(prediction);
            } else if (sectionType === 'same_match') {
                categories.same_match.push(prediction);
            } else if (sectionType === 'acca_6match') {
                categories.acca_6match.push(prediction);
            } else if (sectionType === 'mega_acca_12') {
                categories.mega_acca_12.push(prediction);
            }
        }

        // PHASE 3: Add watchlist items to categories
        for (const watchlistItem of watchlistItems) {
            const metadata = watchlistItem.metadata || {};
            const enrichedWatchlist = {
                id: watchlistItem.id,
                home_team: metadata.home_team || 'Unknown',
                away_team: metadata.away_team || 'Unknown',
                prediction: watchlistItem.prediction || 'Unknown',
                confidence: watchlistItem.confidence || 0,
                market: watchlistItem.market || 'Unknown',
                edgemind_report: watchlistItem.edgemind_report || 'Near miss - below publication threshold',
                reject_reason: watchlistItem.reject_reason || 'Near miss',
                is_watchlist: true,
                created_at: watchlistItem.created_at,
                match_date: metadata.match_time || metadata.kickoff || null
            };
            categories.watchlist.push(enrichedWatchlist);
        }

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        // Fetch pipeline metrics for frontend visibility
        const pipelineSnapshot = getLatestRunSnapshot();
        const sportKey = sport === 'Football' ? 'Football' : sport;
        const sportMetrics = pipelineSnapshot?.sports?.[sportKey] || null;

        const pipelineMetrics = (() => {
            if (!sportMetrics) {
                return {
                    ingested: 0,
                    analyzed: 0,
                    rejected_confidence: 0,
                    rejected_efficiency: 0,
                    rejected_other: 0,
                    rejected_total: 0,
                    pending_analysis: 0,
                    published: 0,
                    empty_reason: 'no_pipeline_snapshot'
                };
            }

            const ingested = Number(sportMetrics.stages.normalized_count) || 0;
            const analyzed = Number(sportMetrics.stages.market_scored_count) || 0;
            const published = Number(sportMetrics.stages.published_count) || 0;
            const rejectedConfidence = Number(sportMetrics.rejections.low_confidence) || 0;
            const rejectedEfficiency = Number(sportMetrics.rejections.validation_reject) || 0;
            const rejectedTotal = Object.values(sportMetrics.rejections || {}).reduce(
                (sum, value) => sum + (Number(value) || 0),
                0
            );
            const rejectedOther = Math.max(0, rejectedTotal - rejectedConfidence - rejectedEfficiency);
            const pendingAnalysis = Math.max(0, ingested - analyzed);

            let emptyReason = 'pipeline_incomplete';
            if (ingested === 0) {
                emptyReason = 'no_fixtures_in_window';
            } else if (analyzed === 0 && published === 0) {
                emptyReason = 'sync_complete_analysis_pending';
            } else if (published === 0 && rejectedTotal > 0) {
                emptyReason = 'reviewed_none_approved';
            }

            return {
                ingested,
                analyzed,
                rejected_confidence: rejectedConfidence,
                rejected_efficiency: rejectedEfficiency,
                rejected_other: rejectedOther,
                rejected_total: rejectedTotal,
                pending_analysis: pendingAnalysis,
                published,
                empty_reason: emptyReason
            };
        })();

        return sendPredictionsSuccess(res, {
            plan_id: planId,
            sport,
            source: DEFAULT_PREDICTIONS_SOURCE,
            publish_run_source: publishRunSource,
            include_all: includeAll,
            admin_audit: isAdminAudit,
            subscription_view_tier: subscriptionViewTier,
            user_access_tiers: Array.isArray(req.user?.access_tiers) ? req.user.access_tiers : [],
            day: todayName,
            history_days: historyWindowDays,
            window_days: futureWindowDays,
            daily_limits: dailyLimits,
            plan_meta: {
                id: planCapabilities.plan_id,
                name: planCapabilities.name,
                tier: planCapabilities.tier,
                duration_days: planCapabilities.duration_days,
                mega_acca_allocation: planCapabilities.capabilities?.mega_acca_allocation || 0,
                mega_acca_daily_allocation: megaAccaDailyAllocation,
                mega_acca_constraints: planCapabilities.capabilities?.mega_acca_constraints || null,
                mega_acca_policy: planCapabilities.capabilities?.mega_acca_policy || null
            },
            direct_market_counts: directMarketCountsSnapshot,
            read_path_diagnostics: {
                server_now_utc: now.toISOString(),
                server_now_sast: moment.tz(now, 'Africa/Johannesburg').format(),
                include_all: includeAll,
                gate_config: {
                    upcoming_grace_minutes: UPCOMING_GRACE_MINUTES,
                    acca_started_lookback_hours: ACCA_STARTED_LOOKBACK_HOURS,
                    acca_window_lookback_hours: ACCA_WINDOW_LOOKBACK_HOURS,
                    elite_confidence_floor: ELITE_CONFIDENCE_FLOOR,
                    elite_floor_enforced: enforceEliteFloor
                },
                db_counts: readPathDbCounts,
                stage_counts: stageCounts,
                drop_counts: dropCounts
            },
            pipeline_metrics: pipelineMetrics,
            count: predictionsEnriched.length,
            source_rows: predictionsEnriched.length,
            payload: { categories },
            predictions: predictionsEnriched
        }, 200);
    } catch (err) {
        console.error('[predictions] Route Error:', err);
        return sendPredictionsError(res, 500, 'Internal server error');
    }
});

// Deterministic rebuild endpoint (useful for scheduled jobs)
router.post('/rebuild', requireRole('admin'), async (_req, res) => {
    try {
        console.log('[predictions] Manual rebuild of final outputs requested...');
        const result = await executeOperation({
            operation: 'predictions.rebuild',
            caller: 'backend/routes/predictions.js',
            payload: { source: 'route_rebuild' },
            execute: async () => rebuildFinalOutputs()
        });
        if (result?.success === false) {
            return res.status(503).json({ error: result.reason || result.error || 'rebuild_blocked' });
        }
        res.status(200).json({ ok: true, message: 'Final outputs rebuilt successfully', data: result.result || result });
    } catch (err) {
        console.error('[predictions] rebuild error:', err);
        res.status(500).json({ error: 'Rebuild failed', details: err.message });
    }
});

// Clear ALL predictions data + caches from BOTH PostgreSQL AND Supabase
router.post('/clear-all', requireRole('admin'), async (_req, res) => {
    try {
        console.log('[predictions] Clearing ALL data from PostgreSQL and Supabase...');
        
        // Clear PostgreSQL
        await query(`DELETE FROM predictions_filtered`);
        await query(`DELETE FROM predictions_raw`);
        const finalResult = await query(`DELETE FROM direct1x2_prediction_final`);
        await query(`DELETE FROM prediction_publish_runs`);
        await query(`DELETE FROM rapidapi_cache`);
        await query(`DELETE FROM context_intelligence_cache`);
        await query(`DELETE FROM fixture_context_cache`);
        
        // Clear Supabase (if configured)
        let supabaseCleared = false;
        if (config.supabase && config.supabase.url && config.supabase.anonKey) {
            try {
                const sb = createClient(config.supabase.url, config.supabase.anonKey);
                await sb.from('predictions_filtered').delete().neq('id', 0);
                await sb.from('predictions_raw').delete().neq('id', 0);
                await sb.from('direct1x2_prediction_final').delete().neq('id', 0);
                await sb.from('prediction_publish_runs').delete().neq('id', 0);
                await sb.from('rapidapi_cache').delete().neq('cache_key', 'x');
                await sb.from('context_intelligence_cache').delete().neq('cache_key', 'x');
                await sb.from('fixture_context_cache').delete().neq('fixture_id', 'x');
                supabaseCleared = true;
                console.log('[predictions] Supabase tables cleared');
            } catch (sbErr) {
                console.warn('[predictions] Supabase clear failed:', sbErr.message);
            }
        }
        
        res.status(200).json({ 
            ok: true, 
            message: "All data cleared from PostgreSQL" + (supabaseCleared ? ' and Supabase' : '') + ". Now trigger /api/pipeline/sync to pull fresh April 14 data.",
            deleted_final: finalResult.rowCount,
            supabase_cleared: supabaseCleared
        });
    } catch (err) {
        console.error('[predictions] clear-all error:', err);
        res.status(500).json({ error: 'Clear failed', details: err.message });
    }
});

// Clear test data from raw and filtered tables
router.post('/clear-test', requireRole('admin'), async (_req, res) => {
    try {
        console.log('[predictions] Clearing test data...');
        // Delete test data from predictions_filtered first (foreign key constraint)
        await query(`DELETE FROM predictions_filtered WHERE raw_id IN (SELECT id FROM predictions_raw WHERE metadata->>'data_mode' = 'test')`);
        // Delete test data from predictions_raw
        const rawResult = await query(`DELETE FROM predictions_raw WHERE metadata->>'data_mode' = 'test'`);
        // Clear direct1x2_prediction_final (will be rebuilt)
        await query(`DELETE FROM direct1x2_prediction_final`);
        res.status(200).json({ 
            ok: true, 
            message: "Test data cleared. Run /rebuild to regenerate final outputs.",
            deleted_raw: rawResult.rowCount 
        });
    } catch (err) {
        console.error('[predictions] clear-test error:', err);
        res.status(500).json({ error: 'Clear failed', details: err.message });
    }
});

module.exports = router;
