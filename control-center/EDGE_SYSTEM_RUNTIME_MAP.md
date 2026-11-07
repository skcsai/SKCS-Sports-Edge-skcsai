# Edge System Runtime Map

Inventory version: 1.0.0
Inventory SHA-256: c0632105a408deaef8e21a3ebdd79d2b6aab5916d53c309d34fbe820dd99403d

> Synchronized review surface for `EDGE_SYSTEM_RUNTIME_INVENTORY.v1.json`.
> This map is observational and does not declare future Edge architecture or canonical authority.

## Summary

- Runtime/system surfaces: 233
- Candidate status establishes authority: false
- Inventory declares future architecture: false

## Surfaces

### AGENTS.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/apiClients.js

- Surface classes: EXTERNAL_PROVIDER
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js, backend/services/cricApiCacheService.js, backend/services/dataProvider.js, scripts/fetch-live-fixtures.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.cricapi.com, api.football-data.org, api.sportsdata.io, api.sportsrc.org, api.the-odds-api.com, v1.afl.api-sports.io, v1.american-football.api-sports.io, v1.baseball.api-sports.io, v1.basketball.api-sports.io, v1.cricket.api-sports.io, v1.formula-1.api-sports.io, v1.handball.api-sports.io, v1.hockey.api-sports.io, v1.mma.api-sports.io, v1.rugby.api-sports.io, v1.tennis.api-sports.io, v1.volleyball.api-sports.io, v2.nba.api-sports.io, v3.football.api-sports.io
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/config/bigBallsLeagueMap.js

- Surface classes: EXTERNAL_PROVIDER
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/bigBallsFootballBridge.js
- Database role: NONE
- Database objects: None recorded
- External providers: bigballsdata.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/controllers/edgeMindController.js

- Surface classes: CONTROLLER, DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/chat.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/core/verificationController.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/predictions.js, backend/semantic-layer/controlPlaneEvaluator.js, backend/semantic-layer/governanceGatekeeper.js, backend/semantic-layer/verificationController.js, backend/server-express.js, backend/services/aiPipeline.js, backend/services/contextEnrichmentService.js, backend/services/pipelineMetricsService.js, backend/services/semanticDriftSummaryService.js, backend/services/syncService.js, backend/services/thesportsdbPipeline.js
- Database role: READ_WRITE
- Database objects: public.system_health_state
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/database.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/dbBootstrap.js, backend/middleware/supabaseJwt.js, backend/routes/feedback.js, backend/routes/refresh-ai.js, backend/routes/scheduler.js, backend/routes/user.js, backend/server-express.js, backend/services/aiPipelineOrchestrator.js, backend/services/contextEnrichmentService.js, backend/services/providerQuotaService.js, backend/services/sportsrcHealthService.js, scripts/fetch-live-fixtures.js
- Database role: READ_WRITE
- Database objects: IF, acca_rules, across, await, direct1x2_prediction_final, for, is, leagues, matches, not, pg_constraint, prediction_results, profiles, public.direct1x2_prediction_final, replaced, subscriptions, table_lifecycle_registry, teams, tier_rules, users
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/db.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/controllers/edgeMindController.js, backend/core/verificationController.js, backend/routes/accuracy.js, backend/routes/debug.js, backend/routes/predictions.js, backend/routes/sportsEdge.js, backend/routes/user.js, backend/routes/v1/acca.js, backend/routes/v1/predictions.js, backend/routes/v1/sameMatchBuilder.js, backend/routes/v1/secondaryMarkets.js, backend/routes/vip.js, backend/semantic-layer/violationLogger.js, backend/services/accaBuilder.js, backend/services/aiPipeline.js, backend/services/aiTelemetryService.js, backend/services/blockedApiCallsLog.js, backend/services/cronJobs.js, backend/services/direct1x2Builder.js, backend/services/enhancedMatchDetailsService.js, backend/services/filterEngine.js, backend/services/gradingSnapshotService.js, backend/services/hybridSportsDataService.js, backend/services/pipelineMetricsService.js, backend/services/semanticDriftSummaryService.js, backend/services/systemTruthLogger.js, backend/services/thesportsdbPipeline.js, backend/services/tier1BootstrapService.js
- Database role: CONNECTION_OR_CLIENT
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/dbBootstrap.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: API, IF, acca_rules, across, direct1x2_prediction_final, fixtures, for, information_schema.columns, jsonb_array_elements, latest_run, match_context_data, not, pg_constraint, prediction_publish_runs, predictions_accuracy, predictions_filtered, replaced, secondary_market_allowlist, table_lifecycle_registry, tier_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/deploy-trigger-cricket.js

