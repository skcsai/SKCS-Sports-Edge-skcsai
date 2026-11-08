'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express      = require('express');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cors         = require('cors');
const morgan       = require('morgan');
const compression = require('compression');
const { spawn }    = require('child_process');
const moment       = require('moment-timezone');
const path         = require('path');
const { createClient } = require('@supabase/supabase-js');
const config       = require('./config');
const { query }            = require('./database');
const {
    shouldAllowOddsCall,
    consumeOddsCallSlot,
    applyOddsProviderHeaders,
    getOddsBudgetStatus
} = require('./services/oddsBudgetService');
const { requireRole, requireSchedulerSecret } = require('./utils/auth');
const {
    createSubscriptionRecord,
    hasUsedDayZeroForUser,
    upsertProfile
} = require('./database');
const { getPlan }           = require('./config/subscriptionPlans');
const { requireSupabaseUser } = require('./middleware/supabaseJwt');
// AI-DISABLED: node-cron removed to prevent race conditions on scaled/sleeping Render instances.
// Rely exclusively on external triggers hitting the /api/cron/* routes.
// const cron         = require('node-cron');
const { syncAllSports, syncSports }      = require('./services/syncService');
const { bootstrap }          = require('./dbBootstrap');
const { runLiveSync }       = require('../scripts/fetch-live-fixtures');
const { jobLogger } = require('./utils/jobLogger');
const {
    calculateExpirationTime,
    calculateSubscriptionStart,
    formatSastDateTime
} = require('./services/subscriptionTiming');
const verificationController = require('./core/verificationController');
const verificationHydrationPromise = verificationController.hydrateFromLatestSystemHealthState().catch((error) => {
    console.warn('[Server] Failed to seed verification controller from system health state:', error.message);
    return null;
});
const PRE_MATCH_ONLY_MODE = String(process.env.SKCS_PRE_MATCH_ONLY || 'true').trim() !== 'false';

const { getPlanCapabilities, filterPredictionsForPlan } = require('./config/subscriptionMatrix');
const { normalizeFixtureDate, getPredictionWindow, isFixtureEligibleForPrediction } = require('./utils/dateNormalization');
const { initCronJobs } = require('./services/cronJobs');
const { resolveStartupMode } = require('./startupMode');
const startupPolicy = resolveStartupMode();

const { syncDailyFixtures, enrichMatchContext, generateEdgeMindInsight } = require('./services/thesportsdbPipeline');

// Initialize Express app BEFORE using it
const app = express();

