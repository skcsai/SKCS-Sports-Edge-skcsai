'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION = "supabase/migrations/20261108065612_esec_001_i6_server_only_rls_boundary.sql";
const REPORT = 'reports/esec-001-i6/rls-server-only-boundary.json';
const PACKET = 'control-center/ESEC-001_I6_RLS_SERVER_ONLY_TABLE_BOUNDARY_AND_PRIVILEGE_HARDENING.v1.md';

const TARGETS = [
  'fixture_lifecycle_current',
  'fixture_identity_aliases',
  'fixture_lifecycle_transition_events',
  'fixture_lifecycle_rollover_events',
  'lifecycle_daily_admission_counters',
  'lifecycle_admission_idempotency',
  'fixture_display_metadata',
  'fip_intake_evidence'
];

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const sql = read(MIGRATION);
const report = JSON.parse(read(REPORT));
const packet = read(PACKET);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (['node_modules', '.git'].includes(ent.name)) continue;
      walk(full, out);
    } else if (/\.(?:js|cjs|mjs|ts|tsx|html)$/i.test(ent.name)) {
      out.push(full);
    }
  }
  return out;
}

test('migration targets exactly the eight governed RLS-001 tables', () => {
  assert.deepEqual(report.target_tables, TARGETS);
  for (const name of TARGETS) assert.match(sql, new RegExp("'" + name + "'"));
  assert.equal((sql.match(/'fixture_[a-z0-9_]+'|'lifecycle_[a-z0-9_]+'|'fip_intake_evidence'/g) || []).filter((x) => TARGETS.includes(x.slice(1,-1))).length, 8);
});

test('migration keeps RLS enabled and fails closed on missing tables or FORCE RLS', () => {
  assert.match(sql, /ALTER TABLE public\.%I ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /to_regclass/);
  assert.match(sql, /expected table public\.% is missing/);
  assert.match(sql, /relforcerowsecurity/);
  assert.match(sql, /refuses FORCE ROW LEVEL SECURITY/);
  assert.doesNotMatch(sql, /ALTER TABLE[^;\n]+NO FORCE ROW LEVEL SECURITY/i);
  assert.doesNotMatch(sql, /ALTER TABLE[^;\n]+FORCE ROW LEVEL SECURITY/i);
});

test('browser roles are denied table privileges and no permissive RLS policy is created', () => {
  assert.match(sql, /REVOKE ALL PRIVILEGES ON TABLE public\.%I FROM PUBLIC/);
  assert.match(sql, /rolname = 'anon'/);
  assert.match(sql, /FROM anon/);
  assert.match(sql, /rolname = 'authenticated'/);
  assert.match(sql, /FROM authenticated/);
  assert.doesNotMatch(sql, /CREATE\s+POLICY/i);
  assert.doesNotMatch(sql, /ALTER\s+DEFAULT\s+PRIVILEGES/i);
});

test('service-only Supabase privilege is conditional and limited to CRUD', () => {
  assert.match(sql, /rolname = 'service_role'/);
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.%I TO service_role/);
  assert.doesNotMatch(sql, /ALTER\s+ROLE/i);
  assert.equal(report.access_model.rls_policies_created, 0);
  assert.equal(report.access_model.force_rls_allowed, false);
});

test('no public browser asset or supabase-js Data API caller targets the eight tables', () => {
  const publicFiles = walk(path.join(ROOT, 'public'));
  for (const file of publicFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const table of TARGETS) assert.doesNotMatch(text, new RegExp('\\b' + table + '\\b'), path.relative(ROOT, file));
  }

  const sourceFiles = [
    ...walk(path.join(ROOT, 'backend')),
    ...walk(path.join(ROOT, 'api')),
    ...walk(path.join(ROOT, 'scripts'))
  ];
  for (const file of sourceFiles) {
    const text = fs.readFileSync(file, 'utf8');
    for (const table of TARGETS) {
      const dataApi = new RegExp("\\.from\\s*\\(\\s*['\\\"]" + table + "['\\\"]\\s*\\)");
      assert.doesNotMatch(text, dataApi, path.relative(ROOT, file));
    }
  }
});

test('I6 preserves inactive Supabase and deployment boundaries', () => {
  assert.equal(report.supabase_project.state, 'INACTIVE');
  assert.equal(report.supabase_project.restored, false);
  assert.equal(report.supabase_project.live_migration_applied, false);
  for (const [name, value] of Object.entries(report.boundaries)) {
    assert.equal(value, false, name);
  }
  assert.match(packet, /No Supabase restore/);
  assert.match(packet, /must not claim live execution/);
});
