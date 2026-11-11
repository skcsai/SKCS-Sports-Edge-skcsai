'use strict';

const soccerGovernor = require('../governance/soccer-governor/governor');
const { areMarketsConflicting } = require('../services/marketIntelligence');

// Football outcome universe
const OUTCOMES = {
    H: 'H', // home
    D: 'D', // draw
    A: 'A'  // away
};

function normMarket(m) {
    return String(m || '').trim().toLowerCase();
}

function normPick(p) {
    return String(p || '').trim().toUpperCase();
}

function outcomeSetForLeg(market, pick) {
    const m = normMarket(market);
    const p = normPick(pick);

    // 1X2 / match result
    if (m === '1x2' || m === 'match_result' || m === 'match result') {
        if (p === 'HOME WIN' || p === 'HOME_WIN' || p === 'HOME') return new Set([OUTCOMES.H]);
        if (p === 'AWAY WIN' || p === 'AWAY_WIN' || p === 'AWAY') return new Set([OUTCOMES.A]);
        if (p === 'DRAW' || p === 'X') return new Set([OUTCOMES.D]);
    }

    // double chance
    if (m.includes('double_chance') || m === 'double chance') {
        if (p === '1X' || p === 'HOME_OR_DRAW' || p === 'HOME OR DRAW') return new Set([OUTCOMES.H, OUTCOMES.D]);
        if (p === 'X2' || p === 'DRAW_OR_AWAY' || p === 'DRAW OR AWAY') return new Set([OUTCOMES.D, OUTCOMES.A]);
        if (p === '12' || p === 'HOME_OR_AWAY' || p === 'HOME OR AWAY') return new Set([OUTCOMES.H, OUTCOMES.A]);
    }

    // BTTS — encode as goal-event tokens so we can cross-check with goal predictions
    if (m === 'btts_yes' || m === 'btts') {
        if (p === 'YES') return new Set(['BTTS_YES']);
        if (p === 'NO') return new Set(['BTTS_NO']);
    }

    // Over/Under goals — encode threshold so we can detect contradictions
    const goalsOverMatch = m.match(/^over_(\d+)_(\d)$/);
    const goalsUnderMatch = m.match(/^under_(\d+)_(\d)$/);
    if (goalsOverMatch) {
        const line = parseFloat(`${goalsOverMatch[1]}.${goalsOverMatch[2]}`);
        return new Set([`OVER_GOALS_${line}`]);
    }
    if (goalsUnderMatch) {
        const line = parseFloat(`${goalsUnderMatch[1]}.${goalsUnderMatch[2]}`);
        return new Set([`UNDER_GOALS_${line}`]);
    }

    // Unknown/non-result market: cannot infer, treat as compatible by default
    return null;
}

function toSkcsSelection(leg) {
    const market = normMarket(leg?.market);
    const pick = normPick(leg?.pick ?? leg?.prediction);

    if (market === '1x2' || market === 'match_result' || market === 'match_winner') {
        if (pick === 'HOME_WIN' || pick === 'HOME') return { market: 'home_win', prediction: 'home_win' };
        if (pick === 'AWAY_WIN' || pick === 'AWAY') return { market: 'away_win', prediction: 'away_win' };
        return { market: 'draw', prediction: 'draw' };
    }
    if (market.includes('double_chance')) {
        if (pick === '1X' || pick === 'HOME_OR_DRAW') return { market: 'double_chance_1x', prediction: '1x' };
        if (pick === 'X2' || pick === 'DRAW_OR_AWAY') return { market: 'double_chance_x2', prediction: 'x2' };
        return { market: 'double_chance_12', prediction: '12' };
    }
    if (market.includes('draw_no_bet')) {
        return pick === 'AWAY'
            ? { market: 'draw_no_bet_away', prediction: 'away' }
            : { market: 'draw_no_bet_home', prediction: 'home' };
    }
    if (market === 'btts_yes' || (market === 'btts' && pick === 'YES')) {
        return { market: 'btts_yes', prediction: 'yes' };
    }
    if (market === 'btts_no' || (market === 'btts' && pick === 'NO')) {
        return { market: 'btts_no', prediction: 'no' };
    }
    const overMatch = market.match(/^over_(\d+)_(\d)$/);
    if (overMatch) return { market: `over_${overMatch[1]}_${overMatch[2]}`, prediction: 'over' };
    const underMatch = market.match(/^under_(\d+)_(\d)$/);
    if (underMatch) return { market: `under_${underMatch[1]}_${underMatch[2]}`, prediction: 'under' };
    return market ? { market, prediction: String(pick || '').toLowerCase() } : null;
}

