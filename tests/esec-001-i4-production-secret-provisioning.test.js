'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const script = read('scripts/import-esec-001-i4-keyvault.ps1');
const report = JSON.parse(read('reports/esec-001-i4/production-secret-provisioning.json'));
const packet = read('control-center/ESEC-001_I4_PRODUCTION_SECRET_PROVISIONING_AND_ROTATION_PROOF.v1.md');

test('I4 transfer uses files and never places secret values in CLI arguments', () => {
  assert.match(script, /az keyvault secret set/);
  assert.match(script, /--file \$secretPath/);
  assert.doesNotMatch(script, /az keyvault secret set[^\n]*--value/);
  assert.ok(script.includes('--only-show-errors'));
});

test('I4 fails closed for provider-protected and missing sources', () => {
  assert.match(script, /BLOCKED_PROVIDER_NONEXPORTABLE/);
  assert.match(script, /BLOCKED_MISSING_SOURCE/);
  assert.ok(script.includes("value === '[SENSITIVE]'"));
  assert.equal(report.dry_run.ready_count, 7);
  assert.equal(report.dry_run.blocked_count, 2);
  assert.deepEqual(report.dry_run.blocked.map((x) => x.keyvault_name).sort(), ['cron-secret','skcs-refresh-key']);
});

test('all sensitive temporary files are cleaned in a finally path', () => {
  assert.match(script, /finally\s*\{[\s\S]*Clear-SecureTemp/);
  assert.match(script, /Remove-SensitiveFile/);
  assert.ok(script.includes('$stream.Write($buffer'));
  assert.equal(report.dry_run.temporary_file_removed, true);
});

test('current Vercel production is authoritative where local values drift', () => {
  assert.equal(report.sources.local_edge_source.equality_with_vercel_pullable.ADMIN_API_KEY, 'DIFFERENT_USE_CURRENT_VERCEL');
  assert.equal(report.sources.local_edge_source.equality_with_vercel_pullable.X_APISPORTS_KEY, 'DIFFERENT_USE_CURRENT_VERCEL');
  assert.equal(report.sources.vercel.source_role, 'current production configuration');
});

test('temporary vault write privilege is bounded and must be revoked', () => {
  assert.equal(report.temporary_rbac.write_role_required, 'Key Vault Secrets Officer');
  assert.equal(report.temporary_rbac.scope, 'Edge Key Vault only');
  assert.match(report.temporary_rbac.mandatory_cleanup, /revoke immediately/i);
  assert.match(packet, /returning the deployment identity to Reader-only metadata access/);
  assert.ok(script.includes('role assignment create'));
  assert.ok(script.includes('--role $SecretsOfficerRole'));
  assert.ok(script.includes('role assignment delete'));
  assert.ok(script.includes('if ($TemporarySecretsOfficerCreated'));
});

test('I4 preserves deployment and source-system boundaries', () => {
  for (const key of ['container_app_deploy','stage_b','rls','render_mutation','vercel_mutation','dns_mutation','secret_values_in_report']) {
    assert.equal(report.boundaries[key], false, key);
  }
});
