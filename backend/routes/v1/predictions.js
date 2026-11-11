// API v1 Predictions Endpoint for SKCS Master Rulebook
// GET /api/v1/matches/:match_id/predictions

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { selectSecondaryMarkets } = require('../../services/safeHavenSelector');
const { filterMarketsByMainPick, validateSMBCLegs } = require('../../services/contradictionGovernance');
const { requireSupabaseUser, requireActiveSubscription } = require('../../middleware/supabaseJwt');

/**
 * Get match predictions with main market and secondary insights
 * Implements Safe Haven fallback logic from Master Rulebook
 */
router.get('/matches/:match_id/predictions', requireSupabaseUser, requireActiveSubscription, async (req, res) => {
    try {
        const { match_id } = req.params;
        const userId = req.user?.id;
        
        if (!match_id) {
            return res.status(400).json({
                error: 'match_id is required',
                status: 'error'
            });
        }

        // Get main prediction (1X2 market)
        const mainQuery = `
            SELECT id, market_type, prediction, confidence, risk_tier, 
                   edgemind_report, created_at, is_published
            FROM direct1x2_prediction_final
            WHERE id::text = $1 AND market_type = '1X2' AND is_published = true
            ORDER BY created_at DESC
            LIMIT 1
        `;
        
        const mainResult = await db.query(mainQuery, [match_id]);
        
        if (mainResult.rows.length === 0) {
            return res.status(404).json({
                error: 'No predictions found for this match',
                status: 'not_found'
            });
        }
        
        const main = mainResult.rows[0];
        
        // Check if main confidence is too low (Extreme Risk)
        if (main.confidence < 30) {
            return res.status(404).json({
                error: 'Main prediction confidence too low for publication',
                status: 'extreme_risk'
            });
        }
        
        // Get all market predictions for this match
        const allMarketsQuery = `
            SELECT id, market_type, prediction, confidence, risk_tier,
                   edgemind_report, created_at, is_published
            FROM direct1x2_prediction_final
            WHERE id::text = $1 AND is_published = true
            ORDER BY confidence DESC
        `;
        
        const allMarketsResult = await db.query(allMarketsQuery, [match_id]);
        const allMarkets = allMarketsResult.rows;
        
        // Select secondary markets using Safe Haven logic
        const secondarySelection = selectSecondaryMarkets(main.confidence, allMarkets);

        const mainPickRaw = String(main.prediction || '').trim().toLowerCase();
        let mainPickToken = null;
        if (mainPickRaw === '1' || mainPickRaw.includes('home')) mainPickToken = '1';
        else if (mainPickRaw === 'x' || mainPickRaw.includes('draw')) mainPickToken = 'X';
        else if (mainPickRaw === '2' || mainPickRaw.includes('away')) mainPickToken = '2';

        const secondaryLegs = secondarySelection.secondary.map(m => ({
            market: m.market_type || m.market,
            prediction: m.prediction,
            confidence: m.confidence
        }));
        let filteredSecondaryLegs = secondaryLegs;
        let removedLegs = [];
        if (mainPickToken) {
            const verdict = validateSMBCLegs(secondaryLegs, mainPickToken, main);
            filteredSecondaryLegs = verdict.legs;
            removedLegs = verdict.removed;
        }
        
        // Format response
        const response = {
            match_id,
            main: {
                market: '1X2',
                prediction: main.prediction,
                confidence: Number(main.confidence),
                risk_tier: main.risk_tier,
                color: getRiskColor(main.confidence),
                label: getRiskLevel(main.confidence),
                edgemind_report: main.edgemind_report,
                created_at: main.created_at
            },
            secondary: filteredSecondaryLegs.map(market => ({
                market: market.market,
                prediction: market.prediction,
                confidence: Number(market.confidence),
                risk_tier: getRiskLevel(market.confidence),
                color: getRiskColor(market.confidence),
                label: getRiskLevel(market.confidence),
                source: market.source || 'database'
            })),
            safe_haven_fallback_triggered: secondarySelection.safeHavenTriggered,
            secondary_removed: removedLegs,
            fallback_message: secondarySelection.fallbackMessage,
            metadata: {
                total_markets_analyzed: allMarkets.length,
                low_risk_secondary_count: allMarkets.filter(m => 
                    m.market_type !== '1X2' && m.confidence >= 75
                ).length,
                safe_haven_candidates_count: secondarySelection.secondary.length,
                user_access: {
                    user_id: userId,
                    can_view_acca: true, // Based on subscription tier
                    can_view_secondary: true
                }
            }
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('[API/v1/predictions] Error:', error.message);
        res.status(500).json({
            error: 'Internal server error',
            status: 'error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Get multiple match predictions (batch endpoint)
 * GET /api/v1/predictions/batch?match_ids=id1,id2,id3
 */
router.get('/predictions/batch', requireSupabaseUser, async (req, res) => {
    try {
        const { match_ids } = req.query;
        
        if (!match_ids) {
            return res.status(400).json({
                error: 'match_ids parameter is required',
                status: 'error'
            });
        }
        
        const matchIdArray = match_ids.split(',').map(id => id.trim()).filter(id => id);
        
        if (matchIdArray.length === 0 || matchIdArray.length > 50) {
            return res.status(400).json({
                error: 'Provide between 1 and 50 match IDs',
                status: 'error'
            });
        }
        
        const results = {};
        
        for (const matchId of matchIdArray) {
            try {
                // Get main prediction
                const mainQuery = `
                    SELECT id, market_type, prediction, confidence, risk_tier,
                           edgemind_report, created_at, is_published
                    FROM direct1x2_prediction_final
                    WHERE id::text = $1 AND market_type = '1X2' AND is_published = true
                    ORDER BY created_at DESC
                    LIMIT 1
                `;
                
                const mainResult = await db.query(mainQuery, [matchId]);
                
                if (mainResult.rows.length === 0 || mainResult.rows[0].confidence < 30) {
                    results[matchId] = { status: 'not_available' };
                    continue;
                }
                
                const main = mainResult.rows[0];
                
                // Get all markets
                const allMarketsQuery = `
                    SELECT id, market_type, prediction, confidence, risk_tier,
                           edgemind_report, created_at, is_published
                    FROM direct1x2_prediction_final
                    WHERE id::text = $1 AND is_published = true
                    ORDER BY confidence DESC
                `;
                
                const allMarketsResult = await db.query(allMarketsQuery, [matchId]);
                const allMarkets = allMarketsResult.rows;
                
                // Select secondary markets
                const secondarySelection = selectSecondaryMarkets(main.confidence, allMarkets);

                const mainPickRaw = String(main.prediction || '').trim().toLowerCase();
                let mainPickToken = null;
                if (mainPickRaw === '1' || mainPickRaw.includes('home')) mainPickToken = '1';
                else if (mainPickRaw === 'x' || mainPickRaw.includes('draw')) mainPickToken = 'X';
                else if (mainPickRaw === '2' || mainPickRaw.includes('away')) mainPickToken = '2';

                const secondaryLegs = secondarySelection.secondary.map(m => ({
                    market: m.market_type || m.market,
                    prediction: m.prediction,
                    confidence: m.confidence
                }));
                let filteredSecondaryLegs = secondaryLegs;
                if (mainPickToken) {
                    const verdict = validateSMBCLegs(secondaryLegs, mainPickToken, main);
                    filteredSecondaryLegs = verdict.legs;
                }
                
                results[matchId] = {
                    main: {
                        market: '1X2',
                        prediction: main.prediction,
                        confidence: Number(main.confidence),
                        risk_tier: main.risk_tier,
                        color: getRiskColor(main.confidence),
                        label: getRiskLevel(main.confidence)
                    },
                    secondary: filteredSecondaryLegs.map(market => ({
                        market: market.market,
                        prediction: market.prediction,
                        confidence: Number(market.confidence),
                        risk_tier: getRiskLevel(market.confidence),
                        color: getRiskColor(market.confidence),
                        label: getRiskLevel(market.confidence)
                    })),
                    safe_haven_fallback_triggered: secondarySelection.safeHavenTriggered,
                    status: 'available'
                };
                
            } catch (matchError) {
                console.error(`[API/v1/predictions] Error for match ${matchId}:`, matchError.message);
                results[matchId] = { status: 'error', error: 'Failed to load predictions' };
            }
        }
        
        res.json({
            results,
            summary: {
                total_requested: matchIdArray.length,
                available: Object.values(results).filter(r => r.status === 'available').length,
                not_available: Object.values(results).filter(r => r.status === 'not_available').length,
                errors: Object.values(results).filter(r => r.status === 'error').length
            }
        });
        
    } catch (error) {
        console.error('[API/v1/predictions] Batch error:', error.message);
        res.status(500).json({
            error: 'Internal server error',
            status: 'error'
        });
    }
});

/**
 * Get user's prediction history
 * GET /api/v1/predictions/history?limit=10&offset=0
 */
router.get('/predictions/history', requireSupabaseUser, async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        const userId = req.user?.id;
        
        const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 100);
        const offsetNum = Math.max(parseInt(offset) || 0, 0);
        
        // This would need to be implemented based on user prediction tracking
        const historyQuery = `
            SELECT dp.id, dp.fixture_id, dp.market_type, dp.prediction, 
                   dp.confidence, dp.risk_tier, dp.created_at, dp.edgemind_report,
                   f.home_team, f.away_team, f.start_time_utc
            FROM direct1x2_prediction_final dp
            LEFT JOIN fixtures f ON f.id::text = dp.fixture_id::text
            WHERE dp.is_published = true
            ORDER BY dp.created_at DESC
            LIMIT $1 OFFSET $2
        `;
        
        const historyResult = await db.query(historyQuery, [limitNum, offsetNum]);
        
        const fixtureIds = historyResult.rows.map(r => String(r.fixture_id));
        
        let countsMap = {};
        if (fixtureIds.length > 0) {
            const countsQuery = `
                SELECT fixture_id, COUNT(*) as count 
                FROM secondary_market_predictions 
                WHERE fixture_id = ANY($1) 
                GROUP BY fixture_id
            `;
            const { rows: counts } = await db.query(countsQuery, [fixtureIds]);
            countsMap = counts.reduce((acc, row) => {
                acc[row.fixture_id] = parseInt(row.count, 10);
                return acc;
            }, {});
        }

        res.json({
            predictions: historyResult.rows.map(pred => ({
                match_id: pred.fixture_id,
                market: pred.market_type,
                prediction: pred.prediction,
                confidence: Number(pred.confidence),
                actual_confidence: Number(pred.confidence),
                ai_reasoning: pred.edgemind_report || "System rated prediction.",
                secondary_market_count: countsMap[pred.fixture_id] || 0,
                risk_tier: pred.risk_tier,
                color: getRiskColor(pred.confidence),
                created_at: pred.created_at,
                fixture: {
                    home_team: pred.home_team,
                    away_team: pred.away_team,
                    start_time_utc: pred.start_time_utc
                }
            })),
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                has_more: historyResult.rows.length === limitNum
            }
        });
        
    } catch (error) {
        console.error('[API/v1/predictions] History error:', error.message);
        res.status(500).json({
            error: 'Internal server error',
            status: 'error'
        });
    }
});

// Helper functions
function getRiskLevel(confidence) {
    if (confidence >= 75) return 'Low Risk';
    if (confidence >= 55) return 'Medium Risk';
    if (confidence >= 30) return 'High Risk';
    return 'Extreme Risk';
}

function getRiskColor(confidence) {
    if (confidence >= 75) return 'green';
    if (confidence >= 55) return 'yellow';
    if (confidence >= 30) return 'orange';
    return 'red'; // Extreme risk (not shown)
}

module.exports = router;
