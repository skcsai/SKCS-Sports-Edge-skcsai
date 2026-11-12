require('dotenv').config();

const { Pool } = require('pg');
const config = require('./config');
const { resolveStartupMode } = require('./startupMode');
const linkedSubscriptionReads = process.env.SKCS_C14_LINKED_SUBSCRIPTIONS === 'true';
if (linkedSubscriptionReads && resolveStartupMode().mode !== 'canary') {
    throw new Error('C14 linked subscription reads require canary startup mode');
}
const subscriptionReadSource = linkedSubscriptionReads ? 'edge_c14_access.linked_subscriptions' : 'subscriptions';

console.log('✅ LOADING database.js (PostgreSQL version)');

const databaseUrl = process.env.DATABASE_URL;
const hasDatabaseUrl = typeof databaseUrl === 'string' && databaseUrl.trim().length > 0;

function shouldUseSsl(connectionString) {
    try {
        const url = new URL(connectionString);
        const host = (url.hostname || '').toLowerCase();
        if (host === 'localhost' || host === '127.0.0.1') return false;
        return true;
    } catch {
        return true;
    }
}

function summarizeDatabaseUrl(connectionString) {
    try {
        const url = new URL(connectionString);
        return {
            protocol: url.protocol,
            host: url.hostname || null,
            port: url.port || null,
            database: url.pathname ? url.pathname.replace(/^\//, '') : null,
            username: url.username || null,
            sslmode: url.searchParams.get('sslmode') || null,
            pgbouncer: url.searchParams.get('pgbouncer') || null
        };
    } catch (error) {
        return {
            parse_error: error?.message || 'Unable to parse DATABASE_URL'
        };
    }
}

if (hasDatabaseUrl) {
    console.log('🔎 DATABASE_URL runtime summary:', summarizeDatabaseUrl(databaseUrl));
}

// Auto-convert direct Supabase URL to pooler URL to fix auth errors
let effectiveConnectionString = databaseUrl;
if (hasDatabaseUrl && effectiveConnectionString.includes('db.ghzjntdvaptuxfpvhybb.supabase.co')) {
    effectiveConnectionString = effectiveConnectionString
        .replace('db.ghzjntdvaptuxfpvhybb.supabase.co:5432', 'aws-1-eu-central-1.pooler.supabase.com:6543')
        .replace('postgres:', 'postgres.ghzjntdvaptuxfpvhybb:');
    if (!effectiveConnectionString.includes('pgbouncer=')) {
        effectiveConnectionString += (effectiveConnectionString.includes('?') ? '&' : '?') + 'pgbouncer=true';
    }
    console.log('🔄 Auto-converted DATABASE_URL to Supabase pooler URL for production stability.');
}

// Create a connection pool to PostgreSQL only when configured.
// This keeps local/dev and Render boot clean when DATABASE_URL is not set yet.
const pool = hasDatabaseUrl
    ? new Pool({
        connectionString: effectiveConnectionString,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
        max: 10,
        ssl: shouldUseSsl(effectiveConnectionString) ? { rejectUnauthorized: false } : false
    })
    : null;

if (pool) {
    pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', {
            message: err?.message,
            code: err?.code,
            detail: err?.detail,
            hint: err?.hint
        });
    });

    void (async () => {
        try {
            const res = await pool.query('SELECT 1 AS ok');
            console.log('✅ Supabase PostgreSQL connection test OK:', res.rows?.[0]?.ok);
        } catch (err) {
            console.error('❌ Supabase PostgreSQL connection test FAILED:', {
                message: err?.message,
                code: err?.code,
                detail: err?.detail,
                hint: err?.hint
            });
            if (err?.code === '28P01') {
                console.error('🚨 DATABASE AUTH CHECK: Render DATABASE_URL is reaching Supabase, but authentication failed. Verify the Render Environment value, reset the Supabase DB password if needed, and URL-encode any special characters in the password before pasting it into DATABASE_URL.');
            }
        }
    })();
}

let hasLoggedDbDisabled = false;
let hasInitializedTables = false;
let hasPublicUsersTable = null;
let publicUsersIdType = null;

async function publicUsersTableExists(client = pool) {
    if (!client) return false;
    if (hasPublicUsersTable !== null) return hasPublicUsersTable;

    const res = await client.query(`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'users'
        ) AS exists
    `);

    hasPublicUsersTable = res.rows?.[0]?.exists === true;
    return hasPublicUsersTable;
}