- Surface classes: EXTERNAL_PROVIDER, RUNTIME_ENTRY_POINT
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: skcs-sports-edge-skcsai.onrender.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/deploy-trigger.js

- Surface classes: EXTERNAL_PROVIDER, RUNTIME_ENTRY_POINT
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: skcsai.onrender.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/middleware/supabaseJwt.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/chat.js, backend/routes/cricketCount.js, backend/routes/cricketInsights.js, backend/routes/divanscore.js, backend/routes/feedback.js, backend/routes/metrics.js, backend/routes/predictions.js, backend/routes/scheduler.js, backend/routes/user.js, backend/routes/v1/acca.js, backend/routes/v1/predictions.js, backend/routes/vip.js, backend/server-express.js
- Database role: CONNECTION_OR_CLIENT
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/accuracy.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/antigravity.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/chat.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/controlCenter.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/cricketCache.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/cricketCount.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: cricket_insights_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/cricketCron.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/cricketInsights.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: cricket_insights_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/debug.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/direct1x2.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: direct1x2_prediction_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/divanscore.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/feedback.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: user_experience_feedback
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/metrics.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/pipeline.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: direct1x2_prediction_final, predictions_raw
- External providers: skcsai.onrender.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/predictions.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: context_intelligence_cache, direct1x2_prediction_final, fixture_context_cache, leagues, players, prediction_publish_runs, predictions_filtered, predictions_raw, rapidapi_cache, raw_kickoff, teams
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/refresh-ai.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: direct1x2_prediction_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/scheduler.js

- Surface classes: DATABASE_SURFACE, ROUTE, SCHEDULED_EXECUTION
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/semanticDrift.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/skcsGrading.js

- Surface classes: ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/sportsEdge.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/tier1.js

- Surface classes: EXTERNAL_PROVIDER, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.sportmonks.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/user.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/v1/acca.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: acca_legs, accas, market_correlations
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/v1/predictions.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: direct1x2_prediction_final, fixtures, secondary_market_predictions
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/v1/sameMatchBuilder.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/v1/secondaryMarkets.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/routes/vip.js

- Surface classes: DATABASE_SURFACE, ROUTE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ
- Database objects: prediction_publish_runs
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/semantic-layer/violationLogger.js

- Surface classes: DATABASE_SURFACE, SCHEDULED_EXECUTION
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/semantic-layer/enforcementGuard.js
- Database role: WRITE
- Database objects: public.semantic_violations
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/server-express.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER, RUNTIME_ENTRY_POINT, SCHEDULED_EXECUTION
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: READ_WRITE
- Database objects: ai_predictions, cricket_fixtures, cricket_insights_final, cricket_market_rules, database, direct1x2_prediction_final, direct_1x2_insights, first, fixture_processing_log, prediction_publish_runs, public_intelligence, rapidapi_cache, raw_fixtures, sport_sync, tier_rules, upsert_raw_fixture
- External providers: api.odds.p.rapidapi.com, api.the-odds-api.com, cdn.jsdelivr.net, cdn.tailwindcss.com, cricbuzz-cricket.p.rapidapi.com, skcs-sports-edge-skcsai.onrender.com, skcs-sports-edge-skcsai.vercel.app, skcs-sports-edge.github.io, skcs.co.za, skcsai-z8cd.onrender.com, skcsai.vercel.app, skcsaiedge.onrender.com, skcsaisports-5ltic8509-stephens-projects-e3dd898a.vercel.app, skcsaisports-6x2zcgjq1-stephens-projects-e3dd898a.vercel.app, skcsaisports-o200aflsl-stephens-projects-e3dd898a.vercel.app, skcsaisports.vercel.app, v3.football.api-sports.io, www.skcs.co.za
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/accaBuilder.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/v1/acca.js, backend/services/aiPipeline.js, backend/services/aiPipelineOrchestrator.js
- Database role: READ_WRITE
- Database objects: acca_rules, debug_published, direct1x2_prediction_final, lateral, latest_week_run, normalized_fixtures, predictions_filtered, predictions_raw, predictions_stage_1, predictions_stage_2, predictions_stage_3, same_match_combinations, team_week_locks, tier_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/aiPipeline.js

