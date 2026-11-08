'use strict';

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { getRiskTier } = require('../services/direct1x2Builder');

const router = express.Router();

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = String(process.env.SUPABASE_ANON_KEY || '').trim();

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
    : null;

function asNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function extractPipelineData(row, firstMatch) {
    const candidates = [
        firstMatch?.metadata?.pipeline_data,
        row?.pipeline_data
    ];
    return candidates.find((candidate) => candidate && typeof candidate === 'object') || {};
}

const INVALID_TEAM_TOKENS = new Set([
    'unknown',
    'unknown home',
    'unknown away',
    'home team',
    'away team',
    'tbd',
    'n/a'
]);

function isValidIdentityText(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    return !INVALID_TEAM_TOKENS.has(text.toLowerCase());
}

function isPredictionRowIdentityValid(row) {
    const firstMatch = Array.isArray(row?.matches) && row.matches.length ? row.matches[0] : {};
    const home = String(row?.home_team || firstMatch?.home_team || firstMatch?.home_team_name || '').trim();
    const away = String(row?.away_team || firstMatch?.away_team || firstMatch?.away_team_name || '').trim();
    const sport = String(row?.sport || firstMatch?.sport || '').trim().toLowerCase();

    if (!isValidIdentityText(home) || !isValidIdentityText(away)) return false;
    if (!sport || sport === 'unknown') return false;
    return true;
}

function normalizeProbability(value) {
    const raw = asNumber(value, NaN);
    if (!Number.isFinite(raw)) return null;
    const pct = raw > 0 && raw <= 1 ? raw * 100 : raw;
    const bounded = Math.max(0, Math.min(100, pct));
    return Math.round(bounded);
}

function extractStage1Baseline(row, firstMatch) {
    const candidates = [
        firstMatch?.metadata?.pipeline_data?.stage_1_baseline,
        firstMatch?.metadata?.stage_1_baseline,
        firstMatch?.pipeline_data?.stage_1_baseline,
        row?.pipeline_data?.stage_1_baseline,
        row?.stage_1_baseline
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue;
        const home = normalizeProbability(candidate.home);
        const draw = normalizeProbability(candidate.draw);
        const away = normalizeProbability(candidate.away);
        if (home === null || draw === null || away === null) continue;
        return { home, draw, away };
    }
    return null;
}

function inferStage1Baseline(prediction, confidence) {
    const score = Math.max(0, Math.min(100, Math.round(asNumber(confidence, 0))));
    const key = String(prediction || '').trim().toLowerCase().replace(/\s+/g, '_');
    let home = 33;
    let draw = 34;
    let away = 33;

    if (key === 'home_win' || key === 'home' || key === '1') {
        home = score;
        const remainder = Math.max(0, 100 - home);
        draw = Math.round(remainder * 0.55);
        away = Math.max(0, remainder - draw);
    } else if (key === 'away_win' || key === 'away' || key === '2') {
        away = score;
        const remainder = Math.max(0, 100 - away);
        draw = Math.round(remainder * 0.55);
        home = Math.max(0, remainder - draw);
    } else {
        draw = score;
        const remainder = Math.max(0, 100 - draw);
        home = Math.round(remainder / 2);
        away = Math.max(0, remainder - home);
    }

    return { home, draw, away };
}

