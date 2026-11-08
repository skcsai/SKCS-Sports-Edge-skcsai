'use strict';

const { createClient } = require('@supabase/supabase-js');
const { query: dbQuery } = require('../db');
const { selectSecondaryMarkets } = require('../utils/secondaryMarketSelector');
const { generateInsight, isDolphinAvailable, isGroqAvailable } = require('./aiProvider');
const { FOOTBALL_RULES } = require('../config/footballRules');
const config = require('../config');
const { executeOperation } = require('../core/executionPipeline');

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
    : null;

let leagueStatsSchemaPromise = null;
const leagueStatsCache = new Map();
const LEAGUE_STATS_CACHE_TTL_MS = 30 * 60 * 1000;

function asNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function clampConfidence(value) {
    return Math.max(0, Math.min(100, Math.round(asNumber(value, 0))));
}

function normalizePercent(value) {
    const raw = asNumber(value, NaN);
    if (!Number.isFinite(raw)) return null;
    if (raw > 0 && raw <= 1) return Math.max(0, Math.min(100, raw * 100));
    return Math.max(0, Math.min(100, raw));
}

function normalizeRate(value, fallback = null) {
    const pct = normalizePercent(value);
    if (pct === null) return fallback;
    return pct / 100;
}

function normalizeBaseline(rawBaseline) {
    const baseline = rawBaseline && typeof rawBaseline === 'object' ? rawBaseline : {};
    let home = normalizePercent(baseline.home);
    let draw = normalizePercent(baseline.draw);
    let away = normalizePercent(baseline.away);
    if (home === null || draw === null || away === null) return null;

    const sum = home + draw + away;
    if (sum <= 0) return null;

    home = Math.round((home / sum) * 100);
    draw = Math.round((draw / sum) * 100);
    away = Math.max(0, 100 - home - draw);

    return { home, draw, away };
}

function blendBaselines(primary, secondary, secondaryWeight = 0.55) {
    if (!primary) return secondary || null;
    if (!secondary) return primary || null;
    const weight = Math.max(0, Math.min(1, asNumber(secondaryWeight, 0.55)));
    const mixed = {
        home: (primary.home * (1 - weight)) + (secondary.home * weight),
        draw: (primary.draw * (1 - weight)) + (secondary.draw * weight),
        away: (primary.away * (1 - weight)) + (secondary.away * weight)
    };
    return normalizeBaseline(mixed);
}

function getRiskTier(confidence) {
    const score = clampConfidence(confidence);
    const bands = FOOTBALL_RULES.confidenceBands || {};
    
    // Check if the new bands exist (lowRisk / mediumRisk)
    if (bands.lowRisk) {
        if (score >= bands.lowRisk.min) return bands.lowRisk.label;
        if (bands.mediumRisk && score >= bands.mediumRisk.min) return bands.mediumRisk.label;
        if (bands.highRisk && score >= bands.highRisk.min) return bands.highRisk.label;
        return bands.extremeRisk?.label || 'EXTREME_RISK';
    }
    
    // Fallback to old band naming if needed
    if (bands.highConfidence) {
        if (score >= bands.highConfidence.min) return bands.highConfidence.label;
        if (bands.moderateRisk && score >= bands.moderateRisk.min) return bands.moderateRisk.label;
        if (bands.highRisk && score >= bands.highRisk.min) return bands.highRisk.label;
        return bands.extremeRisk?.label || 'EXTREME_RISK';
    }
    
    // Hardcoded safety fallback conforming to the new rulebook specification
    if (score >= 75) return 'LOW_RISK';
    if (score >= 55) return 'MEDIUM_RISK';
    if (score >= 30) return 'HIGH_RISK';
    return 'EXTREME_RISK';
}

function toLegacyRiskLevel(confidence) {
    return clampConfidence(confidence) >= 75 ? 'safe' : 'medium';
}

