'use strict';

const crypto = require('node:crypto');

const MODEL_VERSION = 'EPI-001-I1-baseline-v1';

function round(value, decimals = 4) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function finiteNonNegative(value) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
}

function stableObject(value) {
    if (Array.isArray(value)) return value.map(stableObject);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.keys(value)
                .sort()
                .map((key) => [key, stableObject(value[key])])
        );
    }
    return value;
}

function computeScoutPackageHash(value) {
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(stableObject(value)))
        .digest('hex');
}

function isSha256(value) {
    return /^[a-f0-9]{64}$/i.test(String(value || '').trim());
}

function fail(code, message, details = {}) {
    return {
        ok: false,
        model_version: MODEL_VERSION,
        code,
        message,
        details
    };
}

function pointsForResult(value) {
    const result = String(value || '').trim().toUpperCase();
    if (result === 'W') return 3;
    if (result === 'D') return 1;
    if (result === 'L') return 0;
    return null;
}

function recentFormPoints(values) {
    if (!Array.isArray(values) || values.length < 3) return null;

    let points = 0;
    for (const value of values) {
        const resultPoints = pointsForResult(value);
        if (resultPoints === null) return null;
        points += resultPoints;
    }
    return points;
}

function seasonStrength(summary) {
    if (!summary || typeof summary !== 'object') return null;

    const won = finiteNonNegative(summary.won);
    const drawn = finiteNonNegative(summary.drawn);
    const lost = finiteNonNegative(summary.lost);
    const goalsFor = finiteNonNegative(summary.goals_for);
    const goalsAgainst = finiteNonNegative(summary.goals_against);

    if ([won, drawn, lost, goalsFor, goalsAgainst].some((value) => value === null)) {
        return null;
    }

    const matches = won + drawn + lost;
    if (matches < 3) return null;

    const pointsShare = ((won * 3) + drawn) / (matches * 3);
    const goalTotal = goalsFor + goalsAgainst;
    const goalShare = goalTotal > 0 ? goalsFor / goalTotal : 0.5;

    return {
        matches,
        won,
        drawn,
        lost,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        points_share: round(pointsShare),
        goal_share: round(goalShare),
        // Equal weighting is deliberate for baseline-v1: one results component,
        // one goal-balance component. No provider odds or hidden model weight.
        strength: round((pointsShare + goalShare) / 2),
        draw_rate: round(drawn / matches)
    };
}

function h2hAverageGoals(h2h) {
    const meetings = Array.isArray(h2h?.recent_meetings) ? h2h.recent_meetings : [];
    const totals = meetings
        .map((meeting) => {
            const home = finiteNonNegative(meeting?.home_score);
            const away = finiteNonNegative(meeting?.away_score);
            return home === null || away === null ? null : home + away;
        })
        .filter((value) => value !== null);

    if (!totals.length) return null;
    return round(totals.reduce((sum, value) => sum + value, 0) / totals.length);
}

