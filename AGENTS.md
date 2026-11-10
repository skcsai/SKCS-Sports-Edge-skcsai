# AGENTS.md

## Project at a Glance

**SKCS AI** is a multi-sport prediction platform (13+ sports) with real-time accuracy tracking, AI-powered analysis, and tiered subscription features.

- **Frontend**: HTML/CSS/JavaScript in `public/` → Vercel
- **Backend**: Node.js + Express in `backend/` → Render (https://skcsai-z8cd.onrender.com)
- **Database**: PostgreSQL via Supabase
- **Live Domain**: https://skcs.co.za

## Architecture

### Backend Services (`backend/services/`)

The pipeline architecture follows a staged AI analysis model:

- **aiProvider.js** - Manages AI inference: Groq (primary) → Dolphin/Llama (fallback)
- **aiPipeline.js** - Orchestrates multi-stage prediction generation
- **syncService.js** - Fetches and normalizes data from external 13+ sports APIs
- **subscriptionTiming.js** - Handles subscription expiry, grace periods, and tier calculations
- **accaBuilder.js, direct1x2Builder.js** - Constructs combination bets and direct market predictions
- **contextIngestionService.js** - Injects real-time context (injuries, form, weather) into analysis

Key API clients in `backend/apiClients.js` connect to RapidAPI, API-Sports, Odds API, and weather services.

### Database & Migrations

- **PostgreSQL** via Supabase (connection pooling with PgBouncer)
- **Bootstrap**: `backend/dbBootstrap.js` runs on server startup to ensure schema compatibility
- **Queries**: Use `backend/db.js` (pg pool wrapper) for all DB operations
- Example tables: `fixtures`, `predictions`, `direct1x2_prediction_final`, `subscriptions`, `profiles`

### Authentication & Authorization

- **Primary**: Supabase JWT tokens (via `backend/middleware/supabaseJwt.js`)
- **Fallback**: Admin/User API keys in headers (`x-api-key`)
- **Admin Bypass**: Email `sfynn13433@gmail.com` gets immediate VIP access (see middleware for god mode logic)
- **Subscription Tiers**: core, elite, vip — resolved in `resolveAccessContext()` function

### Configuration

- **backend/config.js** - Central env var mapping for APIs, database, AI providers
- **backend/config/subscriptionMatrix.js** - Defines tier capabilities and feature gates
- **backend/config/subscriptionPlans.js** - Normalizes plan IDs and retrieves plan metadata

Key env vars:
- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY` - Groq inference (primary AI)
- `DOLPHIN_URL` - Local/Render Dolphin service fallback
- `DATA_MODE=live` - Switches between live and test data modes
- `NODE_ENV=production` - Always production on Render

## Development Workflow

### Local Setup

```bash
npm install                    # Install dependencies
npm run build:supabase        # Bundle Supabase client to public/js/
npm run dev                   # Start server with nodemon (watches backend/)
```

### Running Pipelines & Utilities

```bash
npm run sync:live            # Trigger live data sync from all sports APIs
npm run refresh:trigger      # Trigger prediction regeneration pipeline
npm run grade:trigger        # Grade existing predictions against match results
npm run accuracy:track       # Track & store prediction accuracy metrics
```

Scripts live in `scripts/` directory. Common patterns:
- `trigger-*.js` - Hit HTTP endpoints on Render to kick off async jobs
- `check-*.js` - Validate database state, schema, or data integrity
- `backfill-*.js` - Manually populate missing fields or correct historical data

### Testing & Debugging

- **Smoke tests**: `npm run test` or `npm test` runs `scripts/smoke-test.js`
- **Rulebook drift guard**: `npm run verify:rulebook` catches legacy `80/70/59` or `76%` thresholds (local only, no GitHub billing)
- **Local pre-commit hook**: run `npm run install:hooks` once per clone to block commits that reintroduce legacy rule thresholds
- **API testing**: Use postman, curl, or scripts like `scripts/test-api.js` with bearer token headers
- **Database audit**: `scripts/audit-database.js` and `scripts/master-qa.js` validate tables and data consistency
- **Logger**: Use `backend/utils/jobLogger.js` for structured job execution logs

## Deployment Policy

- For any user-approved change that is meant to go live, do not stop at local edits.
- After verification, commit the changes and push them to the GitHub remote named `deploy` on branch `main`.
- Treat that `deploy` remote as the live production GitHub repo for this workspace.
- Vercel and Render are expected to auto-deploy from `deploy/main`, so a successful push is the step that should trigger all three targets: GitHub, Vercel, and Render.
- Do not claim the site is deployed unless the push to `deploy/main` succeeded.
- If the push fails, report the exact blocker and stop instead of claiming deployment success.
- If the user explicitly asks not to deploy, skip the commit/push step.

## Deployment Targets & Build Commands

### Vercel (Frontend)

- **Output Directory**: `public/`
- **Before Deploy**: `npm run build:supabase` (bundles Supabase client)
- **Cron Job**: `/api/pipeline/run-full` on Monday 02:00 UTC (defined in `vercel.json`)
- **Rewrites**: Handles `/subscribe/*` and `/terms` routes via `vercel.json`

### Render (Backend)

- **Build Command**: `npm install && npm run build:supabase`
- **Start Command**: `npm start` (runs `backend/server-express.js`)
- **Health Check**: `GET /api/health`
- **Port**: 10000 (internal), exposed as https://skcsai-z8cd.onrender.com
- **Region**: Frankfurt, free tier
- **Separate Cron Service**: `skcs-weekly-global-scrape` runs `node backend/deploy-trigger.js` on Monday 02:00 UTC per `render.yaml`

### Backend API Structure

Main server in `backend/server-express.js` listens on `$PORT` (default 10000).

Core routes (`backend/routes/`):
- `/api/predictions/*` - Get predictions, filter by tier/sport, track accuracy
- `/api/pipeline/*` - Refresh/grade predictions, sync live data
- `/api/user/*` - User profile, subscription status
- `/api/debug/*` - Internal diagnostics (requires admin key)
- `/api/health` - Health check for Render

**Critical**: No `node-cron` on Render. All scheduled tasks are triggered externally via HTTP endpoints to avoid race conditions on scaled/sleeping instances.

## Critical Code Patterns & Rules

### Subscriptions & Tiers

Subscription flow:
1. User authenticates via Supabase JWT or API key
2. `requireSupabaseUser` middleware fetches active subscriptions from DB
3. `resolveAccessContext()` maps subscription tiers → access scopes
4. Prediction routes gate features via `getPlanCapabilities()` matrix

Example: A user with `elite_30day_deep_vip` plan gets:
- Daily prediction quota: 500 predictions
- Deep tier analysis enabled
- Access to all secondary markets

### Prediction Confidence Tiers & Risk Framework

From `STRICT_RULES.md` / `SKCS_MASTER_RULEBOOK.md` — ALL predictions must follow this framework:

- **75-100%**: ✅ Low Risk (Green)
- **55-74%**: 📊 Medium Risk (Blue)
- **30-54%**: ⚠️ High Risk (Orange) — Must attach secondary insights; UI warns users
- **0-29%**: 🛑 Extreme Risk (Red) — Not published; enforce exactly 4 secondary insights when surfaced

Secondary insight rules (mandatory):
- Confidence threshold: 72% minimum
- Max 4 per match
- Double Chance is a separate market group (not part of the secondary pool)
- Same Match Builder sizes: 4, 6, 8
- Allowed secondary markets: draw no bet, goals/team totals, BTTS, corners, cards, half markets
- ACCA leg minimum: 75%

**Do NOT modify these rules**: they are enforced at database level and in `backend/services/`. Violations create inconsistent user experiences.

### AI Provider Fallback Chain

From `backend/services/aiProvider.js`:

1. **Groq** (primary) — URL: `https://api.groq.com/openai/v1/chat/completions`, model: `llama-3.1-8b-instant`
2. **Dolphin** (fallback) — Local/Render service, URL: `$DOLPHIN_URL` (default `http://127.0.0.1:8080`)
3. **Template** (fallback) — Returns placeholder insights if both fail

JSON response extraction uses `extractAndParseJSON()` helper — tolerates markdown code blocks and partial responses.

### Date & Timezone Handling

- **SAST (UTC+2)**: `Africa/Johannesburg` timezone used for rolling sync cutoffs
- **Normalized Dates**: Use `backend/utils/dateNormalization.js` for fixture dates
- **Prediction Window**: 15-minute grace period post-kickoff (matches more than 15 min past kickoff are rejected)
- Active sync window: 11:59 SAST daily rolling cutoff

### Environment-Specific Behavior

Render uses `DATA_MODE=live` (hardcoded in `render.yaml`). Local dev can use `.env` to override.

If `DATABASE_URL` is missing:
- No PostgreSQL pool is created
- Server boots cleanly but DB operations fail gracefully
- Useful for local development without a remote DB

## Remote Notes

- `deploy` is the production remote to use for live updates.
- `origin` may not be available or may not be the live deployment repo. Do not rely on `origin` for production deployment unless the user explicitly changes the setup.

## Cursor Cloud specific instructions

The startup update script runs `npm install` and `npm run build:supabase`. The notes below cover non-obvious caveats for running and testing in the cloud VM (dependencies are already installed by the update script).

### Running the app locally
- `npm run dev` runs the **entire app** (Express API + the static `public/` frontend) as one process. Locally `PORT` defaults to `3000` (the smoke test also uses `3000`), unlike Render which uses `10000`. Open `http://localhost:3000/`.
- A local **PostgreSQL 16** is installed in the VM with a `skcs` role/database. It is not auto-started — run `sudo pg_ctlcluster 16 main start` at the start of a session before the app/tests. Root `.env` already has `DATABASE_URL=postgresql://skcs:skcs@127.0.0.1:5432/skcs`. `backend/dbBootstrap.js` auto-creates the schema on server startup.
- A root `.env` (gitignored) holds dev-only placeholder secrets. Two non-obvious requirements it satisfies:
  - `backend/db.js` forces TLS whenever a connection string is set; the local cluster works only because Ubuntu enables SSL (snakeoil cert) and the pool uses `rejectUnauthorized:false`. A non-SSL local Postgres would fail to connect.
  - Several modules construct a Supabase client at require-time and throw `supabaseUrl is required` if it's empty, so `.env` must keep placeholder `SUPABASE_URL`/keys even without a real Supabase project.

### Testing
- `npm test` (smoke test) reads env from `backend/.env`, **not** root `.env`. Keep them in sync (`cp .env backend/.env`) or the server it spawns won't see your config. It asserts the `/api/accuracy` shape, so a running DB is required; it also needs `USER_API_KEY` (or `ADMIN_API_KEY`).
- `npm run verify:rulebook` is a fast, offline static guard against legacy confidence thresholds — safe to run anytime. There is no separate eslint/build step for the backend.
- On a fresh DB, bootstrap logs `Error: relation "match_context_data" does not exist` — this is benign; all core tables (including `predictions_accuracy`) are created before that point.

### Data caveats
- Without external sports API keys and a Groq key, the live sync (`npm run sync:live`) and AI pipeline cannot fetch real fixtures, so the predictions list is empty by default. To exercise the prediction-display flow, seed `direct1x2_prediction_final` directly: insert a `prediction_publish_runs` row with `status='completed'`, then a prediction row with a future `match_date`, a non-empty `matches` JSON array, and real `home_team`/`away_team` (rows are filtered out if `match_date <= NOW()` or teams are null/placeholder).
