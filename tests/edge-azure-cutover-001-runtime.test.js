'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const { resolveCanaryRequestPolicy } = require('../backend/startupMode');

test('cutover canary remains read-only by default', () => {
  const policy = resolveCanaryRequestPolicy({ SKCS_STARTUP_MODE: 'canary' });
  assert.equal(policy.readOnly, true);
  assert.equal(policy.requestWritesEnabled, false);
});

test('Azure reverse proxy is trusted before rate limiting', () => {
  const source = read('backend/server-express.js');
  const trustProxy = source.indexOf("app.set('trust proxy', 1)");
  const limiter = source.indexOf('const globalLimiter = rateLimit');
  assert.ok(trustProxy >= 0);
  assert.ok(limiter >= 0);
  assert.ok(trustProxy < limiter);
});

test('server installs the canary write guard before mutation routes', () => {
  const source = read('backend/server-express.js');
  const guard = source.indexOf("error: 'C14 canary is read-only'");
  const firstMutation = source.indexOf("app.post('/api/pipeline/trigger'");
  assert.ok(guard >= 0);
  assert.ok(firstMutation >= 0);
  assert.ok(guard < firstMutation);
});

test('predictions route uses the Microsoft-capable user verifier', () => {
  const source = read('backend/routes/predictions.js');
  assert.match(source, /requirePredictionsUser/);
  assert.match(source, /router\.get\('\/', requirePredictionsUser, requireActiveSubscription/);
});

test('Microsoft verifier and canary no-profile guard are present', () => {
  const identity = read('backend/middleware/microsoftEdgeIdentity.js');
  const auth = read('backend/middleware/supabaseJwt.js');
  assert.match(identity, /validateMicrosoftToken/);
  assert.match(identity, /isMicrosoftEdgeToken/);
  assert.match(auth, /validateMicrosoftToken\(token\)/);
  assert.match(auth, /canaryRequestPolicy\.readOnly/);
  assert.match(auth, /Linked Edge profile not available/);
});

test('linked Microsoft customer identity is supplied by runtime secrets and fails closed', () => {
  const identity = read('backend/middleware/microsoftEdgeIdentity.js');
  const { getLinkedIdentityConfig } = require('../backend/middleware/microsoftEdgeIdentity');
  assert.match(identity, /MICROSOFT_EDGE_EXPECTED_OBJECT_ID/);
  assert.match(identity, /MICROSOFT_EDGE_PROFILE_ID/);
  assert.match(identity, /MICROSOFT_EDGE_EXPECTED_EMAIL/);
  assert.doesNotMatch(identity, /const\s+EXPECTED_MICROSOFT_OBJECT_ID\s*=/);
  assert.doesNotMatch(identity, /const\s+EDGE_PROFILE_ID\s*=/);
  assert.doesNotMatch(identity, /const\s+EXPECTED_EMAIL\s*=/);
  assert.throws(() => getLinkedIdentityConfig({}), /linked identity is not configured/);
  assert.deepEqual(getLinkedIdentityConfig({
    MICROSOFT_EDGE_EXPECTED_OBJECT_ID: 'OBJECT-ID',
    MICROSOFT_EDGE_PROFILE_ID: 'profile-id',
    MICROSOFT_EDGE_EXPECTED_EMAIL: 'USER@EXAMPLE.COM'
  }), {
    objectId: 'object-id',
    profileId: 'profile-id',
    email: 'user@example.com'
  });
});

test('Azure auth profile route reuses the shared verifier and restricted PostgreSQL path', () => {
  const source = read('api/auth/me.js');
  assert.match(source, /validateMicrosoftToken/);
  assert.match(source, /getLinkedIdentityConfig/);
  assert.match(source, /getProfileById/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE_KEY|createClient/);
  assert.doesNotMatch(source, /EXPECTED_MICROSOFT_OBJECT_ID|EDGE_PROFILE_ID|EXPECTED_EMAIL/);
});

test('C14 restricted subscription view is enabled only with canary startup', () => {
  const source = read('backend/database.js');
  assert.match(source, /SKCS_C14_LINKED_SUBSCRIPTIONS/);
  assert.match(source, /C14 linked subscription reads require canary startup mode/);
  assert.match(source, /edge_c14_access\.linked_subscriptions/);
});

test('Azure image uses the exact proven Supabase TLS root', () => {
  const certPath = path.join(ROOT, 'supabase-root-2021.crt');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(certPath)).digest('hex');
  assert.equal(digest, '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7');
  const dockerfile = read('Dockerfile');
  assert.match(dockerfile, /COPY supabase-root-2021\.crt \/usr\/local\/share\/ca-certificates\/supabase-root-2021\.crt/);
  assert.match(dockerfile, /ENV NODE_EXTRA_CA_CERTS=\/usr\/local\/share\/ca-certificates\/supabase-root-2021\.crt/);
});
