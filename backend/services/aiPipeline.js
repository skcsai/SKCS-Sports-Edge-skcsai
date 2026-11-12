'use strict';

const { createClient } = require('@supabase/supabase-js');
const { query, withTransaction } = require('../db');
const { validateRawPredictionInput } = require('../utils/validation');
const { filterRawPrediction } = require('./filterEngine');
const { buildFinalForTier } = require('./accaBuilder');
const { getPredictionInputs } = require('./dataProvider');
const {
    receiveValidatedFip,
    PROOF_FIXTURE_MODE
} = require('./fipIntakeService');
const { scoreMatch } = require('./aiScoring');
const { buildMatchContext } = require('./normalizerService');
const {
    buildCandidateMarkets,
    selectDirectSecondarySameMatch,
    getStandardSecondaryMarkets
} = require('./marketIntelligence');
const { safeFetch, getInjuries, getH2H, getWeather, getTeamNewsContext } = require('./contextIngestionService');
const { evaluateDirect1x2 } = require('./direct1x2Engine');
const { extractRankData, buildPredictionFromRank } = require('./footballRankExtractor');
const { canUseFootballHighlights, fetchHeadToHeadFallback } = require('./footballHighlightsService');
const { buildH2HSignal, getH2HVolatilityAdjustment } = require('./footballH2HExtractor');
const { saveContextData } = require('./saveContextData');
const { saveDirectInsight } = require('./saveDirectInsights');
const pipelineLogger = require('../utils/pipelineLogger');
const enrichFixtureWithContext = require('../src/services/contextIntelligence/aiPipeline');
const adjustProbability = require('../src/services/contextIntelligence/adjustProbability');
const verificationController = require('../core/verificationController');
const semanticGuard = require('../semantic-layer/enforcementGuard');
const { resolveActiveDeploymentSports } = require('../config/activeSports');