- Surface classes: DATABASE_SURFACE, SCOUT_FIP_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/pipeline.js, backend/routes/predictions.js, backend/routes/scheduler.js, backend/services/syncService.js
- Database role: READ_WRITE
- Database objects: prediction_publish_runs, predictions_raw
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/aiPipelineOrchestrator.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/scheduler.js, backend/server-express.js
- Database role: READ_WRITE
- Database objects: direct1x2_prediction_final, fixture, get_odds_volatility, prediction_publish_runs, predictions_filtered, predictions_raw, sport_sync, tier_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/aiProvider.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/refresh-ai.js, backend/services/aiPipelineOrchestrator.js, backend/services/aiScoring.js, backend/services/direct1x2Builder.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.groq.com, generativelanguage.googleapis.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/aiScoring.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/accaBuilder.js, backend/services/aiPipeline.js, backend/services/marketScoringEngine.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/aiTelemetryService.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiProvider.js
- Database role: WRITE
- Database objects: public.ai_pipeline_telemetry, public.blocked_ai_calls_log
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/antigravity/WorkflowEngine.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/antigravity.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/apiCacheService.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/divanscore.js, backend/routes/metrics.js, backend/services/dataProviders.js, scripts/fetch-live-fixtures.js
- Database role: READ_WRITE
- Database objects: rapidapi_cache
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/apiQuotaRouter.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/apiClients.js, backend/deploy-trigger-cricket.js, backend/routes/cricketCron.js, backend/routes/debug.js, backend/server-express.js, backend/services/apiCacheService.js, backend/services/cricketLiveEnrichmentService.js, backend/services/cricketLiveMatchResolver.js, scripts/publish-cricbuzz-cricket.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/apiQuotaRouterProviders.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/apiQuotaRouter.js, backend/services/providerQuotaService.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/bigBallsDataApiClient.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/bigBallsFootballBridge.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.bigballsdata.com, api.bigballsports.com, bbsgateway-production.up.railway.app
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/bigBallsFootballBridge.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/dataProvider.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/blockedApiCallsLog.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/apiQuotaRouter.js
- Database role: READ_WRITE
- Database objects: IF, blocked_api_calls_log
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/canonicalEvents.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/scheduler.js, backend/services/syncService.js
- Database role: RPC
- Database objects: upsert_canonical_event
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/canonicalIngestFirewall.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/canonicalEvents.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/conflictEngine.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/predictions.js, backend/services/accaBuilder.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/contextEnrichmentService.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/scheduler.js, backend/server-express.js, backend/services/aiPipelineOrchestrator.js
- Database role: READ_WRITE
- Database objects: context_enrichment_queue, context_intelligence_cache, event_odds_snapshots, match_context_data, raw_fixtures, teams
- External providers: api.openweathermap.org
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/contextIngestionService.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.openweathermap.org, newsapi.org, v3.football.api-sports.io
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/contradictionGovernance.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/predictions.js, backend/routes/v1/predictions.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/controlCenterReadService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/controlCenter.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/cricApiCacheService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/cricketCache.js, backend/routes/cricketCron.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/cricbuzzService.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: scripts/publish-cricbuzz-cricket.js
- Database role: NONE
- Database objects: None recorded
- External providers: cricbuzz-cricket.p.rapidapi.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/cricketLiveEnrichmentService.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: scripts/publish-cricbuzz-cricket.js
- Database role: NONE
- Database objects: None recorded
- External providers: cricket-live-line-advance.p.rapidapi.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/cricketLiveMatchResolver.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: scripts/publish-cricbuzz-cricket.js
- Database role: NONE
- Database objects: None recorded
- External providers: cricket-live-line-advance.p.rapidapi.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/cricketRulesEngine.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: scripts/publish-cricbuzz-cricket.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/cronJobs.js