// Pipeline trigger endpoint for enrichment and AI processing
app.post('/api/pipeline/trigger', requireSchedulerSecret, express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { publishRunId } = req.body || {};
    
    if (!publishRunId) {
      return res.status(400).json({ 
        error: 'publishRunId is required' 
      });
    }

    console.log(`[pipeline/trigger] Starting pipeline for run ${publishRunId}`);
    const result = await executeOperation({
      operation: 'server.pipeline.trigger',
      caller: 'backend/server-express.js',
      payload: { publishRunId },
      execute: async () => {
        console.log('[pipeline/trigger] Starting context enrichment...');
        try {
          const { rows: fixturesToEnrich } = await query(`
            SELECT rf.id_event, rf.sport
            FROM raw_fixtures rf
            LEFT JOIN fixture_processing_log fpl ON rf.id_event = fpl.id_event AND fpl.publish_run_id = $1
            WHERE fpl.enrichment_completed_at IS NULL
              AND rf.start_time >= NOW()
              AND rf.start_time <= NOW() + INTERVAL '7 days'
          `, [publishRunId]);

          console.log(`[pipeline/trigger] Found ${fixturesToEnrich.length} fixtures to enrich`);

          for (const fixture of fixturesToEnrich) {
            try {
              const contextEnrichmentService = require('./services/contextEnrichmentService.js');
              await contextEnrichmentService.enrichFixture(fixture.id_event, fixture.sport);
              await query(`
                SELECT update_fixture_processing_log(
                  $1, $2, 'enrichment_completed', NULL, NULL, $3
                )
              `, [fixture.id_event, publishRunId, fixture.sport]);
            } catch (err) {
              console.error(`[pipeline/trigger] Enrichment failed for ${fixture.id_event}:`, err.message);
              await query(`
                SELECT update_fixture_processing_log(
                  $1, $2, 'enrichment_completed', NULL, $3, $4
                )
              `, [fixture.id_event, publishRunId, fixture.sport, err.message]);
            }
          }
        } catch (err) {
          console.error('[pipeline/trigger] Context enrichment failed:', err.message);
        }

        console.log('[pipeline/trigger] Starting AI pipeline processing...');
        const aiPipelineOrchestrator = require('./services/aiPipelineOrchestrator');
        return await aiPipelineOrchestrator.runFullPipeline(null, 'UPCOMING_7_DAYS', publishRunId);
      }
    });

    if (result?.success === false) {
      return res.status(503).json({
        error: result.reason || result.error || 'pipeline_trigger_blocked',
        publishRunId,
        traceId: result.traceId || result.trace_id || null
      });
    }

    console.log(`[pipeline/trigger] AI pipeline completed:`, result.result);
    res.json({
      success: true,
      publishRunId,
      result: result.result
    });
    
  } catch (err) {
    console.error('[pipeline/trigger] Pipeline trigger error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

if (startupPolicy.runDatabaseBootstrap) {
    void bootstrap().catch(err => console.error('[startup] bootstrap failed:', err.message));
} else {
    console.log('[startup] CANARY mode: database bootstrap suppressed');
}

if (startupPolicy.initializeCronJobs) {
    try {
        initCronJobs();
    } catch (err) {
        console.error('[startup] cron jobs init failed:', err.message);
    }
} else {
    console.log('[startup] CANARY mode: internal cron initialization suppressed');
}

const isProd = process.env.NODE_ENV === 'production';
const safeErr = (err) => isProd ? 'Internal server error' : (err?.message || 'Unknown error');

const WEEKLY_ROLLING_SCRAPE_CRON = '0 2 * * 1'; // Monday 02:00 UTC = 04:00 SAST
const ACCA_ROLLING_SYNC_CRON = '0 */4 * * *';
const CORE_MARKET_ROLLING_SYNC_CRON = '0 */2 * * *';
const ROLLING_SYNC_TIMEZONE = 'Africa/Johannesburg';
const ROLLING_CUTOFF_HOUR = 11;
const ROLLING_CUTOFF_MINUTE = 59;

let rollingSyncInProgress = false;

// AI-DISABLED: Weekly rolling scrape scheduler
// cron.schedule(WEEKLY_ROLLING_SCRAPE_CRON, () => {
//     console.log('[cron] Triggering weekly global 7-day rolling scrape (04:00 SAST / 02:00 UTC)');
//     void syncAllSports().catch(err => console.error('[cron] Weekly rolling scrape failed:', err));
// }, { timezone: 'UTC' });

function isWithinRollingWindow(nowMoment = moment.tz(ROLLING_SYNC_TIMEZONE)) {
    const hour = nowMoment.hour();
    const minute = nowMoment.minute();
    return hour < ROLLING_CUTOFF_HOUR || (hour === ROLLING_CUTOFF_HOUR && minute <= ROLLING_CUTOFF_MINUTE);
}

async function runRollingSync(label) {
    const now = moment.tz(ROLLING_SYNC_TIMEZONE);
    if (!isWithinRollingWindow(now)) {
        console.log(`[cron] ${label}: skipped (${now.format()} outside 00:00-11:59 SAST rolling window)`);
        return;
    }
    if (rollingSyncInProgress) {
        console.log(`[cron] ${label}: skipped (another rolling sync is in progress)`);
        return;
    }

    rollingSyncInProgress = true;
    try {
        console.log(`[cron] ${label}: starting rolling sync at ${now.format()} SAST`);
        await executeOperation({
            operation: 'server.rolling-sync',
            caller: 'backend/server-express.js',
            payload: { label },
            execute: async () => syncAllSports()
        });
        console.log(`[cron] ${label}: rolling sync completed`);
    } catch (err) {
        console.error(`[cron] ${label}: rolling sync failed`, err.message);
    } finally {
        rollingSyncInProgress = false;
    }
}

// AI-DISABLED: Internal interval schedulers
// cron.schedule(ACCA_ROLLING_SYNC_CRON, () => {
//     void runRollingSync('ACCA-4h');
// }, { timezone: ROLLING_SYNC_TIMEZONE });
// 
// cron.schedule(CORE_MARKET_ROLLING_SYNC_CRON, () => {
//     void runRollingSync('DIRECT-SAME-DOUBLECHANCE-2h');
// }, { timezone: ROLLING_SYNC_TIMEZONE });

function warnEnv(name) {
    if (!process.env[name] || String(process.env[name]).trim().length === 0) {
        console.warn(`[env] warning: ${name} is not set`);
    }
}
warnEnv('DATABASE_URL');
warnEnv('ADMIN_API_KEY');
warnEnv('USER_API_KEY');
warnEnv('GEMINI_API_KEY');

const predictionsRouter = require('./routes/predictions');
const pipelineRouter    = require('./routes/pipeline');
const debugRouter       = require('./routes/debug');
const userRouter        = require('./routes/user');
const chatRouter        = require('./routes/chat');
const accuracyRouter    = require('./routes/accuracy');
const skcsGradingRouter = require('./routes/skcsGrading');
const vipRouter         = require('./routes/vip');
const direct1x2Router   = require('./routes/direct1x2');
const refreshAIRouter   = require('./routes/refresh-ai');
const tier1Router       = require('./routes/tier1');
const cricketInsightsRouter = startupPolicy.sideEffectsEnabled ? require('./routes/cricketInsights') : express.Router();
const cricketCountRouter = startupPolicy.sideEffectsEnabled ? require('./routes/cricketCount') : express.Router();
const cricketCronRouter = startupPolicy.sideEffectsEnabled ? require('./routes/cricketCron') : express.Router();
const cricketCacheRouter = require('./routes/cricketCache');
const sportsEdgeRouter   = require('./routes/sportsEdge');
const schedulerRouter   = require('./routes/scheduler');
const metricsRouter     = require('./routes/metrics');
const semanticDriftRouter = require('./routes/semanticDrift');
const divanscoreRouter  = require('./routes/divanscore');
const antigravityRouter = require('./routes/antigravity');
const controlCenterRouter = require('./routes/controlCenter');

// API v1 Routers (Master Rulebook v2.0)
const v1PredictionsRouter = require('./routes/v1/predictions');
const v1AccaRouter = require('./routes/v1/acca');
const v1SmbRouter = require('./routes/v1/sameMatchBuilder');
const v1SecondaryMarketsRouter = require('./routes/v1/secondaryMarkets');
const feedbackRouter    = require('./routes/feedback');
const { runTier1Stage1Bootstrap } = require('./services/tier1BootstrapService');
const { executeOperation } = require('./core/executionPipeline');

const DIRECT_INSIGHTS_READ_SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const DIRECT_INSIGHTS_READ_SUPABASE_ANON_KEY = String(
    process.env.SUPABASE_ANON_KEY || ''
).trim();
const directInsightsReadSupabase = DIRECT_INSIGHTS_READ_SUPABASE_URL && DIRECT_INSIGHTS_READ_SUPABASE_ANON_KEY
    ? createClient(DIRECT_INSIGHTS_READ_SUPABASE_URL, DIRECT_INSIGHTS_READ_SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
    : null;

app.disable('x-powered-by');

const configuredOrigins = String(process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "https://skcsaiedge.onrender.com",
  "https://skcsai-z8cd.onrender.com",
  "https://skcs-sports-edge-skcsai.onrender.com",
  "https://skcs-sports-edge.github.io",
  "https://skcsaisports.vercel.app",
  "https://skcsai.vercel.app",
  "https://skcs-sports-edge-skcsai.vercel.app",
  "https://skcs.co.za",
  "https://www.skcs.co.za",
  "https://skcsaisports-5ltic8509-stephens-projects-e3dd898a.vercel.app",
  "https://skcsaisports-6x2zcgjq1-stephens-projects-e3dd898a.vercel.app",
  "https://skcsaisports-o200aflsl-stephens-projects-e3dd898a.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174"
]);

for (const origin of configuredOrigins) {
  allowedOrigins.add(origin);
}

if (process.env.RENDER_EXTERNAL_URL) {
  try {
    const u = new URL(process.env.RENDER_EXTERNAL_URL);
    allowedOrigins.add(u.origin);
  } catch { /* ignore invalid URL */ }
}

function isAllowedVercelPreview(origin) {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'https:') return false;

    return (
      hostname === 'skcsaisports.vercel.app' ||
      hostname === 'skcsai.vercel.app' ||
      hostname === 'skcs-sports-edge-skcsai.vercel.app' ||
      /^skcsaisports-[a-z0-9-]+\.vercel\.app$/i.test(hostname) ||
      /^skcsai-[a-z0-9-]+\.vercel\.app$/i.test(hostname) ||
      /^skcs-sports-edge-skcsai(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(hostname)
    );
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins.has(origin) || isAllowedVercelPreview(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true
};

app.use(cors(corsOptions));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});

// Apply rate limiter conditionally to avoid blocking external cron-jobs and admin triggers
app.use((req, res, next) => {
  if (req.path.startsWith('/api/cron') || req.path.startsWith('/api/admin') || req.path.startsWith('/api/refresh-predictions')) {
    return next();
  }
  globalLimiter(req, res, next);
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'https://cdn.tailwindcss.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'https://cdn.tailwindcss.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'https://api.odds.p.rapidapi.com', 'https://v3.football.api-sports.io', 'https://cricbuzz-cricket.p.rapidapi.com', 'https://*.rapidapi.com', 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'data:', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Enable gzip compression for bandwidth management
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Don't compress small responses
    return res.getHeader('Content-Length') > 1024;
  },
  level: 6, // Balanced compression level
  threshold: 1024 // Only compress responses larger than 1KB
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure all JSON responses use UTF-8 encoding for proper emoji/character support
app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (data) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return originalJson(data);
    };
    next();
});

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