let isRunning = false;
const ACTIVE_DEPLOYMENT_SPORTS = resolveActiveDeploymentSports();
const DIRECT_INSIGHTS_WRITE_SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const DIRECT_INSIGHTS_WRITE_SERVICE_ROLE_KEY = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
).trim();
const directInsightsWriteSupabase = DIRECT_INSIGHTS_WRITE_SUPABASE_URL && DIRECT_INSIGHTS_WRITE_SERVICE_ROLE_KEY
    ? createClient(DIRECT_INSIGHTS_WRITE_SUPABASE_URL, DIRECT_INSIGHTS_WRITE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
    : null;

function normalizeSport(sport) {
    if (typeof sport !== 'string' || sport.trim().length === 0) throw new Error('sport must be a non-empty string');
    const s = sport.trim().toLowerCase();
    const map = {
        football: 'Football', basketball: 'Basketball', tennis: 'Tennis', cricket: 'Cricket',
        esports: 'Esports', nfl: 'NFL', mlb: 'MLB', mma: 'MMA', f1: 'F1', golf: 'Golf',
        rugby: 'Rugby', boxing: 'Boxing', nhl: 'NHL', afl: 'AFL', volleyball: 'Volleyball',
        handball: 'Handball', darts: 'Darts'
    };
    return map[s] || (s.charAt(0).toUpperCase() + s.slice(1));
}

function normalizeSportForDeployment(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return 'unknown';

    const mapping = {
        soccer: 'Football',
        football: 'Football',
        nba: 'Basketball',
        basketball: 'Basketball',
        nfl: 'NFL',
        american_football: 'NFL',
        mlb: 'MLB',
        baseball: 'MLB',
        nhl: 'NHL',
        hockey: 'NHL',
        f1: 'F1',
        formula1: 'F1',
        mma: 'MMA',
        afl: 'AFL',
        volleyball: 'Volleyball',
        handball: 'Handball',
        golf: 'Golf',
        rugby: 'Rugby',
        boxing: 'Boxing',
        tennis: 'Tennis',
        cricket: 'Cricket',
        esports: 'Esports',
        darts: 'Darts'
    };

    if (key.startsWith('soccer_') || key.startsWith('football_')) return 'Football';
    if (key.startsWith('americanfootball_')) return 'NFL';
    if (key.startsWith('basketball_')) return 'Basketball';
    if (key.startsWith('icehockey_')) return 'NHL';
    if (key.startsWith('rugbyunion_')) return 'Rugby';

    const resolved = mapping[key];
    if (resolved) return resolved;

    return key.charAt(0).toUpperCase() + key.slice(1);
}

function isDeploymentSportEnabled(value) {
    return ACTIVE_DEPLOYMENT_SPORTS.has(normalizeSportForDeployment(value));
}

function normalizePrediction(prediction) {
    const value = String(prediction || '').trim().toLowerCase();
    if (!value) return null;

    const aliases = {
        home: 'home_win',
        away: 'away_win',
        home_win: 'home_win',
        away_win: 'away_win',
        draw: 'draw'
    };

    return aliases[value] || value;
}

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function isObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const D1_R1_REQUIRED_METADATA_FIELDS = [
    'fip_id',
    'fip_schema_version',
    'validation_hash',
    'validation_validated_at',
    'scout_run_id',
    'intake_id',
    'idempotency_key'
];

function buildGovernedFipProvenanceMetadata(item) {
    const metadata = isObject(item?.metadata) ? item.metadata : {};
    const sportsTruthOrigin = String(
        metadata.sports_truth_origin
        || item?.match_info?.sports_truth_origin
        || ''
    ).trim();

    if (sportsTruthOrigin !== 'SCOUT_FIP') {
        return {};
    }

    const missing = D1_R1_REQUIRED_METADATA_FIELDS.filter((field) => {
        const value = metadata[field];
        return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missing.length > 0) {
        const error = new Error(
            `EPI_D1_R1_PROVENANCE_INCOMPLETE: missing ${missing.join(', ')}`
        );
        error.code = 'EPI_D1_R1_PROVENANCE_INCOMPLETE';
        error.missing_fields = missing;
        throw error;
    }

    return {
        sports_truth_origin: 'SCOUT_FIP',
        fip_id: metadata.fip_id.trim(),
        fip_schema_version: metadata.fip_schema_version.trim(),
        validation_hash: metadata.validation_hash.trim(),
        validation_validated_at: metadata.validation_validated_at.trim(),
        scout_run_id: metadata.scout_run_id.trim(),
        intake_id: metadata.intake_id.trim(),
        idempotency_key: metadata.idempotency_key.trim()
    };
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function toProbability(confidencePercent) {
    const n = Number(confidencePercent);
    if (!Number.isFinite(n)) return 0.5;
    return clamp(n, 0, 100) / 100;
}

function toConfidencePercent(probability) {
    const n = Number(probability);
    if (!Number.isFinite(n)) return 50;
    return Math.round(clamp(n, 0, 1) * 10000) / 100;
}

function normalizeMarketKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
}

function normalizeRankPrimaryMarket(market) {
    const key = String(market || '').trim().toUpperCase();
    if (key === 'HOME_WIN') return 'home_win';
    if (key === 'DRAW') return 'draw';
    if (key === 'AWAY_WIN') return 'away_win';
    return null;
}

function normalizeRankSecondaryMarket(market) {
    const key = String(market || '').trim().toUpperCase();
    if (key === 'OVER_2.5') return 'over_2_5';
    if (key === 'OVER_1.5') return 'over_1_5';
    if (key === 'BTTS_YES') return 'btts_yes';
    return null;
}

function normalizeTeamIdValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return String(Math.floor(value));
    const text = String(value || '').trim();
    if (!/^\d+$/.test(text)) return null;
    return text;
}

function extractFootballHighlightsTeamIds(match) {
    const source = isObject(match) ? match : {};
    const homeCandidates = [
        { value: source?.homeTeam?.id, field: 'homeTeam.id' },
        { value: source?.home_team_id, field: 'home_team_id' },
        { value: source?.homeTeamId, field: 'homeTeamId' },
        { value: source?.home?.id, field: 'home.id' },
        { value: source?.teams?.home?.id, field: 'teams.home.id' },
        { value: source?.match_info?.home_team_id, field: 'match_info.home_team_id' },
        { value: source?.raw?.homeTeam?.id, field: 'raw.homeTeam.id' },
        { value: source?.raw_provider_data?.homeTeam?.id, field: 'raw_provider_data.homeTeam.id' }
    ];
    const awayCandidates = [
        { value: source?.awayTeam?.id, field: 'awayTeam.id' },
        { value: source?.away_team_id, field: 'away_team_id' },
        { value: source?.awayTeamId, field: 'awayTeamId' },
        { value: source?.away?.id, field: 'away.id' },
        { value: source?.teams?.away?.id, field: 'teams.away.id' },
        { value: source?.match_info?.away_team_id, field: 'match_info.away_team_id' },
        { value: source?.raw?.awayTeam?.id, field: 'raw.awayTeam.id' },
        { value: source?.raw_provider_data?.awayTeam?.id, field: 'raw_provider_data.awayTeam.id' }
    ];

    let homeTeamId = null;
    let homeField = null;
    for (const candidate of homeCandidates) {
        const id = normalizeTeamIdValue(candidate.value);
        if (id) {
            homeTeamId = id;
            homeField = candidate.field;
            break;
        }
    }

    let awayTeamId = null;
    let awayField = null;
    for (const candidate of awayCandidates) {
        const id = normalizeTeamIdValue(candidate.value);
        if (id) {
            awayTeamId = id;
            awayField = candidate.field;
            break;
        }
    }

    return {
        homeTeamId,
        awayTeamId,
        sourceField: homeField && awayField ? `${homeField}|${awayField}` : null
    };
}

async function applyFootballH2HEnrichment(
    {
        sport,
        fixtureId,
        candidatePrediction,
        candidateConfidence,
        match,
        currentVolatilityScore
    },
    deps = {}
) {
    const fetchFn = deps.fetchHeadToHeadFallback || fetchHeadToHeadFallback;
    const buildSignalFn = deps.buildH2HSignal || buildH2HSignal;
    const canUseFn = deps.canUseFootballHighlights || canUseFootballHighlights;
    const volatilityAdjustFn = deps.getH2HVolatilityAdjustment || getH2HVolatilityAdjustment;

    const metadata = {
        h2h_enrichment_source: 'football_highlights',
        h2h_enrichment_endpoint: 'head-2-head',
        h2h_match_count: null,
        h2h_edge_label: null,
        h2h_draw_rate: null,
        h2h_btts_rate: null,
        h2h_over_1_5_rate: null,
        h2h_over_2_5_rate: null,
        h2h_volatility_hint: null,
        h2h_confidence_adjustment: 0,
        h2h_notes: []
    };

    const safeFixtureId = String(fixtureId || 'unknown_fixture');
    const normalizedSport = normalizeSportForDeployment(sport);
    if (normalizedSport !== 'Football') {
        const reason = 'non_football_sport';
        console.log(`[H2H] skipped: match=${safeFixtureId} reason=${reason}`);
        return {
            confidence: candidateConfidence,
            metadata: {
                ...metadata,
                h2h_enrichment_status: 'skipped',
                h2h_enrichment_reason: reason
            }
        };
    }

    if (!String(candidatePrediction || '').trim()) {
        const reason = 'missing_candidate_prediction';
        console.log(`[H2H] skipped: match=${safeFixtureId} reason=${reason}`);
        return {
            confidence: candidateConfidence,
            metadata: {
                ...metadata,
                h2h_enrichment_status: 'skipped',
                h2h_enrichment_reason: reason
            }
        };
    }

    const confidence = Number(candidateConfidence);
    if (!Number.isFinite(confidence) || confidence < 65 || confidence > 78) {
        const reason = 'confidence_outside_h2h_window';
        console.log(`[H2H] skipped: match=${safeFixtureId} reason=${reason}`);
        return {
            confidence: candidateConfidence,
            metadata: {
                ...metadata,
                h2h_enrichment_status: 'skipped',
                h2h_enrichment_reason: reason
            }
        };
    }

    const ids = extractFootballHighlightsTeamIds(match);
    if (!ids.homeTeamId || !ids.awayTeamId) {
        const reason = 'missing_team_id';
        console.log(`[H2H] skipped: match=${safeFixtureId} reason=${reason}`);
        return {
            confidence: candidateConfidence,
            metadata: {
                ...metadata,
                h2h_enrichment_status: 'skipped',
                h2h_enrichment_reason: reason
            }
        };
    }

    if (!canUseFn()) {
        const reason = 'daily_budget_reached';
        console.log(`[H2H] skipped: match=${safeFixtureId} reason=${reason}`);
        return {
            confidence: candidateConfidence,
            metadata: {
                ...metadata,
                h2h_enrichment_status: 'skipped',
                h2h_enrichment_reason: reason
            }
        };
    }

    const result = await fetchFn(ids.homeTeamId, ids.awayTeamId);
    if (!result?.ok || !result?.data) {
        const reason = String(result?.reason || 'request_failed').trim() || 'request_failed';
        const status = result?.skipped ? 'skipped' : 'failed';
        const logLabel = status === 'failed' ? 'failed' : 'skipped';
        console.log(`[H2H] ${logLabel}: match=${safeFixtureId} reason=${reason}`);
        return {
            confidence: candidateConfidence,
            metadata: {
                ...metadata,
                h2h_enrichment_status: status,
                h2h_enrichment_reason: reason
            }
        };
    }

    const signal = buildSignalFn(result.data);
    const adjustment = clamp(Math.round(Number(signal?.confidence_adjustment) || 0), -4, 4);
    const adjustedConfidence = clamp(Math.round(confidence + adjustment), 55, 92);

    const nextMetadata = {
        ...metadata,
        h2h_enrichment_status: 'applied',
        h2h_match_count: Number(signal?.match_count) || Number(result?.data?.match_count) || 0,
        h2h_edge_label: signal?.h2h_edge_label || result?.data?.summary?.h2h_edge_label || null,
        h2h_draw_rate: Number.isFinite(Number(signal?.draw_rate)) ? Number(signal.draw_rate) : null,
        h2h_btts_rate: Number.isFinite(Number(signal?.btts_rate)) ? Number(signal.btts_rate) : null,
        h2h_over_1_5_rate: Number.isFinite(Number(signal?.over_1_5_rate)) ? Number(signal.over_1_5_rate) : null,
        h2h_over_2_5_rate: Number.isFinite(Number(signal?.over_2_5_rate)) ? Number(signal.over_2_5_rate) : null,
        h2h_volatility_hint: signal?.volatility_hint || null,
        h2h_confidence_adjustment: adjustment,
        h2h_notes: Array.isArray(signal?.notes) ? signal.notes : [],
        h2h_team_id_source: ids.sourceField || null
    };

    if (String(signal?.volatility_hint || '').trim().toUpperCase() === 'HIGH') {
        const existingVolatility = Number(currentVolatilityScore);
        if (Number.isFinite(existingVolatility)) {
            const volAdj = clamp(Math.round(Number(volatilityAdjustFn(signal)) || 0), -10, 15);
            if (volAdj > 0) {
                nextMetadata.volatility_score = clamp(
                    Math.max(existingVolatility, existingVolatility + volAdj),
                    0,
                    100
                );
            } else {
                nextMetadata.volatility_score = existingVolatility;
            }
        } else {
            nextMetadata.h2h_volatility_warning = 'high_h2h_volatility';
        }
    }

    console.log(`[H2H] applied: match=${safeFixtureId} adjustment=${adjustment} volatility=${signal?.volatility_hint || 'MEDIUM'}`);
    return {
        confidence: adjustedConfidence,
        metadata: nextMetadata
    };
}

function defaultPredictionForMarket(market) {
    const key = normalizeMarketKey(market);
    if (key === 'home_win' || key === 'away_win' || key === 'draw') return key;
    if (key.startsWith('over_')) return 'over';
    if (key.startsWith('under_')) return 'under';
    if (key === 'btts_yes') return 'yes';
    if (key === 'btts_no') return 'no';
    return key || 'home_win';
}

function isPrimaryMatchOutcomeMarket(value) {
    const key = normalizeMarketKey(value);
    return key === 'home_win'
        || key === 'away_win'
        || key === 'draw'
        || key === '1x2'
        || key === 'match_winner'
        || key === 'match_result';
}

function riskLevelFromConfidence(confidence) {
    const n = Number(confidence);
    if (!Number.isFinite(n)) return 'extreme_risk';
    if (n >= 75) return 'low_risk';
    if (n >= 55) return 'medium_risk';
    if (n >= 30) return 'high_risk';
    return 'extreme_risk';
}

function transparencyFlagsForRiskLevel(riskLevel) {
    if (riskLevel === 'extreme_risk') {
        return {
            warning_banner: 'EXTREME RISK: Primary match outcome is below the 30% direct-display threshold.',
            action_advice: 'Avoid treating this as a safe direct insight. Review Safe Haven alternatives below.'
        };
    }
    if (riskLevel === 'high_risk') {
        return {
            warning_banner: 'HIGH RISK: 30–54 confidence band.',
            action_advice: 'Use the draw-cover alternative and lower-variance alternatives below.'
        };
    }
    if (riskLevel === 'medium_risk') {
        return {
            warning_banner: 'MEDIUM RISK: 55–74 confidence band.',
            action_advice: 'Use lower-variance alternatives below and avoid treating this as a safe direct insight.'
        };
    }
    return {
        warning_banner: 'LOW RISK: 75+ confidence band.',
        action_advice: 'Still review the 4 lower-variance alternatives below.'
    };
}

function normalizeCandidateConfidencePercent(candidate) {
    const confidence = Number(candidate?.confidence);
    if (Number.isFinite(confidence)) {
        if (confidence <= 1) {
            return Math.round(clamp(confidence, 0, 1) * 10000) / 100;
        }
        return Math.round(clamp(confidence, 0, 100) * 100) / 100;
    }
    const probability = Number(candidate?.probability);
    if (!Number.isFinite(probability)) return null;
    if (probability <= 1) {
        return Math.round(clamp(probability, 0, 1) * 10000) / 100;
    }
    return Math.round(clamp(probability, 0, 100) * 100) / 100;
}

const SECONDARY_PIVOT_MARKETS = Object.freeze(new Set([
    'over_0_5',
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

function isAllowedSecondaryPivotMarket(marketKey) {
    const key = normalizeMarketKey(marketKey);
    if (!key) return false;
    // AI-DISABLED: Strict rules explicitly allow 'over_0_5' in Goals Totals
    // if (key === 'over_0_5' || key === 'under_0_5') return false;
    if (key === 'under_0_5') return false;
    if (key.includes('red_cards')) return false;
    if (SECONDARY_PIVOT_MARKETS.has(key)) return true;

    if (/^corners_(over|under)_(6|7|8|9|10|11|12)_5$/.test(key)) return true;
    if (/^yellow_cards_(over|under)_(1|2|3|4|5|6)_5$/.test(key)) return true;
    if (/^cards_(over|under)_(1|2|3|4|5|6)_5$/.test(key)) return true;

    return false;
}

function buildSecondaryInsights(candidates, selectedMarket) {
    const selectedKey = normalizeMarketKey(selectedMarket);
    const deduped = new Map();
    const minSecondaryConfidence = 75;

    ensureArray(candidates)
        .map((candidate) => {
            const confidence = normalizeCandidateConfidencePercent(candidate);
            return {
                market: normalizeMarketKey(candidate?.market),
                prediction: candidate?.prediction || null,
                confidence,
                probability: Number.isFinite(Number(candidate?.probability))
                    ? Number(candidate.probability)
                    : (Number.isFinite(confidence) ? confidence / 100 : null),
                category: candidate?.category || null,
                priority_tier: candidate?.priority_tier || null
            };
        })
        .filter((candidate) => {
            if (!candidate.market) return false;
            if (candidate.market === selectedKey) return false;
            if (!isAllowedSecondaryPivotMarket(candidate.market)) return false;
            return Number.isFinite(candidate.confidence) && candidate.confidence >= minSecondaryConfidence;
        })
        .forEach((candidate) => {
            const existing = deduped.get(candidate.market);
            if (!existing || Number(candidate.confidence || 0) > Number(existing.confidence || 0)) {
                deduped.set(candidate.market, candidate);
            }
        });

    return Array.from(deduped.values())
        .sort((a, b) => {
            const confidenceDiff = Number(b.confidence || 0) - Number(a.confidence || 0);
            if (confidenceDiff !== 0) return confidenceDiff;
            return Number(a.priority_tier || 99) - Number(b.priority_tier || 99);
        })
        .slice(0, 4);
}

function normalizeSecondaryPredictionToken(market, prediction) {
    const key = normalizeMarketKey(market);
    const value = String(prediction || '').trim().toLowerCase();
    if (value) return value;
    if (key.startsWith('double_chance_')) return key.replace('double_chance_', '');
    if (key === 'draw_no_bet_home') return 'home';
    if (key === 'draw_no_bet_away') return 'away';
    if (key.startsWith('over_')) return 'over';
    if (key.startsWith('under_')) return 'under';
    if (key === 'btts_yes') return 'yes';
    if (key === 'btts_no') return 'no';
    return '';
}

function secondaryFallbackDefaultsForOutcome(_primaryOutcome, _fallbackConfidence = 78) {
    // SOCCER-GATE-001: fallback changes market preference; it never fabricates
    // a market or confidence. Real secondary candidates must be independently scored.
    return [];
}

function buildMandatorySecondaryInsights({
    candidates,
    selectedMarket,
    primaryOutcome,
    primaryConfidence,
    ruleOf4
}) {
    const selectedKey = normalizeMarketKey(selectedMarket);
    const picked = [];
    const seen = new Set();
    const pushUnique = (item, sourceLabel) => {
        if (!item || typeof item !== 'object') return;
        const market = normalizeMarketKey(item.market);
        if (!market) return;
        if (market === selectedKey) return;
        if (!isAllowedSecondaryPivotMarket(market)) return;

        const prediction = normalizeSecondaryPredictionToken(market, item.prediction);
        const confidence = normalizeCandidateConfidencePercent(item);
        const probability = Number(item.probability);
        const key = `${market}:${prediction}`;
        // Customer-visible secondary markets require their own real scored probability
        // and confidence. A primary confidence must never be copied into another market.
        if (!prediction || seen.has(key) || !Number.isFinite(confidence) || !Number.isFinite(probability)) return;
        seen.add(key);
        picked.push({
            market,
            prediction,
            confidence,
            probability,
            category: item.category || null,
            priority_tier: item.priority_tier || null,
            source: sourceLabel
        });
    };

    buildSecondaryInsights(candidates, selectedMarket).forEach((item) => pushUnique(item, 'ranked'));
    // Legacy rule-of-4/default fallbacks are intentionally not customer publication
    // sources unless they carry an independently scored probability (pushUnique enforces this).
    ensureArray(ruleOf4).forEach((item) => pushUnique(item, 'governed_rule_of_4'));

    return picked
        .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))
        .slice(0, 4);
}

function directConfidenceTierWarning(confidence) {
    const score = Number(confidence);
    if (!Number.isFinite(score)) return 'UNKNOWN';
    if (score >= 75) return 'LOW_RISK';
    if (score >= 55) return 'MEDIUM_RISK';
    if (score >= 30) return 'HIGH_RISK';
    return 'EXTREME_RISK';
}

function normalizeContextSignals(value) {
    const source = value && typeof value === 'object' ? value : {};
    const read = (key) => {
        const n = Number(source[key]);
        if (!Number.isFinite(n)) return 0;
        return clamp(n, 0, 1);
    };
    const sourceMarketAdjustments = isObject(source.market_adjustments)
        ? source.market_adjustments
        : (isObject(source.marketAdjustments) ? source.marketAdjustments : {});
    const marketAdjustments = {};
    for (const [key, valueRaw] of Object.entries(sourceMarketAdjustments)) {
        const valueNum = Number(valueRaw);
        if (Number.isFinite(valueNum)) {
            marketAdjustments[key] = valueNum;
        }
    }

    return {
        weather_risk: read('weather_risk'),
        availability_risk: read('availability_risk'),
        discipline_risk: read('discipline_risk'),
        stability_risk: read('stability_risk'),
        travel_fatigue_risk: read('travel_fatigue_risk'),
        fixture_congestion_risk: read('fixture_congestion_risk'),
        derby_risk: read('derby_risk'),
        rotation_risk: read('rotation_risk'),
        market_movement_risk: read('market_movement_risk'),
        lineup_uncertainty_risk: read('lineup_uncertainty_risk'),
        market_adjustments: marketAdjustments
    };
}

function firstNonEmptyString(values = []) {
    for (const value of values) {
        const text = String(value || '').trim();
        if (text) return text;
    }
    return null;
}

function resolveContextIngestionCity(matchInfo = {}, item = {}) {
    const venue = String(matchInfo?.venue || item?.venue || '').trim();
    const venueParts = venue.includes(',')
        ? venue.split(',').map((part) => String(part || '').trim()).filter(Boolean)
        : [];

    return firstNonEmptyString([
        matchInfo?.city,
        item?.city,
        venueParts[1] || null,
        venueParts[0] || null,
        matchInfo?.country,
        item?.country
    ]);
}

function normalizeInjuriesFromProvider(rawInjuries, homeTeamId, awayTeamId) {
    const records = ensureArray(rawInjuries);
    if (!records.length) return [];

    const homeId = String(homeTeamId || '').trim();
    const awayId = String(awayTeamId || '').trim();
    return records.map((entry) => {
        const teamId = String(entry?.team?.id || '').trim();
        const side = teamId && homeId && teamId === homeId
            ? 'home'
            : (teamId && awayId && teamId === awayId ? 'away' : null);

        return {
            side,
            team_id: teamId || null,
            team_name: entry?.team?.name || null,
            player_id: entry?.player?.id || null,
            player_name: entry?.player?.name || null,
            reason: entry?.player?.reason || null,
            type: entry?.player?.type || null,
            isKeyPlayer: true
        };
    });
}

function normalizeH2HFromProvider(rawH2H) {
    const fixtures = ensureArray(rawH2H);
    if (!fixtures.length) return null;

    const matches = fixtures.map((fixture) => {
        const homeGoals = Number(fixture?.goals?.home ?? fixture?.score?.fulltime?.home ?? 0);
        const awayGoals = Number(fixture?.goals?.away ?? fixture?.score?.fulltime?.away ?? 0);
        return {
            fixture_id: fixture?.fixture?.id || null,
            date: fixture?.fixture?.date || null,
            home_team_id: fixture?.teams?.home?.id || null,
            away_team_id: fixture?.teams?.away?.id || null,
            home_goals: Number.isFinite(homeGoals) ? homeGoals : null,
            away_goals: Number.isFinite(awayGoals) ? awayGoals : null
        };
    });

    let goalsTotal = 0;
    let goalsCount = 0;
    let under25 = 0;

    for (const match of matches) {
        if (!Number.isFinite(match.home_goals) || !Number.isFinite(match.away_goals)) continue;
        const totalGoals = match.home_goals + match.away_goals;
        goalsTotal += totalGoals;
        goalsCount += 1;
        if (totalGoals <= 2) under25 += 1;
    }

    const avgGoals = goalsCount > 0 ? goalsTotal / goalsCount : null;
    const under25Rate = goalsCount > 0 ? under25 / goalsCount : null;

    return {
        sampleSize: matches.length,
        avgGoals,
        under25Rate,
        lowScoringTrend: Number.isFinite(under25Rate) ? under25Rate >= 0.6 : false,
        matches
    };
}

function normalizeWeatherFromProvider(rawWeather) {
    if (!rawWeather || typeof rawWeather !== 'object') return null;

    const weatherMain = Array.isArray(rawWeather.weather) && rawWeather.weather.length
        ? rawWeather.weather[0]
        : {};
    const condition = String(weatherMain.main || weatherMain.description || '').trim();
    const key = condition.toLowerCase();
    const rain = key.includes('rain')
        || key.includes('drizzle')
        || key.includes('storm')
        || typeof rawWeather.rain === 'object';

    return {
        city: rawWeather.name || null,
        rain,
        condition: condition || null,
        summary: condition || null,
        temperature_c: Number.isFinite(Number(rawWeather?.main?.temp))
            ? Math.round((Number(rawWeather.main.temp) - 273.15) * 100) / 100
            : null,
        wind_speed: Number.isFinite(Number(rawWeather?.wind?.speed))
            ? Number(rawWeather.wind.speed)
            : null
    };
}

function dedupePublicIncidents(rows = []) {
    const safeRows = ensureArray(rows);
    const out = [];
    const seen = new Set();

    for (const row of safeRows) {
        if (!isObject(row)) continue;
        const key = String(
            row?.url
            || `${row?.team_name || ''}|${row?.title || ''}|${row?.published_at || ''}`
        ).trim().toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(row);
    }

    return out;
}

function mergeIngestedContextIntoMatchContext(effectiveMatchContext, ingestedContextData) {
    const source = isObject(effectiveMatchContext) ? effectiveMatchContext : {};
    const ingested = isObject(ingestedContextData) ? ingestedContextData : {};
    const merged = { ...source };

    const contextual = isObject(source.contextual_intelligence)
        ? { ...source.contextual_intelligence }
        : {};

    const ingestedInjuries = ensureArray(ingested.injuries);
    if (ingestedInjuries.length && !ensureArray(contextual.injuries).length) {
        contextual.injuries = ingestedInjuries;
    }
    const ingestedNews = dedupePublicIncidents(ingested.news);
    if (ingestedNews.length) {
        contextual.public_incidents = dedupePublicIncidents([
            ...ensureArray(contextual.public_incidents),
            ...ingestedNews
        ]).slice(0, 8);
    }
    if (ingested.weather && !contextual.weather) {
        contextual.weather = ingested.weather;
    }
    if (Object.keys(contextual).length) {
        merged.contextual_intelligence = contextual;
    }

    if (ingested.h2h && !isObject(merged.h2h)) {
        merged.h2h = ingested.h2h;
    }

    const rawProvider = isObject(source.raw_provider_data) ? { ...source.raw_provider_data } : {};
    if (ingested.h2h && !isObject(rawProvider.h2h)) {
        rawProvider.h2h = ingested.h2h;
    }
    if (ingested.weather && !rawProvider.weather) {
        rawProvider.weather = ingested.weather;
    }
    if (ingestedInjuries.length && !ensureArray(rawProvider.injuries).length) {
        rawProvider.injuries = ingestedInjuries;
    }
    if (ingestedNews.length) {
        rawProvider.news_context = ingestedNews;
    }
    if (Object.keys(rawProvider).length) {
        merged.raw_provider_data = rawProvider;
    }

    return merged;
}

function normalizeTeamTokenForSide(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function resolveInjuryTeamSide(entry, homeTeam, awayTeam) {
    if (!entry || typeof entry !== 'object') return null;
    const candidate = String(
        entry.side
        || entry.team_side
        || entry.home_away
        || entry.teamType
        || entry.team_type
        || entry.team
        || entry.team_name
        || ''
    ).trim().toLowerCase();
    if (!candidate) return null;
    if (candidate === 'home' || candidate === 'h') return 'home';
    if (candidate === 'away' || candidate === 'a') return 'away';

    const normalizedCandidate = normalizeTeamTokenForSide(candidate);
    if (normalizedCandidate && normalizedCandidate === normalizeTeamTokenForSide(homeTeam)) return 'home';
    if (normalizedCandidate && normalizedCandidate === normalizeTeamTokenForSide(awayTeam)) return 'away';
    return null;
}

function isKeyAbsence(entry) {
    if (!entry || typeof entry !== 'object') return false;
    if (entry.isKeyPlayer === true || entry.is_key_player === true) return true;
    const priority = String(entry.priority || entry.importance || entry.role || '').trim().toLowerCase();
    return priority === 'key' || priority === 'critical' || priority === 'starter';
}

function buildDirect1x2InjuryContext(effectiveMatchContext, matchInfo = {}) {
    const context = isObject(effectiveMatchContext?.contextual_intelligence)
        ? effectiveMatchContext.contextual_intelligence
        : {};
    const absences = []
        .concat(ensureArray(context.injuries))
        .concat(ensureArray(context.suspensions));

    const out = {
        home: { keyPlayersOut: 0 },
        away: { keyPlayersOut: 0 }
    };

    for (const absence of absences) {
        if (!isKeyAbsence(absence)) continue;
        const side = resolveInjuryTeamSide(absence, matchInfo.home_team, matchInfo.away_team);
        if (side === 'home') out.home.keyPlayersOut += 1;
        if (side === 'away') out.away.keyPlayersOut += 1;
    }

    return {
        home: { keyPlayersOut: out.home.keyPlayersOut },
        away: { keyPlayersOut: out.away.keyPlayersOut }
    };
}

function computeDirect1x2VolatilityScore(contextSignals) {
    const source = isObject(contextSignals) ? contextSignals : {};
    const volatilitySignals = [
        source.weather_risk,
        source.availability_risk,
        source.discipline_risk,
        source.stability_risk,
        source.travel_fatigue_risk,
        source.fixture_congestion_risk,
        source.derby_risk,
        source.rotation_risk,
        source.market_movement_risk,
        source.lineup_uncertainty_risk
    ].map((value) => clamp(Number(value) || 0, 0, 1));

    if (!volatilitySignals.length) return 0;
    const average = volatilitySignals.reduce((sum, value) => sum + value, 0) / volatilitySignals.length;
    return clamp(average, 0, 1);
}

function extractWeatherForDirect1x2(effectiveMatchContext) {
    const context = isObject(effectiveMatchContext?.contextual_intelligence)
        ? effectiveMatchContext.contextual_intelligence
        : {};
    const weatherSource = context.weather || effectiveMatchContext?.weather || null;
    if (!weatherSource) return null;

    if (typeof weatherSource === 'string') {
        const text = weatherSource.trim();
        const key = text.toLowerCase();
        const rain = key.includes('rain') || key.includes('shower') || key.includes('drizzle') || key.includes('storm');
        return {
            rain,
            condition: text,
            summary: text
        };
    }

    if (typeof weatherSource === 'object') {
        const condition = String(
            weatherSource.condition
            || weatherSource.description
            || weatherSource.summary
            || ''
        ).trim();
        const lower = condition.toLowerCase();
        const precipitation = Number(weatherSource.precipitation || weatherSource.precipitation_probability || 0);
        const rain = weatherSource.rain === true
            || lower.includes('rain')
            || lower.includes('shower')
            || lower.includes('drizzle')
            || lower.includes('storm')
            || (Number.isFinite(precipitation) && precipitation >= 40);

        return {
            ...weatherSource,
            rain,
            condition: condition || null,
            summary: condition || null
        };
    }

    return null;
}

function detectLowScoringTrend(h2hSource) {
    if (!h2hSource || typeof h2hSource !== 'object') return null;
    if (typeof h2hSource.lowScoringTrend === 'boolean') return h2hSource.lowScoringTrend;

    const avgGoals = Number(h2hSource.avgGoals || h2hSource.avg_goals || h2hSource.averageGoals);
    if (Number.isFinite(avgGoals)) return avgGoals <= 2.2;

    const under25Rate = Number(h2hSource.under25Rate || h2hSource.under_2_5_rate || h2hSource.under25);
    if (Number.isFinite(under25Rate)) return under25Rate >= 0.55;

    const recent = Array.isArray(h2hSource.matches) ? h2hSource.matches : [];
    if (!recent.length) return null;
    let lowScoring = 0;
    for (const match of recent) {
        const homeGoals = Number(match?.homeGoals ?? match?.home_goals ?? match?.home_score ?? 0);
        const awayGoals = Number(match?.awayGoals ?? match?.away_goals ?? match?.away_score ?? 0);
        if (Number.isFinite(homeGoals) && Number.isFinite(awayGoals) && (homeGoals + awayGoals) <= 2) {
            lowScoring += 1;
        }
    }
    return (lowScoring / recent.length) >= 0.6;
}

function extractH2HForDirect1x2(effectiveMatchContext) {
    const context = isObject(effectiveMatchContext?.contextual_intelligence)
        ? effectiveMatchContext.contextual_intelligence
        : {};
    const rawProvider = isObject(effectiveMatchContext?.raw_provider_data)
        ? effectiveMatchContext.raw_provider_data
        : {};
    const source = context.h2h || effectiveMatchContext?.h2h || rawProvider?.h2h || null;
    if (!source || typeof source !== 'object') return null;

    const lowScoringTrend = detectLowScoringTrend(source);
    return {
        ...source,
        lowScoringTrend: lowScoringTrend === true
    };
}

function parseFormPoints(value) {
    const raw = String(value || '').trim().toUpperCase();
    if (!raw) return null;
    let points = 0;
    let matches = 0;
    for (const char of raw.replace(/[^WDL]/g, '')) {
        if (char === 'W') points += 3;
        if (char === 'D') points += 1;
        if (char === 'L') points += 0;
        matches += 1;
    }
    return matches > 0 ? points : null;
}

function extractFormForDirect1x2(effectiveMatchContext) {
    const context = isObject(effectiveMatchContext?.contextual_intelligence)
        ? effectiveMatchContext.contextual_intelligence
        : {};
    const rawProvider = isObject(effectiveMatchContext?.raw_provider_data)
        ? effectiveMatchContext.raw_provider_data
        : {};
    const source = context.form || effectiveMatchContext?.form || rawProvider?.form || rawProvider || {};
    if (!source || typeof source !== 'object') return null;

    const homePointsLast5 = Number(
        source.homePointsLast5
        ?? source.home_points_last5
        ?? source.home_last5_points
        ?? parseFormPoints(source.homeForm || source.home_form || source.home_recent_form)
    );
    const awayPointsLast5 = Number(
        source.awayPointsLast5
        ?? source.away_points_last5
        ?? source.away_last5_points
        ?? parseFormPoints(source.awayForm || source.away_form || source.away_recent_form)
    );
    const homeMomentum = Number(source.homeMomentum ?? source.home_momentum);
    const awayMomentum = Number(source.awayMomentum ?? source.away_momentum);

    const hasPoints = Number.isFinite(homePointsLast5) || Number.isFinite(awayPointsLast5);
    const hasMomentum = Number.isFinite(homeMomentum) || Number.isFinite(awayMomentum);
    if (!hasPoints && !hasMomentum) return null;

    return {
        homePointsLast5: Number.isFinite(homePointsLast5) ? homePointsLast5 : null,
        awayPointsLast5: Number.isFinite(awayPointsLast5) ? awayPointsLast5 : null,
        homeMomentum: Number.isFinite(homeMomentum) ? homeMomentum : null,
        awayMomentum: Number.isFinite(awayMomentum) ? awayMomentum : null
    };
}

function buildDirect1x2MatchContext({ waterfallProbabilities, effectiveMatchContext, contextSignals, matchInfo }) {
    return {
        baseProb: {
            home: waterfallProbabilities.home_win,
            draw: waterfallProbabilities.draw,
            away: waterfallProbabilities.away_win
        },
        injuries: buildDirect1x2InjuryContext(effectiveMatchContext, matchInfo),
        weather: extractWeatherForDirect1x2(effectiveMatchContext),
        h2h: extractH2HForDirect1x2(effectiveMatchContext),
        form: extractFormForDirect1x2(effectiveMatchContext),
        volatilityScore: computeDirect1x2VolatilityScore(contextSignals)
    };
}

function toTitleCase(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toNormalizationInput(item) {
    if (!isObject(item)) return null;

    if (isObject(item.match_info) && isObject(item.sharp_odds) && isObject(item.contextual_intelligence)) {
        return item;
    }

    if (isObject(item.match) && isObject(item.odds)) {
        return item;
    }

    const rawProviderData = isObject(item.raw_provider_data) ? item.raw_provider_data : {};
    const match = {
        ...rawProviderData,
        ...item
    };
    const odds = isObject(item.odds)
        ? item.odds
        : (isObject(rawProviderData.odds) ? rawProviderData.odds : {});

    return {
        ...item,
        match,
        odds
    };
}

function safeTeamData(teamData) {
    const payload = teamData && typeof teamData === 'object' ? teamData : {};
    return {
        injuries: ensureArray(payload.injuries),
        suspensions: ensureArray(payload.suspensions),
        expectedXI: {
            reliability: Number.isFinite(Number(payload.expectedXI?.reliability))
                ? Number(payload.expectedXI.reliability)
                : 1
        }
    };
}

function deriveWaterfallProbabilities(predictionKey, pAdj, matchContext = {}) {
    const pFav = clamp(toProb(pAdj), 0.10, 0.95);

    let home = 0.33;
    let away = 0.33;
    let draw = 0.34;

    if (predictionKey === 'home_win') {
        home = pFav;
        const rem = 1 - home;
        away = rem * 0.58;
        draw = rem * 0.42;
    } else if (predictionKey === 'away_win') {
        away = pFav;
        const rem = 1 - away;
        home = rem * 0.58;
        draw = rem * 0.42;
    } else {
        draw = pFav;
        const rem = 1 - draw;
        home = rem * 0.5;
        away = rem * 0.5;
    }

    const doubleChance1X = clamp(home + draw, 0, 1);
    const doubleChanceX2 = clamp(away + draw, 0, 1);

    const dnbDenom = Math.max(home + away, 0.0001);
    const dnbHome = clamp(home / dnbDenom, 0, 1);
    const dnbAway = clamp(away / dnbDenom, 0, 1);

    const over15 = clamp(Math.max(home, away) + 0.18, 0.55, 0.98);
    const under45 = clamp(0.92 - Math.abs(home - away) * 0.12 + draw * 0.06, 0.55, 0.98);

    const fallback = {
        home_win: home,
        away_win: away,
        draw,
        double_chance_1x: doubleChance1X,
        double_chance_x2: doubleChanceX2,
        draw_no_bet_home: dnbHome,
        draw_no_bet_away: dnbAway,
        over_1_5: over15,
        under_4_5: under45
    };

    const sharpOdds = matchContext && typeof matchContext.sharp_odds === 'object' ? matchContext.sharp_odds : {};
    const merged = { ...fallback };
    for (const [key, value] of Object.entries(sharpOdds)) {
        const prob = toProb(value);
        if (prob > 0) merged[key] = prob;
    }

    if (!merged.over_2_5) merged.over_2_5 = clamp((merged.over_1_5 || over15) - 0.12, 0.30, 0.90);
    if (!merged.over_3_5) merged.over_3_5 = clamp((merged.over_2_5 || merged.over_1_5 || over15) - 0.16, 0.15, 0.82);
    if (!merged.under_3_5) merged.under_3_5 = clamp(1 - merged.over_3_5 + 0.08, 0.20, 0.95);
    if (!merged.under_2_5) merged.under_2_5 = clamp(1 - merged.over_2_5, 0.10, 0.90);
    if (!merged.double_chance_12) merged.double_chance_12 = clamp((merged.home_win || home) + (merged.away_win || away), 0, 1);
    if (!merged.home_over_0_5) merged.home_over_0_5 = clamp((merged.home_win || home) + 0.18, 0.48, 0.95);
    if (!merged.away_over_0_5) merged.away_over_0_5 = clamp((merged.away_win || away) + 0.16, 0.44, 0.94);
    if (!merged.home_over_1_5) merged.home_over_1_5 = clamp(merged.home_over_0_5 - 0.20, 0.12, 0.86);
    if (!merged.away_over_1_5) merged.away_over_1_5 = clamp(merged.away_over_0_5 - 0.20, 0.10, 0.84);
    if (!merged.btts_yes) merged.btts_yes = clamp(((merged.home_over_0_5 + merged.away_over_0_5) / 2) - 0.06, 0.24, 0.88);
    if (!merged.btts_no) merged.btts_no = clamp(1 - merged.btts_yes, 0.12, 0.90);
    if (!merged.double_chance_over_1_5) {
        merged.double_chance_over_1_5 = clamp(
            Math.max(merged.double_chance_1x || 0, merged.double_chance_x2 || 0, merged.double_chance_12 || 0) * (merged.over_1_5 || over15),
            0.30,
            0.98
        );
    }
    if (!merged.double_chance_under_3_5) {
        merged.double_chance_under_3_5 = clamp(
            Math.max(merged.double_chance_1x || 0, merged.double_chance_x2 || 0, merged.double_chance_12 || 0) * (merged.under_3_5 || 0.70),
            0.25,
            0.96
        );
    }

    return merged;
}

function toProb(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return clamp(n, 0, 1);
}

function countKeyAbsences(teamData) {
    const safe = safeTeamData(teamData);
    const keyInjuries = safe.injuries.filter((p) => Boolean(p?.isKeyPlayer)).length;
    const keySuspensions = safe.suspensions.filter((p) => Boolean(p?.isKeyPlayer)).length;
    return keyInjuries + keySuspensions;
}

function riskBand(value) {
    const risk = clamp(Number(value) || 0, 0, 1);
    if (risk >= 0.7) return 'High Risk';
    if (risk >= 0.4) return 'Medium Risk';
    return 'Low Risk';
}

function buildUiInsights(contextFixture, contextSignals) {
    const weatherRisk = clamp(Number(contextSignals.weather_risk) || 0, 0, 1);
    const availabilityRisk = clamp(Number(contextSignals.availability_risk) || 0, 0, 1);
    const stabilityRisk = clamp(Number(contextSignals.stability_risk) || 0, 0, 1);
    const teamName = String(contextFixture.home_team || 'Team').trim() || 'Team';
    const keyAbsences = countKeyAbsences(contextFixture.teamData);

    const weather = weatherRisk > 0.3
        ? `Adverse weather risk (${Math.round(weatherRisk * 100)}%)`
        : 'Weather conditions stable';
    const availability = keyAbsences > 0
        ? `${teamName} missing ${keyAbsences} key player${keyAbsences === 1 ? '' : 's'}`
        : `Squad availability stable (${Math.round((1 - availabilityRisk) * 100)}%)`;
    const stability = `${teamName}: ${riskBand(stabilityRisk)}`;

    return { weather, availability, stability };
}

function buildContextFixture(matchContext, item, sport) {
    const info = matchContext?.match_info || {};
    const context = matchContext?.contextual_intelligence || {};
    return {
        ...matchContext,
        metadata: item?.metadata || matchContext?.metadata || null,
        id: info.match_id || item?.match_id || item?.id || null,
        match_id: info.match_id || item?.match_id || item?.id || null,
        sport,
        home_team: info.home_team || item?.home_team || null,
        away_team: info.away_team || item?.away_team || null,
        competition: info.league || item?.league || item?.competition || null,
        location: info.venue || item?.venue || item?.location || null,
        kickoffTime: info.kickoff || item?.date || item?.kickoff || new Date().toISOString(),
        teamData: {
            injuries: ensureArray(context.injuries),
            suspensions: ensureArray(context.suspensions),
            expectedXI: {
                reliability: context.lineup_confirmed ? 0.95 : 0.65
            }
        },
        teamDiscipline: {
            redCards: { last5Games: 0 },
            yellowCardThreats: [],
            bans: ensureArray(context.suspensions)
        },
        teamContext: {
            coachConflict: Boolean(context.coach_conflict),
            execInstability: Boolean(context.boardroom_instability),
            playerLegalIssues: ensureArray(context.public_incidents),
            fanViolence: false,
            morale: context.morale
        }
    };
}

function fallbackPredictionForMarket(market, defaultPrediction = 'home_win') {
    const key = String(market || '').trim().toLowerCase();
    if (key.startsWith('double_chance_')) return key.replace('double_chance_', '');
    if (key.startsWith('draw_no_bet_')) return key.endsWith('_away') ? 'away' : 'home';
    if (key === 'home_win') return 'home_win';
    if (key === 'away_win') return 'away_win';
    if (key === 'draw') return 'draw';
    if (key === 'btts_yes') return 'yes';
    if (key === 'btts_no') return 'no';
    if (key.includes('team_to_score_first_home')) return 'home';
    if (key.includes('team_to_score_first_away')) return 'away';
    if (key.includes('over')) return 'over';
    if (key.includes('under')) return 'under';
    return defaultPrediction;
}

function sanitizeMatchContextForStorage(matchContext) {
    const source = matchContext && typeof matchContext === 'object' ? matchContext : {};
    return {
        match_info: { ...(source.match_info || {}) },
        sharp_odds: { ...(source.sharp_odds || {}) },
        contextual_intelligence: { ...(source.contextual_intelligence || {}) }
    };
}

function volatilityFromRiskProfile(riskProfile, fallbackVolatility) {
    if (!riskProfile || typeof riskProfile !== 'object') {
        return fallbackVolatility || 'medium';
    }
    const aggregate = Number(riskProfile.aggregate_risk || 0);
    if (aggregate >= 0.67) return 'high';
    if (aggregate >= 0.38) return 'medium';
    return 'low';
}

async function buildRawPredictionFromProviderItem(item) {
    const telemetry = isObject(item?.telemetry) ? item.telemetry : {};
    const telemetryRunId = telemetry.run_id || null;
    const normalizationInput = toNormalizationInput(item);
    const semanticState = semanticGuard.enforceSemanticAlignment(normalizationInput, {
        pipeline: 'aiPipeline',
        source: 'aiPipeline'
    });
    if (semanticState.violations.length > 0) {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport: item?.sport || telemetry?.sport || 'unknown',
            bucket: semanticState.quarantined ? 'semantic_quarantine' : 'semantic_alignment',
            reason: semanticState.quarantined
                ? 'canonical_identity_missing'
                : 'semantic_guard_applied',
            metadata: {
                match_id: semanticState.normalizedInput?.match_id || item?.match_id || null,
                violations: semanticState.violations,
                blocked_contexts: semanticState.semantic?.blocked_contexts || []
            }
        });
    }
    if (semanticState.quarantined) {
        return null;
    }

    const canonicalInput = semanticState.normalizedInput;
    const matchContext = buildMatchContext(canonicalInput);
    if (!matchContext) {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport: item?.sport || telemetry?.sport || 'unknown',
            bucket: 'legacy_schema_reject',
            metadata: {
                reason: 'buildMatchContext_returned_null',
                match_id: item?.match_id || null
            }
        });
        return null;
    }
    const matchInfo = matchContext?.match_info || {};

    const match_id = String(matchInfo.match_id || canonicalInput.match_id || item.match_id || item.id || '').trim();
    if (!match_id) throw new Error('match_id missing in provider item');

    const sport = normalizeSportForDeployment(matchContext?.sport || canonicalInput.sport || item.sport || 'Football');
    if (!isDeploymentSportEnabled(sport)) {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport: sport || 'unknown',
            bucket: 'sport_phase_block',
            metadata: {
                match_id,
                reason: 'phase_1_Football_only'
            }
        });
        return null;
    }
    const requestedMarket = String(item.market || '1X2').trim();
    pipelineLogger.stageAdd({
        run_id: telemetryRunId,
        sport,
        stage: 'normalized_count',
        count: 1
    });

    const semanticFailures = semanticState.violations || [];
    const controlDecision = verificationController.evaluateControlPlane({
        pipeline: 'aiPipeline',
        provider: canonicalInput?.metadata?.provider || canonicalInput?.provider || item?.provider || 'unknown',
        totalViolations: semanticFailures.length,
        criticalViolations: semanticFailures.filter((violation) => String(violation.severity || '').toLowerCase() === 'critical').length,
        warningViolations: semanticFailures.filter((violation) => String(violation.severity || '').toLowerCase() === 'warning').length,
        blockedViolations: semanticFailures.filter((violation) => String(violation.severity || '').toLowerCase() === 'blocked').length,
        degradedFlag: semanticState.quarantined || semanticFailures.some((violation) => String(violation.severity || '').toLowerCase() === 'blocked'),
        canonicalIntegrityBroken: semanticState.quarantined,
        trend: 'stable',
        batchSize: 1
    }, {
        pipelineThresholds: {
            aiPipeline: {
                warnViolations: 1,
                degradedViolations: 1,
                failViolations: 2,
                warnViolationRate: 0.01,
                degradedViolationRate: 0.05,
                failViolationRate: 0.1
            }
        }
    });

    if (controlDecision.actions.quarantine || controlDecision.actions.allowPublish === false) {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport,
            bucket: 'control_plane_quarantine',
            reason: controlDecision.state,
            metadata: {
                match_id,
                healthScore: controlDecision.healthScore,
                reasons: controlDecision.reasons,
                actions: controlDecision.actions
            }
        });
        return null;
    }

    // Always ingest context for football fixtures before downstream pipeline filtering.
    let ingestedContextData = { injuries: {}, h2h: {}, weather: {}, news: [], sport };
    const isScoutFipMode =
        String(item?.data_mode || '').trim() === 'scout_fip'
        || item?.metadata?.sports_truth_origin === 'SCOUT_FIP'
        || matchInfo?.sports_truth_origin === 'SCOUT_FIP';
    const allowEnrichment =
        !isScoutFipMode
        && controlDecision.actions.allowEnrichment !== false;
    const allowWeather = semanticState.contextPolicy?.allowWeather === true;
    const allowNews = semanticState.contextPolicy?.allowNews === true;

    if (allowEnrichment) {
        try {
            console.log('Processing fixture:', match_id);
            const fixtureIdForIngestion = matchInfo.match_id || match_id;
            const homeTeamIdForIngestion = matchInfo.home_team_id || item.home_team_id || null;
            const awayTeamIdForIngestion = matchInfo.away_team_id || item.away_team_id || null;
            const cityForWeather = resolveContextIngestionCity(matchInfo, item);
            const homeTeamForNews = matchInfo.home_team || item.home_team || null;
            const awayTeamForNews = matchInfo.away_team || item.away_team || null;
            const kickoffForNews = matchInfo.kickoff || item.date || item.kickoff || null;

            const [injuriesRaw, h2hRaw, weatherRaw, newsRaw] = await Promise.all([
                safeFetch(
                    () => getInjuries(fixtureIdForIngestion),
                    'Injuries'
                ),
                safeFetch(
                    () => getH2H(homeTeamIdForIngestion, awayTeamIdForIngestion),
                    'H2H'
                ),
                allowWeather
                    ? safeFetch(
                        () => getWeather(cityForWeather),
                        'Weather'
                    )
                    : Promise.resolve(null),
                allowNews
                    ? safeFetch(
                        () => getTeamNewsContext({
                            homeTeam: homeTeamForNews,
                            awayTeam: awayTeamForNews,
                            kickoff: kickoffForNews
                        }),
                        'News'
                    )
                    : Promise.resolve([])
            ]);

            ingestedContextData = {
                injuries: normalizeInjuriesFromProvider(injuriesRaw, homeTeamIdForIngestion, awayTeamIdForIngestion),
                h2h: normalizeH2HFromProvider(h2hRaw),
                weather: normalizeWeatherFromProvider(weatherRaw),
                news: dedupePublicIncidents(newsRaw),
                sport
            };

            console.log('ATTEMPTING INSERT:', fixtureIdForIngestion);
            const saveResult = await saveContextData(directInsightsWriteSupabase, match_id, ingestedContextData);
            if (saveResult?.saved === true) {
                console.log('Context inserted:', match_id);
            } else if (saveResult?.reason === 'already_exists') {
                console.log('Context already exists:', match_id);
            }
        } catch (contextIngestionErr) {
            console.warn('[aiPipeline] context ingestion failed for match_id=%s: %s', match_id, contextIngestionErr.message);
        }
    } else {
        pipelineLogger.stageAdd({
            run_id: telemetryRunId,
            sport,
            stage: 'semantic_enrichment_skipped',
            count: 1
        });
    }

    const scoring = await scoreMatch({
        match_id,
        sport,
        home_team: matchInfo.home_team || canonicalInput.home_team || item.home_team || null,
        away_team: matchInfo.away_team || canonicalInput.away_team || item.away_team || null,
        prediction: canonicalInput.prediction || null,
        confidence: canonicalInput.confidence,
        raw_provider_data: canonicalInput.raw_provider_data || matchContext.raw_provider_data || null,
        metadata: canonicalInput.metadata || matchContext.metadata || null
    });

    const providerPrediction = normalizePrediction(canonicalInput.prediction || matchContext.prediction);
    const predictionSource = providerPrediction ? 'provider' : 'ai_fallback';
    const fallbackPrediction = scoring.winner === 'home'
        ? 'home_win'
        : scoring.winner === 'away'
            ? 'away_win'
            : scoring.winner === 'draw'
                ? 'draw'
                : 'home_win';
    const prediction = providerPrediction || fallbackPrediction;
    const rawBaselineConfidence = typeof canonicalInput.confidence === 'number' && Number.isFinite(canonicalInput.confidence)
        ? canonicalInput.confidence
        : (Number.isFinite(Number(scoring.confidence)) ? Number(scoring.confidence) : 62);
    const baselineConfidence = controlDecision.actions.capConfidence && Number.isFinite(Number(controlDecision.actions.confidenceCap))
        ? Math.min(rawBaselineConfidence, Number(controlDecision.actions.confidenceCap))
        : rawBaselineConfidence;
    const p_base = toProbability(baselineConfidence);
    const contextFixture = buildContextFixture(matchContext, canonicalInput, sport);
    let contextEnriched = null;

    try {
        contextEnriched = await enrichFixtureWithContext(contextFixture);
    } catch (contextErr) {
        console.warn('[aiPipeline] context enrichment failed for match_id=%s: %s', match_id, contextErr.message);
    }
    pipelineLogger.stageAdd({
        run_id: telemetryRunId,
        sport,
        stage: 'enriched_count',
        count: 1
    });
    if (!contextEnriched?.contextual_intelligence && !contextFixture?.contextual_intelligence) {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport,
            bucket: 'missing_context',
            metadata: { match_id }
        });
    }

    const contextSignals = normalizeContextSignals(contextEnriched?.contextSignals);
    const p_adj = adjustProbability(p_base, contextSignals);
    const effectiveMatchContext = mergeIngestedContextIntoMatchContext(
        contextEnriched || contextFixture,
        ingestedContextData
    );
    const storableMatchContext = sanitizeMatchContextForStorage(effectiveMatchContext);
    const waterfallProbabilities = deriveWaterfallProbabilities(prediction, p_adj, effectiveMatchContext);
    const direct1x2Evaluation = evaluateDirect1x2(
        buildDirect1x2MatchContext({
            waterfallProbabilities,
            effectiveMatchContext,
            contextSignals,
            matchInfo
        })
    );
    if (direct1x2Evaluation.confidence < 45) {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport,
            bucket: 'validation_reject',
            reason: 'low_confidence',
            metadata: {
                match_id,
                confidence: direct1x2Evaluation.confidence,
                tier: direct1x2Evaluation.tier
            }
        });
        return { rejected: true, reason: 'low_confidence' };
    }
    try {
        await saveDirectInsight(directInsightsWriteSupabase, match_id, direct1x2Evaluation);
    } catch (saveErr) {
        console.warn('[aiPipeline] direct_1x2_insights save failed match_id=%s: %s', match_id, saveErr.message);
    }
    const marketIntelligence = buildCandidateMarkets(
        waterfallProbabilities,
        effectiveMatchContext,
        {
            contextSignals,
            telemetry: {
                run_id: telemetryRunId,
                sport
            }
        }
    );
    pipelineLogger.stageAdd({
        run_id: telemetryRunId,
        sport,
        stage: 'market_scored_count',
        count: 1
    });
    const marketSelections = selectDirectSecondarySameMatch(
        marketIntelligence.candidates,
        effectiveMatchContext,
        {
            contextSignals,
            riskProfile: marketIntelligence.risk_profile,
            telemetry: {
                run_id: telemetryRunId,
                sport
            }
        }
    );
    if (marketSelections?.direct || marketSelections?.secondary) {
        pipelineLogger.stageAdd({
            run_id: telemetryRunId,
            sport,
            stage: 'post_conflict_count',
            count: 1
        });
    } else {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport,
            bucket: 'conflict_reject',
            metadata: { match_id }
        });
    }
    if (marketIntelligence.risk_profile?.reject) {
        console.log('[aiPipeline] risk-rejection fixture skipped match_id=%s aggregate_risk=%s', match_id, marketIntelligence.risk_profile.aggregate_risk);
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport,
            bucket: 'validation_reject',
            metadata: {
                match_id,
                reason: 'risk_profile_reject'
            }
        });
        return null;
    }

    const selectedDirect = marketSelections.direct || null;
    const selectedSecondary = marketSelections.secondary || null;
    const rankMatchShape = {
        ...(isObject(matchContext) ? matchContext : {}),
        ...(isObject(item?.raw_provider_data) ? item.raw_provider_data : {}),
        ...(isObject(item) ? item : {})
    };
    const rankData = extractRankData(rankMatchShape);
    const rankPrediction = rankData ? buildPredictionFromRank(rankData) : null;
    const rankMarket = rankPrediction ? normalizeRankPrimaryMarket(rankPrediction.market) : null;
    const rankSecondaryMarket = rankPrediction?.secondary
        ? normalizeRankSecondaryMarket(rankPrediction.secondary)
        : null;
    const rankProbability = Number(rankPrediction?.probability);
    const rankCalibratedConfidence = Number(rankPrediction?.confidence);
    const rankVolatilityScore = Number(rankPrediction?.volatility_score ?? rankPrediction?.volatility);
    const rankApplied = Boolean(rankMarket && Number.isFinite(rankProbability));

    const baseMarket = selectedDirect?.market || requestedMarket;
    const baseRoutedPrediction = selectedDirect?.prediction
        || direct1x2Evaluation.outcome
        || prediction
        || fallbackPredictionForMarket(baseMarket, prediction);
    const baseConfidenceProbabilityRaw = selectedDirect?.probability || (direct1x2Evaluation.confidence / 100) || p_adj;
    const baseConfidenceProbability = adjustProbability.applyMarketAdjustment(
        baseConfidenceProbabilityRaw,
        baseMarket,
        contextSignals.market_adjustments
    );
    const baseConfidence = toConfidencePercent(baseConfidenceProbability);

    const market = rankApplied ? rankMarket : baseMarket;
    const routedPrediction = rankApplied ? defaultPredictionForMarket(rankMarket) : baseRoutedPrediction;
    const confidence = rankApplied
        ? (
            Number.isFinite(rankCalibratedConfidence)
                ? clamp(Math.round(rankCalibratedConfidence), 55, 92)
                : clamp(Math.round(clamp(rankProbability, 0, 1) * 100), 0, 100)
        )
        : baseConfidence;
    let confidenceWithH2H = confidence;
    let h2hMetadata = {
        h2h_enrichment_status: 'skipped',
        h2h_enrichment_reason: 'not_evaluated',
        h2h_enrichment_source: 'football_highlights',
        h2h_enrichment_endpoint: 'head-2-head',
        h2h_match_count: null,
        h2h_edge_label: null,
        h2h_draw_rate: null,
        h2h_btts_rate: null,
        h2h_over_1_5_rate: null,
        h2h_over_2_5_rate: null,
        h2h_volatility_hint: null,
        h2h_confidence_adjustment: 0,
        h2h_notes: []
    };
    const preH2HVolatilityScore = rankApplied
        ? Number(rankPrediction?.volatility_score ?? rankPrediction?.volatility)
        : null;
    const h2hMatchShape = {
        ...(isObject(matchContext) ? matchContext : {}),
        ...(isObject(item?.raw_provider_data) ? item.raw_provider_data : {}),
        ...(isObject(item) ? item : {}),
        match_info: isObject(matchInfo) ? matchInfo : {},
        raw: isObject(item?.raw_provider_data) ? item.raw_provider_data : {}
    };
    const h2hEnrichment = await applyFootballH2HEnrichment({
        sport,
        fixtureId: match_id,
        candidatePrediction: routedPrediction,
        candidateConfidence: confidence,
        match: h2hMatchShape,
        currentVolatilityScore: preH2HVolatilityScore
    });
    confidenceWithH2H = Number.isFinite(Number(h2hEnrichment?.confidence))
        ? clamp(Math.round(Number(h2hEnrichment.confidence)), 55, 92)
        : confidence;
    h2hMetadata = h2hEnrichment?.metadata && typeof h2hEnrichment.metadata === 'object'
        ? h2hEnrichment.metadata
        : h2hMetadata;

    const confidenceProbabilityRaw = rankApplied ? (confidenceWithH2H / 100) : baseConfidenceProbabilityRaw;
    const confidenceProbability = rankApplied ? (confidenceWithH2H / 100) : baseConfidenceProbability;
    const selectedSecondaryFinal = rankApplied && rankSecondaryMarket
        ? {
            market: rankSecondaryMarket,
            prediction: defaultPredictionForMarket(rankSecondaryMarket),
            confidence: confidenceWithH2H,
            probability: confidenceWithH2H / 100,
            source: 'rank_data'
        }
        : selectedSecondary;
    if (rankApplied) {
        const rankFixtureId = String(matchInfo?.id || item?.fixture_id || match_id || '');
        console.log(`[RANK] Applied calibrated rank prediction for match ${rankFixtureId} confidence=${confidence} band=${rankPrediction?.confidence_band || 'LOW_EDGE'} volatility=${rankPrediction?.volatility_label || 'MEDIUM'}`);
    }
    const riskLevel = isPrimaryMatchOutcomeMarket(market)
        ? riskLevelFromConfidence(confidenceWithH2H)
        : 'good';
    const transparencyFlags = transparencyFlagsForRiskLevel(riskLevel);
    const secondaryInsights = buildMandatorySecondaryInsights({
        candidates: marketIntelligence.candidates,
        selectedMarket: market,
        primaryOutcome: routedPrediction,
        primaryConfidence: confidenceWithH2H,
        ruleOf4: rankApplied && rankSecondaryMarket
            ? [{ market: rankSecondaryMarket, prediction: defaultPredictionForMarket(rankSecondaryMarket), confidence: confidenceWithH2H }]
            : (marketSelections.rule_of_4_markets || [])
    });
    const volatility = rankApplied && Number.isFinite(rankVolatilityScore)
        ? clamp(Math.round(rankVolatilityScore), 0, 100)
        : (item.volatility || scoring.volatility || volatilityFromRiskProfile(marketIntelligence.risk_profile, 'medium'));
    const aiSource = scoring.source || null; // 'dolphin', 'fallback', 'odds', etc.
    const aiReasoning = scoring.reasoning || null;
    const uiInsights = buildUiInsights(contextFixture, contextSignals);

    const raw = {
        match_id,
        sport,
        market,
        prediction: routedPrediction,
        confidence: confidenceWithH2H,
        volatility,
        odds: item.odds !== undefined ? item.odds : null,
        metadata: {
            source: 'aiPipeline:v3-normalized+market-intelligence',
            data_mode: item.data_mode || null,
            ...buildGovernedFipProvenanceMetadata(item),
            prediction_source: rankApplied ? 'rank_data' : predictionSource,
            confidence_band: rankApplied ? (rankPrediction?.confidence_band || null) : null,
            volatility_score: Number.isFinite(Number(h2hMetadata?.volatility_score))
                ? Number(h2hMetadata.volatility_score)
                : (rankApplied ? (rankPrediction?.volatility_score ?? rankPrediction?.volatility ?? null) : null),
            volatility_label: rankApplied ? (rankPrediction?.volatility_label || null) : null,
            calibration_notes: rankApplied ? (rankPrediction?.calibration_notes || []) : [],
            rank_filter_warning: rankApplied ? (rankPrediction?.rank_filter_warning || null) : null,
            rank_volatility_warning: rankApplied ? (rankPrediction?.rank_volatility_warning || null) : null,
            ai_source: aiSource,
            ai_reasoning: aiReasoning,
            provider: item.provider || matchContext.provider || null,
            bookmaker: item.bookmaker || null,
            home_team: matchInfo.home_team || item.home_team || null,
            away_team: matchInfo.away_team || item.away_team || null,
            match_time: matchInfo.kickoff || item.date || item.commence_time || item.kickoff || item.match_time || null,
            league: matchInfo.league || item.league || null,
            tournament: item.tournament || null,
            stage: item.stage || item.round || null,
            venue: matchInfo.venue || item.venue || null,
            country: matchInfo.country || item.country || null,
            base_market: requestedMarket,
            base_prediction: prediction,
            normalized_match_context: true,
            match_context: storableMatchContext,
            context_intelligence: {
                status: contextEnriched?.context_status || 'unavailable',
                last_verified: new Date().toISOString(),
                signals: contextSignals,
                insights: {
                    weather: { summary: uiInsights.weather },
                    availability: { summary: uiInsights.availability },
                    stability: { summary: uiInsights.stability },
                    discipline: {}
                },
                p_base,
                p_adj,
                confidence_base_pct: Math.round(toProbability(baselineConfidence) * 10000) / 100,
                confidence_adj_pct: confidenceWithH2H
            },
            direct_1x2_engine: {
                market: direct1x2Evaluation.market,
                outcome: direct1x2Evaluation.outcome,
                confidence: direct1x2Evaluation.confidence,
                tier: direct1x2Evaluation.tier,
                confidence_tier_warning: directConfidenceTierWarning(direct1x2Evaluation.confidence),
                secondary_required: direct1x2Evaluation.secondaryRequired,
                acca_eligible: direct1x2Evaluation.accaEligible,
                volatility_score: direct1x2Evaluation.volatilityScore,
                limited_context: direct1x2Evaluation.limitedContext === true,
                stages: direct1x2Evaluation.stages
            },
            market_intelligence: {
                direct_1x2: {
                    outcome: direct1x2Evaluation.outcome,
                    confidence: direct1x2Evaluation.confidence,
                    tier: direct1x2Evaluation.tier,
                    confidence_tier_warning: directConfidenceTierWarning(direct1x2Evaluation.confidence)
                },
                direct_market: selectedDirect,
                secondary_market: selectedSecondaryFinal,
                rule_of_4_markets: marketSelections.rule_of_4_markets || [],
                same_match: marketSelections.same_match,
                secondary_insights: secondaryInsights,
                risk_profile: marketIntelligence.risk_profile,
                ranked_markets: ensureArray(marketIntelligence.candidates)
                    .slice(0, 20)
                    .map((candidate) => ({
                        market: candidate.market,
                        prediction: candidate.prediction,
                        confidence: candidate.confidence,
                        probability: candidate.probability,
                        score: candidate.score,
                        priority_tier: candidate.priority_tier,
                        category: candidate.category
                    }))
            },
            market_router: {
                phase: selectedDirect ? 'market_intelligence_tiered' : 'primary_outcome_backbone',
                status: 'locked',
                final_recommendation: {
                    market: toTitleCase(market),
                    confidence: confidenceWithH2H
                },
                engine_log: [
                    `Primary outcome retained: ${toTitleCase(market)} at ${confidenceWithH2H}% confidence.`,
                    `Direct 1X2 tier: ${direct1x2Evaluation.tier} (${direct1x2Evaluation.confidence}%).`,
                    'Defensive floor market mutation disabled for transparency.'
                ],
                probabilities: waterfallProbabilities || {},
                insights: uiInsights
            },
            h2h_enrichment_status: h2hMetadata.h2h_enrichment_status || 'skipped',
            h2h_enrichment_source: h2hMetadata.h2h_enrichment_source || 'football_highlights',
            h2h_enrichment_endpoint: h2hMetadata.h2h_enrichment_endpoint || 'head-2-head',
            h2h_match_count: h2hMetadata.h2h_match_count,
            h2h_edge_label: h2hMetadata.h2h_edge_label,
            h2h_draw_rate: h2hMetadata.h2h_draw_rate,
            h2h_btts_rate: h2hMetadata.h2h_btts_rate,
            h2h_over_1_5_rate: h2hMetadata.h2h_over_1_5_rate,
            h2h_over_2_5_rate: h2hMetadata.h2h_over_2_5_rate,
            h2h_volatility_hint: h2hMetadata.h2h_volatility_hint,
            h2h_confidence_adjustment: h2hMetadata.h2h_confidence_adjustment,
            h2h_notes: h2hMetadata.h2h_notes || [],
            h2h_enrichment_reason: h2hMetadata.h2h_enrichment_reason || null,
            h2h_volatility_warning: h2hMetadata.h2h_volatility_warning || null,
            risk_level: riskLevel,
            secondary_insights: secondaryInsights,
            transparency_flags: transparencyFlags,
            ai: !rankApplied && predictionSource === 'ai_fallback'
                ? {
                    winner: scoring.winner,
                    source: aiSource,
                    reasoning: aiReasoning
                }
                : null
        },
        secondary_market: rankApplied ? (rankPrediction?.secondary || null) : null,
        source: rankApplied ? 'rank_data' : predictionSource
    };

    try {
        validateRawPredictionInput(raw);
    } catch (validationError) {
        pipelineLogger.rejectionAdd({
            run_id: telemetryRunId,
            sport,
            bucket: 'validation_reject',
            reason: validationError.message,
            metadata: { match_id }
        });
        throw validationError;
    }

    const verificationState = verificationController.evaluatePipelineOutput(raw);
    verificationController.enforce(verificationState);

    pipelineLogger.stageAdd({
        run_id: telemetryRunId,
        sport,
        stage: 'post_validation_count',
        count: 1
    });
    return raw;
}

