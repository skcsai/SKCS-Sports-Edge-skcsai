'use strict';

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireSupabaseUser } = require('../middleware/supabaseJwt');

const router = express.Router();

console.log('[cricketInsights] Router loaded successfully');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

// Status mapping for tolerant filtering
const STATUS_MAP = {
    completed: ['complete', 'completed', 'finished', 'ft', 'stumps', 'abandoned', 'cancelled', 'canceled'],
    active: ['active', 'live', 'in progress', 'in_progress', 'started'],
    upcoming: ['upcoming', 'scheduled', 'not started', 'not_started', 'pre-match', 'prematch', 'preview']
};

function getStatusCategory(status) {
    const normalized = String(status || '').toLowerCase();
    
    for (const [category, values] of Object.entries(STATUS_MAP)) {
        if (values.some(value => normalized.includes(value))) {
            return category;
        }
    }
    
    return 'unknown';
}

function filterByStatus(data, statusFilter) {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(row => {
        const statusCategory = getStatusCategory(row.status);
        const kickoffMs = row.start_time ? new Date(row.start_time).getTime() : NaN;
        const nowMs = Date.now();
        const hasFutureKickoff = Number.isFinite(kickoffMs) && kickoffMs >= (nowMs - (15 * 60 * 1000));
        
        switch (statusFilter) {
            case 'active':
                return statusCategory === 'active' || statusCategory === 'upcoming' || (statusCategory === 'unknown' && hasFutureKickoff);
            case 'upcoming':
                return statusCategory === 'upcoming' || (statusCategory === 'unknown' && hasFutureKickoff);
            case 'complete':
                return statusCategory === 'completed';
            case 'all':
                return true;
            default:
                return statusCategory === 'active' || statusCategory === 'upcoming' || (statusCategory === 'unknown' && hasFutureKickoff);
        }
    });
}

function groupByFixtures(insights) {
    const grouped = {};
    
    insights.forEach(row => {
        const key = row.fixture_id || `${row.home_team}-${row.away_team}-${row.start_time}`;
        
        if (!grouped[key]) {
            grouped[key] = {
                fixture_id: row.fixture_id,
                home_team: row.home_team,
                away_team: row.away_team,
                league: row.league,
                start_time: row.start_time,
                status: row.status,
                insights: []
            };
        }
        
        grouped[key].insights.push(row);
    });
    
    return Object.values(grouped);
}

