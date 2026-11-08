'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const report = JSON.parse(read('reports/esec-001-i3/production-credential-remediation.json'));
const bicep = read('infra/azure/eops-001-a1/main.bicep');
const provider = read('backend/services/dataProvider.js');

const protectedFiles = [
  'backend/routes/pipeline.js',
  'backend/routes/cricketCount.js',
  'backend/routes/cricketInsights.js',
  'backend/routes/direct1x2.js',
  'backend/services/apiCacheService.js',
  'backend/services/canonicalEvents.js',
  'backend/services/direct1x2Builder.js',
  'backend/services/filterEngine.js',
  'backend/services/thesportsdbPipeline.js'
];

test('provider diagnostics never reveal credential prefixes', () => {
  for (const key of ['X_APISPORTS_KEY', 'THESPORTSDB_KEY', 'ODDS_API_KEY', 'RAPIDAPI_KEY']) {
    assert.doesNotMatch(provider, new RegExp(key + "[^\\n]*slice\\("));
    assert.match(provider, new RegExp(key + "[^\\n]*\\? 'SET' : 'MISSING'"));
  }
});

test('protected I3 runtime paths contain no legacy SUPABASE_KEY fallback', () => {
  for (const file of protectedFiles) {
    assert.doesNotMatch(read(file), /process\.env\.SUPABASE_KEY\b/, file);
  }
});

test('read-only Supabase paths use anon and privileged paths use service role explicitly', () => {
  for (const file of [
    'backend/routes/cricketCount.js',
    'backend/routes/cricketInsights.js',
    'backend/routes/direct1x2.js',
    'backend/services/filterEngine.js'
  ]) {
    const source = read(file);
    assert.match(source, /SUPABASE_ANON_KEY/, file);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/, file);
  }

  for (const file of [
    'backend/routes/pipeline.js',
    'backend/services/apiCacheService.js',
    'backend/services/canonicalEvents.js',
    'backend/services/direct1x2Builder.js',
    'backend/services/thesportsdbPipeline.js'
  ]) {
    assert.match(read(file), /SUPABASE_SERVICE_ROLE_KEY/, file);
  }
});

test('Bicep uses Key Vault secretRef wiring with no plaintext secret values', () => {
  assert.match(bicep, /Microsoft\.KeyVault\/vaults/);
  assert.match(bicep, /productionSecretsEnabled bool = false/);
  assert.match(bicep, /keyVaultUrl:/);
  assert.match(bicep, /secretRef:/);
  assert.equal((bicep.match(/keyVaultUrl:/g) || []).length, 9);
  assert.equal((bicep.match(/secretRef:/g) || []).length, 9);
  assert.doesNotMatch(bicep, /SUPABASE_KEY/);
  assert.doesNotMatch(bicep, /Microsoft\.Authorization\/roleAssignments[^\n]*keyVaultSecretsUser/);
});

test('approved production environment names are mapped separately', () => {
  for (const name of [
    'DATABASE_URL','SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY',
    'CRON_SECRET','ADMIN_API_KEY','SKCS_REFRESH_KEY','X_APISPORTS_KEY','ODDS_API_KEY'
  ]) {
    assert.match(bicep, new RegExp("name: '" + name + "'"));
  }
});

test('vault RBAC is least privilege and metadata proof did not read values', () => {
  assert.equal(report.azure_rbac.scope, 'EDGE_VAULT_ONLY');
  assert.equal(report.azure_rbac.runtime_identity_role, 'Key Vault Secrets User');
  assert.equal(report.azure_rbac.deployment_identity_role, 'Key Vault Reader');
  assert.equal(report.azure_rbac.subscription_wide_new_role_assignments, false);
  assert.equal(report.key_vault_metadata.metadata_read_succeeded, true);
  assert.equal(report.key_vault_metadata.secret_values_read, false);
});

test('empty vault remains a fail-closed production blocker', () => {
  assert.equal(report.key_vault_metadata.secret_count, 0);
  assert.ok(report.blockers.some((b) => b.id === 'KV-SECRETS-EMPTY-001'));
  assert.equal(report.current_decision.production_secret_population, 'HOLD');
  assert.equal(report.current_decision.stage_b_authorized, false);
});

test('what-if is non-destructive and no deployment occurred', () => {
  assert.equal(report.bicep.build, 'PASS');
  assert.equal(report.what_if.status, 'Succeeded');
  assert.equal(report.what_if.destructive_changes, 0);
  assert.equal(report.what_if.deployment_performed, false);
  assert.equal(report.no_mutation_boundary.container_app_deployed, false);
  assert.equal(report.no_mutation_boundary.secret_create_update_rotate_delete, false);
  assert.equal(report.no_mutation_boundary.secret_values_read, false);
});