async function insertRawPrediction(pred, client) {
    const metadata = pred && typeof pred.metadata === 'object' && pred.metadata !== null
        ? pred.metadata
        : {};
    const kickoff = String(
        metadata.match_time
        || metadata.kickoff
        || metadata.kickoff_time
        || ''
    ).trim();

    if (kickoff) {
        const existingRes = await client.query(
            `
            select *
            from predictions_raw
            where match_id = $1
              and sport = $2
              and market = $3
              and coalesce(metadata->>'match_time', metadata->>'kickoff', metadata->>'kickoff_time', '') = $4
              and created_at >= now() - interval '21 days'
            order by created_at desc
            limit 1;
            `,
            [
                pred.match_id,
                pred.sport,
                pred.market,
                kickoff
            ]
        );

        if (existingRes.rows.length) {
            const existing = existingRes.rows[0];
            const refreshed = await client.query(
                `
                update predictions_raw
                set prediction = $2,
                    confidence = $3,
                    volatility = $4,
                    odds = $5,
                    metadata = $6::jsonb,
                    created_at = now()
                where id = $1
                returning *;
                `,
                [
                    existing.id,
                    pred.prediction,
                    pred.confidence,
                    pred.volatility,
                    pred.odds,
                    JSON.stringify(metadata)
                ]
            );
            return refreshed.rows[0];
        }
    }

    const res = await client.query(
        `
        insert into predictions_raw
            (match_id, sport, market, prediction, confidence, volatility, odds, metadata)
        values
            ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        returning *;
        `,
        [
            pred.match_id,
            pred.sport,
            pred.market,
            pred.prediction,
            pred.confidence,
            pred.volatility,
            pred.odds,
            JSON.stringify(pred.metadata || {})
        ]
    );

    return res.rows[0];
}