// Cricket market display helpers
function cleanCricketCategoryLabel(value) {
    if (!value) return "Cricket Market";

    const cleaned = String(value)
        .replace(/_/g, " ")
        .replace(/\b(stumps|complete|completed|finished|live|in progress)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const labels = {
        "direct cricket": "Direct Cricket",
        "direct": "Direct Cricket",
        "direct cover": "Safer Covers",
        "direct covers": "Safer Covers",
        "safer covers": "Safer Covers",
        "covers": "Safer Covers",
        "totals": "Totals",
        "phase markets": "Phase Markets",
        "phase": "Phase Markets",
        "boundaries": "Boundaries",
        "wickets": "Wickets",
        "test phase markets": "Test Phase Markets",
        "test phase": "Test Phase Markets",
        "player markets": "Player Markets",
        "player": "Player Markets"
    };

    return labels[cleaned] || cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCricketMarketName(rawValue, marketKey) {
    const value = String(rawValue || "").trim();

    if (
        value &&
        !["market", "selection", "market — selection", "market - selection"].includes(value.toLowerCase())
    ) {
        return value;
    }

    const key = String(marketKey || "").toLowerCase();

    const labels = {
        cricket_match_winner: "Match Winner",
        test_match_result_1x2: "Test Match Result",
        test_match_result: "Test Match Result",
        test_double_chance: "Double Chance",
        double_chance: "Double Chance",
        test_draw_no_bet: "Draw No Bet",
        draw_no_bet: "Draw No Bet",
        innings_total_runs: "Innings Total Runs",
        day_total_runs: "Day Total Runs",
        test_day_total_runs: "Day Total Runs",
        team_total_runs: "Team Total Runs",
        first_innings_runs: "First Innings Total",
        first_innings_total: "First Innings Total",
        second_innings_runs: "Second Innings Total",
        match_total_runs: "Match Total Runs",
        boundaries_over: "Total Boundaries Over",
        boundaries_under: "Total Boundaries Under",
        fours_over: "Total Fours Over",
        sixes_over: "Total Sixes Over",
        total_sixes: "Total Sixes",
        total_fours: "Total Fours",
        match_total_wickets: "Total Wickets",
        wicket_total: "Total Wickets",
        session_runs: "Session Runs",
        powerplay_runs: "Powerplay Runs",
        top_batter: "Top Batter",
        top_bowler: "Top Bowler"
    };

    return labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Cricket Market";
}

function buildCricketSelection(rawValue, marketKey, row = {}) {
    const value = String(rawValue || "").trim();
    const key = String(marketKey || "").toLowerCase();

    const looksLikeRunsLine = /\bruns?\b/i.test(value);
    const looksLikeWicketsLine = /\bwickets?\b/i.test(value);
    const keyIsWickets = key.includes("wicket");
    const keyIsRuns = key.includes("run") || key.includes("total");

    if (
        value &&
        !["selection", "market", "market — selection", "market - selection"].includes(value.toLowerCase()) &&
        !((keyIsWickets && looksLikeRunsLine && !looksLikeWicketsLine) || (keyIsRuns && looksLikeWicketsLine && !looksLikeRunsLine))
    ) {
        return value;
    }
    const format = String(row.match_format || "").toLowerCase();

    const home = row.home_team || row.team_home || row.team1 || row.home || "Home";
    const away = row.away_team || row.team_away || row.team2 || row.away || "Away";

    if (key.includes("match_winner")) return home;
    if (key.includes("test_match_result")) return `${home} or Draw`;
    if (key.includes("double_chance")) return `${home} or ${away}`;
    if (key.includes("draw_no_bet")) return `${home} Draw No Bet`;
    if (key.includes("match_total_wickets") || key.includes("wicket_total")) return "Over 13.5 wickets";
    if (key.includes("innings_total_runs")) {
        if (format === "odi") return "Over 299.5 runs (50 overs)";
        if (format === "test") return "Over 324.5 runs (first innings)";
        return "Over 171.5 runs (20 overs)";
    }
    if (key.includes("first_10_overs_runs")) return "Over 52.5 runs (first 10 overs)";
    if (key.includes("day_total_runs")) {
        if (format === "test") return "Over 274.5 runs (Day 1, 90 overs)";
        if (format === "odi") return "Over 244.5 runs (40 overs)";
        return "Over 132.5 runs (15 overs)";
    }
    if (key.includes("team_total_runs")) {
        if (format === "odi") return `${home} over 154.5 runs (first innings)`;
        if (format === "test") return `${home} over 289.5 runs (first innings)`;
        return `${home} over 84.5 runs (20 overs)`;
    }
    if (key.includes("first_innings")) {
        if (format === "odi") return "Over 299.5 runs (50 overs)";
        if (format === "test") return "Over 324.5 runs (first innings)";
        return "Over 171.5 runs (20 overs)";
    }
    if (key.includes("second_innings")) {
        if (format === "odi") return "Over 266.5 runs chase line (50 overs)";
        if (format === "test") return "Over 238.5 runs chase line (4th innings)";
        return "Over 162.5 runs chase line (20 overs)";
    }
    if (key.includes("match_total")) {
        if (format === "odi") return "Over 569.5 total match runs";
        if (format === "test") return "Over 684.5 total match runs";
        return "Over 333.5 total match runs";
    }
    if (key.includes("boundaries_over")) return "Over boundaries line";
    if (key.includes("boundaries_under")) return "Under boundaries line";
    if (key.includes("fours_over") || key.includes("total_fours")) return "Over 21.5 fours";
    if (key.includes("sixes_over") || key.includes("total_sixes")) return "Over 12.5 sixes";
    if (key.includes("session_runs")) return "Over 76.5 session runs (session block)";
    if (key.includes("powerplay_runs")) {
        if (format === "odi") return "Over 52.5 runs (first 10 overs)";
        return "Over 49.5 runs (first 6 overs)";
    }
    if (key.includes("top_batter")) return `${home} to provide top batter`;
    if (key.includes("top_bowler")) return `${home} to provide top bowler`;
    if (key.includes("team_with_top_batter")) return `${home} to provide top batter`;
    if (key.includes("team_with_top_bowler")) return `${home} to provide top bowler`;
    if (key.includes("any_player_50")) return "Yes - at least one player scores 50+";
    if (key.includes("any_player_100")) return "Yes - at least one player scores 100+";

    return "Cricket insight";
}

function buildCricketExplanation(row, marketKey, rawSelection, confidence) {
    const home = row.home_team || row.team_home || row.team1 || row.home || "the home side";
    const away = row.away_team || row.team_away || row.team2 || row.away || "the away side";
    const status = row.status || row.match_status || "scheduled";
    const market = buildCricketMarketName(row.market_name || row.market || row.rule_name, marketKey);
    const selection = buildCricketSelection(rawSelection, marketKey, row);

    return `${market}: ${selection}. Confidence ${Math.round(confidence || 0)}%. Fixture: ${home} vs ${away}. Current status: ${status}.`;
}

function normalizeCricketInsightRow(row) {
    const marketGroup =
        row.market_group ||
        row.category ||
        row.market_category ||
        row.group_key ||
        "cricket_market";

    const marketKey =
        row.market_key ||
        row.market_type ||
        row.market ||
        row.prediction_type ||
        row.rule_key ||
        "cricket_market";

    const rawMarketName =
        row.market_name ||
        row.market_label ||
        row.label ||
        row.rule_name ||
        row.market ||
        marketKey;

    const rawSelection =
        row.selection ||
        row.selection_label ||
        row.recommended_pick ||
        row.pick ||
        row.prediction ||
        row.outcome ||
        row.bet_selection ||
        "";

    const confidence = Number(
        row.confidence ??
        row.confidence_score ??
        row.score ??
        row.probability ??
        0
    );

    return {
        id: row.id,
        fixture_id: row.fixture_id || row.match_id || row.cricbuzz_match_id || row.provider_match_id,
        home_team: row.home_team || row.team_home || row.team1 || row.home || "Unknown Home",
        away_team: row.away_team || row.team_away || row.team2 || row.away || "Unknown Away",
        league: row.league || row.competition || row.series_name || row.tournament || "Cricket",
        start_time: row.start_time || row.match_time || row.commence_time || row.date,
        status: row.status || row.match_status || "upcoming",

        market_group: marketGroup,
        market_group_label: cleanCricketCategoryLabel(marketGroup),

        market_key: marketKey,
        market_name: buildCricketMarketName(rawMarketName, marketKey),
        market_label: buildCricketMarketName(rawMarketName, marketKey),

        selection: buildCricketSelection(rawSelection, marketKey, row),
        selection_label: buildCricketSelection(rawSelection, marketKey, row),

        confidence,

        explanation:
            row.explanation ||
            row.reason ||
            row.reasoning ||
            row.edgemind_summary ||
            row.ai_reason ||
            row.analysis ||
            buildCricketExplanation(row, marketKey, rawSelection, confidence),

        reason:
            row.reason ||
            row.explanation ||
            row.reasoning ||
            row.edgemind_summary ||
            row.ai_reason ||
            row.analysis ||
            buildCricketExplanation(row, marketKey, rawSelection, confidence),

        source: row.source || "cricbuzz",
        created_at: row.created_at
    };
}

// Lightweight count endpoint - must be defined before the catch-all route
router.get('/count', requireSupabaseUser, async (req, res) => {
    console.log('[cricket-count] Route hit successfully');
    try {
        const status = String(req.query.status || 'active').trim().toLowerCase();

        let query = supabase
            .from('cricket_insights_final')
            .select('*')
            .eq('sport', 'cricket');

        const { data, error } = await query;

        if (error) {
            console.error('[cricket-count] query failed:', error.message);
            return res.status(500).json({ error: 'Failed to load cricket count', details: error.message });
        }

        const allData = data || [];
        const filtered = filterByStatus(allData, status);
        
        // Count direct market insights for cricket
        const directCount = filtered.filter(row => 
            String(row.market_group || '').toLowerCase() === 'direct'
        ).length;

        return res.json({
            ok: true,
            sport: 'cricket',
            status: status,
            direct_count: directCount,
            total_count: filtered.length
        });
    } catch (err) {
        console.error('[cricket-count] failed:', err);
        return res.status(500).json({ error: 'Failed to load cricket count', details: err.message });
    }
});

router.get('/', requireSupabaseUser, async (req, res) => {
    try {
        const status = String(req.query.status || 'active').trim().toLowerCase();
        const grouped = String(req.query.grouped || 'false').trim().toLowerCase() === 'true';
        const format = String(req.query.format || '').trim().toLowerCase();
        const marketGroup = String(req.query.market_group || '').trim().toLowerCase();
        const includeExpired = String(req.query.include_expired || '').trim() === '1';
        const limit = Math.min(Number(req.query.limit || 100), 250);

        let query = supabase
            .from('cricket_insights_final')
            .select('*')
            .eq('sport', 'cricket')
            .order('start_time', { ascending: true })
            .limit(limit);

        if (format) {
            query = query.eq('match_format', format);
        }

        if (marketGroup) {
            query = query.eq('market_group', marketGroup);
        }

        if (!includeExpired) {
            query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[cricket-insights] query failed:', error.message);
            return res.status(500).json({ error: 'Failed to load cricket insights', details: error.message });
        }

        const allData = data || [];
        const filtered = filterByStatus(allData, status);
        
        // Normalize all rows using the helper function
        const normalizedRows = filtered.map(row => normalizeCricketInsightRow(row));
        
        // Count direct market insights for cricket
        const directCount = normalizedRows.filter(row => 
            String(row.market_group || '').toLowerCase() === 'direct'
        ).length;

        const response = {
            ok: true,
            sport: 'cricket',
            status: status,
            direct_count: directCount,
            total_count: normalizedRows.length,
            grouped: grouped
        };

        if (grouped) {
            response.fixtures = groupByFixtures(normalizedRows);
        } else {
            response.insights = normalizedRows;
        }

        // Development-only debug logging
        if (process.env.NODE_ENV !== "production") {
            console.log("[SKCS Cricket] insights response sample", normalizedRows.slice(0, 2));
        }

        return res.json(response);
    } catch (err) {
        console.error('[cricket-insights] failed:', err);
        return res.status(500).json({ error: 'Failed to load cricket insights', details: err.message });
    }
});

module.exports = router;