// Internal endpoint for fixture fetching by sport
app.post('/api/internal/fetch-fixtures', requireSchedulerSecret, async (req, res) => {
  try {
    const { sport, start, end, publishRunId } = req.body;
    
    if (!sport || !start || !end || !publishRunId) {
      return res.status(400).json({ 
        error: 'Missing required fields: sport, start, end, publishRunId' 
      });
    }

    console.log(`[internal/fetch-fixtures] Processing ${sport} for run ${publishRunId}`);
    
    // Get sport configuration to find adapter name
    const { rows: sportConfigs } = await query(`
      SELECT adapter_name FROM sport_sync WHERE sport = $1
    `, [sport]);
    
    if (sportConfigs.length === 0) {
      return res.status(404).json({ 
        error: `Sport ${sport} not found in configuration` 
      });
    }
    
    const adapterName = sportConfigs[0].adapter_name;
    console.log(`[internal/fetch-fixtures] Loading adapter: ${adapterName}`);
    
    // Load the adapter dynamically
    let adapter;
    try {
      adapter = require(`./adapters/${adapterName}`);
    } catch (err) {
      console.error(`[internal/fetch-fixtures] Failed to load adapter ${adapterName}:`, err.message);
      return res.status(500).json({ 
        error: `Failed to load adapter ${adapterName}: ${err.message}` 
      });
    }
    
    // Call adapter to fetch fixtures
    const fixtures = await adapter.fetchFixtures(new Date(start), new Date(end));
    console.log(`[internal/fetch-fixtures] Fetched ${fixtures.length} fixtures for ${sport}`);
    
    // Upsert each fixture with telemetry
    const results = [];
    for (const fixture of fixtures) {
      try {
        const { rows: [upsertResult] } = await query(`
          SELECT * FROM upsert_raw_fixture(
            $1, $2, $3, $4, $5, $6
          )
        `, [
          fixture.id_event,
          fixture.sport || sport,
          fixture.league_id,
          fixture.home_team_id,
          fixture.away_team_id,
          fixture.start_time,
          fixture.raw_json || JSON.stringify(fixture)
        ]);
        
        // Log telemetry for ingestion completion
        await query(`
          SELECT update_fixture_processing_log(
            $1, $2, 'ingestion_completed', NULL, NULL, $3
          )
        `, [
          fixture.id_event,
          publishRunId,
          sport
        ]);
        
        results.push(upsertResult);
        
      } catch (err) {
        console.error(`[internal/fetch-fixtures] Failed to upsert fixture ${fixture.id_event}:`, err.message);
        results.push({
          action: 'ERROR',
          id_event: fixture.id_event,
          error_message: err.message
        });
      }
    }
    
    const successCount = results.filter(r => r.action !== 'ERROR').length;
    const errorCount = results.filter(r => r.action === 'ERROR').length;
    
    console.log(`[internal/fetch-fixtures] Completed: ${successCount} successful, ${errorCount} errors`);
    
    res.json({ 
      success: true, 
      sport,
      total: fixtures.length,
      successful: successCount,
      errors: errorCount,
      results 
    });
    
  } catch (err) {
    console.error('[internal/fetch-fixtures] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await verificationController.hydrateFromLatestSystemHealthState(true);
  } catch (error) {
    console.warn('[api/health] Failed to refresh health snapshot:', error.message);
  }
  const systemHealth = verificationController.getSnapshot();
  res.set('X-System-State', String(systemHealth.state || 'UNKNOWN'));
  const normalizedState = String(systemHealth.state || 'UNKNOWN').toUpperCase();
  res.json({
    status: normalizedState === 'HEALTHY' || normalizedState === 'UNKNOWN'
      ? 'ok'
      : normalizedState.toLowerCase(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
    env: process.env.NODE_ENV || 'development',
    marker_deploy: 'test-' + Date.now(),
    system_health: systemHealth,
    pipeline_metrics: systemHealth.pipelineMetrics || null
  });
});

app.get('/api/billing-status', (_req, res) => {
    const billing_enabled = String(process.env.BILLING_ENABLED || 'false').toLowerCase() === 'true';
    const subscription_open = String(process.env.SUBSCRIPTION_OPEN || 'true').toLowerCase() !== 'false';

    res.status(200).json({
        billing_enabled,
        subscription_open,
        currency: 'GBP',
        policy: {
            pro_rata: 'Join after 11:00 AM SAST and receive a complimentary Day Zero Pass for evening fixtures. Full paid cycle starts at 00:00 midnight.',
            refunds: 'All sales are final. No refunds are processed after activation.'
        }
    });
});

app.post('/api/select-plan', requireSupabaseUser, async (req, res) => {
    try {
        const tierId = String(req.body?.tier_id || '').trim();
        if (!tierId) {
            return res.status(400).json({ error: 'tier_id is required' });
        }

        const plan = getPlan(tierId);
        if (!plan) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const billingEnabled = String(process.env.BILLING_ENABLED || 'false').toLowerCase() === 'true';
        const subscriptionOpen = String(process.env.SUBSCRIPTION_OPEN || 'true').toLowerCase() !== 'false';
        const allowSelfServePlanSelection = String(process.env.ALLOW_SELF_SERVE_PLAN_SELECTION || 'false').toLowerCase() === 'true';
        if (!billingEnabled && !subscriptionOpen) {
            return res.status(403).json({
                requires_payment: true,
                message: 'Billing is not live yet. Access is currently limited to approved accounts or staging mode.'
            });
        }

        const isPrivilegedBypass = req.user?.is_admin === true || req.user?.is_test_user === true;
        if (!allowSelfServePlanSelection && !isPrivilegedBypass) {
            return res.status(403).json({
                requires_payment_confirmation: true,
                message: 'Plan activation requires a verified payment confirmation.'
            });
        }

        if (billingEnabled && !isPrivilegedBypass) {
            const paymentReference = String(req.body?.payment_reference || '').trim();
            if (!paymentReference) {
                return res.status(400).json({
                    error: 'payment_reference is required when billing is enabled'
                });
            }
        }

        const userId = req.user?.id;
        const email = req.user?.email || null;
        if (!userId) {
            return res.status(401).json({ error: 'User session is invalid' });
        }

        const hasUsedDayZero = await hasUsedDayZeroForUser(userId);
        const start = calculateSubscriptionStart(new Date(), hasUsedDayZero);
        const expirationTime = calculateExpirationTime(start.officialStartTime, plan.days);

        const subscription = await createSubscriptionRecord({
            user_id: userId,
            tier_id: tierId,
            status: start.status,
            payment_timestamp: start.paymentTimestamp,
            official_start_time: start.officialStartTime,
            expiration_time: expirationTime,
            join_after_cutoff: start.joinedAfterCutoff,
            pro_rata_direct_free_percent: start.proRataDirectFreePercent
        });

        await upsertProfile({
            id: userId,
            email,
            subscription_status: start.status,
            is_test_user: false,
            plan_id: tierId,
            plan_tier: plan.tier,
            plan_expires_at: expirationTime.toISOString()
        });

        return res.status(200).json({
            success: true,
            tier_id: tierId,
            tier_name: tierId,
            status: start.status,
            official_start_time: start.officialStartTimeIso,
            payment_timestamp: start.paymentTimestampIso,
            expires_at: expirationTime.toISOString(),
            join_after_cutoff: start.joinedAfterCutoff,
            pro_rata_direct_free_percent: start.proRataDirectFreePercent,
            policy: {
                pro_rata: 'Join after 11:59 AM SAST and receive 50% of today\'s Direct 1x2 matches free. Full paid cycle starts at 00:00 midnight.',
                refunds: 'All sales are final. Once paid and activated, no refund requests are processed.'
            },
            subscription
        });
    } catch (err) {
        console.error('[select-plan] error:', err);
        return res.status(500).json({ error: 'Failed to activate plan', details: safeErr(err) });
    }
});

app.get('/', (_req, res) => {
  res.redirect('/index.html');
});

app.get('/subscribe', (req, res) => {
  const params = new URLSearchParams();
  if (req.query?.locked !== undefined) {
    params.set('locked', String(req.query.locked));
  }
  if (req.query?.message !== undefined) {
    params.set('message', String(req.query.message));
  }
  const query = params.toString();
  res.redirect(`/subscribe/index.html${query ? `?${query}` : ''}`);
});

async function proxyOdds(req, res) {
  if (!process.env.ODDS_API_KEY) {
    return res.status(503).json({ error: 'Odds API not configured' });
  }

  const budget = shouldAllowOddsCall();
  if (!budget.allowed) {
    return res.status(429).json({
      error: 'Odds API daily budget reached',
      reason: budget.reason,
      budget: getOddsBudgetStatus()
    });
  }

  const target = `https://api.the-odds-api.com/v4${req.path}`;
  const params = { ...req.query, apiKey: process.env.ODDS_API_KEY };

  try {
    const axios = require('axios');
    consumeOddsCallSlot();
    const response = await axios.get(target, { params, timeout: 10000 });
    applyOddsProviderHeaders(response?.headers || {});
    const budgetStatus = getOddsBudgetStatus();
    res.setHeader('x-skcs-odds-daily-limit', String(budgetStatus.dailyLimitToday));
    res.setHeader('x-skcs-odds-remaining-today', String(budgetStatus.remainingToday));
    res.setHeader('x-skcs-odds-remaining-month', String(budgetStatus.remainingMonth));
    res.json(response.data);
  } catch (err) {
    applyOddsProviderHeaders(err?.response?.headers || {});
    console.error('[odds-proxy] error:', err.message);
    res.status(502).json({ error: 'Upstream error', details: safeErr(err) });
  }
}

app.use('/api/proxy/odds', proxyOdds);

app.use('/api/predictions', predictionsRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/debug', debugRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', refreshAIRouter);
app.use('/api/chat', chatRouter);
app.use('/api/edgemind', chatRouter);
app.use('/api/accuracy', accuracyRouter);
app.use('/api/skcs', skcsGradingRouter);
app.use('/api/vip', vipRouter);
app.use('/api/direct-1x2', direct1x2Router);
app.use('/api/tier1', tier1Router);
app.use('/api/cricket/insights', cricketInsightsRouter);
console.log('[server] Cricket insights router mounted at /api/cricket/insights');
app.use('/api/cricket/count', cricketCountRouter);
console.log('[server] Cricket count router mounted at /api/cricket/count');
app.use('/api/cricket/cache', cricketCacheRouter);
console.log('[server] Cricket cache router mounted at /api/cricket/cache');
app.use('/api/cron', cricketCronRouter);
app.use('/api/scheduler', schedulerRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/semantic-drift-summary', semanticDriftRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/control-center', controlCenterRouter);
app.use('/api', divanscoreRouter);
app.use('/api/antigravity', antigravityRouter);

// API v1 Endpoints (Master Rulebook v2.0)
app.use('/api/v1', v1PredictionsRouter);
app.use('/api/v1', v1AccaRouter);
app.use('/api/v1/smb', v1SmbRouter);
app.use('/api/v1/markets/secondary', v1SecondaryMarketsRouter);

// SKCS Sports Edge routes
app.use('/', sportsEdgeRouter);
console.log('[server] Sports Edge router mounted with API endpoints');

// --- Cloud Scheduler endpoints -------------------------------------------------
// These match the URLs documented in docs/google-cloud-soccer-refresh.md
// and expected by the skcs-football-refresh / skcs-football-grade scheduler jobs.

function requireRefreshKey(req, res, next) {
    const key = req.headers['x-api-key'];
    const refreshKey = process.env.SKCS_REFRESH_KEY;
    const adminKey   = process.env.ADMIN_API_KEY;

    if (!key) {
        return res.status(401).json({ error: 'Missing API key' });
    }
    if ((refreshKey && key === refreshKey) || (adminKey && key === adminKey)) {
        return next();
    }
    return res.status(403).json({ error: 'Invalid API key' });
}

function requireAdminKey(req, res, next) {
    const queryKey = req.query.key;
    const headerKey = req.headers['x-admin-key'];
    const cronSecret = process.env.CRON_SECRET;

    const providedKey = queryKey || headerKey;

    if (!cronSecret) {
        return res.status(500).json({ error: 'CRON_SECRET not configured' });
    }
    if (!providedKey) {
        return res.status(401).json({ error: 'Missing admin API key' });
    }
    if (providedKey !== cronSecret) {
        return res.status(401).json({ error: 'Invalid admin API key' });
    }
    return next();
}

app.get('/api/refresh-predictions', (_req, res) => {
    res.status(405).json({
        ok: false,
        error: 'Method not allowed',
        message: 'This endpoint only accepts POST. Open admin-sync.html and click Trigger Sync, or send POST with x-api-key.',
        method: 'POST',
        admin_page: 'https://www.skcs.co.za/admin-sync.html',
        example: 'POST /api/refresh-predictions?sport=football'
    });
});

app.post('/api/refresh-predictions', requireRefreshKey, (req, res) => {
    const sport = req.query.sport || req.body?.sport || null;
    const label = `scheduler refresh${sport ? ` (${sport})` : ''}`;
    console.log(`[scheduler] ${label} triggered — starting in background`);

    // Respond immediately so the caller doesn't timeout
    res.status(202).json({
        ok: true,
        message: `${label} started in background`,
        note: 'Sync is running asynchronously. Check /api/predictions in a few minutes for fresh data.'
    });

    // Run the sync in the background — unhandled errors are logged but won't crash the server
    (async () => {
        try {
            const result = await executeOperation({
                operation: 'server.refresh-predictions',
                caller: 'backend/server-express.js',
                payload: { sport },
                execute: async () => (
                    sport
                        ? syncSports({ sports: sport })
                        : syncAllSports()
                )
            });

            console.log(`[scheduler] ${label} completed:`, JSON.stringify({
                totalMatchesProcessed: result?.result?.totalMatchesProcessed || 0,
                perSport: result?.result?.perSport || [],
                errors: result?.result?.errors || [],
                rebuiltFinalOutputs: result?.result?.rebuiltFinalOutputs || false
            }));
        } catch (err) {
            console.error(`[scheduler] ${label} failed:`, err.message);
            console.error(`[scheduler] ${label} stack:`, err.stack);
        }
    })();
});

// Debug endpoint to check API-Sports connectivity and trigger sync with detailed output
app.get('/api/debug/sync-test', requireRefreshKey, async (req, res) => {
    try {
        const { APISportsClient } = require('./apiClients');
        const client = new APISportsClient();
        const today = new Date().toISOString().slice(0, 10);
        const windowEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        // Compute season year inline (same logic as syncService)
        const now = new Date();
        const month = now.getUTCMonth() + 1;
        const year = now.getUTCFullYear();
        const seasonYear = month >= 8 ? year : year - 1;

        const debug = {
            timestamp: new Date().toISOString(),
            config: {
                hasApiSportsKey: !!process.env.X_APISPORTS_KEY,
                hasOddsApiKey: !!process.env.ODDS_API_KEY,
                dataMode: config.DATA_MODE || 'test (default)',
                seasonYear: String(seasonYear),
                dateRange: `${today} to ${windowEnd}`,
            },
            apiTest: {}
        };

        // Test football API
        try {
            const footballKeys = client.getKeysForSport('Football');
            debug.apiTest.football = {
                keysFound: footballKeys.length,
                test: `EPL league 39, season ${seasonYear}`,
            };

            if (footballKeys.length > 0) {
                const data = await client.getFixtures('39', String(seasonYear), { from: today, to: windowEnd }, 'Football');
                debug.apiTest.football.result = data ? {
                    results: data.results || 0,
                    errors: data.errors || null,
                    fixtureCount: data.response ? data.response.length : 0,
                } : 'request_failed';
            } else {
                debug.apiTest.football.result = 'no_keys_configured';
            }
        } catch (err) {
            debug.apiTest.football = { error: err.message };
        }

        res.json({ ok: true, debug });
    } catch (err) {
        res.status(500).json({ ok: false, error: safeErr(err) });
    }
});

async function runSettlementJob({ sport, gradeDate }) {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'track-prediction-accuracy.js');
    const args = [`--sport=${sport}`, `--date=${gradeDate}`];

    const result = await executeOperation({
        operation: 'server.settlement.run',
        caller: 'backend/server-express.js',
        payload: { sport, gradeDate },
        execute: async () => new Promise((resolve, reject) => {
            const child = spawn(process.execPath, [scriptPath, ...args], {
                env: { ...process.env },
                stdio: ['ignore', 'pipe', 'pipe'],
                timeout: 25 * 60 * 1000   // 25 minutes
            });

            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (chunk) => { stdout += chunk; });
            child.stderr.on('data', (chunk) => { stderr += chunk; });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Grading script exited with code ${code}: ${stderr || stdout}`));
                }
            });

            child.on('error', reject);
        })
    });

    if (result?.success === false) {
        throw new Error(result.reason || result.error || 'settlement_blocked');
    }

    let summary = null;
    try {
        const lines = result.result.stdout.trim().split('\n');
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].trim().startsWith('{')) {
                summary = JSON.parse(lines.slice(i).join('\n'));
                break;
            }
        }
    } catch {
        summary = null;
    }

    return { summary, raw: result.result.stdout.slice(-2000) };
}

app.post('/api/grade-predictions', requireRefreshKey, async (req, res) => {
    const sport     = req.query.sport || req.body?.sport || 'football';
    const dateParam = req.query.date  || req.body?.date  || null;

    // Default to yesterday in Africa/Johannesburg
    const gradeDate = dateParam
        || moment().tz('Africa/Johannesburg').subtract(1, 'day').format('YYYY-MM-DD');

    console.log(`[scheduler] grading ${sport} for ${gradeDate}`);

    try {
        const result = await runSettlementJob({ sport, gradeDate });

        res.status(200).json({
            ok: true,
            message: `Grading completed for ${sport} on ${gradeDate}`,
            gradeDate,
            sport,
            summary: result.summary,
            raw: result.raw
        });
    } catch (err) {
        console.error(`[scheduler] grading failed:`, err.message);
        res.status(500).json({ ok: false, error: safeErr(err), gradeDate, sport });
    }
});

app.post('/api/settlement/run', requireRefreshKey, async (req, res) => {
    const sport = req.query.sport || req.body?.sport || 'Football';
    const dateParam = req.query.date || req.body?.date || null;
    const settlementDate = dateParam
        || moment().tz('Africa/Johannesburg').subtract(1, 'day').format('YYYY-MM-DD');

    console.log(`[scheduler] settlement ${sport} for ${settlementDate}`);
    try {
        const result = await runSettlementJob({ sport, gradeDate: settlementDate });
        res.status(200).json({
            ok: true,
            message: `Settlement completed for ${sport} on ${settlementDate}`,
            settlementDate,
            sport,
            summary: result.summary,
            raw: result.raw
        });
    } catch (err) {
        console.error(`[scheduler] settlement failed:`, err.message);
        res.status(500).json({ ok: false, error: safeErr(err), settlementDate, sport });
    }
});

// ============================================================
// TIERED CRON SYNC ENDPOINTS
// External cron jobs should hit these at different intervals
// ============================================================

const { fetchWithWaterfall } = require('./utils/rapidApiWaterfall');
const { pool } = require('./database');

const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
    console.error('[startup] CRON_SECRET env var is not set — cron endpoints will reject all requests');
}

// Cron routes use the canonical header-only requireSchedulerSecret middleware.

async function runCronWithLog(jobName, req, fn) {
    const startedAtMs = Date.now();
    const logId = await jobLogger.start(jobName, {
        path: req.path,
        method: req.method,
        query: req.query || {}
    });
    try {
        const result = await fn();
        await jobLogger.success(jobName, logId, {
            durationMs: Date.now() - startedAtMs,
            ...(result && typeof result === 'object' ? result : { result })
        });
        return result;
    } catch (error) {
        await jobLogger.fail(jobName, logId, error.message, {
            durationMs: Date.now() - startedAtMs
        });
        throw error;
    }
}

async function startPublishRun(triggerSource, requestedSports, runScope, notes, metadata = {}) {
    const res = await query(`
        INSERT INTO prediction_publish_runs (
            trigger_source, requested_sports, run_scope, status, notes, metadata
        )
        VALUES ($1, $2::text[], $3, 'running', $4, $5::jsonb)
        RETURNING id
    `, [
        triggerSource,
        Array.isArray(requestedSports) ? requestedSports : [],
        runScope,
        notes || null,
        JSON.stringify({ started_at: new Date().toISOString(), ...(metadata || {}) })
    ]);
    return res.rows?.[0]?.id || null;
}

async function finalizePublishRun(runId, status, errorMessage, metadata = {}) {
    if (!runId) return;
    await query(`
        UPDATE prediction_publish_runs
        SET
            status = $2,
            completed_at = NOW(),
            error_message = $3,
            metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb
        WHERE id = $1
    `, [
        runId,
        status === 'completed' ? 'completed' : 'failed',
        errorMessage || null,
        JSON.stringify({ finished_at: new Date().toISOString(), ...(metadata || {}) })
    ]);
}

// ADMIN: Force reset tier rules to minimal (accept ALL)
app.get('/api/admin/reset-tier-rules', async (_req, res) => {
    try {
        await query(`
            INSERT INTO tier_rules (tier, min_confidence, allowed_markets, max_acca_size, allowed_volatility)
            VALUES
                ('normal', 1, '["ALL"]'::jsonb, 100, '["low","medium","high"]'::jsonb),
                ('deep', 1, '["ALL"]'::jsonb, 100, '["low","medium","high"]'::jsonb)
            ON CONFLICT (tier) DO UPDATE SET
                min_confidence = 1,
                allowed_markets = '["ALL"]'::jsonb,
                max_acca_size = 100,
                allowed_volatility = '["low","medium","high"]'::jsonb;
        `);
        res.json({ ok: true, message: 'Tier rules reset to minimal' });
    } catch (err) {
        res.status(500).json({ error: safeErr(err) });
    }
});

// TIER 1: LIVE SYNC -> Run every 5 minutes
// Uses the main pipeline from fetch-live-fixtures.js with Master League filtering
app.get('/api/cron/sync-live', requireSchedulerSecret, async (req, res) => {
    if (PRE_MATCH_ONLY_MODE) {
        return res.status(410).json({
            status: 'disabled',
            message: 'Live sync is disabled in pre-match-only mode'
        });
    }
    console.log('[cron/sync-live] Starting tier-1 live sync...');
    const logId = await jobLogger.start('cron_sync_live', {
        path: req.path,
        method: req.method,
        query: req.query || {}
    });
    const startedAtMs = Date.now();
    
    const debugInfo = {
        hasApiKey: !!process.env.X_APISPORTS_KEY,
        hasDbUrl: !!process.env.DATABASE_URL
    };
    console.log('[cron/sync-live] Config check:', debugInfo);
    
    try {
        const result = await runLiveSync();
        
        // Return simple summary instead of full data dump (fixes Cron-job.org 64KB limit)
        const summary = {
            status: 'ok',
            success: result.success,
            fixtures: result.fixtures || 0,
            upserted: result.upserted || 0,
            eventsUpserted: result.eventsUpserted || 0,
            aiTokensSaved: result.aiTokensSaved || 0,
            publishRunId: result.publishRunId || null
        };
        
        console.log('[cron/sync-live] Result:', JSON.stringify(summary));
        await jobLogger.success('cron_sync_live', logId, {
            durationMs: Date.now() - startedAtMs,
            fixturesImported: Number(summary.fixtures || 0),
            predictionsGenerated: Number(summary.upserted || 0),
            predictionsFiltered: 0,
            summary
        });
        res.json(summary);
        
    } catch (err) {
        console.error('[cron/sync-live] Failed:', err.message, err.stack);
        await jobLogger.fail('cron_sync_live', logId, err.message, {
            durationMs: Date.now() - startedAtMs
        });
        res.json({ status: 'error', message: err.message });
    }
});

// TIER 1 ENTITY BOOTSTRAP (TheSportsDB + priority queue ordering)
app.get('/api/cron/tier1-stage1-bootstrap', requireSchedulerSecret, async (req, res) => {
    console.log('[cron/tier1-stage1-bootstrap] Starting Tier 1 entity bootstrap...');
    try {
        const result = await runCronWithLog('cron_tier1_stage1_bootstrap', req, async () => {
            const rawCountries = String(req.query.countries || '').trim();
            const countries = rawCountries
                ? rawCountries.split(',').map((value) => String(value || '').trim()).filter(Boolean)
                : undefined;
            const delayMs = Number(req.query.delayMs || 0) || undefined;
            const payload = await runTier1Stage1Bootstrap({ countries, delayMs });
            const summary = (Array.isArray(payload?.results) ? payload.results : []).map((row) => ({
                sport: row.sport,
                priority: row.priority,
                leagues_discovered: row.leagues_discovered,
                leagues_hydrated: row.leagues_hydrated,
                teams_hydrated: row.teams_hydrated,
                players_hydrated: row.players_hydrated
            }));
            return {
                fixturesImported: 0,
                predictionsGenerated: 0,
                tier1Summary: summary
            };
        });
        return res.json({ status: 'ok', ...result });
    } catch (error) {
        console.error('[cron/tier1-stage1-bootstrap] Failed:', error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/direct-insights', async (_req, res) => {
    if (!directInsightsReadSupabase) {
        return res.status(503).json({ error: 'Supabase is not configured' });
    }

    const { data, error } = await directInsightsReadSupabase
        .from('direct_1x2_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('[api/direct-insights] query failed:', error.message);
        return res.status(500).json({ error: 'Failed to load direct insights' });
    }

    return res.json(data || []);
});

// TIER 2: STANDARD SYNC (Hits Tier 2 APIs) -> Run every 60 minutes
// Hits AllSportsApi, Cricbuzz, Sofascore for general fixture generation
// and injury updates for the upcoming week.
app.get('/api/cron/sync-standard', requireSchedulerSecret, async (req, res) => {
    console.log('[cron/sync-standard] Starting tier-2 standard sync...');
    
    try {
        const result = await runCronWithLog('cron_sync_standard', req, async () => {
            let upserted = 0;
            let publishRunId = null;
            try {
                const fixtures = await fetchWithWaterfall('/v1/fixtures', { sport: 'soccer' }, 'TIER_2', 10000);

                if (fixtures && fixtures.data) {
                    const data = Array.isArray(fixtures.data) ? fixtures.data : fixtures.data.response || [];
                    console.log(`[cron/sync-standard] Fetched ${data.length} fixtures via ${fixtures.host}`);

                    publishRunId = await startPublishRun(
                        'cron_sync_standard',
                        ['Football'],
                        'football_standard',
                        'Tier 2 standard sync fallback publish',
                        { provider_host: fixtures.host || null }
                    );

                    const client = await pool.connect();
                    try {
                        for (const f of data.slice(0, 100)) {
                            const matchId = String(f.id || f.fixture?.id || '').trim();
                            const homeTeam = f.home_team || f.teams?.home?.name || null;
                            const awayTeam = f.away_team || f.teams?.away?.name || null;
                            const kickoffRaw = f.date || f.fixture?.date || null;
                            const kickoff = kickoffRaw ? new Date(kickoffRaw).toISOString() : null;
                            if (!matchId || !homeTeam || !awayTeam) continue;

                            await client.query(`
                            INSERT INTO direct1x2_prediction_final (
                                publish_run_id, tier, type, matches, total_confidence, risk_level,
                                sport, market_type, recommendation, fixture_id, home_team, away_team,
                                prediction, confidence, match_date, created_at
                            )
                            VALUES ($1, 'normal', 'direct', $2::jsonb, 62, 'medium', 'Football', '1X2', $3, $4, $5, $6, $7, 62, $8::timestamptz, NOW())
                            ON CONFLICT DO NOTHING
                        `, [
                            publishRunId,
                            JSON.stringify([{
                                fixture_id: matchId,
                                home_team: homeTeam,
                                away_team: awayTeam,
                                match_date: kickoff,
                                commence_time: kickoff,
                                market: '1X2',
                                prediction: 'home_win',
                                metadata: { source: fixtures.host || null }
                            }]),
                            `${homeTeam} vs ${awayTeam}`,
                            matchId,
                            homeTeam,
                            awayTeam,
                            'home_win',
                            kickoff
                        ]);

                            upserted += 1;
                        }
                    } finally {
                        client.release();
                    }

                    await finalizePublishRun(publishRunId, 'completed', null, { upserted });
                    console.log(`[cron/sync-standard] Completed: ${upserted} fixtures upserted`);
                }

                return { fixturesImported: upserted, predictionsGenerated: upserted, publishRunId };
            } catch (error) {
                await finalizePublishRun(publishRunId, 'failed', error.message, { upserted });
                throw error;
            }
        });

        res.json({ message: 'Standard sync complete', status: 'ok', ...result });
        
    } catch (err) {
        console.error('[cron/sync-standard] Failed:', err.message);
        res.status(500).json({ error: 'Standard sync failed' });
    }
});

// TIER 3: DEEP SYNC (Hits Tier 3 APIs) -> Run every 24 hours (Midnight)
// Hits Football News API, MMA, F1 for deep EdgeMind context.
// Saves summaries to Supabase so the AI has context for the day.
app.get('/api/cron/sync-deep', requireSchedulerSecret, async (req, res) => {
    console.log('[cron/sync-deep] Starting tier-3 deep sync...');
    
    try {
        const result = await runCronWithLog('cron_sync_deep', req, async () => {
            const newsData = await fetchWithWaterfall('/v1/news', { query: 'football match analysis' }, 'TIER_3', 15000);
            let saved = 0;
            if (newsData && newsData.data) {
                const articles = Array.isArray(newsData.data) ? newsData.data : newsData.data.results || [];
                console.log(`[cron/sync-deep] Fetched ${articles.length} news articles via ${newsData.host}`);

                const cacheKey = `cron_deep_news_${new Date().toISOString().slice(0, 10)}`;
                await query(`
                    INSERT INTO rapidapi_cache (cache_key, provider_name, payload, updated_at)
                    VALUES ($1, $2, $3::jsonb, NOW())
                    ON CONFLICT (cache_key) DO UPDATE SET
                        provider_name = EXCLUDED.provider_name,
                        payload = EXCLUDED.payload,
                        updated_at = NOW()
                `, [
                    cacheKey,
                    'football_news_api',
                    JSON.stringify({
                        source_host: newsData.host || null,
                        articles: articles.slice(0, 50)
                    })
                ]);
                saved = Math.min(50, articles.length);
            }
            return { fixturesImported: 0, predictionsGenerated: 0, articlesSaved: saved };
        });

        res.json({ status: 'ok', articlesSaved: result.articlesSaved || 0 });
        
    } catch (err) {
        console.error('[cron/sync-deep] Failed:', err.message);
        res.json({ status: 'error', message: err.message });
    }
});

// SIMPLE SYNC - No validation, direct insert
app.get('/api/cron/sync-simple', requireSchedulerSecret, async (req, res) => {
    console.log('[cron/sync-simple] Starting simple sync (no validation)...');
    
    const scriptPath = path.join(__dirname, '..', 'scripts', 'simple-sync.js');
    
    try {
        await runCronWithLog('cron_sync_simple', req, async () => {
            await new Promise((resolve, reject) => {
                const child = spawn(process.execPath, [scriptPath], {
                    env: { ...process.env },
                    stdio: ['ignore', 'pipe', 'pipe'],
                    timeout: 10 * 60 * 1000
                });
                
                let stdout = '';
                let stderr = '';
                child.stdout.on('data', (chunk) => { stdout += chunk; });
                child.stderr.on('data', (chunk) => { stderr += chunk; });
                
                child.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Script exited with code ${code}: ${stderr || stdout}`));
                });
                
                child.on('error', reject);
            });
            return { fixturesImported: 0, predictionsGenerated: 0 };
        });
        
        console.log('[cron/sync-simple] Completed');
        res.json({ message: 'Simple sync complete', status: 'ok' });
        
    } catch (err) {
        console.error('[cron/sync-simple] Failed:', err.message);
        res.status(500).json({ error: 'Simple sync failed' });
    }
});