function rawDedupeKey(raw) {
    const metadata = raw && typeof raw.metadata === 'object' && raw.metadata !== null
        ? raw.metadata
        : {};
    const kickoff = String(
        metadata.match_time
        || metadata.kickoff
        || metadata.kickoff_time
        || raw?.date
        || ''
    ).trim();
    return [
        String(raw?.sport || '').trim().toLowerCase(),
        String(raw?.match_id || '').trim(),
        String(raw?.market || '').trim().toLowerCase(),
        kickoff
    ].join('|');
}

async function runPipelineForMatches({ matches, telemetry = {} }) {
    console.log('PIPELINE STARTED');
    if (!Array.isArray(matches) || matches.length === 0) {
        throw new Error('matches must be a non-empty array');
    }

    const eligibleMatches = matches.filter((item) =>
        isDeploymentSportEnabled(
            item?.sport
             || item?.match_info?.sport
             || item?.match?.sport
             || item?.raw_provider_data?.sport
             || 'Football'
         )
     );

     if (!eligibleMatches.length) {
         console.log('[aiPipeline] all input matches were skipped by active deployment sport gate');
         return {
             mode: 'manual',
             inserted: [],
             filtered: [],
             filtered_valid: 0,
             filtered_invalid: 0,
             skipped_non_active: matches.length
         };
     }

    if (isRunning) {
        console.warn('[aiPipeline] blocked: pipeline already running');
        return { mode: 'manual', inserted: [], filtered: [], filtered_valid: 0, filtered_invalid: 0, error: 'Pipeline already running' };
    }

    isRunning = true;

    try {
        return await withTransaction(async (client) => {
            const inserted = [];
            const seenRawKeys = new Set();
            let normalValid = 0;
            let normalInvalid = 0;

        console.log('[aiPipeline] manual matches input count=%s eligible_Football=%s', matches.length, eligibleMatches.length);

        for (const item of eligibleMatches) {
            const fixtureId = String(item?.id || item?.match_id || item?.match_info?.match_id || '').trim();
            console.log('LOOP RUNNING:', fixtureId || 'unknown_fixture');
            const raw = await buildRawPredictionFromProviderItem({
                ...item,
                data_mode: 'manual',
                telemetry
            });
            if (!raw || raw.rejected) continue;
            if (!isDeploymentSportEnabled(raw.sport)) continue;
            const dedupeKey = rawDedupeKey(raw);
            if (seenRawKeys.has(dedupeKey)) continue;
            seenRawKeys.add(dedupeKey);
            const row = await insertRawPrediction(raw, client);
            inserted.push(row);
        }

        const filtered = [];
        let filteredValid = 0;
        let filteredInvalid = 0;

        for (const row of inserted) {
            const n = await filterRawPrediction({ rawId: row.id, tier: 'normal' }, client);
            const d = await filterRawPrediction({ rawId: row.id, tier: 'deep' }, client);
            filtered.push(n, d);
            if (n?.is_valid) {
                normalValid += 1;
            } else {
                normalInvalid += 1;
                pipelineLogger.rejectionAdd({
                    run_id: telemetry?.run_id || null,
                    sport: row?.sport || telemetry?.sport || 'unknown',
                    bucket: 'validation_reject',
                    reason: n?.reject_reason || null,
                    metadata: {
                        raw_id: row?.id || null,
                        tier: 'normal'
                    }
                });
            }
        }

        for (const f of filtered) {
            if (f.is_valid) filteredValid++;
            else filteredInvalid++;
        }

        pipelineLogger.stageSet({
            run_id: telemetry?.run_id || null,
            sport: telemetry?.sport || 'unknown',
            stage: 'post_validation_count',
            count: normalValid
        });

        console.log('[aiPipeline] inserted_raw=%s filtered_valid=%s filtered_invalid=%s', inserted.length, filteredValid, filteredInvalid);

            return {
                mode: 'manual',
                inserted,
                filtered,
                filtered_valid: filteredValid,
                filtered_invalid: filteredInvalid,
                skipped_non_football: Math.max(0, matches.length - eligibleMatches.length),
                telemetry: {
                    normal_valid: normalValid,
                    normal_invalid: normalInvalid
                }
            };
        });
    } finally {
        isRunning = false;
    }
}