- Surface classes: DATABASE_SURFACE, SCHEDULED_EXECUTION, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: direct1x2_prediction_final, predictions_accuracy, predictions_raw
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/dataProvider.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/scheduler.js, backend/services/accaBuilder.js, backend/services/aiPipeline.js, backend/services/syncService.js, scripts/fetch-live-fixtures.js
- Database role: NONE
- Database objects: None recorded
- External providers: www.thesportsdb.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/dataProviders.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/apiClients.js, backend/services/syncService.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/direct1x2Builder.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/direct1x2.js, backend/services/aiPipelineOrchestrator.js
- Database role: READ_WRITE
- Database objects: direct1x2_prediction_final, direct_1x2_predictions
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/direct1x2Engine.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/controllers/edgeMindController.js, backend/services/aiPipeline.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/divanscoreService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/divanscore.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/enhancedMatchDetailsService.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/sportsEdge.js
- Database role: CONNECTION_OR_CLIENT
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/espnHiddenApiService.js

- Surface classes: EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/dataProvider.js, backend/services/enhancedMatchDetailsService.js, backend/services/hybridSportsDataService.js
- Database role: NONE
- Database objects: None recorded
- External providers: site.api.espn.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/filterEngine.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/accaBuilder.js, backend/services/aiPipeline.js
- Database role: READ_WRITE
- Database objects: predictions_filtered, predictions_raw, tier_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/fipIntakeEvidenceService.js

- Surface classes: SCOUT_FIP_SURFACE, SERVICE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/fipIntakeM2MAuthenticator.js

- Surface classes: SCOUT_FIP_SURFACE, SERVICE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/fipIntakeService.js

- Surface classes: SCOUT_FIP_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/fipStoragePolicyService.js

- Surface classes: SCOUT_FIP_SURFACE, SERVICE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/fixtureIdentityResolverService.js

- Surface classes: SCOUT_FIP_SURFACE, SERVICE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/footballH2HExtractor.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/footballHighlightsService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/footballRankExtractor.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/freeLivescoreApiService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/hybridSportsDataService.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/governedFipIntakeAdapter.js

- Surface classes: SCOUT_FIP_SURFACE, SERVICE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/governedFipIntakeComposition.js

- Surface classes: SCOUT_FIP_SURFACE, SERVICE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/gradingAccuracyCore.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/accuracy.js, backend/services/gradingSnapshotService.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/gradingSnapshotService.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/skcsGrading.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/hybridSportsDataService.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/sportsEdge.js, backend/services/skcsHeartbeat.js
- Database role: CONNECTION_OR_CLIENT
- Database objects: None recorded
- External providers: www.thesportsdb.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/marketIntelligence.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/controllers/edgeMindController.js, backend/services/accaBuilder.js, backend/services/aiPipeline.js, backend/services/conflictEngine.js, backend/services/safeHavenSelector.js, backend/utils/accaLogicEngine.js, backend/utils/conflictResolver.js, backend/utils/insightEngine.js, backend/utils/marketConsistency.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/marketScoringEngine.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/accaBuilder.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/masterRulebookRiskClassification.js

- Surface classes: GOVERNANCE_ENFORCEMENT, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/predictions.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/metrxFactoryService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/metrics.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/normalizerService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js, backend/services/syncService.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/oddsBudgetService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/apiClients.js, backend/server-express.js, backend/services/apiQuotaRouter.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/pipelineMetricsService.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/metrics.js, backend/services/cronJobs.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/proFootballDataService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/skcsHeartbeat.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/providerQuotaService.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/metrics.js, backend/services/apiQuotaRouter.js, backend/services/quotaPlanner.js
- Database role: READ_WRITE
- Database objects: rapidapi_quota_usage
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/quotaPlanner.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/syncService.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/safeHavenSelector.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/v1/predictions.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/saveContextData.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: READ_WRITE
- Database objects: match_context_data
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/saveDirectInsights.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: WRITE
- Database objects: direct_1x2_insights, direct_1x2_stages
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/scoutSignalSync.js