// FULL PIPELINE SYNC (Uses the main fetch-live-fixtures.js script)
app.get('/api/cron/sync-full', requireSchedulerSecret, async (req, res) => {
    console.log('[cron/sync-full] Starting full pipeline sync...');
    
    try {
        const scriptPath = path.join(__dirname, '..', 'scripts', 'fetch-live-fixtures.js');
        
        await runCronWithLog('cron_sync_full', req, async () => {
            await new Promise((resolve, reject) => {
                const child = spawn(process.execPath, [scriptPath], {
                    env: { ...process.env },
                    stdio: ['ignore', 'pipe', 'pipe'],
                    timeout: 15 * 60 * 1000
                });
                
                child.stdout.on('data', (chunk) => { process.stdout.write(chunk); });
                child.stderr.on('data', (chunk) => { process.stderr.write(chunk); });
                
                child.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`Script exited with code ${code}`));
                });
                
                child.on('error', reject);
            });
            return { fixturesImported: 0, predictionsGenerated: 0 };
        });
        
        console.log('[cron/sync-full] Completed');
        res.json({ message: 'Full sync complete', status: 'ok' });
        
    } catch (err) {
        console.error('[cron/sync-full] Failed:', err.message);
        res.status(500).json({ error: 'Full sync failed' });
    }
});