function hasOwn(value, key) {
    return Boolean(value)
        && typeof value === 'object'
        && Object.prototype.hasOwnProperty.call(value, key);
}

function buildConfiguredInputRejection(code, message, details = {}) {
    return {
        mode: 'scout_fip',
        accepted: false,
        batch_rejected: true,
        rejection_code: code,
        message,
        intake_results: [],
        details,
        inserted: [],
        filtered: [],
        filtered_valid: 0,
        filtered_invalid: 0
    };
}

async function resolveConfiguredPredictionInput(options = {}, deps = {}) {
    const providerLoader = deps.getPredictionInputs || getPredictionInputs;
    const intakeReceiver = deps.receiveValidatedFip || receiveValidatedFip;

    if (!hasOwn(options, 'fip_envelopes')) {
        const providerInput = await providerLoader();
        return {
            ok: true,
            mode: providerInput.mode,
            predictions: Array.isArray(providerInput.predictions)
                ? providerInput.predictions
                : [],
            intake_results: null,
            source: 'configured_provider'
        };
    }

    const fipEnvelopes = options.fip_envelopes;

    if (!Array.isArray(fipEnvelopes)) {
        return {
            ok: false,
            response: buildConfiguredInputRejection(
                'FIP_BATCH_INVALID',
                'fip_envelopes must be an array.'
            )
        };
    }

    if (fipEnvelopes.length < 1 || fipEnvelopes.length > 100) {
        return {
            ok: false,
            response: buildConfiguredInputRejection(
                'FIP_BATCH_SIZE_INVALID',
                'fip_envelopes must contain between 1 and 100 FIPs.',
                {
                    count: fipEnvelopes.length,
                    minimum: 1,
                    maximum: 100
                }
            )
        };
    }

    const malformedIndex = fipEnvelopes.findIndex(
        (item) => !item || typeof item !== 'object' || Array.isArray(item)
    );

    if (malformedIndex !== -1) {
        return {
            ok: false,
            response: buildConfiguredInputRejection(
                'FIP_BATCH_ITEM_INVALID',
                'Every fip_envelopes item must be a non-null object.',
                {
                    index: malformedIndex
                }
            )
        };
    }

    if (options.governed_mode !== PROOF_FIXTURE_MODE) {
        return {
            ok: false,
            response: buildConfiguredInputRejection(
                'FIP_GOVERNED_MODE_INVALID',
                'P1-B01 only accepts PROOF_FIXTURE governed mode.',
                {
                    expected: PROOF_FIXTURE_MODE,
                    actual: options.governed_mode || null
                }
            )
        };
    }

    const caller = typeof options.caller === 'string'
        ? options.caller.trim()
        : '';

    if (!caller) {
        return {
            ok: false,
            response: buildConfiguredInputRejection(
                'FIP_CALLER_INVALID',
                'A non-empty governed caller is required.'
            )
        };
    }

    const receivedAt = options.received_at || new Date().toISOString();

    const intakeResults = fipEnvelopes.map((fipPayload) =>
        intakeReceiver(fipPayload, {
            caller,
            governedMode: options.governed_mode,
            receivedAt,
            scoutEdgeMarriageGate: 'BLOCKED',
            supabaseStorageGate: 'BLOCKED'
        })
    );

    const rejectedIndexes = [];
    intakeResults.forEach((result, index) => {
        if (!result || result.accepted !== true || !result.envelope) {
            rejectedIndexes.push(index);
        }
    });

    if (rejectedIndexes.length > 0) {
        return {
            ok: false,
            response: {
                ...buildConfiguredInputRejection(
                    'FIP_BATCH_REJECTED',
                    'The complete FIP batch was rejected atomically.',
                    {
                        rejected_indexes: rejectedIndexes
                    }
                ),
                intake_results: intakeResults
            }
        };
    }

    return {
        ok: true,
        mode: 'scout_fip',
        predictions: intakeResults.map((result) => result.envelope),
        intake_results: intakeResults,
        source: 'scout_fip'
    };
}

