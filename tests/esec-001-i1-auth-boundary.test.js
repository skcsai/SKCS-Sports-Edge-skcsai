'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function createResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}


function loadSupabaseJwtWithoutDatabase() {
    const Module = require('node:module');
    const modulePath = require.resolve(
        '../backend/middleware/supabaseJwt'
    );
    const originalLoad = Module._load;

    Module._load = function (request, parent, isMain) {
        const parentFile = String(parent?.filename || '');

        if (
            request === '../database'
            && parentFile.endsWith(
                path.join('backend', 'middleware', 'supabaseJwt.js')
            )
        ) {
            return {
                getProfileById: async () => null,
                getLatestSubscriptionByUserId: async () => null,
                getActiveSubscriptionsByUserId: async () => [],
                upsertProfile: async (profile) => profile
            };
        }

        return originalLoad.call(this, request, parent, isMain);
    };

    try {
        delete require.cache[modulePath];
        return require(modulePath);
    } finally {
        Module._load = originalLoad;
        delete require.cache[modulePath];
    }
}

test('ESEC-001-I1 core auth source is fail-closed', () => {
    const auth = read('backend/utils/auth.js');
    const jwt = read('backend/middleware/supabaseJwt.js');
    const predictions = read('backend/routes/predictions.js');
    const v1Predictions = read('backend/routes/v1/predictions.js');

    assert.doesNotMatch(auth, /skcs_user_12345/);
    assert.doesNotMatch(auth, /ALLOW_LEGACY_USER_KEY/);
    assert.doesNotMatch(auth, /startsWith\('\/api\/cron\/'\)/);
    assert.match(auth, /timingSafeEqual/);
    assert.match(auth, /x-cron-secret/);

    assert.doesNotMatch(jwt, /Bypassing subscription resolution/);
    assert.doesNotMatch(jwt, /ADMIN_BYPASS_EMAIL/);
    assert.doesNotMatch(jwt, /metadataIsAdmin/);
    assert.doesNotMatch(jwt, /USER_API_KEYS?/);
    assert.match(jwt, /profile\?\.is_admin === true/);
    assert.match(jwt, /Active subscription required/);
    assert.match(jwt, /NODE_ENV[\s\S]*production/);

    assert.doesNotMatch(predictions, /sfynn13433@gmail\.com/);
    assert.doesNotMatch(predictions, /isHardcodedAdmin/);
    assert.match(
        predictions,
        /router\.get\('\/', requirePredictionsUser, requireActiveSubscription,/
    );
    assert.match(
        v1Predictions,
        /requireSupabaseUser, requireActiveSubscription/
    );
});

test('admin middleware rejects missing configuration and invalid credentials', () => {
    const original = process.env.ADMIN_API_KEY;
    delete process.env.ADMIN_API_KEY;

    delete require.cache[require.resolve('../backend/utils/auth')];
    const { requireAdminKey } = require('../backend/utils/auth');

    let nextCalls = 0;
    let res = createResponse();
    requireAdminKey({ headers: {} }, res, () => { nextCalls += 1; });
    assert.equal(res.statusCode, 503);
    assert.equal(nextCalls, 0);

    process.env.ADMIN_API_KEY = 'admin-secret';
    res = createResponse();
    requireAdminKey(
        { headers: { 'x-admin-key': 'wrong-secret' } },
        res,
        () => { nextCalls += 1; }
    );
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalls, 0);

    res = createResponse();
    requireAdminKey(
        { headers: { 'x-admin-key': 'admin-secret' } },
        res,
        () => { nextCalls += 1; }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(nextCalls, 1);

    if (original === undefined) delete process.env.ADMIN_API_KEY;
    else process.env.ADMIN_API_KEY = original;
});

test('scheduler middleware accepts only the dedicated header', () => {
    const original = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'scheduler-secret';

    delete require.cache[require.resolve('../backend/utils/auth')];
    const { requireSchedulerSecret } = require('../backend/utils/auth');

    let nextCalls = 0;
    let res = createResponse();

    requireSchedulerSecret(
        {
            headers: {},
            query: { secret: 'scheduler-secret' }
        },
        res,
        () => { nextCalls += 1; }
    );
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalls, 0);

    res = createResponse();
    requireSchedulerSecret(
        { headers: { 'x-cron-secret': 'scheduler-secret' } },
        res,
        () => { nextCalls += 1; }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(nextCalls, 1);

    if (original === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = original;
});

test('subscription middleware is fail-closed with bounded test policy', () => {
    const originalEnvironment = process.env.NODE_ENV;
    const originalBypass = process.env.ALLOW_TEST_USER_SUBSCRIPTION_BYPASS;

    process.env.NODE_ENV = 'production';
    process.env.ALLOW_TEST_USER_SUBSCRIPTION_BYPASS = 'true';

    let { requireActiveSubscription } =
        loadSupabaseJwtWithoutDatabase();

    let nextCalls = 0;
    let res = createResponse();

    requireActiveSubscription(
        {
            user: {
                subscription_status: 'inactive',
                is_test_user: true
            }
        },
        res,
        () => { nextCalls += 1; }
    );
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalls, 0);

    process.env.NODE_ENV = 'test';
    ({ requireActiveSubscription } =
        loadSupabaseJwtWithoutDatabase());

    res = createResponse();
    requireActiveSubscription(
        {
            user: {
                subscription_status: 'inactive',
                is_test_user: true
            }
        },
        res,
        () => { nextCalls += 1; }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(nextCalls, 1);

    res = createResponse();
    requireActiveSubscription(
        {
            user: {
                subscription_status: 'active',
                is_test_user: false
            }
        },
        res,
        () => { nextCalls += 1; }
    );
    assert.equal(res.statusCode, 200);
    assert.equal(nextCalls, 2);

    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;

    if (originalBypass === undefined) {
        delete process.env.ALLOW_TEST_USER_SUBSCRIPTION_BYPASS;
    } else {
        process.env.ALLOW_TEST_USER_SUBSCRIPTION_BYPASS = originalBypass;
    }
});