// CRICKET DAILY FIXTURES CRON
app.get('/api/cron/cricket-daily-fixtures', requireSchedulerSecret, async (req, res) => {
    const { isSportIngestionEnabled } = require('./services/apiQuotaRouter');
    if (!isSportIngestionEnabled('cricket')) {
        console.log('[cron/cricket-daily-fixtures] Skipped — cricket ingestion disabled (CRICKET_INGESTION_ENABLED)');
        return res.json({
            status: 'skipped',
            job: 'cron_cricket_daily_fixtures',
            reason: 'cricket_ingestion_disabled'
        });
    }

    console.log('[cron/cricket-daily-fixtures] Starting Cricbuzz daily cricket fixture sync...');

    try {
        const result = await runCronWithLog('cron_cricket_daily_fixtures', req, async () => {
            const { publishCricbuzzCricket } = require('../scripts/publish-cricbuzz-cricket');
            return await executeOperation({
                operation: 'cron.cricket.daily-fixtures',
                caller: 'backend/server-express.js',
                payload: { trigger: 'cron_cricket_daily_fixtures' },
                execute: async () => publishCricbuzzCricket({
                    trigger: 'cron_cricket_daily_fixtures'
                })
            });
        });

        res.json({
            status: 'ok',
            job: 'cron_cricket_daily_fixtures',
            result
        });
    } catch (err) {
        console.error('[cron/cricket-daily-fixtures] Failed:', err.message);
        res.status(500).json({
            status: 'error',
            job: 'cron_cricket_daily_fixtures',
            error: err.message
        });
    }
});