async function runPipelineFromConfiguredDataMode(options = {}) {
     console.log('PIPELINE STARTED');

     const resolvedInput = await resolveConfiguredPredictionInput(options);
     if (!resolvedInput.ok) {
         return resolvedInput.response;
     }

     const {
         mode,
         predictions,
         intake_results: intakeResults
     } = resolvedInput;

     const eligiblePredictions = (Array.isArray(predictions) ? predictions : []).filter((item) =>
         isDeploymentSportEnabled(
             item?.sport
             || item?.match_info?.sport
             || item?.match?.sport
             || item?.raw_provider_data?.sport
             || 'Football'
         )
     );

    if (isRunning) {
        console.warn('[aiPipeline] blocked: pipeline already running');
        return { mode, inserted: [], filtered: [], filtered_valid: 0, filtered_invalid: 0, error: 'Pipeline already running' };
    }

    isRunning = true;

    try {
        return await withTransaction(async (client) => {
            const inserted = [];
            const seenRawKeys = new Set();

        console.log('[aiPipeline] DATA_MODE=%s provider_items=%s eligible_Football=%s', mode, predictions.length, eligiblePredictions.length);

        for (const item of eligiblePredictions) {
            const fixtureId = String(item?.id || item?.match_id || item?.match_info?.match_id || '').trim();
            console.log('LOOP RUNNING:', fixtureId || 'unknown_fixture');
            const raw = await buildRawPredictionFromProviderItem({
                ...item,
                data_mode: mode
            });
            if (!raw || raw.rejected) continue;
            if (!isDeploymentSportEnabled(raw.sport)) continue;
            const dedupeKey = rawDedupeKey(raw);
            if (seenRawKeys.has(dedupeKey)) continue;
            seenRawKeys.add(dedupeKey);

            const row = await insertRawPrediction(raw, client);
            inserted.push(row);
        }

        const filtered = [];
        let filteredValid = 0;
        let filteredInvalid = 0;

        for (const row of inserted) {
            const n = await filterRawPrediction({ rawId: row.id, tier: 'normal' }, client);
            const d = await filterRawPrediction({ rawId: row.id, tier: 'deep' }, client);
            filtered.push(n, d);
        }

        for (const f of filtered) {
            if (f.is_valid) filteredValid++;
            else filteredInvalid++;
        }

        console.log('[aiPipeline] mode=%s inserted_raw=%s filtered_valid=%s filtered_invalid=%s', mode, inserted.length, filteredValid, filteredInvalid);

            return {
                mode,
                intake_results: intakeResults,
                inserted,
                filtered,
                filtered_valid: filteredValid,
                filtered_invalid: filteredInvalid,
                skipped_non_football: Math.max(0, predictions.length - eligiblePredictions.length)
            };
        });
    } finally {
        isRunning = false;
    }
}