function formatPredictionRow(row) {
    const firstMatch = Array.isArray(row?.matches) && row.matches.length ? row.matches[0] : {};
    const confidence = Math.max(
        0,
        Math.min(
            100,
            Math.round(asNumber(
                row?.confidence ?? row?.total_confidence ?? firstMatch?.confidence,
                0
            ))
        )
    );

    const prediction = String(
        row?.prediction
        || firstMatch?.prediction
        || row?.recommendation
        || 'home_win'
    ).trim();

    const secondaryMarkets = toArray(
        row?.secondary_markets && toArray(row.secondary_markets).length
            ? row.secondary_markets
            : row?.secondary_insights
    ).slice(0, 4);

    const riskTier = String(row?.risk_tier || '').trim() || getRiskTier(confidence);
    const pipelineData = extractPipelineData(row, firstMatch);
    const dataSufficient = typeof pipelineData?.data_sufficient === 'boolean' ? pipelineData.data_sufficient : true;
    const oneX2Probabilities = extractStage1Baseline(row, firstMatch)
        || (dataSufficient ? inferStage1Baseline(prediction, confidence) : null);
    const league = String(
        firstMatch?.metadata?.league
        || firstMatch?.metadata?.competition
        || firstMatch?.league
        || firstMatch?.metadata?.match_info?.league
        || firstMatch?.metadata?.match_context?.match_info?.league
        || row?.league
        || row?.competition
        || ''
    ).trim();
    const country = String(
        firstMatch?.metadata?.country
        || firstMatch?.metadata?.league_country
        || firstMatch?.country
        || firstMatch?.metadata?.match_info?.country
        || firstMatch?.metadata?.match_context?.match_info?.country
        || row?.country
        || ''
    ).trim();

    return {
        id: row?.id || null,
        fixture_id: String(row?.fixture_id || firstMatch?.fixture_id || ''),
        sport: row?.sport || firstMatch?.sport || 'Football',
        home_team: row?.home_team || firstMatch?.home_team || '',
        away_team: row?.away_team || firstMatch?.away_team || '',
        match_date: row?.match_date || firstMatch?.match_date || firstMatch?.commence_time || null,
        prediction,
        confidence,
        risk_tier: riskTier,
        one_x2_probabilities: oneX2Probabilities,
        data_sufficient: dataSufficient,
        data_note: String(pipelineData?.data_note || '').trim() || null,
        secondary_markets_note: String(pipelineData?.secondary_markets_note || '').trim() || null,
        baseline_source: String(pipelineData?.baseline_source || '').trim() || null,
        league: league || null,
        country: country || null,
        secondary_markets: secondaryMarkets,
        edgemind_report: row?.edgemind_report || '',
        caution_label: riskTier === 'EXTREME_RISK' ? 'EXTREME CAUTION ADVISED' : riskTier.replace(/_/g, ' ')
    };
}

// GET /api/direct-1x2?sport=football&risk_tier=EXTREME_RISK&limit=100
router.get('/', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase is not configured.' });
        }

        const sport = String(req.query?.sport || 'Football').trim();
        const riskTier = String(req.query?.risk_tier || '').trim().toUpperCase();
        const limit = Math.min(500, Math.max(1, Number.parseInt(String(req.query?.limit || '100'), 10) || 100));
        const historyDays = Math.max(0, Math.min(7, Number.parseInt(String(req.query?.history_days || '1'), 10) || 1));
        const windowDays = Math.max(1, Math.min(14, Number.parseInt(String(req.query?.window_days || '14'), 10) || 14));
        const latestRunOnly = !['0', 'false'].includes(String(req.query?.latest_run || '1').trim().toLowerCase());
        const now = new Date();
        const windowStartIso = new Date(now.getTime() - historyDays * 24 * 60 * 60 * 1000).toISOString();
        const windowEndIso = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000).toISOString();

        let latestRunId = null;
        if (latestRunOnly) {
            const { data: latestRows, error: latestError } = await supabase
                .from('direct1x2_prediction_final')
                .select('publish_run_id')
                .eq('sport', sport)
                .in('type', ['direct', 'single'])
                .not('publish_run_id', 'is', null)
                .order('publish_run_id', { ascending: false })
                .limit(1);

            if (latestError) throw latestError;
            latestRunId = Array.isArray(latestRows) && latestRows.length ? latestRows[0].publish_run_id : null;
        }

        let query = supabase
            .from('direct1x2_prediction_final')
            .select('*')
            .eq('sport', sport)
            .in('type', ['direct', 'single'])
            .not('match_date', 'is', null)
            .gte('match_date', windowStartIso)
            .lte('match_date', windowEndIso)
            .order('match_date', { ascending: true, nullsFirst: false })
            .limit(limit);

        if (riskTier) {
            query = query.eq('risk_tier', riskTier);
        }
        if (latestRunId !== null && latestRunId !== undefined) {
            query = query.eq('publish_run_id', latestRunId);
        }

        const { data, error } = await query;
        if (error) {
            throw error;
        }

        const predictions = (Array.isArray(data) ? data : [])
            .filter(isPredictionRowIdentityValid)
            .map(formatPredictionRow);
        return res.json({ predictions });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