- Surface classes: DATABASE_SURFACE, SCOUT_FIP_SURFACE, SERVICE
- Reachability: CANDIDATE
- Source state: PRE_EXISTING_UNTRACKED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: READ_WRITE
- Database objects: scout_raw_match_signals
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/semanticDriftSummaryService.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/semanticDrift.js
- Database role: READ
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/skcsHeartbeat.js

- Surface classes: SCHEDULED_EXECUTION, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/sportsrcHealthService.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/scheduler.js
- Database role: WRITE
- Database objects: sportsrc_account_health
- External providers: api.sportsrc.org
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/subscriptionTiming.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/middleware/supabaseJwt.js, backend/routes/user.js, backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/syncService.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/pipeline.js, backend/server-express.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/systemTruthLogger.js

- Surface classes: DATABASE_SURFACE, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/core/executionPipeline.js, backend/services/pipelineMetricsService.js
- Database role: READ_WRITE
- Database objects: public.decision_fingerprints, public.pipeline_executions
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/thesportsdbPipeline.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js, backend/services/cronJobs.js, backend/services/hybridSportsDataService.js
- Database role: READ_WRITE
- Database objects: ai_predictions, match_context_data, raw_fixtures, upsert_canonical_event
- External providers: www.thesportsdb.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/tier1BootstrapService.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER, SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/tier1.js, backend/server-express.js
- Database role: WRITE
- Database objects: rapidapi_cache
- External providers: www.thesportsdb.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/services/tier1SchemaProfile.js

- Surface classes: SERVICE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/saveContextData.js, backend/services/tier1BootstrapService.js
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/src/services/contextIntelligence/aiPipeline.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/services/aiPipeline.js
- Database role: READ_WRITE
- Database objects: fixture_context_cache
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/src/services/contextIntelligence/weatherSignal.js

- Surface classes: EXTERNAL_PROVIDER
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/src/services/contextIntelligence/aiPipeline_core.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.weatherapi.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/utils/apiCache.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/utils/rapidApiWaterfall.js
- Database role: READ_WRITE
- Database objects: rapidapi_cache
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/utils/availability.js

- Surface classes: EXTERNAL_PROVIDER
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/predictions.js, scripts/fetch-live-fixtures.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.sportmonks.com, v3.football.api-sports.io
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/utils/jobLogger.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: WRITE
- Database objects: scheduling_logs
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### backend/utils/weather.js

- Surface classes: EXTERNAL_PROVIDER
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/predictions.js, scripts/fetch-live-fixtures.js
- Database role: NONE
- Database objects: None recorded
- External providers: api.open-meteo.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### COMPREHENSIVE_FOOTBALL_RULES_REPORT.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### Dockerfile

- Surface classes: DEPLOYMENT_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### docs/acca_rules_v2.1.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### dolphin-server/Dockerfile

- Surface classes: DEPLOYMENT_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### force-seed.js

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: SEED
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### MASTER_RULEBOOK_IMPLEMENTATION_GUIDE.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### MIGRATION_FREEZE.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### package.json

- Surface classes: DEPLOYMENT_SURFACE
- Reachability: CANDIDATE
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### render.yaml

- Surface classes: DEPLOYMENT_SURFACE
- Reachability: CANDIDATE
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scratch/inspect_edge_external_sources.js

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### scripts/apply-db-governance.js

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: READ_WRITE
- Database objects: IF, direct1x2_prediction_final, jsonb_array_elements, secondary_markets_allowlist
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scripts/audit-cricket-rules.js

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: READ
- Database objects: direct1x2_prediction_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scripts/audit-football-rules-alignment.js

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scripts/e2e-001e-local-marriage-runner.js