async function rebuildFinalOutputs(options = {}) {
    const requestedSports = Array.isArray(options.requestedSports)
        ? options.requestedSports
        : (options.requestedSports ? [options.requestedSports] : []);
    const triggerSource = String(options.triggerSource || 'manual');
    const runScope = requestedSports.length ? requestedSports.join(',') : 'all';
    const staleRunHours = Math.max(1, Number(process.env.SKCS_STALE_RUN_HOURS || 2));

    await query(
        `
        UPDATE prediction_publish_runs
        SET
            status = 'failed',
            completed_at = COALESCE(completed_at, NOW()),
            error_message = CASE
                WHEN COALESCE(error_message, '') = '' THEN
                    CONCAT('Auto-closed stale running publish run by rebuild (> ', $1::text, 'h).')
                ELSE error_message
            END,
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'stale_auto_closed_at', NOW(),
                'stale_threshold_hours', $1::int
            )
        WHERE status = 'running'
          AND started_at < NOW() - make_interval(hours => $1::int)
        `,
        [staleRunHours]
    );

    const runRes = await query(
        `
        INSERT INTO prediction_publish_runs (
            trigger_source,
            requested_sports,
            run_scope,
            status,
            notes,
            metadata
        )
        VALUES ($1, $2::text[], $3, 'running', $4, $5::jsonb)
        RETURNING *;
        `,
        [
            triggerSource,
            requestedSports,
            runScope,
            options.notes || null,
            JSON.stringify({
                ...(options.metadata || {}),
                rebuild_started_at: new Date().toISOString(),
                stale_run_hours: staleRunHours
            })
        ]
    );

    const publishRun = runRes.rows[0];

    try {
        const buildOptions = {
            publishRunId: publishRun.id,
            requestedSports,
            telemetryRunId: options.telemetryRunId || null
        };
        const deep = await buildFinalForTier('deep', buildOptions);
        const normal = await buildFinalForTier('normal', buildOptions);
        const summary = {
            normal: {
                direct: normal?.direct?.length || 0,
                secondary: normal?.secondary?.length || 0,
                same_match: normal?.same_match?.length || 0,
                multi: normal?.multi?.length || 0,
                acca_6match: normal?.acca_6match?.length || 0,
                mega_acca_12: normal?.mega_acca_12?.length || 0
            },
            deep: {
                direct: deep?.direct?.length || 0,
                secondary: deep?.secondary?.length || 0,
                same_match: deep?.same_match?.length || 0,
                multi: deep?.multi?.length || 0,
                acca_6match: deep?.acca_6match?.length || 0,
                mega_acca_12: deep?.mega_acca_12?.length || 0
            }
        };

        await query(
            `
            UPDATE prediction_publish_runs
            SET status = 'completed',
                completed_at = NOW(),
                error_message = NULL,
                metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
            WHERE id = $1
            `,
            [
                publishRun.id,
                JSON.stringify({
                    summary,
                    rebuild_completed_at: new Date().toISOString()
                })
            ]
        );

        return {
            publish_run: {
                id: publishRun.id,
                trigger_source: publishRun.trigger_source,
                requested_sports: publishRun.requested_sports,
                status: 'completed'
            },
            normal,
            deep
        };
    } catch (error) {
        await query(
            `
            UPDATE prediction_publish_runs
            SET status = 'failed',
                completed_at = NOW(),
                error_message = $2,
                metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb
            WHERE id = $1
            `,
            [
                publishRun.id,
                error.message,
                JSON.stringify({
                    rebuild_failed_at: new Date().toISOString(),
                    failure_name: error?.name || 'Error'
                })
            ]
        );
        throw error;
    }
}

module.exports = {
    runPipelineForMatches,
    runPipelineFromConfiguredDataMode,
    rebuildFinalOutputs,
    __test: {
        extractFootballHighlightsTeamIds,
        applyFootballH2HEnrichment,
        resolveConfiguredPredictionInput,
        buildConfiguredInputRejection,
        buildGovernedFipProvenanceMetadata
    }
};
