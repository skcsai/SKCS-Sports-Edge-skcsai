'use strict';

const soccerGovernor = require('../governance/soccer-governor/governor');
const { areMarketsConflicting } = require('./marketIntelligence');

function normalizeMarket(market) {
    return String(market || '').trim().toUpperCase();
}

function normalizePick(pick) {
    return String(pick || '').trim().toLowerCase();
}

/**
 * CONFLICT_MATRIX defines which picks are incompatible for the same match.
 * Structure: { market: { pick: [incompatible_picks_in_other_markets] } }
 */
const CONFLICT_MATRIX = {
    '1X2': {
        'home_win': [
            { market: '1X2', pick: 'away_win' },
            { market: '1X2', pick: 'draw' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_draw' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_away' },
            { market: 'DOUBLE_CHANCE', pick: 'draw_or_away' },
            { market: 'DRAW_NO_BET', pick: 'home' },
            { market: 'OVER_UNDER_0_5', pick: 'under' },
            { market: 'CLEAN_SHEET_AWAY', pick: 'yes' }
        ],
        'away_win': [
            { market: '1X2', pick: 'home_win' },
            { market: '1X2', pick: 'draw' },
            { market: 'DOUBLE_CHANCE', pick: 'draw_or_away' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_away' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_draw' },
            { market: 'DRAW_NO_BET', pick: 'away' },
            { market: 'OVER_UNDER_0_5', pick: 'under' },
            { market: 'CLEAN_SHEET_HOME', pick: 'yes' }
        ],
        'draw': [
            { market: '1X2', pick: 'home_win' },
            { market: '1X2', pick: 'away_win' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_away' }
        ]
    },
    'DOUBLE_CHANCE': {
        'home_or_draw': [
            { market: '1X2', pick: 'away_win' },
            { market: '1X2', pick: 'home_win' },
            { market: 'DOUBLE_CHANCE', pick: 'draw_or_away' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_away' }
        ],
        'draw_or_away': [
            { market: '1X2', pick: 'home_win' },
            { market: '1X2', pick: 'away_win' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_draw' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_away' }
        ],
        'home_or_away': [
            { market: '1X2', pick: 'draw' },
            { market: 'DOUBLE_CHANCE', pick: 'home_or_draw' },
            { market: 'DOUBLE_CHANCE', pick: 'draw_or_away' }
        ]
    },
    'DRAW_NO_BET': {
        'home': [
            { market: '1X2', pick: 'away_win' },
            { market: '1X2', pick: 'home_win' },
            { market: 'DRAW_NO_BET', pick: 'away' }
        ],
        'away': [
            { market: '1X2', pick: 'home_win' },
            { market: '1X2', pick: 'away_win' },
            { market: 'DRAW_NO_BET', pick: 'home' }
        ]
    },
    'OVER_UNDER_2_5': {
        'over': [
            { market: 'OVER_UNDER_2_5', pick: 'under' },
            { market: 'OVER_UNDER_1_5', pick: 'under' },
            { market: 'OVER_UNDER_0_5', pick: 'under' },
            { market: 'BTTS', pick: 'no' } // SOFT CONFLICT: Volatility Trap
        ],
        'under': [
            { market: 'OVER_UNDER_2_5', pick: 'over' },
            { market: 'BTTS', pick: 'yes' } // Paradox: BTTS requires at least 1-1 (2 goals)
        ]
    },
    'OVER_UNDER_1_5': {
        'under': [
            { market: 'OVER_UNDER_1_5', pick: 'over' },
            { market: 'OVER_UNDER_2_5', pick: 'over' },
            { market: 'BTTS', pick: 'yes' } // Paradox: BTTS requires at least 2 goals
        ],
        'over': [
            { market: 'OVER_UNDER_1_5', pick: 'under' },
            { market: 'OVER_UNDER_0_5', pick: 'under' }
        ]
    },
    'OVER_UNDER_3_5': {
        'over': [
            { market: 'OVER_UNDER_3_5', pick: 'under' }
        ],
        'under': [
            { market: 'OVER_UNDER_3_5', pick: 'over' }
        ]
    },
    'OVER_UNDER_0_5': {
        'under': [
            { market: 'OVER_UNDER_0_5', pick: 'over' },
            { market: 'OVER_UNDER_1_5', pick: 'over' },
            { market: 'OVER_UNDER_2_5', pick: 'over' },
            { market: 'BTTS', pick: 'yes' },
            { market: '1X2', pick: 'home_win' },
            { market: '1X2', pick: 'away_win' }
        ],
        'over': [
            { market: 'OVER_UNDER_0_5', pick: 'under' }
        ]
    },
    'BTTS': {
        'yes': [
            { market: 'BTTS', pick: 'no' },
            { market: 'OVER_UNDER_1_5', pick: 'under' },
            { market: 'OVER_UNDER_0_5', pick: 'under' },
            { market: 'CLEAN_SHEET_HOME', pick: 'yes' },
            { market: 'CLEAN_SHEET_AWAY', pick: 'yes' }
        ],
        'no': [
            { market: 'BTTS', pick: 'yes' },
            { market: 'OVER_UNDER_2_5', pick: 'over' } // SOFT CONFLICT: Volatility Trap
        ]
    },
    'CLEAN_SHEET_HOME': {
        'yes': [
            { market: '1X2', pick: 'away_win' },
            { market: 'BTTS', pick: 'yes' }
        ]
    },
    'CLEAN_SHEET_AWAY': {
        'yes': [
            { market: '1X2', pick: 'home_win' },
            { market: 'BTTS', pick: 'yes' }
        ]
    }
};

function isOverUnderMarket(market) {
    return /^OVER_UNDER_\d+_?\d*$/.test(market) || /^TOTAL_(GOALS|POINTS|RUNS|GAMES|POINTS)$/.test(market);
}

function toSkcsMarket(market, pick) {
    const marketKey = String(market || '').trim().toUpperCase();
    const pickKey = String(pick || '').trim().toLowerCase();

    if (marketKey === '1X2' || marketKey === 'MATCH_RESULT' || marketKey === 'MATCH_WINNER') {
        if (pickKey === 'home_win' || pickKey === 'home') return 'home_win';
        if (pickKey === 'away_win' || pickKey === 'away') return 'away_win';
        if (pickKey === 'draw' || pickKey === 'x') return 'draw';
        return 'draw';
    }
    if (marketKey === 'DOUBLE_CHANCE') {
        if (pickKey === 'home_or_draw' || pickKey === '1x') return 'double_chance_1x';
        if (pickKey === 'draw_or_away' || pickKey === 'x2') return 'double_chance_x2';
        return 'double_chance_12';
    }
    if (marketKey === 'DRAW_NO_BET') {
        return pickKey === 'away' ? 'draw_no_bet_away' : 'draw_no_bet_home';
    }
    if (marketKey === 'BTTS') {
        return pickKey === 'no' ? 'btts_no' : 'btts_yes';
    }
    if (marketKey === 'OVER_UNDER_1_5') {
        return pickKey === 'under' ? 'under_1_5' : 'over_1_5';
    }
    if (marketKey === 'OVER_UNDER_2_5') {
        return pickKey === 'under' ? 'under_2_5' : 'over_2_5';
    }
    if (marketKey === 'OVER_UNDER_3_5') {
        return pickKey === 'under' ? 'under_3_5' : 'over_3_5';
    }
    if (marketKey === 'OVER_UNDER_0_5') {
        return pickKey === 'under' ? 'under_0_5' : 'over_0_5';
    }

    return String(market || '').trim().toLowerCase();
}

function isValidCombination(legs, options = {}) {
    const {
        no_same_match = true,
        no_conflicting_markets = true
    } = options;

    if (!Array.isArray(legs) || legs.length === 0) return false;

    const perScopeState = new Map();
    const premierLeagueContexts = new Map();
    for (const leg of legs) {
        if (soccerGovernor.isPremierLeague(leg)) {
            const id = String(leg?.match_id || leg?.metadata?.match_id || '').trim() || '__no_match_scope__';
            premierLeagueContexts.set(id, leg);
        }
    }
    const seenMatchIds = new Set();

    for (const leg of legs) {
        const market = normalizeMarket(leg?.market);
        const pick = normalizePick(leg?.prediction || leg?.pick);
        const matchId = String(leg?.match_id || leg?.metadata?.match_id || '').trim();

        if (!market || !pick) return false;
        if (matchId) {
            if (no_same_match && seenMatchIds.has(matchId)) return false;
            seenMatchIds.add(matchId);
        }

        const scopeKey = matchId || '__no_match_scope__';
        let scope = perScopeState.get(scopeKey);
        if (!scope) {
            scope = {
                marketToPick: new Map(),
                skcsSelections: []
            };
            perScopeState.set(scopeKey, scope);
        }

        // Same market duplicated within the same scope.
        if (scope.marketToPick.has(market)) return false;

        const soccerScope = soccerGovernor.isPremierLeague(options.scope) ? options.scope : premierLeagueContexts.get(scopeKey);
        if (soccerScope) {
            scope.soccerSelections = scope.soccerSelections || [];
            if (no_conflicting_markets && !soccerGovernor.evaluateSelections(soccerScope, [...scope.soccerSelections, leg]).compatible) return false;
            scope.soccerSelections.push(leg);
            scope.marketToPick.set(market, pick);
            continue;
        }

        // Check against conflict matrix (if no_conflicting_markets is enabled)
        if (no_conflicting_markets) {
            if (CONFLICT_MATRIX[market] && CONFLICT_MATRIX[market][pick]) {
                const conflicts = CONFLICT_MATRIX[market][pick];
                for (const conflict of conflicts) {
                    if (scope.marketToPick.has(conflict.market) && scope.marketToPick.get(conflict.market) === conflict.pick) {
                        return false;
                    }
                }
            }

            // Check if other existing picks conflict with THIS new pick
            for (const [existingMarket, existingPick] of scope.marketToPick.entries()) {
                if (CONFLICT_MATRIX[existingMarket] && CONFLICT_MATRIX[existingMarket][existingPick]) {
                    const conflicts = CONFLICT_MATRIX[existingMarket][existingPick];
                    for (const conflict of conflicts) {
                        if (conflict.market === market && conflict.pick === pick) {
                            return false;
                        }
                    }
                }
            }

            scope.marketToPick.set(market, pick);

            const currentSelection = { market: toSkcsMarket(market, pick), prediction: pick };
            for (const existingSelection of scope.skcsSelections) {
                if (areMarketsConflicting(existingSelection, currentSelection)) {
                    return false;
                }
            }
            scope.skcsSelections.push(currentSelection);
        } else {
            scope.marketToPick.set(market, pick);
        }
    }

    return true;
}

module.exports = {
    isValidCombination
};
