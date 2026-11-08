'use strict';

const express = require('express');
const { 
    runPipelineForMatches, 
    runPipelineFromConfiguredDataMode, 
    rebuildFinalOutputs 
} = require('../services/aiPipeline');
const { syncAllSports, syncSports } = require('../services/syncService');
const { executeOperation } = require('../core/executionPipeline');
const config = require('../config');
const { requireRole, requireSchedulerSecret } = require('../utils/auth');

const router = express.Router();

function isProductionRuntime() {
    return String(process.env.NODE_ENV || '').toLowerCase() === 'production'
        || String(process.env.DATA_MODE || '').toLowerCase() === 'live';
}

async function handleSyncRequest(res, options = {}) {
    const requestedSport = options.requestedSport ? String(options.requestedSport).toLowerCase() : null;
    let waitForCompletion = options.waitForCompletion === true;
    if (waitForCompletion && isProductionRuntime() && String(process.env.SKCS_ALLOW_SYNC_WAIT || '').trim() !== '1') {
        console.warn('[pipeline] Ignoring wait=true on production to protect cron endpoints; running in background.');
        waitForCompletion = false;
    }
    const triggerLabel = options.triggerLabel || 'manual sync';
    const footballOnlyPhase = null;

    if (requestedSport && requestedSport !== footballOnlyPhase && footballOnlyPhase) {
        return res.status(200).json({
            ok: true,
            message: 'Sport disabled in current deployment phase',
            requestedSport,
            activeSport: footballOnlyPhase,
            note: 'Phase 1 is football + ACCA only'
        });
    }

    console.log(`[pipeline] Starting ${triggerLabel}${requestedSport ? ` for ${requestedSport}` : ''}...`);

    const execute = () => executeOperation({
        operation: 'pipeline.sync',
        caller: 'backend/routes/pipeline.js',
        payload: {
            requestedSport,
            triggerLabel
        },
        execute: async () => (
            requestedSport
                ? syncSports({ sports: requestedSport })
                : syncAllSports()
        )
    });

    if (waitForCompletion) {
        try {
            const result = await execute();
            if (result?.success === false) {
                res.status(503).json({
                    ok: false,
                    error: result.reason || result.error || 'pipeline_blocked',
                    traceId: result.traceId || result.trace_id || null
                });
                return;
            }

            res.status(200).json({
                ok: true,
                message: 'Sync completed successfully',
                sync: result?.success === false ? 'failed' : 'ok',
                requestedSport,
                publishRun: result?.publishRun || null,
                totalMatchesProcessed: result?.totalMatchesProcessed || 0,
                perSport: result?.perSport || [],
                errors: result?.errors || [],
                rebuiltFinalOutputs: result?.rebuiltFinalOutputs || false
            });
        } catch (err) {
            console.error(`[pipeline] ${triggerLabel} failed:`, err.message);
            res.status(500).json({
                ok: false,
                error: 'Sync failed',
                details: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
        return;
    }

    res.status(202).json({
        ok: true,
        message: 'Sync started in background. Check /api/pipeline/status for results.',
        requestedSport,
        note: 'Use wait=true to wait for completion'
    });

    try {
        const result = await execute();
        console.log('[pipeline] Background sync complete:', JSON.stringify({
            trigger: triggerLabel,
            sync: result?.success === false ? 'failed' : 'ok',
            requestedSport,
            publishRun: result?.publishRun || null,
            totalMatchesProcessed: result?.totalMatchesProcessed || 0,
            errors: result?.errors || []
        }));
    } catch (err) {
        console.error(`[pipeline] Background ${triggerLabel} failed:`, err.message);
        console.error('[pipeline] Stack trace:', err.stack);
    }
}

/**
 * TRIGGER REAL DATA SYNC
 * URL: POST https://skcsai.onrender.com/api/pipeline/sync
 * This is the main button to pull real matches from APIs into Supabase.
 */
router.post('/sync', requireRole('admin'), async (req, res) => {
    const requestedSport = req.body?.sport ? String(req.body.sport).toLowerCase() : null;
    const waitForCompletion = req.body?.wait === true;

    await handleSyncRequest(res, {
        requestedSport,
        waitForCompletion,
        triggerLabel: 'manual sync of REAL sports data'
    });
});

// Run the full multi-sport weekly scrape pipeline.
// URL: POST|GET /api/pipeline/run-full
const runFullHandler = async (req, res) => {
    const waitFromBody = req.body?.wait === true;
    const waitFromQuery = String(req.query?.wait || '').toLowerCase() === 'true';

    await handleSyncRequest(res, {
        waitForCompletion: waitFromBody || waitFromQuery,
        triggerLabel: 'run-full global sync'
    });
};

router.post('/run-full', requireSchedulerSecret, runFullHandler);
router.get('/run-full', requireSchedulerSecret, runFullHandler);

/**
 * SYNC WITH DETAILED PROGRESS
 * URL: POST /api/pipeline/sync-detailed
 * Returns step-by-step progress for debugging
 */
router.post('/sync-detailed', requireRole('admin'), async (req, res) => {
    const requestedSport = req.body?.sport ? String(req.body.sport).toLowerCase() : null;
    
    console.log(`[pipeline] Starting detailed sync for: ${requestedSport || 'all sports'}`);
    
    const progress = {
        startTime: new Date().toISOString(),
        steps: [],
        final: null,
        error: null
    };

    try {
        // Step 1: Check configuration
        progress.steps.push({
            step: 1,
            action: 'Checking configuration',
            timestamp: new Date().toISOString(),
            details: {
                dataMode: config.DATA_MODE,
                hasApiSportsKey: !!process.env.X_APISPORTS_KEY,
                hasOddsApiKey: !!process.env.ODDS_API_KEY,
                hasSupabaseUrl: !!process.env.SUPABASE_URL
            }
        });

        // Step 2: Run sync
        progress.steps.push({
            step: 2,
            action: 'Running sync',
            timestamp: new Date().toISOString()
        });

        const result = await executeOperation({
            operation: requestedSport ? 'pipeline.sync-detailed.sport' : 'pipeline.sync-detailed.all',
            caller: 'backend/routes/pipeline.js',
            payload: { requestedSport: requestedSport || 'all' },
            execute: async () => (
                requestedSport
                    ? syncSports({ sports: requestedSport })
                    : syncAllSports()
            )
        });

        // Step 3: Report results
        progress.steps.push({
            step: 3,
            action: 'Sync completed',
            timestamp: new Date().toISOString(),
            details: {
                totalMatchesProcessed: result?.result?.totalMatchesProcessed || 0,
                perSport: result?.result?.perSport || [],
                errors: result?.result?.errors || [],
                rebuiltFinalOutputs: result?.result?.rebuiltFinalOutputs || false
            }
        });

        progress.final = result?.result || result;

        res.status(200).json({
            ok: true,
            message: 'Sync completed with detailed progress',
            progress
        });
    } catch (err) {
        progress.error = {
            message: err.message,
            timestamp: new Date().toISOString()
        };
        
        console.error('[pipeline] Detailed sync failed:', err.message);
        res.status(500).json({
            ok: false,
            error: 'Sync failed',
            progress,
            details: err.message
        });
    }
});

// Check sync status / latest data
router.get('/status', requireRole('admin'), async (_req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { count: rawCount } = await supabase.from('predictions_raw').select('*', { count: 'exact', head: true });
        const { count: finalCount } = await supabase.from('direct1x2_prediction_final').select('*', { count: 'exact', head: true });
        res.json({
            ok: true,
            predictions_raw: rawCount,
            predictions_final: finalCount,
            direct1x2_prediction_final: finalCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Accept manual match data and run the full pipeline
router.post('/run', requireRole('admin'), async (req, res) => {
    try {
        const matches = req.body?.matches;
        const pipeline = await executeOperation({
            operation: 'pipeline.run',
            caller: 'backend/routes/pipeline.js',
            payload: {
                matches: Array.isArray(matches) ? matches.length : 0
            },
            execute: async () => (
                Array.isArray(matches) && matches.length > 0
                    ? runPipelineForMatches({ matches })
                    : runPipelineFromConfiguredDataMode()
            )
        });

        if (pipeline?.success === false || pipeline?.result?.error) {
            res.status(409).json({ error: pipeline?.error || pipeline?.result?.error || 'Pipeline rejected' });
            return;
        }

        const final = await executeOperation({
            operation: 'pipeline.rebuild',
            caller: 'backend/routes/pipeline.js',
            payload: { source: 'routes/pipeline' },
            execute: async () => rebuildFinalOutputs()
        });

        res.status(200).json({
            mode: pipeline?.result?.mode,
            raw_count: pipeline?.result?.inserted?.length || 0,
            filtered_valid: pipeline?.result?.filtered_valid || 0,
            filtered_invalid: pipeline?.result?.filtered_invalid || 0,
            singles_count: (final?.result?.normal?.singles?.length || 0) + (final?.result?.deep?.singles?.length || 0),
            acca_count: (final?.result?.normal?.accas?.length || 0) + (final?.result?.deep?.accas?.length || 0)
        });
    } catch (err) {
        console.error('Pipeline error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Switch between 'test' and 'live' mode
router.post('/mode', requireRole('admin'), async (req, res) => {
    try {
        const mode = req.body?.mode;
        if (mode !== 'test' && mode !== 'live') {
            res.status(400).json({ error: 'mode must be test or live' });
            return;
        }

        config.DATA_MODE = mode;
        console.log('[pipeline] DATA_MODE set to %s', mode);

        res.status(200).json({ ok: true, mode });
    } catch (err) {
        console.error('Pipeline error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Force a rebuild of the website outputs (direct1x2_prediction_final table)
router.post('/rebuild', requireRole('admin'), async (_req, res) => {
    try {
        console.log('[pipeline] Manual rebuild of final outputs requested...');
        const final = await executeOperation({
            operation: 'pipeline.rebuild',
            caller: 'backend/routes/pipeline.js',
            payload: { source: 'routes/pipeline.rebuild' },
            execute: async () => rebuildFinalOutputs()
        });
        if (final?.success === false) {
            res.status(503).json({ error: final.reason || final.error || 'rebuild_blocked', traceId: final.traceId || final.trace_id || null });
            return;
        }
        res.status(200).json({ ok: true, message: 'Final outputs rebuilt successfully', data: final.result || final });
    } catch (err) {
        console.error('Pipeline rebuild error:', err);
        res.status(500).json({ error: 'Rebuild failed', details: err.message });
    }
});

module.exports = router;