- Surface classes: DATABASE_SURFACE, SCHEDULED_EXECUTION, SCOUT_FIP_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: READ_WRITE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scripts/fetch-live-fixtures.js

- Surface classes: DATABASE_SURFACE, EXTERNAL_PROVIDER
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/server-express.js
- Database role: READ_WRITE
- Database objects: direct1x2_prediction_final, events, prediction_publish_runs
- External providers: v3.football.api-sports.io, www.sofascore.com
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scripts/inspect_secondary.js

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### scripts/master-qa.js

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: READ
- Database objects: zz_archive_matches
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scripts/publish-cricbuzz-cricket.js

- Surface classes: DATABASE_SURFACE
- Reachability: CONFIRMED
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: backend/routes/cricketCron.js, backend/server-express.js
- Database role: READ_WRITE
- Database objects: cricket_fixtures, cricket_insights_final, cricket_market_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### scripts/seed_acca_test_data.js

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### scripts/seed_final.js

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### scripts/verify-master-rulebook-alignment.js

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS_MASTER_RULEBOOK.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/ai_usage_policy.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/bigballs_evaluation_focus.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/bsd_governance_hold.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/bsd_provider_suitability_scorecard.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/documentation_policy.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/edge_asset_work_sequence_policy.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/feature_risk_registry.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/naming_standards.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/provider_scorecard_bsd.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/governance/verification_layer_spec.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### SKCS-KNOWLEDGE/knowledge/business_rules.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### smb_combo_rules_refined.txt

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: PRE_EXISTING_UNTRACKED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### sql/acca_rules.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: WRITE
- Database objects: acca_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### sql/market_correlations_schema.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: SCHEMA
- Database objects: IF, market_correlations
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### sql/master_rulebook_triggers.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: PRE_EXISTING_MODIFIED
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: TRIGGER
- Database objects: IF, acca_legs, being, direct1x2_prediction_final, information_schema.tables, market_correlations, pg_type
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### sql/schema_refactor.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: SCHEMA
- Database objects: IF, normalized_fixtures, predictions_final, subscription_plans, v_sast_time
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### sql/supabase_test_user_reset_and_seed.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: SEED
- Database objects: IF, auth.users, information_schema.columns, information_schema.tables, public.profiles, public.subscriptions, public.tiers, public.verification
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### sql/supabase_test_user_seed_access.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: SEED
- Database objects: IF, auth.users, information_schema.columns, information_schema.tables, public.profiles, public.subscriptions, public.verification, unnest
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### sql/tier_rules.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: WRITE
- Database objects: tier_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### STRICT_RULES.md

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260415000001_create_insight_usage.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, insight_usage
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260418000002_update_predictions_final_risk_level_check.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_class, pg_namespace, public.predictions_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260501_skcs_comprehensive_engine.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, canonical_betting_markets, fixture_weekly_publication_log, information_schema.columns, jsonb_array_elements, pg_class, pg_namespace, pg_type, predictions_final, skcs_allocation_matrix, skcs_daily_wallets, skcs_secondary_market_allowlist, skcs_subscription_plans, source_rows, v_local_ts, v_now_sast
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000001_create_canonical_bookmakers.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: canonical_bookmakers, information_schema.columns, information_schema.tables
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000002_add_odds_to_match_context.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: does, information_schema.tables, match_context_data, multiple
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000003_create_sport_sync_table.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000004_create_upsert_raw_fixture_rpc.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: jsonb_array_elements, raw_fixtures, upsert_raw_fixture
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000005_create_context_enrichment_trigger.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, context_enrichment_queue, context_intelligence_cache, match_context_data
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000006_create_fixture_processing_log.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, fixture_processing_log, pg_constraint
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000007_create_admin_views.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: fixture_processing_log, match_context_data, raw_fixtures, sport_sync
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000008_create_event_odds_snapshots.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, event_odds_snapshots, jsonb_each_text, pg_constraint
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000009_create_get_prediction_rpc.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: direct1x2_prediction_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000010_populate_sport_sync.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000012_create_get_prediction_function.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: ai_predictions
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260512000013_disable_rls_match_context.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: match_context_data
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260522000001_add_watchlist_column.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: predictions_filtered
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260522000002_add_sport_to_tier_rules.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: tier_rules
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260523000001_drop_insight_usage.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260524000001_remove_dev_rls_policies.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260524000002_create_upsert_canonical_event_rpc.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: public.canonical_events
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260531000001_skcs_engine_v2_phase0_identity.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, public.canonical_entities, public.skcs_teams, public.team_aliases, public.team_identity_map
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260531000002_skcs_engine_v2_phase0b_match_results.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, football_canonical_events, public.events, public.football_canonical_events, public.match_results
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260616_scout_signal_mirror.sql

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### supabase/migrations/20260617_add_market_tier.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: secondary_markets
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260617000000_setup_accas.sql

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### supabase/migrations/20260619000001_rename_predictions_final_to_direct1x2.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_class, pg_namespace, public.direct1x2_prediction_final, public.predictions_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260619000002_align_direct1x2_columns.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: public.direct1x2_prediction_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260619000003_direct1x2_risk_tier_and_secondary_markets.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_constraint, pg_type, public.direct1x2_prediction_final, public.predictions_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260621000001_enforce_league_country_on_direct_matches.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: public.direct1x2_prediction_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260701000001_normalize_sport_names.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: direct1x2_prediction_final, predictions_accuracy, predictions_raw
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260717000001_create_f1_schema.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: if
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260718000001_db_rule_alignment_75_55_30.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: CASE, jsonb_array_elements, public.direct1x2_prediction_final, public.predictions_final
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260820000001_rename_risk_tiers_and_safe_haven.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: CASE, information_schema.columns, jsonb_array_elements, pg_type, public.direct1x2_prediction_final, public.predictions_final, public.secondary_market_allowlist
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260820000002_fix_secondary_governance_80_75.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: jsonb_array_elements, public.predictions_final, public.secondary_market_allowlist
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000001_add_partitioning.sql