async function publicUsersIdDataType(client = pool) {
    if (!client) return null;
    if (publicUsersIdType !== null) return publicUsersIdType;
    if (!(await publicUsersTableExists(client))) return null;

    const res = await client.query(`
        SELECT data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'id'
        LIMIT 1
    `);

    publicUsersIdType = res.rows?.[0]?.data_type || null;
    return publicUsersIdType;
}

async function ensureDbInitialized() {
    if (!pool) {
        if (!hasLoggedDbDisabled) {
            hasLoggedDbDisabled = true;
            console.warn('⚠️ DATABASE_URL not set. Database-backed routes will return empty results.');
        }
        return false;
    }

    if (hasInitializedTables) return true;

    try {
        const client = await pool.connect();
        client.release();
        if (resolveStartupMode().runDatabaseBootstrap) await initializeTables();
        hasInitializedTables = true;
        console.log('Connected to PostgreSQL.');
        return true;
    } catch (err) {
        console.error('Error connecting to PostgreSQL:', err.stack || err);
        return false;
    }
}

// Initialize tables if they don't exist
async function initializeTables() {
    if (!pool) return;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Leagues table
        await client.query(`CREATE TABLE IF NOT EXISTS leagues (
            id SERIAL PRIMARY KEY,
            sport TEXT NOT NULL,
            name TEXT NOT NULL,
            api_source TEXT,
            api_league_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Teams table
        await client.query(`CREATE TABLE IF NOT EXISTS teams (
            id SERIAL PRIMARY KEY,
            league_id INTEGER REFERENCES leagues(id),
            name TEXT NOT NULL,
            short_name TEXT,
            country TEXT,
            venue TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Matches table
        await client.query(`CREATE TABLE IF NOT EXISTS matches (
            id SERIAL PRIMARY KEY,
            league_id INTEGER REFERENCES leagues(id),
            home_team_id INTEGER REFERENCES teams(id),
            away_team_id INTEGER REFERENCES teams(id),
            match_date TIMESTAMP,
            status TEXT,
            home_score INTEGER,
            away_score INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Team stats table
        await client.query(`CREATE TABLE IF NOT EXISTS team_stats (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id),
            season TEXT,
            matches_played INTEGER,
            wins INTEGER,
            draws INTEGER,
            losses INTEGER,
            goals_for INTEGER,
            goals_against INTEGER,
            points INTEGER,
            form_rating REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Injuries table
        await client.query(`CREATE TABLE IF NOT EXISTS injuries (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id),
            player_name TEXT,
            injury_type TEXT,
            severity TEXT,
            status TEXT,
            expected_return DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // News mentions table
        await client.query(`CREATE TABLE IF NOT EXISTS news_mentions (
            id SERIAL PRIMARY KEY,
            team_id INTEGER REFERENCES teams(id),
            source TEXT,
            title TEXT,
            content TEXT,
            sentiment_score REAL,
            relevance_score REAL,
            published_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Insights Raw
        await client.query(`CREATE TABLE IF NOT EXISTS prediction_publish_runs (
            id BIGSERIAL PRIMARY KEY,
            trigger_source TEXT NOT NULL DEFAULT 'manual',
            requested_sports TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
            run_scope TEXT NOT NULL DEFAULT 'all',
            status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
            notes TEXT,
            error_message TEXT,
            metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);

        // Insights Raw
        await client.query(`CREATE TABLE IF NOT EXISTS predictions_raw (
            id BIGSERIAL PRIMARY KEY,
            match_id TEXT NOT NULL,
            sport TEXT NOT NULL,
            market TEXT NOT NULL,
            prediction TEXT NOT NULL,
            confidence REAL NOT NULL,
            volatility TEXT NOT NULL,
            odds REAL,
            metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);

        // Insights Filtered
        await client.query(`CREATE TABLE IF NOT EXISTS predictions_filtered (
            id BIGSERIAL PRIMARY KEY,
            raw_id BIGINT NOT NULL REFERENCES predictions_raw(id) ON DELETE CASCADE,
            tier TEXT NOT NULL CHECK (tier IN ('normal', 'deep')),
            is_valid BOOLEAN NOT NULL,
            reject_reason TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (raw_id, tier)
        )`);

        // Insights Final
        await client.query(`CREATE TABLE IF NOT EXISTS direct1x2_prediction_final (
            id BIGSERIAL PRIMARY KEY,
            publish_run_id BIGINT REFERENCES prediction_publish_runs(id) ON DELETE CASCADE,
            tier TEXT NOT NULL CHECK (tier IN ('normal', 'deep')),
            type TEXT NOT NULL CHECK (type IN ('single', 'acca', 'direct', 'secondary', 'multi', 'same_match', 'acca_6match', 'mega_acca_12')),
            matches JSONB NOT NULL,
            total_confidence REAL NOT NULL,
            risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'medium')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);

        await client.query(`
            ALTER TABLE direct1x2_prediction_final
            ADD COLUMN IF NOT EXISTS publish_run_id BIGINT REFERENCES prediction_publish_runs(id) ON DELETE CASCADE
        `);

        await client.query(`
            ALTER TABLE direct1x2_prediction_final
            ADD COLUMN IF NOT EXISTS plan_visibility JSONB NOT NULL DEFAULT '[]'::JSONB,
            ADD COLUMN IF NOT EXISTS sport TEXT,
            ADD COLUMN IF NOT EXISTS market_type TEXT,
            ADD COLUMN IF NOT EXISTS recommendation TEXT,
            ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS edgemind_report TEXT,
            ADD COLUMN IF NOT EXISTS secondary_insights JSONB NOT NULL DEFAULT '[]'::JSONB
        `);

        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'risk_tier_enum'
                ) THEN
                    CREATE TYPE risk_tier_enum AS ENUM (
                        'LOW_RISK',
                        'MEDIUM_RISK',
                        'HIGH_RISK',
                        'EXTREME_RISK'
                    );
                END IF;
            END
            $$;
        `);

        await client.query(`
            ALTER TABLE direct1x2_prediction_final
            ADD COLUMN IF NOT EXISTS fixture_id TEXT,
            ADD COLUMN IF NOT EXISTS home_team TEXT,
            ADD COLUMN IF NOT EXISTS away_team TEXT,
            ADD COLUMN IF NOT EXISTS prediction TEXT,
            ADD COLUMN IF NOT EXISTS confidence REAL,
            ADD COLUMN IF NOT EXISTS match_date TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS risk_tier risk_tier_enum,
            ADD COLUMN IF NOT EXISTS secondary_markets JSONB NOT NULL DEFAULT '[]'::JSONB
        `);

        await client.query(`
            UPDATE direct1x2_prediction_final
            SET confidence = total_confidence
            WHERE confidence IS NULL
              AND total_confidence IS NOT NULL
        `);

        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'confidence_range'
                      AND conrelid = 'direct1x2_prediction_final'::regclass
                ) THEN
                    ALTER TABLE direct1x2_prediction_final
                    ADD CONSTRAINT confidence_range
                    CHECK (confidence BETWEEN 0 AND 100);
                END IF;
            END
            $$;
        `);

        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'secondary_markets_length'
                      AND conrelid = 'direct1x2_prediction_final'::regclass
                ) THEN
                    ALTER TABLE direct1x2_prediction_final
                    ADD CONSTRAINT secondary_markets_length
                    CHECK (jsonb_array_length(secondary_markets) <= 4);
                END IF;
            END
            $$;
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_predictions_final_publish_run_id
            ON direct1x2_prediction_final(publish_run_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_direct1x2_match_date
            ON direct1x2_prediction_final(match_date)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_direct1x2_risk_tier
            ON direct1x2_prediction_final(risk_tier)
        `);

        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_predictions_final_live_direct_fixture_market
            ON direct1x2_prediction_final (
                LOWER(COALESCE(sport, '')),
                LOWER(COALESCE(market_type, '')),
                (CASE
                    WHEN jsonb_typeof(matches) = 'array'
                    THEN NULLIF(BTRIM(matches->0->>'fixture_id'), '')
                    ELSE NULL
                END)
            )
            WHERE LOWER(COALESCE(tier, '')) = 'normal'
              AND LOWER(COALESCE(type, '')) = 'direct'
              AND publish_run_id IS NULL
              AND (CASE
                    WHEN jsonb_typeof(matches) = 'array'
                    THEN NULLIF(BTRIM(matches->0->>'fixture_id'), '')
                    ELSE NULL
                END) IS NOT NULL
        `);

        await client.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'predictions_final_type_check'
                ) THEN
                    ALTER TABLE direct1x2_prediction_final DROP CONSTRAINT predictions_final_type_check;
                END IF;
            END
            $$;
        `);

        await client.query(`
            ALTER TABLE direct1x2_prediction_final
            ADD CONSTRAINT predictions_final_type_check
            CHECK (type IN ('single', 'acca', 'direct', 'secondary', 'multi', 'same_match', 'acca_6match', 'mega_acca_12'))
        `);

        await client.query(`
            DROP VIEW IF EXISTS public.predictions_final;
        `);

        await client.query(`
            CREATE OR REPLACE VIEW public.predictions_final AS
            SELECT *
            FROM public.direct1x2_prediction_final;
        `);

        await client.query(`
            DROP VIEW IF EXISTS public.prediction_final;
        `);

        await client.query(`
            CREATE OR REPLACE VIEW public.prediction_final AS
            SELECT *
            FROM public.direct1x2_prediction_final;
        `);

        // Tier Rules
        await client.query(`CREATE TABLE IF NOT EXISTS tier_rules (
            tier TEXT PRIMARY KEY CHECK (tier IN ('normal', 'deep')),
            min_confidence REAL NOT NULL,
            allowed_markets JSONB NOT NULL,
            max_acca_size INTEGER NOT NULL,
            allowed_volatility JSONB NOT NULL
        )`);
        await client.query(`ALTER TABLE tier_rules DROP COLUMN IF EXISTS sport CASCADE;`).catch(() => {});

        await client.query(`
            DELETE FROM tier_rules
            WHERE tier NOT IN ('normal', 'deep')
        `);

        await client.query(`
            DELETE FROM tier_rules WHERE tier IS NULL OR tier NOT IN ('normal', 'deep');
            DELETE FROM tier_rules a USING tier_rules b WHERE a.ctid < b.ctid AND a.tier = b.tier;
        `);
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_tier_rules_tier ON tier_rules (tier);
        `).catch(err => console.warn('[database] Warning: failed to ensure unique index on tier_rules:', err.message));

        // Acca Rules
        await client.query(`CREATE TABLE IF NOT EXISTS acca_rules (
            id BIGSERIAL PRIMARY KEY,
            rule_name TEXT NOT NULL UNIQUE,
            rule_value JSONB NOT NULL
        )`);

        // Initial Rules Data (lowered thresholds to allow more predictions)
        await client.query(`
            INSERT INTO tier_rules (tier, min_confidence, allowed_markets, max_acca_size, allowed_volatility)
            VALUES
                ('normal', 35, '["ALL"]'::JSONB, 3, '["low","medium","high"]'::JSONB),
                ('deep', 45, '["ALL"]'::JSONB, 12, '["low","medium"]'::JSONB)
            ON CONFLICT (tier) DO UPDATE SET
                min_confidence = EXCLUDED.min_confidence,
                allowed_markets = EXCLUDED.allowed_markets,
                max_acca_size = EXCLUDED.max_acca_size,
                allowed_volatility = EXCLUDED.allowed_volatility;
        `);

        await client.query(`
            INSERT INTO acca_rules (rule_name, rule_value)
            VALUES
                ('no_same_match', 'true'::JSONB),
                ('no_conflicting_markets', 'true'::JSONB),
                ('max_per_match', '1'::JSONB),
                ('allow_high_volatility', 'true'::JSONB)
            ON CONFLICT (rule_name) DO UPDATE SET
                rule_value = EXCLUDED.rule_value;
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS table_lifecycle_registry (
                table_name TEXT PRIMARY KEY,
                lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('active', 'compatibility', 'legacy', 'archived')),
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                owner_component TEXT,
                notes TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await client.query(`
            INSERT INTO table_lifecycle_registry (table_name, lifecycle_state, is_active, owner_component, notes)
            VALUES
                ('predictions_raw', 'active', TRUE, 'pipeline', 'Primary raw prediction ingest table.'),
                ('predictions_filtered', 'active', TRUE, 'pipeline', 'Tier validation output table.'),
                ('direct1x2_prediction_final', 'active', TRUE, 'publish', 'Live published insights table.'),
                ('prediction_publish_runs', 'active', TRUE, 'publish', 'Run tracking table for all publish flows.'),
                ('predictions_accuracy', 'active', TRUE, 'grading', 'Prediction grading and outcomes table.'),
                ('team_week_locks', 'active', TRUE, 'publish', 'Persistent single-use team/week lock table across publish runs.'),
                ('rapidapi_cache', 'active', TRUE, 'ingest', 'RapidAPI payload cache wall table.'),
                ('scheduling_logs', 'active', TRUE, 'scheduler', 'Scheduler telemetry table.'),
                ('predictions_final', 'compatibility', TRUE, 'compatibility', 'Compatibility view that mirrors direct1x2_prediction_final.'),
                ('prediction_final', 'compatibility', TRUE, 'compatibility', 'Legacy compatibility view that mirrors direct1x2_prediction_final.'),
                ('prediction_results', 'legacy', FALSE, 'legacy', 'Legacy accuracy table replaced by predictions_accuracy.'),
                ('scheduler_run_locks', 'legacy', FALSE, 'legacy', 'Legacy scheduler lock table not used by active cron routes.')
            ON CONFLICT (table_name) DO UPDATE SET
                lifecycle_state = EXCLUDED.lifecycle_state,
                is_active = EXCLUDED.is_active,
                owner_component = EXCLUDED.owner_component,
                notes = EXCLUDED.notes,
                updated_at = NOW()
        `);

        // Scheduler Run Locks (for idempotency)
        await client.query(`CREATE TABLE IF NOT EXISTS scheduler_run_locks (
            id BIGSERIAL PRIMARY KEY,
            publish_window TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (publish_window)
        )`);

        await client.query(`CREATE TABLE IF NOT EXISTS team_week_locks (
            id BIGSERIAL PRIMARY KEY,
            week_key TEXT NOT NULL,
            team_key TEXT NOT NULL,
            competition_key TEXT NOT NULL,
            publish_run_id BIGINT REFERENCES prediction_publish_runs(id) ON DELETE SET NULL,
            source_type TEXT,
            source_tier TEXT,
            locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (week_key, team_key, competition_key)
        )`);

        // Prediction Results (Historical Data)
        await client.query(`CREATE TABLE IF NOT EXISTS prediction_results (
            id BIGSERIAL PRIMARY KEY,
            match_id TEXT NOT NULL,
            sport TEXT NOT NULL,
            prediction_type TEXT NOT NULL, -- 'normal', 'deep'
            market TEXT NOT NULL,
            prediction TEXT NOT NULL,
            actual_outcome TEXT,
            status TEXT NOT NULL CHECK (status IN ('Win', 'Loss', 'Pending')),
            confidence REAL,
            odds REAL,
            settled_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);

        // Insert some dummy historical data if the table is empty
        const countRes = await client.query('SELECT COUNT(*) FROM prediction_results');
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log('Inserting dummy historical data into prediction_results...');
            const dummyData = [
                ['EPL_1', 'Football', 'normal', '1X2', 'Home Win', 'Home Win', 'Win', 72, 1.85],
                ['EPL_2', 'Football', 'deep', '1X2', 'Away Win', 'Draw', 'Loss', 81, 2.10],
                ['NBA_1', 'Basketball', 'normal', 'Spread', 'Lakers -4.5', 'Lakers -4.5', 'Win', 68, 1.91],
                ['NBA_2', 'Basketball', 'deep', 'Over/Under', 'Over 210.5', 'Over 210.5', 'Win', 79, 1.91],
                ['MLB_1', 'MLB', 'normal', 'Moneyline', 'Dodgers', 'Dodgers', 'Win', 65, 1.70],
                ['NFL_1', 'nfl', 'deep', '1X2', 'Chiefs', 'Chiefs', 'Win', 85, 1.55],
                ['UFC_1', 'mma', 'normal', 'Winner', 'McGregor', 'Loss', 'Loss', 74, 1.65],
                ['F1_1', 'formula1', 'deep', 'Winner', 'Verstappen', 'Verstappen', 'Win', 92, 1.40]
            ];
            for (const row of dummyData) {
                await client.query(
                    `INSERT INTO prediction_results (match_id, sport, prediction_type, market, prediction, actual_outcome, status, confidence, odds, settled_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() - INTERVAL '1 day')`,
                    row
                );
            }
        }

        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_type
                    WHERE typname = 'sub_status'
                ) THEN
                    CREATE TYPE sub_status AS ENUM ('day_zero_bonus', 'day_zero_lite', 'active', 'expired', 'cancelled');
                END IF;
            END
            $$;
        `);

        hasPublicUsersTable = await publicUsersTableExists(client);
        if (hasPublicUsersTable) {
            await client.query(`
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS has_used_day_zero BOOLEAN DEFAULT FALSE
            `);
        }

        const usersReferenceClause = (await publicUsersIdDataType(client)) === 'uuid'
            ? 'REFERENCES users(id)'
            : '';
        await client.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL ${usersReferenceClause},
                tier_id VARCHAR(50) NOT NULL,
                status sub_status NOT NULL,
                payment_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                official_start_time TIMESTAMPTZ NOT NULL,
                expiration_time TIMESTAMPTZ NOT NULL,
                join_after_cutoff BOOLEAN NOT NULL DEFAULT FALSE,
                pro_rata_direct_free_percent INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_subscriptions_user_payment
            ON subscriptions(user_id, payment_timestamp DESC)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_subscriptions_status
            ON subscriptions(status)
        `);

        await client.query(`
            ALTER TABLE subscriptions
            ADD COLUMN IF NOT EXISTS join_after_cutoff BOOLEAN NOT NULL DEFAULT FALSE
        `);

        await client.query(`
            ALTER TABLE subscriptions
            ADD COLUMN IF NOT EXISTS pro_rata_direct_free_percent INTEGER NOT NULL DEFAULT 0
        `);

        await client.query('COMMIT');
        console.log('Database tables initialized.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error initializing tables:', err);
    } finally {
        client.release();
    }
}

// ========== HELPER FUNCTIONS (PostgreSQL versions) ==========

// Get match by ID
async function getMatch(matchId) {
    const ok = await ensureDbInitialized();
    if (!ok) return null;
    const res = await pool.query(
        `SELECT m.*, 
                ht.name as home_team,
                at.name as away_team
         FROM matches m
         LEFT JOIN teams ht ON m.home_team_id = ht.id
         LEFT JOIN teams at ON m.away_team_id = at.id
         WHERE m.id = $1`,
        [matchId]
    );
    return res.rows[0];
}

// Get team stats for a team (most recent season)
async function getTeamStats(teamId) {
    const ok = await ensureDbInitialized();
    if (!ok) return null;
    const res = await pool.query('SELECT * FROM team_stats WHERE team_id = $1 ORDER BY season DESC LIMIT 1', [teamId]);
    return res.rows[0];
}

// Get active injuries for a team
async function getInjuries(teamId) {
    const ok = await ensureDbInitialized();
    if (!ok) return [];
    const res = await pool.query('SELECT * FROM injuries WHERE team_id = $1 AND status = $2', [teamId, 'active']);
    return res.rows;
}

// Get average news sentiment for a team over last 3 days
async function getNewsSentiment(teamId) {
    const ok = await ensureDbInitialized();
    if (!ok) return 0;
    const res = await pool.query(
        'SELECT AVG(sentiment_score) as avgSentiment FROM news_mentions WHERE team_id = $1 AND created_at > NOW() - INTERVAL \'3 days\'',
        [teamId]
    );
    return res.rows[0]?.avgSentiment || 0;
}

// Get all upcoming matches (within the next `days` days)
async function getAllUpcomingMatches(days = 7, sport = null) {
    const ok = await ensureDbInitialized();
    if (!ok) return [];
    let query = `
        SELECT m.*, l.sport 
        FROM matches m
        LEFT JOIN leagues l ON m.league_id = l.id
        WHERE m.match_date > NOW() 
          AND m.match_date < NOW() + INTERVAL '${days} days'
    `;
    const params = [];
    if (sport) {
        query += ' AND l.sport = $1';
        params.push(sport);
    }
    query += ' ORDER BY m.match_date';
    const res = await pool.query(query, params);
    return res.rows;
}

// Save a generated prediction (now includes safer_pick)
// NOTE: This function is deprecated — the active pipeline uses aiPipeline.js + accaBuilder.js
// which write to predictions_raw → predictions_filtered → direct1x2_prediction_final.
async function savePrediction(prediction) {
    console.warn('[database] savePrediction is deprecated — use aiPipeline instead');
    return { id: null };
}

// Get predictions filtered by subscription tier and date (now includes safer_pick)
async function getPredictionsByTier(tier, date) {
    const ok = await ensureDbInitialized();
    if (!ok) return [];
    const tierConfig = require('./config').tiers[tier];
    if (!tierConfig) throw new Error('Invalid tier');

    const tierDb = tierConfig.deep ? 'deep' : 'normal';
    // Calendar day in UTC: prefer kickoff stored on first leg (metadata.match_time), else fall back to row created_at
    const res = await pool.query(
        `SELECT p.*, 
            (p.matches->0->'metadata'->>'home_team')::text as home_team_name,
            (p.matches->0->'metadata'->>'away_team')::text as away_team_name,
            (p.matches->0->>'sport')::text as sport,
            NULL::timestamp as match_date
        FROM direct1x2_prediction_final p
        WHERE p.tier = $1
          AND (
            COALESCE(
              (NULLIF(TRIM(p.matches->0->'metadata'->>'match_time'), '')::timestamptz AT TIME ZONE 'UTC')::date,
              (p.created_at AT TIME ZONE 'UTC')::date
            ) = $2::date
          )
        ORDER BY p.total_confidence DESC
        LIMIT $3`,
        [tierDb, date, tierConfig.daily]
    );

    // Flatten match data from JSONB array for frontend compatibility
    res.rows.forEach(r => {
        if (r.matches && Array.isArray(r.matches)) {
            const firstMatch = r.matches[0] || {};
            r.home_team = firstMatch.home_team || null;
            r.away_team = firstMatch.away_team || null;
            r.prediction = firstMatch.prediction || null;
            r.confidence = firstMatch.confidence || null;
            r.odds = firstMatch.odds || null;
            r.market = firstMatch.market || null;
            r.volatility = firstMatch.volatility || null;
        }
    });

    return res.rows;
}

// NOTE: Deprecated — use aiPipeline.js + accaBuilder.js instead
async function insertFinalPredictionRow({
    match_id,
    prediction,
    confidence,
    stage,
    is_final,
    home_team,
    away_team
}) {
    console.warn('[database] insertFinalPredictionRow is deprecated — use aiPipeline instead');
    return { id: null };
}

// NOTE: Deprecated — use GET /api/predictions endpoint instead
async function getLatestPredictions(limit = 50) {
    console.warn('[database] getLatestPredictions is deprecated — use GET /api/predictions instead');
    return [];
}

// ========== USER HELPERS ==========

async function createUser(email, passwordHash, subscriptionType = 'normal', expiryDays = 30) {
    const ok = await ensureDbInitialized();
    if (!ok) throw new Error('DATABASE_URL not configured');
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);

    const res = await pool.query(
        'INSERT INTO users (email, password_hash, subscription_type, subscription_expiry) VALUES ($1, $2, $3, $4) RETURNING id, email, subscription_type',
        [email, passwordHash, subscriptionType, expiry]
    );
    return res.rows[0];
}

async function findUserByEmail(email) {
    const ok = await ensureDbInitialized();
    if (!ok) return null;
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
}

async function findUserById(id) {
    const ok = await ensureDbInitialized();
    if (!ok) return null;
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
}

async function getProfileById(id) {
    const ok = await ensureDbInitialized();
    if (!ok) return null;
    const res = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
    return res.rows[0] || null;
}

async function hasUsedDayZeroForUser(userId) {
    const ok = await ensureDbInitialized();
    if (!ok || !userId) return false;

    if ((await publicUsersIdDataType()) === 'uuid') {
        try {
            const userRes = await pool.query(
                'SELECT has_used_day_zero FROM users WHERE id = $1 LIMIT 1',
                [userId]
            );
            if (userRes.rows[0]?.has_used_day_zero === true) {
                return true;
            }
        } catch (error) {
            console.warn('[database] users.has_used_day_zero lookup skipped:', error.message);
        }
    }

    const res = await pool.query(
        `SELECT EXISTS (
            SELECT 1
            FROM subscriptions
            WHERE user_id = $1
              AND status IN ('day_zero_bonus', 'day_zero_lite')
        ) AS used`,
        [userId]
    );

    return res.rows[0]?.used === true;
}

async function markDayZeroAsUsed(userId) {
    const ok = await ensureDbInitialized();
    if (!ok || !userId) return false;
    if ((await publicUsersIdDataType()) !== 'uuid') return false;

    const res = await pool.query(
        'UPDATE users SET has_used_day_zero = TRUE WHERE id = $1',
        [userId]
    );

    return res.rowCount > 0;
}

async function createSubscriptionRecord({
    user_id,
    tier_id,
    status,
    payment_timestamp,
    official_start_time,
    expiration_time,
    join_after_cutoff = false,
    pro_rata_direct_free_percent = 0
}) {
    const ok = await ensureDbInitialized();
    if (!ok) throw new Error('DATABASE_URL not configured');

    const res = await pool.query(
        `INSERT INTO subscriptions (
            user_id,
            tier_id,
            status,
            payment_timestamp,
            official_start_time,
            expiration_time,
            join_after_cutoff,
            pro_rata_direct_free_percent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            user_id,
            tier_id,
            status,
            payment_timestamp,
            official_start_time,
            expiration_time,
            join_after_cutoff,
            pro_rata_direct_free_percent
        ]
    );

    const record = res.rows[0] || null;
    if (record && (record.status === 'day_zero_bonus' || record.status === 'day_zero_lite')) {
        await markDayZeroAsUsed(user_id);
    }

    return record;
}

async function getLatestSubscriptionByUserId(userId) {
    const ok = await ensureDbInitialized();
    if (!ok || !userId) return null;

    const res = await pool.query(
        `SELECT *
         FROM ${subscriptionReadSource}
         WHERE user_id = $1
         ORDER BY payment_timestamp DESC, created_at DESC
         LIMIT 1`,
        [userId]
    );

    return res.rows[0] || null;
}

async function getActiveSubscriptionsByUserId(userId, now = new Date()) {
    const ok = await ensureDbInitialized();
    if (!ok || !userId) return [];

    const res = await pool.query(
        `SELECT *
         FROM ${subscriptionReadSource}
         WHERE user_id = $1
           AND status IN ('active', 'day_zero_bonus', 'day_zero_lite')
           AND expiration_time >= $2
         ORDER BY payment_timestamp DESC, created_at DESC`,
        [userId, now.toISOString()]
    );

    return Array.isArray(res.rows) ? res.rows : [];
}

async function upsertProfile({ id, email, subscription_status = 'inactive', is_test_user = false, plan_id = null, plan_tier = null, plan_expires_at = null }) {
    const ok = await ensureDbInitialized();
    if (!ok) return null;
    const res = await pool.query(
        `INSERT INTO profiles (id, email, subscription_status, is_test_user, plan_id, plan_tier, plan_expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id)
         DO UPDATE SET
            email = COALESCE(EXCLUDED.email, profiles.email),
            subscription_status = EXCLUDED.subscription_status,
            is_test_user = EXCLUDED.is_test_user,
            plan_id = COALESCE(EXCLUDED.plan_id, profiles.plan_id),
            plan_tier = COALESCE(EXCLUDED.plan_tier, profiles.plan_tier),
            plan_expires_at = COALESCE(EXCLUDED.plan_expires_at, profiles.plan_expires_at)
         RETURNING *`,
        [id, email, subscription_status, is_test_user, plan_id, plan_tier, plan_expires_at]
    );
    return res.rows[0] || null;
}

// ========== ACCURACY HELPERS ==========

async function updateAccuracyStats() {
    // Placeholder – you can implement this later
    console.log('Weekly accuracy update not yet implemented for PostgreSQL');
}

async function getAccuracyStats() {
    const ok = await ensureDbInitialized();
    if (!ok) {
        return {
            overall: { total: 0, wins: 0, winRate: 0 },
            byTier: [],
            bySport: []
        };
    }
    // Overall stats
    const overall = await pool.query(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN status = 'Win' THEN 1 ELSE 0 END) as wins,
                ROUND(100.0 * SUM(CASE WHEN status = 'Win' THEN 1 ELSE 0 END) / COUNT(*), 1) as winRate
         FROM prediction_results`
    );

    // By tier
    const byTier = await pool.query(
        `SELECT prediction_type as tier, COUNT(*) as total,
                SUM(CASE WHEN status = 'Win' THEN 1 ELSE 0 END) as wins,
                ROUND(100.0 * SUM(CASE WHEN status = 'Win' THEN 1 ELSE 0 END) / COUNT(*), 1) as winRate
         FROM prediction_results
         GROUP BY prediction_type`
    );

    // By sport
    const bySport = await pool.query(
        `SELECT sport, COUNT(*) as total,
                SUM(CASE WHEN status = 'Win' THEN 1 ELSE 0 END) as wins,
                ROUND(100.0 * SUM(CASE WHEN status = 'Win' THEN 1 ELSE 0 END) / COUNT(*), 1) as winRate
         FROM prediction_results
         GROUP BY sport`
    );

    return {
        overall: overall.rows[0] || { total: 0, wins: 0, winRate: 0 },
        byTier: byTier.rows,
        bySport: bySport.rows
    };
}

async function query(text, params) {
    if (!pool) await ensureDbInitialized();
    return pool.query(text, params);
}

async function withTransaction(fn) {
    if (!pool) await ensureDbInitialized();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('❌ Transaction rollback error:', rollbackErr);
        }
        throw err;
    } finally {
        client.release();
    }
}

// ========== EXPORTS ==========
module.exports = {
    pool, // for advanced use
    query,
    withTransaction,
    ensureDbInitialized,
    getMatch,
    getTeamStats,
    getInjuries,
    getNewsSentiment,
    getAllUpcomingMatches,
    savePrediction,
    getPredictionsByTier,
    insertFinalPredictionRow,
    getLatestPredictions,
    createUser,
    findUserByEmail,
    findUserById,
    createSubscriptionRecord,
    getProfileById,
    getLatestSubscriptionByUserId,
    getActiveSubscriptionsByUserId,
    upsertProfile,
    hasUsedDayZeroForUser,
    updateAccuracyStats,
    getAccuracyStats
};