function normalizePrediction(prediction) {
    const key = String(prediction || '').trim().toLowerCase().replace(/\s+/g, '_');
    if (key === 'home' || key === 'home_win' || key === '1') return 'home_win';
    if (key === 'draw' || key === 'x') return 'draw';
    if (key === 'away' || key === 'away_win' || key === '2') return 'away_win';
    return 'home_win';
}

function prettyPrediction(prediction) {
    const normalized = normalizePrediction(prediction);
    if (normalized === 'home_win') return 'HOME WIN';
    if (normalized === 'draw') return 'DRAW';
    return 'AWAY WIN';
}

function resolveLeagueName(fixture) {
    return String(
        fixture?.league
        || fixture?.league_name
        || fixture?.competition
        || fixture?.metadata?.league
        || fixture?.raw_provider_data?.league?.name
        || ''
    ).trim();
}

function getLeagueDefaultBaseline(leagueName) {
    const key = String(leagueName || '').trim().toLowerCase();
    if (!key) return null;

    if (key.includes('premier') || key.includes('epl')) return { home: 45, draw: 27, away: 28 };
    if (key.includes('la liga') || key.includes('laliga')) return { home: 44, draw: 29, away: 27 };
    if (key.includes('serie a')) return { home: 43, draw: 28, away: 29 };
    if (key.includes('bundesliga')) return { home: 46, draw: 24, away: 30 };
    if (key.includes('ligue 1')) return { home: 42, draw: 30, away: 28 };
    if (key.includes('championship') || key.includes('segunda') || key.includes('2') || key.includes('league one')) {
        return { home: 40, draw: 30, away: 30 };
    }
    if (key.includes('amateur') || key.includes('regional') || key.includes('division') || key.includes('super amateur')) {
        return { home: 40, draw: 30, away: 30 };
    }
    return null;
}

function extractThreeWayOdds(odds) {
    if (!odds || typeof odds !== 'object') return null;

    const home = asNumber(
        odds.home ?? odds.h ?? odds.home_odds ?? odds.homeWin ?? odds.one,
        NaN
    );
    const draw = asNumber(
        odds.draw ?? odds.d ?? odds.draw_odds ?? odds.x,
        NaN
    );
    const away = asNumber(
        odds.away ?? odds.a ?? odds.away_odds ?? odds.awayWin ?? odds.two,
        NaN
    );

    if (home > 1 && draw > 1 && away > 1) {
        return { home, draw, away };
    }

    const h2h = Array.isArray(odds.h2h) ? odds.h2h : null;
    if (h2h && h2h.length >= 3) {
        const h = asNumber(h2h[0], NaN);
        const d = asNumber(h2h[1], NaN);
        const a = asNumber(h2h[2], NaN);
        if (h > 1 && d > 1 && a > 1) return { home: h, draw: d, away: a };
    }

    return null;
}

function buildBaselineFromOdds(fixture) {
    const candidates = [
        extractThreeWayOdds(fixture?.odds),
        extractThreeWayOdds(fixture?.raw_provider_data?.odds),
        extractThreeWayOdds(fixture?.metadata?.odds)
    ];

    const odds = candidates.find(Boolean);
    if (!odds) return null;

    const invHome = 1 / odds.home;
    const invDraw = 1 / odds.draw;
    const invAway = 1 / odds.away;
    const sum = invHome + invDraw + invAway;
    if (!Number.isFinite(sum) || sum <= 0) return null;

    return normalizeBaseline({
        home: (invHome / sum) * 100,
        draw: (invDraw / sum) * 100,
        away: (invAway / sum) * 100
    });
}