// 🚀 MASTER PIPELINE CRON ENDPOINT
// Triggers the full deterministic pipeline: Stage 1 → Stage 2 → Stage 3 → EdgeMind Judge
// Configure your external cron (cron-job.org) to hit this every 4-6 hours.
app.get('/api/cron/trigger-master-pipeline', requireSchedulerSecret, (req, res) => {
    console.log('[cron/master-pipeline] Master Pipeline triggered via external cron.');

    // Respond immediately so the cron job doesn't timeout waiting for the AI
    res.status(200).json({ 
        status: 'success', 
        message: 'Master Pipeline triggered. Running in background.' 
    });

    // Trigger the Master Orchestrator in the background
    const scriptPath = path.join(__dirname, '..', 'scripts', 'run-master-pipeline.js');
    const child = spawn('node', [scriptPath], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
    });

    child.stdout.on('data', (data) => console.log(`[master-pipeline] ${data.toString().trim()}`));
    child.stderr.on('data', (data) => console.error(`[master-pipeline] ${data.toString().trim()}`));
    child.on('close', (code) => {
        console.log(`[cron/master-pipeline] Pipeline exited with code ${code}`);
    });
});

// ESPN Hidden API Live Odds Monitoring Endpoint
app.get('/api/admin/cdn-live-loop', requireAdminKey, async (req, res) => {
    try {
        if (PRE_MATCH_ONLY_MODE) {
            return res.status(410).json({
                error: 'Live monitoring is disabled in pre-match-only mode'
            });
        }

        console.log('[cdn-live-loop] Starting ESPN Hidden API live odds monitoring...');
        
        // Import ESPN hidden API service
        const { getLiveGames, monitorGameOdds } = require('../services/espnHiddenApiService');
        
        const startTime = Math.floor(Date.now() / 1000);
        
        // Get current live games from ESPN
        const liveGames = await getLiveGames();
        
        if (!liveGames || liveGames.length === 0) {
            return res.json({
                message: 'No live games found',
                eventsProcessed: 0,
                duration: Math.floor(Date.now() / 1000) - startTime
            });
        }
        
        console.log(`[cdn-live-loop] Found ${liveGames.length} live games`);
        
        // Load previous momentum values from database
        const eventIds = liveGames.map(game => game.gameId);
        const { rows: previousMomentum } = await query(`
            SELECT espn_entity_id, live_momentum 
            FROM public_intelligence 
            WHERE espn_entity_id = ANY($1::text[])
            ORDER BY created_at DESC 
            LIMIT 5
        `, [eventIds]);
        
        // Initialize state tracker with previous values
        const stateTracker = {};
        previousMomentum.forEach(row => {
            stateTracker[row.espns_entity_id] = row.live_momentum;
        });
        
        // Monitor all live games
        const monitoringPromises = liveGames.map(async (game) => {
            try {
                const monitoringData = await monitorGameOdds(game.gameId, game.sport);
                
                if (!monitoringData) {
                    return null;
                }
                
                const previousData = stateTracker[game.gameId];
                let flagsTriggered = false;
                
                if (previousData) {
                    // Check for significant changes
                    const winProbChange = Math.abs(monitoringData.winProbability - previousData.winProbability);
                    
                    if (winProbChange > 0.05) { // Win probability shift > 5%
                        console.log(`[cdn-live-loop] FLAG: Win probability shift detected for ${game.gameId}: ${monitoringData.winProbability} -> ${previousData.winProbability}`);
                        flagsTriggered = true;
                    }
                }
                
                // Update state tracker
                stateTracker[game.gameId] = monitoringData;
                
                // Store significant changes in database
                if (flagsTriggered) {
                    await query(`
                        INSERT INTO public_intelligence (
                            espn_entity_id, news_timestamp, headline, description, 
                            live_momentum, created_at
                        ) VALUES (
                            $1, NOW(), $2, $3, $4, NOW()
                        )
                        ON CONFLICT (espn_entity_id) DO UPDATE SET
                            live_momentum = EXCLUDED.live_momentum,
                            news_timestamp = NOW()
                    `, [
                        game.gameId,
                        `Live odds movement detected: Win prob ${(monitoringData.winProbability * 100).toFixed(1)}%`,
                        `Significant odds movement detected for ${game.sport} event ${game.gameId}`,
                        JSON.stringify(monitoringData)
                    ]);
                }
                
                return monitoringData;
            } catch (error) {
                console.error(`[cdn-live-loop] Error monitoring ${game.gameId}:`, error.message);
                return null;
            }
        });
        
        // Wait for all monitoring to complete
        const results = await Promise.all(monitoringPromises);
        const successfulMonitoring = results.filter(r => r !== null).length;
        
        const duration = Math.floor(Date.now() / 1000) - startTime;
        
        console.log(`[cdn-live-loop] Completed: ${successfulMonitoring}/${liveGames.length} games monitored in ${duration}s`);
        
        res.json({
            message: 'ESPN live odds monitoring completed',
            eventsProcessed: successfulMonitoring,
            totalGames: liveGames.length,
            duration: duration,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[cdn-live-loop] Error:', error.message);
        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

// AI Predictions endpoint for frontend modal
app.get('/api/ai-predictions/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;

        if (!matchId) {
            return res.status(400).json({ error: 'matchId is required' });
        }

        // The function expects TEXT parameter, so keep as string
        console.log('[api/ai-predictions] Fetching prediction for matchId:', matchId, 'type:', typeof matchId);

        // Try ai_predictions table first (new system)
        let result;
        let lastError = null;
        try {
            result = await query(`
                SELECT 
                    id,
                    match_id,
                    home_team,
                    away_team,
                    prediction,
                    confidence,
                    edgemind_feedback,
                    value_combos,
                    same_match_builder,
                    created_at,
                    updated_at
                FROM ai_predictions 
                WHERE match_id = $1
                ORDER BY created_at DESC
                LIMIT 1
            `, [matchId]);
            console.log('[api/ai-predictions] ai_predictions query result:', result?.rows?.length || 0, 'rows');
        } catch (err) {
            console.error('[api/ai-predictions] ai_predictions query failed:', err.message);
            // If table doesn't exist, continue to fallback
            if (err.message.includes('does not exist') || err.message.includes('relation')) {
                console.log('[api/ai-predictions] ai_predictions table does not exist, using fallback');
            } else {
                lastError = err;
            }
        }

        // If not found in ai_predictions, try direct1x2_prediction_final (legacy predictions)
        if (!result || result.rows.length === 0) {
            try {
                // Try as text first (handles both UUID and integer strings)
                result = await query(`
                    SELECT id as match_id,
                           total_confidence as confidence_score,
                           edgemind_report as edgemind_feedback,
                           secondary_insights as value_combos,
                           secondary_markets as same_match_builder,
                           created_at,
                           matches,
                           sport,
                           market_type
                    FROM direct1x2_prediction_final
                    WHERE id::text = $1
                `, [matchId]);
                console.log('[api/ai-predictions] direct1x2_prediction_final (id::text) query result:', result?.rows?.length || 0, 'rows');
            } catch (err) {
                console.error('[api/ai-predictions] direct1x2_prediction_final (id::text) query failed:', err.message);
                // If table doesn't exist, continue to next fallback
                if (err.message.includes('does not exist') || err.message.includes('relation')) {
                    console.log('[api/ai-predictions] direct1x2_prediction_final table does not exist, using next fallback');
                } else {
                    lastError = err;
                }
            }
        }

        // If still not found, try searching in matches array for the match_id (multiple formats)
        if (!result || result.rows.length === 0) {
            try {
                // Try different match_id field names in the JSON
                const searchPatterns = [
                    `%"match_id":"${matchId}"%`,
                    `%"id_event":"${matchId}"%`,
                    `%"fixture_id":"${matchId}"%`,
                    `%"id":"${matchId}%`
                ];

                for (const pattern of searchPatterns) {
                    result = await query(`
                        SELECT id as match_id,
                               total_confidence as confidence_score,
                               edgemind_report as edgemind_feedback,
                               secondary_insights as value_combos,
                               secondary_markets as same_match_builder,
                               created_at,
                               matches,
                               sport,
                               market_type
                        FROM direct1x2_prediction_final
                        WHERE matches::jsonb::text LIKE $1
                        LIMIT 1
                    `, [pattern]);
                    if (result && result.rows.length > 0) {
                        console.log('[api/ai-predictions] direct1x2_prediction_final (matches LIKE) found with pattern:', pattern);
                        break;
                    }
                }
                console.log('[api/ai-predictions] direct1x2_prediction_final (matches LIKE) query result:', result?.rows?.length || 0, 'rows');
            } catch (err) {
                console.error('[api/ai-predictions] direct1x2_prediction_final (matches LIKE) query failed:', err.message);
                // If table doesn't exist, continue to graceful fallback
                if (err.message.includes('does not exist') || err.message.includes('relation')) {
                    console.log('[api/ai-predictions] direct1x2_prediction_final table does not exist, using graceful fallback');
                } else {
                    lastError = err;
                }
            }
        }

        if (!result || result.rows.length === 0) {
            // Graceful response when no AI prediction exists yet
            console.log('[api/ai-predictions] No prediction found for matchId:', matchId);
            return res.status(404).json({
                data: null,
                message: 'AI prediction not yet available - still calculating',
                status: 'pending'
            });
        }

        // Safely extract data with optional chaining
        const predictionData = result.rows[0];
        const responseData = {
            match_id: predictionData.match_id || predictionData.id,
            confidence_score: predictionData.confidence_score || predictionData.total_confidence,
            edgemind_feedback: predictionData.edgemind_feedback,
            value_combos: predictionData.value_combos,
            same_match_builder: predictionData.same_match_builder,
            updated_at: predictionData.updated_at || predictionData.created_at,
            // Optional fields that may not exist in all prediction types
            matches: predictionData.matches,
            sport: predictionData.sport,
            market_type: predictionData.market_type
        };

        console.log('[api/ai-predictions] Successfully fetched prediction for matchId:', matchId);
        res.json({ data: responseData, status: 'ready' });
    } catch (err) {
        console.error('[api/ai-predictions] Match Detail Fetch Error:', err.message);
        console.error('[api/ai-predictions] Full error stack:', err.stack);
        res.status(500).json({
            error: 'Failed to fetch AI prediction',
            message: isProd ? 'Internal server error' : err.message,
            details: isProd ? null : {
                matchId: req.params.matchId,
                errorType: err.constructor.name
            }
        });
    }
});

// DEBUG: Cricket tables health check
app.get('/api/debug/cricket-tables', async (_req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');

        const sb = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_KEY ||
            process.env.SUPABASE_ANON_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );

        const fixtures = await sb
            .from('cricket_fixtures')
            .select('*', { count: 'exact', head: true });

        const insights = await sb
            .from('cricket_insights_final')
            .select('*', { count: 'exact', head: true });

        const rules = await sb
            .from('cricket_market_rules')
            .select('*', { count: 'exact', head: true });

        res.json({
            ok: true,
            cricket_fixtures: fixtures.count || 0,
            cricket_insights_final: insights.count || 0,
            cricket_market_rules: rules.count || 0,
            errors: {
                fixtures: fixtures.error?.message || null,
                insights: insights.error?.message || null,
                rules: rules.error?.message || null
            }
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: safeErr(err) });
    }
});

// TEMPORARY: Admin routes for testing pipeline
app.get('/api/admin/force-discovery', requireAdminKey, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const runFootballSync = req.query.football_sync !== '0';
    console.log(`[ADMIN] Force discovery triggered for ${today}`);

    res.status(202).json({
        success: true,
        message: `Force discovery started in background for ${today}`,
        footballSync: runFootballSync ? 'started_in_background' : 'skipped'
    });

    setImmediate(async () => {
        try {
            const count = await executeOperation({
                operation: 'admin.force-discovery',
                caller: 'backend/server-express.js',
                payload: { today },
                execute: async () => syncDailyFixtures(today)
            });
            if (count?.success === false) {
                console.warn('[ADMIN] Force discovery blocked:', count.reason || count.error || 'force_discovery_blocked');
                return;
            }

            console.log('[ADMIN] Force discovery finished:', count?.result?.totalMatchesProcessed || count?.result || 0);

            if (runFootballSync) {
                const footballResult = await executeOperation({
                    operation: 'admin.force-discovery.football',
                    caller: 'backend/server-express.js',
                    payload: { sport: 'football' },
                    execute: async () => syncSports({ sports: 'football' })
                });
                const summary = footballResult?.result?.summary || footballResult?.result || footballResult;
                console.log('[ADMIN] Background football sync finished:', JSON.stringify(summary));
            }
        } catch (err) {
            console.error('[ADMIN] Force discovery failed:', err.message);
        }
    });
});