function deriveScoutEvidenceBaseline(sourcePackage = {}) {
    if (!sourcePackage || typeof sourcePackage !== 'object' || Array.isArray(sourcePackage)) {
        return fail('SCOUT_BASELINE_INPUT_INVALID', 'Scout evidence package must be an object.');
    }

    const fixture = sourcePackage.fixture || {};
    const competitionId = Number(fixture.competition_id);
    const competition = String(fixture.competition || '').trim().toLowerCase();
    if (competitionId !== 39 && competition !== 'premier league') {
        return fail('SCOUT_BASELINE_COMPETITION_BLOCKED', 'EPI-001-I1 is Premier League only.');
    }

    if (!isSha256(sourcePackage.package_sha256)) {
        return fail('SCOUT_BASELINE_PACKAGE_HASH_MISSING', 'A valid Scout package SHA-256 is required.');
    }

    const { package_sha256: declaredPackageSha256, ...packageBody } = sourcePackage;
    const computedPackageSha256 = computeScoutPackageHash(packageBody);
    if (computedPackageSha256 !== declaredPackageSha256) {
        return fail(
            'SCOUT_BASELINE_PACKAGE_HASH_MISMATCH',
            'Scout package SHA-256 does not match the canonical package body.',
            {
                declared_package_sha256: declaredPackageSha256,
                computed_package_sha256: computedPackageSha256
            }
        );
    }

    const kickoffMs = Date.parse(fixture.kickoff_at || fixture.kickoff_utc || fixture.kickoff_time || '');
    const cutoffMs = Date.parse(sourcePackage.prediction_cutoff || '');
    if (!Number.isFinite(kickoffMs) || !Number.isFinite(cutoffMs) || cutoffMs >= kickoffMs) {
        return fail(
            'SCOUT_BASELINE_CUTOFF_INVALID',
            'Prediction cutoff must be a valid time before kickoff.'
        );
    }

    if (sourcePackage.odds !== false || sourcePackage.prediction_execution !== false) {
        return fail(
            'SCOUT_BASELINE_BOUNDARY_INVALID',
            'Baseline proof requires Scout evidence-only input with odds and Scout prediction execution disabled.'
        );
    }

    if (String(sourcePackage.edge_consumer_policy || '') !== 'EDGE_CONSUME_NO_RECOMPUTE') {
        return fail(
            'SCOUT_BASELINE_CONSUMER_POLICY_INVALID',
            'Scout evidence must preserve EDGE_CONSUME_NO_RECOMPUTE policy.'
        );
    }

    const home = seasonStrength(sourcePackage.team_form?.home?.season_summary);
    const away = seasonStrength(sourcePackage.team_form?.away?.season_summary);
    if (!home || !away) {
        return fail(
            'SCOUT_BASELINE_SEASON_EVIDENCE_INSUFFICIENT',
            'Both teams require at least three matches of verified season summary evidence.'
        );
    }

    const nonDrawStrength = home.strength + away.strength;
    if (!(nonDrawStrength > 0)) {
        return fail(
            'SCOUT_BASELINE_STRENGTH_INVALID',
            'Verified season evidence did not produce usable team strength.'
        );
    }

    const draw = Math.max(0, Math.min(1, (home.draw_rate + away.draw_rate) / 2));
    const remaining = 1 - draw;
    const homeProbability = remaining * (home.strength / nonDrawStrength);
    const awayProbability = remaining * (away.strength / nonDrawStrength);

    const probabilities = {
        home: round(homeProbability),
        draw: round(draw),
        away: round(awayProbability)
    };

    const candidates = [
        { prediction: 'home_win', probability: probabilities.home },
        { prediction: 'draw', probability: probabilities.draw },
        { prediction: 'away_win', probability: probabilities.away }
    ].sort((left, right) => right.probability - left.probability);

    const homePointsLast5 = recentFormPoints(sourcePackage.team_form?.home?.current_form);
    const awayPointsLast5 = recentFormPoints(sourcePackage.team_form?.away?.current_form);
    const avgGoals = h2hAverageGoals(sourcePackage.h2h);
    const playerHistoryCount =
        (Array.isArray(sourcePackage.player_histories?.home) ? sourcePackage.player_histories.home.length : 0)
        + (Array.isArray(sourcePackage.player_histories?.away) ? sourcePackage.player_histories.away.length : 0);

    return {
        ok: true,
        model_version: MODEL_VERSION,
        source: 'scout_evidence_baseline',
        prediction: candidates[0].prediction,
        confidence: round(candidates[0].probability * 100, 2),
        probabilities,
        evidence: {
            package_sha256: sourcePackage.package_sha256,
            prediction_cutoff: sourcePackage.prediction_cutoff,
            fixture_id: fixture.canonical_fixture_id || fixture.fixture_id || null,
            home_team: fixture.home_team?.name || fixture.home_team || null,
            away_team: fixture.away_team?.name || fixture.away_team || null,
            home_season: home,
            away_season: away,
            player_history_records_available: playerHistoryCount,
            player_history_weighted_in_baseline: false,
            home_away_split_weighted_in_baseline: false,
            odds_used: false,
            provider_prediction_used: false,
            ai_fallback_used: false
        },
        direct_context: {
            form: {
                homePointsLast5,
                awayPointsLast5
            },
            h2h: Number.isFinite(avgGoals) ? { avgGoals } : null,
            injuries: {},
            weather: null
        }
    };
}

module.exports = {
    MODEL_VERSION,
    computeScoutPackageHash,
    deriveScoutEvidenceBaseline,
    seasonStrength,
    recentFormPoints
};