- Surface classes: DATABASE_SURFACE, SCHEDULED_EXECUTION
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, event_odds_snapshots, fixture_processing_log, pg_inherits, pg_partitioned_table
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000002_create_relational_odds_tables.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, bookmaker_levels, bookmaker_odds, direct1x2_prediction_final, direct1x2_prediction_final.secondary_markets, event_injuries, event_injury_snapshots, event_news_scores, event_news_snapshots, jsonb_array_elements, jsonb_object_keys, match_context_data, match_context_data.odds, prediction, prediction_secondary_markets
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000002a_create_relational_tables.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, bookmaker_odds, direct1x2_prediction_final.secondary_markets, event_injuries, event_injury_snapshots, event_news_scores, event_news_snapshots, match_context_data.odds, prediction_secondary_markets
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000002b_create_relational_indexes.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000002c_create_relational_functions_triggers.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: bookmaker_odds, direct1x2_prediction_final, jsonb_array_elements, jsonb_object_keys, match_context_data, match_context_data.odds, prediction, prediction_secondary_markets
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000002d_create_relational_views.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: bookmaker_odds, prediction_secondary_markets
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000003_normalize_prediction_tables.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, direct1x2_prediction_final, prediction_core, prediction_insights, prediction_metadata, prediction_publication
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000003a_create_prediction_tables.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, prediction_core, prediction_insights, prediction_metadata, prediction_publication
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000003b_create_prediction_indexes.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000003c_create_prediction_functions_triggers.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: direct1x2_prediction_final, prediction_core, prediction_insights, prediction_metadata, prediction_publication
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000003d_create_prediction_views.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: prediction_core, prediction_insights, prediction_metadata, prediction_publication
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000004_create_materialized_admin_views.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: bookmaker_odds, canonical_bookmakers, event_odds_snapshots, fixture_processing_log, pg_matviews, prediction_core, raw_fixtures
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000005_skcs_engine_v2_engine_core.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, mr.played_at, now, public.direct1x2_prediction_final, public.head_to_head, public.injury_impact, public.match_results, public.prediction_scores, public.secondary_market_allowlist, public.team_form, public.team_strength, public.tier_rules, public.volatility_factors
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000006_ai_governance_telemetry.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, daily_agg, pg_policies, public.ai_pipeline_telemetry, public.ai_usage_daily, public.blocked_ai_calls_log, today
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000007_ai_governance_rls_policies.sql