app.get('/api/admin/force-enrichment', requireAdminKey, async (_req, res) => {
    try {
        console.log('[ADMIN] Force enrichment triggered');
        
        // Query raw_fixtures for next 5 upcoming matches (regardless of 6-hour rule)
        const query = `
            SELECT id_event, start_time, home_team_id, away_team_id
            FROM raw_fixtures
            WHERE start_time >= NOW()
            ORDER BY start_time ASC
            LIMIT 5
        `;
        
        const result = await db.query(query);
        const upcomingMatches = result.rows;
        
        console.log(`[ADMIN] Force enrichment: Found ${upcomingMatches.length} upcoming matches`);
        
        let enrichedCount = 0;
        let insightCount = 0;
        
        for (const match of upcomingMatches) {
            const { id_event, start_time } = match;
            
            try {
                const enriched = await executeOperation({
                    operation: 'admin.force-enrichment.enrich',
                    caller: 'backend/server-express.js',
                    payload: { id_event },
                    execute: async () => enrichMatchContext(id_event)
                });
                if (enriched?.result) enrichedCount++;

                const insight = await executeOperation({
                    operation: 'admin.force-enrichment.insight',
                    caller: 'backend/server-express.js',
                    payload: { id_event },
                    execute: async () => generateEdgeMindInsight(id_event)
                });
                if (insight?.result) insightCount++;
                
                console.log(`[ADMIN] Force enrichment: Processed ${id_event} (starts ${start_time})`);
            } catch (err) {
                console.error(`[ADMIN] Force enrichment: Failed to process ${id_event}:`, err.message);
            }
        }
        
        res.json({ 
            success: true, 
            message: `Enrichment triggered for ${upcomingMatches.length} matches`,
            enriched: enrichedCount,
            insights: insightCount
        });
    } catch (err) {
        console.error('[ADMIN] Force enrichment failed:', err.message);
        res.status(500).json({ success: false, error: safeErr(err) });
    }
});

// --- SKCS Heartbeat Service Initialization ----------------------------------
// Initialize heartbeat service for background syncing
const { startSKCSHeartbeat } = require('./services/skcsHeartbeat');

// Start heartbeat only in normal runtime mode. Azure Stage A canary must stay side-effect free.
if (startupPolicy.startHeartbeat) {
  setTimeout(async () => {
    try {
      await verificationHydrationPromise;
      await verificationController.hydrateFromLatestSystemHealthState();
      startSKCSHeartbeat();
      console.log('[Server] SKCS Heartbeat service started successfully');
    } catch (error) {
      console.error('[Server] Failed to start heartbeat service:', error.message);
    }
  }, 5000); // 5 second delay
} else {
  console.log('[startup] CANARY mode: heartbeat startup suppressed');
}

// --- Error handler -------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server-express] listening on ${PORT}`);
});
