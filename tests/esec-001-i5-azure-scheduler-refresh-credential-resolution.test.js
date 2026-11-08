'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const bicep = read('infra/azure/eops-001-a1/main.bicep');
const server = read('backend/server-express.js');
const refreshTrigger = read('scripts/trigger-refresh.js');
const creator = read('scripts/apply-esec-001-i5-azure-cron-secret.ps1');
const report = JSON.parse(read('reports/esec-001-i5/azure-scheduler-refresh-credential-resolution.json'));
const packet = read('control-center/ESEC-001_I5_AZURE_SCHEDULER_AND_REFRESH_CREDENTIAL_BOUNDARY_RESOLUTION.v1.md');

test('Azure deployment no longer requires SKCS_REFRESH_KEY', () => {
  assert.doesNotMatch(bicep, /SKCS_REFRESH_KEY/);
  assert.doesNotMatch(bicep, /skcs-refresh-key/);
  assert.doesNotMatch(bicep, /skcsRefreshKeySecretName/);
  assert.match(bicep, /name: 'ADMIN_API_KEY'/);
  assert.match(bicep, /name: 'CRON_SECRET'/);
});

test('current refresh boundary remains valid with ADMIN_API_KEY and no SKCS_REFRESH_KEY', () => {
  assert.match(server, /const refreshKey = process\.env\.SKCS_REFRESH_KEY/);
  assert.match(server, /const adminKey\s+= process\.env\.ADMIN_API_KEY/);
  assert.match(server, /adminKey && key === adminKey/);
  assert.match(refreshTrigger, /process\.env\.ADMIN_API_KEY/);
  assert.match(refreshTrigger, /process\.env\.CRON_SECRET/);
  assert.equal(report.decision.azure_refresh_credential, 'ADMIN_API_KEY');
  assert.equal(report.decision.separate_skcs_refresh_key_required, false);
});

test('Azure cron secret creation is cryptographically random and file based', () => {
  assert.match(creator, /RandomNumberGenerator/);
  assert.match(creator, /New-Object byte\[\] 48/);
  assert.match(creator, /az keyvault secret set/);
  assert.match(creator, /--file \$SecretFile/);
  assert.doesNotMatch(creator, /az keyvault secret set[^\n]*--value/);
  assert.equal(report.cron_secret_plan.generation, '48 cryptographically random bytes encoded as base64url');
});

test('I5 refuses silent scheduler-secret overwrite', () => {
  assert.match(creator, /BLOCKED_ALREADY_EXISTS/);
  assert.match(creator, /refuses to overwrite or rotate an existing scheduler secret/);
  assert.equal(report.cron_secret_plan.pre_existing, false);
  assert.equal(report.cron_secret_plan.overwrite_existing, false);
});

test('temporary vault write permission and sensitive files are cleaned in finally', () => {
  assert.match(creator, /finally\s*\{[\s\S]*Remove-SensitiveFile/);
  assert.ok(creator.includes('role assignment create'));
  assert.ok(creator.includes('role assignment delete'));
  assert.ok(creator.includes('--role $SecretsOfficerRole'));
  assert.ok(creator.includes('$stream.Write($buffer'));
});

test('I5 packet keeps deployment and platform boundaries closed', () => {
  for (const key of ['container_app_deploy','stage_b','rls','render_mutation','vercel_mutation','dns_mutation','supabase_mutation','secret_values_in_report']) {
    assert.equal(report.boundaries[key], false, key);
  }
  assert.match(packet, /No Azure Container App deployment/);
});