- Surface classes: DATABASE_SURFACE, GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_policies, public.ai_pipeline_telemetry, public.ai_usage_daily, public.blocked_ai_calls_log
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000008_service_role_rls_policies.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_policies, public
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000009_public_read_config_rls_policies.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_policies, public
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000010_public_read_reference_rls.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_policies, public
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000011_system_health_state.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, pg_policies, public.system_health_state
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000012_semantic_violations.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, pg_policies, public.semantic_violations
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000013_semantic_violation_summary.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: base, drift_velocity, hourly_counts, hourly_series, provider_drift, public.semantic_violations, recent_criticals, rule_failure_heatmap, severity_counts, total_stats, type_counts, window_split
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260822000014_system_health_state_contract.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: pg_indexes, public.system_health_state
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20260902000000_pipeline_health_feed.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: ai_metrics, blocked_metrics, combined, public.ai_pipeline_telemetry, public.blocked_ai_calls_log, public.semantic_violations, semantic_metrics
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261001000000_runtime_truth_mirror.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, pg_policies, public.decision_fingerprints, public.direct1x2_prediction_final, public.pipeline_executions, public.prediction_publish_runs, public.predictions_raw, public.rule_change_history
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261005000000_runtime_truth_mirror_alignment.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, pg_constraint, pg_policies, public.decision_fingerprints, public.pipeline_executions, public.system_health_state
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261005000001_fix_calculate_team_strength_ambiguity.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: public.injury_impact, public.team_strength
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261006000000_sportsdataio_contract_alignment.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, pg_constraint, pg_policies, public.correction_log, public.data_contracts, public.decision_fingerprints, public.pipeline_executions
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261006000001_canonical_events.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, pg_policies, public.canonical_events
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261007000000_user_experience_feedback.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, public.user_experience_feedback
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261008000001_sem_gov_001b_lifecycle_persistence.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, public.fixture_identity_aliases, public.fixture_lifecycle_current, public.fixture_lifecycle_rollover_events, public.fixture_lifecycle_transition_events, public.lifecycle_admission_idempotency, public.lifecycle_daily_admission_counters
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261010000001_sem_gov_001d_ui3_i4_fixture_display_metadata.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, public.fixture_display_metadata
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/migrations/20261011000001_sem_gov_001d_ui3_i8_fip_intake_evidence.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: MIGRATION
- Database objects: IF, public.fip_intake_evidence
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### supabase/schema/ai_pipeline_schema.sql

- Surface classes: DATABASE_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: SCHEMA
- Database objects: IF
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### temp_migrate.js

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### test_scenarios_master_rulebook.js

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### tests/esec-001-i1-governance.test.js

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### tests/sem-gov-001d-ui3-i11-gate-b-c1-governance.test.js

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### tests/sem-gov-001d-ui3-i11-gate-b-governance.test.js

- Surface classes: GOVERNANCE_ENFORCEMENT
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.

### try_regions.js

- Evidence-only resolution: IRRECOVERABLE_EVIDENCE_ONLY
- Source presence: ABSENT_PRESERVED_CANDIDATE
- Candidate disposition: PRESERVED_CANDIDATE
- Governed by: EPR-001
- Recovery RCP-1: EXHAUSTED
- Recovery RCP-2: EXHAUSTED
- Runtime relationship status: UNKNOWABLE_FROM_GOVERNED_EVIDENCE

### vercel.json

- Surface classes: DEPLOYMENT_SURFACE
- Reachability: CANDIDATE
- Source state: COMMITTED_REPOSITORY
- Governed by: ESA-001
- Runtime callers: None recorded
- Runtime consumers: None recorded
- Database role: NONE
- Database objects: None recorded
- External providers: None recorded
- Next validation: Revalidate runtime reachability and relationships during the next governed Edge architecture review.