function areLegsCompatible(legA, legB, scope) {
    const context = soccerGovernor.isPremierLeague(scope) ? scope : soccerGovernor.isPremierLeague(legA) ? legA : legB;
    if (soccerGovernor.isPremierLeague(context)) {
        const idA = legA?.match_id || legA?.metadata?.match_id;
        const idB = legB?.match_id || legB?.metadata?.match_id;
        if (idA && idB && String(idA) !== String(idB)) return true;
        return soccerGovernor.evaluateSelections(context, [legA, legB]).compatible;
    }
    const skcsA = toSkcsSelection(legA);
    const skcsB = toSkcsSelection(legB);
    if (skcsA && skcsB && areMarketsConflicting(skcsA, skcsB)) {
        return false;
    }

    const setA = outcomeSetForLeg(legA.market, legA.pick ?? legA.prediction);
    const setB = outcomeSetForLeg(legB.market, legB.pick ?? legB.prediction);

    // If one is non-result, we don't block here.
    if (!setA || !setB) return true;

    // Check for direct outcome overlap (1X2, double chance)
    for (const x of setA) if (setB.has(x)) return true;

    // Check BTTS vs BTTS conflicts
    if (setA.has('BTTS_YES') && setB.has('BTTS_NO')) return false;
    if (setA.has('BTTS_NO') && setB.has('BTTS_YES')) return false;

    // Check Over/Under goal-line contradictions
    for (const a of setA) {
        if (a.startsWith('OVER_GOALS_')) {
            const lineA = parseFloat(a.split('_')[2]);
            for (const b of setB) {
                if (b.startsWith('UNDER_GOALS_')) {
                    const lineB = parseFloat(b.split('_')[2]);
                    // OVER 2.5 vs UNDER 1.5 = conflict (no score satisfies both)
                    // OVER 1.5 vs UNDER 2.5 = compatible (score of 2 satisfies both)
                    if (lineA > lineB) return false;
                }
            }
        }
        if (a.startsWith('UNDER_GOALS_')) {
            const lineA = parseFloat(a.split('_')[2]);
            for (const b of setB) {
                if (b.startsWith('OVER_GOALS_')) {
                    const lineB = parseFloat(b.split('_')[2]);
                    if (lineB > lineA) return false;
                }
            }
        }
    }

    return false;
}

function doubleChanceFromBaseline(baseline) {
    const home = Number(baseline.home || 0);
    const draw = Number(baseline.draw || 0);
    const away = Number(baseline.away || 0);

    return {
        '1X': home + draw,
        'X2': draw + away,
        '12': home + away
    };
}

function sanitizeSameMatchLegs(legs, scope) {
    const context = soccerGovernor.isPremierLeague(scope) ? scope : legs.find(leg => soccerGovernor.isPremierLeague(leg));
    if (soccerGovernor.isPremierLeague(context)) {
        const kept = [];
        for (const leg of legs) {
            if (soccerGovernor.evaluateSelections(context, [...kept, leg]).compatible) kept.push(leg);
        }
        return kept;
    }
    const out = [];
    for (const leg of legs) {
        // only accept leg if compatible with all already accepted legs
        if (out.every((kept) => areLegsCompatible(kept, leg))) {
            out.push(leg);
        }
    }
    return out;
}

function validatePredictionSet(predictions, scope) {
    const context = soccerGovernor.isPremierLeague(scope) ? scope : predictions.find(leg => soccerGovernor.isPremierLeague(leg));
    if (soccerGovernor.isPremierLeague(scope) || (predictions.length > 0 && predictions.every(leg => soccerGovernor.isPremierLeague(leg)))) {
        const groups = new Map();
        const valid = [];
        const conflicts = [];
        for (const prediction of predictions) {
            const fixtureId = String(prediction.match_id || prediction.metadata?.match_id || '__same_match__');
            const accepted = groups.get(fixtureId) || [];
            const verdict = soccerGovernor.evaluateSelections(context, [...accepted, prediction]);
            if (verdict.compatible) {
                accepted.push(prediction);
                groups.set(fixtureId, accepted);
                valid.push(prediction);
            } else {
                conflicts.push({ prediction_a: prediction, reason: verdict.reason, governor_status: verdict.status });
            }
        }
        return { valid, conflicts, is_valid: conflicts.length === 0 };
    }
    const conflicts = [];
    const validPredictions = [];

    for (let i = 0; i < predictions.length; i++) {
        const current = predictions[i];
        let hasConflict = false;

        for (let j = 0; j < validPredictions.length; j++) {
            const existing = validPredictions[j];
            
            if (!areLegsCompatible(
                current,
                existing
            )) {
                conflicts.push({
                    prediction_a: current,
                    prediction_b: existing,
                    reason: 'Outcome sets are incompatible'
                });
                hasConflict = true;
                break;
            }
        }

        if (!hasConflict) {
            validPredictions.push(current);
        }
    }

    return {
        valid: validPredictions,
        conflicts,
        is_valid: conflicts.length === 0
    };
}

module.exports = {
    outcomeSetForLeg,
    areLegsCompatible,
    doubleChanceFromBaseline,
    sanitizeSameMatchLegs,
    validatePredictionSet,
    OUTCOMES
};
