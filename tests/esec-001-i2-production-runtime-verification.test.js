'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const report = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'esec-001-i2', 'production-runtime-verification.json'), 'utf8'));
const bicep = fs.readFileSync(path.join(ROOT, 'infra', 'azure', 'eops-001-a1', 'main.bicep'), 'utf8');
const provider = fs.readFileSync(path.join(ROOT, 'backend', 'services', 'dataProvider.js'), 'utf8');
const i1 = fs.readFileSync(path.join(ROOT, 'control-center', 'ESEC-001_I1_FAIL_CLOSED_AUTHENTICATION_AND_CREDENTIAL_BOUNDARY_IMPLEMENTATION.v1.md'), 'utf8');

test('I2 is read-only and keeps deployment on HOLD', () => {
  assert.equal(report.decision.deployment_readiness, 'HOLD');
  assert.equal(report.decision.eops_stage_b_allowed, false);
  assert.equal(report.no_mutation_proof.cloud_mutations_performed, false);
  assert.equal(report.no_mutation_proof.secret_values_read, false);
  assert.equal(report.no_mutation_proof.azure_container_app_deployed, false);
});

test('Key Vault and managed identity evidence fail closed', () => {
  assert.equal(report.azure.key_vault.rbac_authorization, true);
  assert.equal(report.azure.key_vault.secret_metadata_read, 'FORBIDDEN_BY_RBAC');
  assert.equal(report.azure.edge_managed_identity.role_assignment_count, 0);
  assert.equal(report.azure.edge_managed_identity.key_vault_data_plane_role_proven, false);
});

test('Stage A Bicep has no production secret-reference wiring yet', () => {
  assert.doesNotMatch(bicep, /keyVaultUrl/);
  assert.doesNotMatch(bicep, /secretRef/);
  assert.doesNotMatch(bicep, /\bsecrets\s*:/);
  assert.match(bicep, /SKCS_STARTUP_MODE/);
  assert.match(bicep, /value: 'canary'/);
});

test('provider diagnostics expose secret prefixes and block production deployment', () => {
  assert.match(provider, /X_APISPORTS_KEY[\s\S]*slice\(0,6\)/);
  assert.match(provider, /ODDS_API_KEY[\s\S]*slice\(0,4\)/);
  assert.ok(report.blockers.some((b) => b.id === 'SECRET-LOG-001'));
});

test('I1 credential-class law and production proof gap remain preserved', () => {
  assert.match(i1, /Supabase service-role key is a privileged server-only credential/);
  assert.match(i1, /Scheduler secret is a dedicated server-to-server credential/);
  assert.match(i1, /Production credential configuration and rotation evidence remain absent/);
  assert.ok(report.credential_classes.some((x) => x.class === 'supabase_legacy_alias'));
});

test('RLS remains outside I2 and ESEC cannot close', () => {
  assert.ok(report.blockers.some((b) => b.id === 'RLS-001'));
  assert.equal(report.decision.esec_parent_can_close, false);
});
