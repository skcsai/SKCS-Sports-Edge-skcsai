'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { resolveStartupMode } = require('../backend/startupMode');

const ROOT = path.resolve(__dirname, '..');
const serverSource = fs.readFileSync(path.join(ROOT, 'backend', 'server-express.js'), 'utf8');

test('normal mode preserves all existing startup side effects by default', () => {
    const policy = resolveStartupMode({});
    assert.deepEqual(policy, {
        mode: 'normal',
        sideEffectsEnabled: true,
        runDatabaseBootstrap: true,
        initializeCronJobs: true,
        startHeartbeat: true
    });
});

test('canary mode suppresses database bootstrap, cron initialization and heartbeat startup', () => {
    const policy = resolveStartupMode({ SKCS_STARTUP_MODE: 'canary' });
    assert.equal(policy.mode, 'canary');
    assert.equal(policy.runDatabaseBootstrap, false);
    assert.equal(policy.initializeCronJobs, false);
    assert.equal(policy.startHeartbeat, false);
});

test('invalid startup mode fails closed instead of silently enabling side effects', () => {
    assert.throws(
        () => resolveStartupMode({ SKCS_STARTUP_MODE: 'typo-mode' }),
        /Invalid SKCS_STARTUP_MODE/
    );
});

test('server startup gates all three side-effect surfaces through the resolved policy', () => {
    assert.match(serverSource, /if \(startupPolicy\.runDatabaseBootstrap\)/);
    assert.match(serverSource, /if \(startupPolicy\.initializeCronJobs\)/);
    assert.match(serverSource, /if \(startupPolicy\.startHeartbeat\)/);
    assert.match(serverSource, /CANARY mode: database bootstrap suppressed/);
    assert.match(serverSource, /CANARY mode: internal cron initialization suppressed/);
    assert.match(serverSource, /CANARY mode: heartbeat startup suppressed/);
});

test('Stage A does not weaken external scheduler authentication or activate prediction work', () => {
    assert.match(serverSource, /requireSchedulerSecret/);
    assert.doesNotMatch(serverSource, /SKCS_STARTUP_MODE[^\n]*prediction/i);
});

test('canary startup does not import the Supabase-bound cricket publisher at module load', () => {
    const topSection = serverSource.split("app.post('/api/pipeline/trigger'")[0];
    assert.doesNotMatch(topSection, /publish-cricbuzz-cricket/);
    assert.match(serverSource, /cron_cricket_daily_fixtures[\s\S]*require\('\.\.\/scripts\/publish-cricbuzz-cricket'\)/);
});

test('canary startup skips Supabase-bound cricket routers', () => {
    assert.match(serverSource, /cricketInsightsRouter = startupPolicy\.sideEffectsEnabled \? require\('\.\/routes\/cricketInsights'\) : express\.Router\(\)/);
    assert.match(serverSource, /cricketCountRouter = startupPolicy\.sideEffectsEnabled \? require\('\.\/routes\/cricketCount'\) : express\.Router\(\)/);
    assert.match(serverSource, /cricketCronRouter = startupPolicy\.sideEffectsEnabled \? require\('\.\/routes\/cricketCron'\) : express\.Router\(\)/);
});

test('Dockerfile uses Node 20 production dependencies and a non-root runtime user', () => {
    const dockerfile = fs.readFileSync(path.join(ROOT, 'Dockerfile'), 'utf8');
    assert.match(dockerfile, /^FROM node:20-alpine/m);
    assert.match(dockerfile, /npm ci --omit=dev/);
    assert.match(dockerfile, /COPY --chown=node:node \. \./);
    assert.match(dockerfile, /^USER node$/m);
    assert.doesNotMatch(dockerfile, /ENV\s+.*(?:KEY|SECRET|PASSWORD|DATABASE_URL)/i);
});