async function getLeagueStatsSchema() {
    if (leagueStatsSchemaPromise) return leagueStatsSchemaPromise;

    leagueStatsSchemaPromise = (async () => {
        try {
            const existsResult = await dbQuery(`SELECT to_regclass('public.league_stats')::text AS rel`);
            const exists = Boolean(existsResult?.rows?.[0]?.rel);
            if (!exists) return null;

            const colsResult = await dbQuery(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = 'league_stats'
            `);
            const columns = new Set((colsResult.rows || []).map((row) => String(row.column_name || '').trim()));
            return columns;
        } catch (error) {
            console.warn('[direct1x2Builder] league_stats schema probe failed:', error.message);
            return null;
        }
    })();

    return leagueStatsSchemaPromise;
}

function pickColumn(columns, candidates) {
    if (!columns) return null;
    return candidates.find((column) => columns.has(column)) || null;
}

async function fetchLeagueStats(leagueName) {
    const key = String(leagueName || '').trim().toLowerCase();
    if (!key) return null;

    const cached = leagueStatsCache.get(key);
    if (cached && (Date.now() - cached.updatedAt) < LEAGUE_STATS_CACHE_TTL_MS) {
        return cached.payload;
    }

    const columns = await getLeagueStatsSchema();
    if (!columns) return null;

    const leagueCol = pickColumn(columns, ['league_name', 'league', 'competition', 'name']);
    if (!leagueCol) return null;

    const homeCol = pickColumn(columns, ['home_win_rate', 'home_win_pct', 'home_rate', 'home_pct', 'home']);
    const drawCol = pickColumn(columns, ['draw_rate', 'draw_pct', 'draw']);
    const awayCol = pickColumn(columns, ['away_win_rate', 'away_win_pct', 'away_rate', 'away_pct', 'away']);
    const avgGoalsCol = pickColumn(columns, ['avg_goals_per_game', 'goals_per_game', 'avg_goals', 'league_avg_goals', 'avg_total_goals']);
    const bttsCol = pickColumn(columns, ['btts_rate', 'btts_yes_rate', 'btts_pct', 'both_teams_score_rate', 'both_teams_to_score_rate']);
    const orderCol = pickColumn(columns, ['updated_at', 'created_at', 'season']);

    const selectedCols = [leagueCol, homeCol, drawCol, awayCol, avgGoalsCol, bttsCol].filter(Boolean);
    if (!selectedCols.length) return null;

    const selectClause = selectedCols.map((column) => `"${column}"`).join(', ');
    const orderClause = orderCol ? ` ORDER BY "${orderCol}" DESC NULLS LAST` : '';

    try {
        const exact = await dbQuery(
            `SELECT ${selectClause}
             FROM public.league_stats
             WHERE LOWER("${leagueCol}") = LOWER($1)
             ${orderClause}
             LIMIT 1`,
            [leagueName]
        );

        let row = exact.rows?.[0] || null;
        if (!row) {
            const partial = await dbQuery(
                `SELECT ${selectClause}
                 FROM public.league_stats
                 WHERE LOWER("${leagueCol}") LIKE LOWER($1)
                 ${orderClause}
                 LIMIT 1`,
                [`%${leagueName}%`]
            );
            row = partial.rows?.[0] || null;
        }

        if (!row) return null;

        const payload = {
            home_win_rate: normalizePercent(homeCol ? row[homeCol] : null),
            draw_rate: normalizePercent(drawCol ? row[drawCol] : null),
            away_win_rate: normalizePercent(awayCol ? row[awayCol] : null),
            avg_goals_per_game: asNumber(avgGoalsCol ? row[avgGoalsCol] : null, NaN),
            btts_rate: normalizeRate(bttsCol ? row[bttsCol] : null, null)
        };

        leagueStatsCache.set(key, { payload, updatedAt: Date.now() });
        return payload;
    } catch (error) {
        console.warn('[direct1x2Builder] league_stats fetch failed:', error.message);
        return null;
    }
}

async function getContextualBaseline(fixture) {
    const leagueName = resolveLeagueName(fixture);
    const leagueStats = await fetchLeagueStats(leagueName);

    const statsBaseline = normalizeBaseline({
        home: leagueStats?.home_win_rate,
        draw: leagueStats?.draw_rate,
        away: leagueStats?.away_win_rate
    });

    const oddsBaseline = buildBaselineFromOdds(fixture);
    const blended = blendBaselines(statsBaseline, oddsBaseline, 0.6);

    if (blended) {
        return {
            baseline: blended,
            source: statsBaseline && oddsBaseline ? 'league_stats_plus_odds' : (oddsBaseline ? 'odds_implied' : 'league_stats'),
            data_sufficient: true,
            note: null,
            leagueStats
        };
    }

    const leagueDefault = getLeagueDefaultBaseline(leagueName);
    if (leagueDefault) {
        return {
            baseline: leagueDefault,
            source: 'league_default',
            data_sufficient: false,
            note: 'Probability split and secondary markets are based on league averages only.',
            leagueStats
        };
    }

    return {
        baseline: null,
        source: 'insufficient_data',
        data_sufficient: false,
        note: 'Limited data available for this match.',
        leagueStats
    };
}

function predictionKeyForBaseline(prediction) {
    const normalized = normalizePrediction(prediction);
    if (normalized === 'home_win') return 'home';
    if (normalized === 'away_win') return 'away';
    return 'draw';
}

function derivePredictionAndConfidence(_requestedPrediction, requestedConfidence, baseline) {
    const fallbackPrediction = normalizePrediction(_requestedPrediction);
    const fallbackConfidence = clampConfidence(requestedConfidence);

    if (!baseline) {
        return { prediction: fallbackPrediction, confidence: fallbackConfidence };
    }

    const scores = {
        home_win: asNumber(baseline.home, 0),
        draw: asNumber(baseline.draw, 0),
        away_win: asNumber(baseline.away, 0)
    };

    const bestPrediction = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'home_win';
    const prediction = bestPrediction;
    const key = predictionKeyForBaseline(prediction);
    const confidence = clampConfidence(baseline[key]);
    return { prediction, confidence };
}

function generateEdgeMindReport(fixture, confidence, riskTier, contextual) {
    const baseline = contextual?.baseline;
    const prediction = normalizePrediction(fixture?.prediction || fixture?.recommendation);
    const baselineKey = predictionKeyForBaseline(prediction);
    const stageOneSelected = baseline ? clampConfidence(baseline[baselineKey]) : clampConfidence(confidence);
    const otherValues = baseline
        ? [baseline.home, baseline.draw, baseline.away].filter((value) => Number.isFinite(Number(value)) && value !== baseline[baselineKey])
        : [];
    const stageOneOther = otherValues.length ? clampConfidence(Math.max(...otherValues)) : Math.max(0, 100 - stageOneSelected);

    const parts = [];
    parts.push(`Stage 1 Baseline: ${prettyPrediction(prediction)} ${stageOneSelected}% vs ${stageOneOther}%.`);

    const contextNotes = String(
        fixture?.contextNotes
        || fixture?.context
        || (resolveLeagueName(fixture) ? `League profile: ${resolveLeagueName(fixture)}` : '')
    ).trim();
    if (contextNotes) parts.push(`Stage 2 Context: ${contextNotes}.`);

    const weather = String(fixture?.weather || fixture?.weatherSummary || '').trim();
    const volatility = String(fixture?.volatility || 'medium').trim().toLowerCase();
    if (weather) {
        parts.push(`Stage 3 Reality: ${weather} conditions - ${volatility} volatility.`);
    } else {
        parts.push(`Stage 3 Reality: ${volatility} volatility profile.`);
    }

    if (confidence < 55 || riskTier === 'HIGH_RISK' || riskTier === 'EXTREME_RISK') {
        parts.push('Stage 4 Decision: 1X2 is fragile - see secondary markets.');
    } else {
        parts.push('Stage 4 Decision: Maintain 1X2 only with lower-variance alternatives in view.');
    }

    if (!contextual?.data_sufficient) {
        parts.push('Limited data available: this match is modeled from league averages.');
    }

    return parts.join(' ');
}

function buildMatchesPayload(fixture, confidence, prediction, riskTier, secondaryMarkets, contextual, secondaryNote) {
    const stage1Baseline = contextual?.baseline || null;
    const leagueName = resolveLeagueName(fixture);

    return [{
        fixture_id: String(fixture?.fixture_id || fixture?.id || fixture?.match_id || ''),
        home_team: String(fixture?.home_team || ''),
        away_team: String(fixture?.away_team || ''),
        market: '1X2',
        prediction: normalizePrediction(prediction),
        confidence: clampConfidence(confidence),
        match_date: fixture?.match_date || fixture?.date || fixture?.commence_time || null,
        sport: String(fixture?.sport || 'football'),
        risk_tier: riskTier,
        secondary_markets: secondaryMarkets,
        metadata: {
            league: leagueName || null,
            pipeline_data: {
                stage_1_baseline: stage1Baseline,
                baseline_source: contextual?.source || null,
                data_sufficient: Boolean(contextual?.data_sufficient),
                data_note: contextual?.note || null,
                secondary_markets_note: secondaryNote || null,
                league_metrics: contextual?.leagueStats || null
            }
        }
    }];
}

async function buildAndStoreDirect1X2(fixture, confidence, prediction, additionalData = {}) {
    if (!supabase) {
        return { success: false, error: new Error('Supabase is not configured (SUPABASE_URL / key missing).') };
    }

    const fixtureId = String(fixture?.fixture_id || fixture?.id || fixture?.match_id || '').trim();
    if (!fixtureId) {
        return { success: false, error: new Error('fixture_id is required') };
    }

    // ── STRICT: Only use real API probability baseline - no fallbacks ──
    const apiProbability = fixture?.api_probability;
    let baseline = null;
    let predictionSource = 'unknown';
    let apiSource = 'api_sports';

    if (apiProbability && typeof apiProbability === 'object') {
        const parseApiPct = (val) => { const n = parseFloat(String(val || '0').replace('%', '').trim()); return Number.isFinite(n) ? n : 0; };
        const apiHome = parseApiPct(apiProbability.home);
        const apiDraw = parseApiPct(apiProbability.draw);
        const apiAway = parseApiPct(apiProbability.away);
        if (apiHome + apiDraw + apiAway > 0) {
            baseline = normalizeBaseline({ home: apiHome, draw: apiDraw, away: apiAway });
            if (baseline) {
                predictionSource = 'api_predictions';
            }
        }
    }

    if (!baseline) {
        return { success: false, error: new Error('No valid API probability provided - cannot generate prediction without real data') };
    }

    const derived = derivePredictionAndConfidence(prediction || fixture?.prediction, confidence, baseline);
    const score = derived.confidence;
    const normalizedPrediction = normalizePrediction(derived.prediction);
    const riskTier = getRiskTier(score);

    const contextual = { baseline, source: 'api_probability', data_sufficient: true, leagueStats: null };
    const secondarySelection = score < 72
        ? selectSecondaryMarkets(
            { ...fixture, prediction: normalizedPrediction, baseline: contextual?.baseline, leagueStats: contextual?.leagueStats },
            { baseline: contextual?.baseline, leagueStats: contextual?.leagueStats }
        )
        : { markets: [], note: null };
    const secondaryMarkets = Array.isArray(secondarySelection?.markets) ? secondarySelection.markets : [];
    const secondaryNote = secondarySelection?.note || null;

    // Generate insight - use AI if available, otherwise template
    // Priority: 1) Groq API (fast/cheap), 2) Local Dolphin, 3) Template fallback
    let edgemindReport;
    let marketName = prettyPrediction(normalizedPrediction);
    let aiSource = 'template';
    let finalScore = score; // Default to baseline-derived score
    
    try {
        const groqReady = await isGroqAvailable();
        const dolphinReady = groqReady ? false : await isDolphinAvailable(); // Skip Dolphin if Groq ready
        
        if (groqReady || dolphinReady) {
            console.log(`[direct1x2Builder] Generating AI insight for ${fixture?.home_team} vs ${fixture?.away_team} via ${groqReady ? 'Groq' : 'Dolphin'}...`);
            
            // Pass api_probability instead of baseline to avoid "41% baseline" in prose
            const apiProbText = baseline ? `Home: ${baseline.home}%, Draw: ${baseline.draw}%, Away: ${baseline.away}%` : 'Not available';
            
            const insightResult = await executeOperation({
                operation: 'direct1x2.generateInsight',
                caller: 'backend/services/direct1x2Builder.js',
                payload: {
                    fixture_id: fixture?.fixture_id || fixture?.id || null,
                    provider_chain: groqReady ? 'groq' : 'dolphin'
                },
                execute: async () => generateInsight({
                    home: fixture?.home_team,
                    away: fixture?.away_team,
                    league: resolveLeagueName(fixture),
                    kickoff: fixture?.match_date || fixture?.commence_time,
                    market: marketName,
                    confidence: score,
                    formData: contextual?.leagueStats ? `League: ${contextual.leagueStats.matches} matches, Home win rate: ${(contextual.leagueStats.homeWinRate * 100).toFixed(1)}%` : null,
                    h2h: null,
                    weather: fixture?.weather || fixture?.weatherSummary,
                    absences: null,
                    api_probability: apiProbText,
                    telemetry: {
                        pipeline_name: 'direct1x2Builder',
                        task_name: 'generateInsight',
                        budget_class: 'Important',
                        knowledge_context: contextual?.leagueStats ? 'hybrid' : 'static',
                        monthly_risk: 'High',
                        fixture_id: fixture?.fixture_id || fixture?.id || null,
                        provider_chain: groqReady ? 'groq' : 'dolphin'
                    }
                })
            });
            const aiInsight = insightResult?.result;
            
            if (aiInsight && aiInsight.edgemind_report) {
                edgemindReport = aiInsight.edgemind_report;
                marketName = aiInsight.market_name || marketName;
                aiSource = groqReady ? 'groq' : 'dolphin';
                // Use AI-calculated confidence if available, otherwise keep baseline score
                if (aiInsight.confidence && typeof aiInsight.confidence === 'number') {
                    finalScore = Math.max(0, Math.min(100, aiInsight.confidence));
                    console.log(`[direct1x2Builder] Using AI-calculated confidence: ${finalScore}% (baseline was ${score}%)`);
                }
                console.log(`[direct1x2Builder] AI insight generated successfully via ${aiSource}`);
            } else {
                console.log(`[direct1x2Builder] AI insight failed, using template fallback`);
                edgemindReport = generateEdgeMindReport(
                    { ...fixture, prediction: normalizedPrediction },
                    score,
                    riskTier,
                    contextual
                );
            }
        } else {
            edgemindReport = generateEdgeMindReport(
                { ...fixture, prediction: normalizedPrediction },
                score,
                riskTier,
                contextual
            );
        }
    } catch (err) {
        console.error(`[direct1x2Builder] Error generating insight: ${err.message}`);
        edgemindReport = generateEdgeMindReport(
            { ...fixture, prediction: normalizedPrediction },
            score,
            riskTier,
            contextual
        );
    }

    const row = {
        fixture_id: fixtureId,
        sport: String(fixture?.sport || 'football'),
        home_team: String(fixture?.home_team || ''),
        away_team: String(fixture?.away_team || ''),
        confidence: finalScore,
        total_confidence: finalScore,
        risk_tier: getRiskTier(finalScore),
        risk_level: toLegacyRiskLevel(finalScore),
        prediction: normalizedPrediction,
        recommendation: prettyPrediction(normalizedPrediction),
        market_type: '1X2',
        tier: 'normal',
        type: 'direct',
        match_date: fixture?.match_date || fixture?.date || fixture?.commence_time || null,
        matches: buildMatchesPayload(
            {
                ...fixture,
                _probability_source: fixture?.prediction_source || 'unknown',
                _api_probability: fixture?.api_probability || null
            },
            finalScore, normalizedPrediction, getRiskTier(finalScore), secondaryMarkets, contextual, secondaryNote
        ),
        secondary_markets: secondaryMarkets,
        secondary_insights: secondaryMarkets,
        edgemind_report: additionalData?.edgemind_report || edgemindReport,
        created_at: new Date().toISOString()
    };

    const best1x2Market = normalizedPrediction === 'home_win' ? 'home' : (normalizedPrediction === 'away_win' ? 'away' : 'draw');
    const best1x2Pct = baseline[best1x2Market];

    const direct1x2Row = {
        fixture_id: fixtureId,
        sport: String(fixture?.sport || 'football'),
        home_team: String(fixture?.home_team || ''),
        away_team: String(fixture?.away_team || ''),
        match_date: fixture?.match_date || fixture?.date || fixture?.commence_time || null,
        league: resolveLeagueName(fixture),
        home_pct: baseline.home,
        draw_pct: baseline.draw,
        away_pct: baseline.away,
        best_1x2_market: best1x2Market,
        best_1x2_pct: best1x2Pct,
        risk_tier: riskTier,
        prediction_source: predictionSource,
        api_source: apiSource,
        metadata: {
            _api_probability: fixture?.api_probability || null,
            _probability_source: fixture?.prediction_source || 'unknown'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const existingResult = await supabase
        .from('direct1x2_prediction_final')
        .select('id')
        .eq('fixture_id', fixtureId)
        .eq('type', 'direct')
        .eq('tier', 'normal')
        .is('publish_run_id', null)
        .limit(1);

    if (existingResult.error) {
        console.error('[direct1x2Builder] lookup failed:', existingResult.error.message);
    }

    const existingId = existingResult?.data?.[0]?.id || null;
    const mutation = existingId
        ? supabase.from('direct1x2_prediction_final').update(row).eq('id', existingId).select('*').single()
        : supabase.from('direct1x2_prediction_final').insert(row).select('*').single();

    let { data, error } = await mutation;
    if (error && String(error.message || '').toLowerCase().includes('uq_predictions_final_live_direct_fixture_market')) {
        let fallbackId = null;

        if (row.fixture_id) {
            try {
                const lookup = await dbQuery(
                    `
                    SELECT id
                    FROM direct1x2_prediction_final
                    WHERE LOWER(COALESCE(sport, '')) = LOWER($1)
                      AND LOWER(COALESCE(type, '')) = 'direct'
                      AND LOWER(COALESCE(tier, '')) = 'normal'
                      AND LOWER(COALESCE(market_type, '')) = '1x2'
                      AND publish_run_id IS NULL
                      AND NULLIF(BTRIM(matches->0->>'fixture_id'), '') = $2
                    ORDER BY id DESC
                    LIMIT 1
                    `,
                    [row.sport, row.fixture_id]
                );
                fallbackId = lookup?.rows?.[0]?.id || null;
            } catch (lookupError) {
                console.warn('[direct1x2Builder] conflict lookup by matches fixture_id failed:', lookupError.message);
            }
        }

        if (!fallbackId) {
            const byTeams = await supabase
                .from('direct1x2_prediction_final')
                .select('id')
                .eq('sport', row.sport)
                .eq('type', 'direct')
                .eq('tier', 'normal')
                .eq('market_type', '1X2')
                .eq('home_team', row.home_team)
                .eq('away_team', row.away_team)
                .is('publish_run_id', null)
                .order('id', { ascending: false })
                .limit(1);
            fallbackId = byTeams?.data?.[0]?.id || null;
        }

        if (fallbackId) {
            // Update only the fields that should change, preserving tier, type, and publish_run_id
            const updateFields = {
                total_confidence: row.total_confidence,
                matches: row.matches,
                recommendation: row.recommendation,
                edgemind_report: row.edgemind_report,
                secondary_insights: row.secondary_insights,
                expires_at: row.expires_at
            };
            
            // Add optional fields if they exist in the row
            if (row.sport !== undefined) updateFields.sport = row.sport;
            if (row.market_type !== undefined) updateFields.market_type = row.market_type;
            if (row.prediction !== undefined) updateFields.prediction = row.prediction;
            if (row.confidence !== undefined) updateFields.confidence = row.confidence;
            if (row.match_date !== undefined) updateFields.match_date = row.match_date;
            if (row.risk_tier !== undefined) updateFields.risk_tier = row.risk_tier;
            
            const retry = await supabase
                .from('direct1x2_prediction_final')
                .update(updateFields)
                .eq('id', fallbackId)
                .select('*')
                .single();
            data = retry.data;
            error = retry.error;
            
            if (!error) {
                console.log('[direct1x2Builder] Updated existing fallback prediction instead of inserting duplicate:', fallbackId);
            }
        }
    }

    if (error) {
        console.error('[direct1x2Builder] write failed:', error.message);
        return { success: false, error };
    }

    const existingDirect1x2Result = await supabase
        .from('direct_1x2_predictions')
        .select('id')
        .eq('fixture_id', fixtureId)
        .limit(1);

    if (existingDirect1x2Result.error) {
        console.error('[direct1x2Builder] direct_1x2_predictions lookup failed:', existingDirect1x2Result.error.message);
    }

    const existingDirect1x2Id = existingDirect1x2Result?.data?.[0]?.id || null;
    const direct1x2Mutation = existingDirect1x2Id
        ? supabase.from('direct_1x2_predictions').update(direct1x2Row).eq('id', existingDirect1x2Id).select('*').single()
        : supabase.from('direct_1x2_predictions').insert(direct1x2Row).select('*').single();

    let direct1x2Result = await direct1x2Mutation;
    if (direct1x2Result.error) {
        console.error('[direct1x2Builder] direct_1x2_predictions write failed:', direct1x2Result.error.message);
    } else {
        console.log('[direct1x2Builder] direct_1x2_predictions upsert successful:', direct1x2Result.data?.id);
    }

    // Enable sync trigger if relational tables feature flag is enabled
    if (config.USE_RELATIONAL_TABLES && data?.id) {
        try {
            // Check if trigger exists and is enabled
            const triggerCheck = await dbQuery(`
                SELECT tgname
                FROM pg_trigger
                WHERE tgname = 'trg_sync_to_normalized_tables'
                AND tgrelid = 'direct1x2_prediction_final'::regclass
            `);
            
            if (triggerCheck.rows.length === 0) {
                // Enable the sync trigger
                await dbQuery(`
                    CREATE TRIGGER trg_sync_to_normalized_tables
                    AFTER INSERT OR UPDATE ON direct1x2_prediction_final
                    FOR EACH ROW
                    EXECUTE FUNCTION trg_sync_to_normalized_tables()
                `);
                console.log('[direct1x2Builder] Enabled sync trigger for normalized tables');
            }
        } catch (triggerError) {
            console.warn('[direct1x2Builder] Failed to enable sync trigger:', triggerError.message);
            // Continue without failing the operation
        }
    }

    return {
        success: true,
        data,
        riskTier,
        secondaryMarkets,
        secondaryNote,
        baseline: contextual?.baseline || null,
        data_sufficient: Boolean(contextual?.data_sufficient)
    };
}

module.exports = {
    buildAndStoreDirect1X2,
    generateEdgeMindReport,
    getContextualBaseline,
    getRiskTier
};
