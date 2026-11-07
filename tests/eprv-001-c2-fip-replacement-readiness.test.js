'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CONTRACT = path.join(ROOT, 'control-center', 'EPRV-001_C2_FIP_REPLACEMENT_READINESS_CONTRACT.v1.md');
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function readJson(rel) { return JSON.parse(read(rel)); }

const MATRIX = Object.freeze({
  'Fixture identity and schedule': 'MAPPED',
  '1X2 / market inputs': 'MAPPED',
  Weather: 'MISSING_BLOCKER',
  'Injuries / availability': 'MISSING_BLOCKER',
  H2H: 'MISSING_BLOCKER',
  'Team form': 'MISSING_BLOCKER',
  'News / contextual events': 'MISSING_BLOCKER'
});

test('EPRV-001-C2 contract is contract-only and HOLDs provider-removal implementation', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  assert.match(c, /EPRV-001-C2 - FIP Replacement Mapping and Fail-Closed Provider Readiness Contract v1/);
  assert.ok(c.includes('| **C2 state during packet** | **IN_PROGRESS** |'));
  assert.ok(c.includes('| **Provider-removal readiness verdict** | **HOLD - NOT IMPLEMENTATION READY** |'));
  assert.ok(c.includes('| **Runtime provider edits** | **FORBIDDEN** in this packet |'));
  assert.ok(c.includes('| **Prediction runtime edits** | **FORBIDDEN** in this packet |'));
});

test('replacement matrix classifies every required provider fact class explicitly', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  for (const [factClass, status] of Object.entries(MATRIX)) {
    assert.ok(c.includes('| ' + factClass + ' |'), 'missing fact class ' + factClass);
    assert.ok(c.includes('**' + status + '**'), 'missing status ' + status);
  }
  assert.equal(Object.values(MATRIX).filter((v) => v === 'MAPPED').length, 2);
  assert.equal(Object.values(MATRIX).filter((v) => v === 'MISSING_BLOCKER').length, 5);
});

test('canonical FIP requires generic markets/context but not missing context subclasses', () => {
  const source = read('backend/services/fipIntakeService.js');
  const required = source.slice(source.indexOf('const CANONICAL_REQUIRED_PATHS'), source.indexOf('function stableClone'));
  assert.ok(required.includes("'markets'"));
  assert.ok(required.includes("'context'"));
  for (const missing of ['context.weather','context.injuries','context.availability','context.h2h','context.form','context.news','context.team_news']) {
    assert.equal(required.includes("'" + missing + "'"), false, 'unexpected required FIP subclass ' + missing);
  }
});

test('Edge envelope maps governed markets and generic context without proving class completeness', () => {
  const source = read('backend/services/fipIntakeService.js');
  const start = source.indexOf('function mapToEdgeAnalysisEnvelope');
  const end = source.indexOf('function validatePayloadSize', start);
  const block = source.slice(start, end);
  assert.match(block, /markets\.direct_1x2/);
  assert.match(block, /markets\.sharp_odds/);
  assert.match(block, /sharp_odds: sharpOdds/);
  assert.match(block, /contextual_intelligence: contextualIntelligence/);
  assert.match(block, /context\?\.contextual_intelligence/);
});

test('current configured input still uses provider loader when fip_envelopes is absent', () => {
  const source = read('backend/services/aiPipeline.js');
  const start = source.indexOf('async function resolveConfiguredPredictionInput');
  const end = source.indexOf('async function runPipelineFromConfiguredDataMode', start);
  const block = source.slice(start, end);
  assert.match(block, /if \(!hasOwn\(options, 'fip_envelopes'\)\)/);
  assert.match(block, /const providerInput = await providerLoader\(\)/);
  const c = fs.readFileSync(CONTRACT, 'utf8');
  assert.ok(c.includes('absence of `fip_envelopes` for the governed prediction path must reject/fail closed'));
  assert.ok(c.includes('rejection must not call external sports-truth providers as a fallback'));
});

test('C2 preserves EPI/EST laws and blocked global gates', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  const ledger = readJson('control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json');
  assert.equal(ledger.scout_edge_marriage_gate, 'BLOCKED');
  assert.equal(ledger.supabase_storage_gate, 'BLOCKED');
  assert.ok(c.includes('EPI-001 remains binding'));
  assert.ok(c.includes('EST-001 remains binding'));
  assert.ok(c.includes('must not persist the full Scout FIP body'));
});

test('Control Center registers C2 as the active contract/readiness project only', () => {
  const ledger = readJson('control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json');
  const register = readJson('control-center/EDGE_MASTER_PROJECT_REGISTER.v1.json');
  const task = ledger.tasks.find((x) => x.task_id === 'EPRV-001-C2');
  const project = register.projects.find((x) => x.project_id === 'EPRV-001-C2');
  assert.ok(task && project);
  assert.equal(task.status, 'IN_PROGRESS');
  assert.equal(task.startable, true);
  assert.equal(project.current_status, 'IN_PROGRESS');
  assert.equal(project.startable, true);
  assert.deepEqual(task.blocked_by, ['EFI-001','EPI-001-D1-R1','ESA-RR-004']);
  const parent = ledger.tasks.find((x) => x.task_id === 'EPRV-001');
  assert.equal(parent.status, 'PARTIAL');
});

test('package includes the focused C2 proof in the Control Center suite', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts['test:eprv-001-c2'], 'node --test tests/eprv-001-c2-fip-replacement-readiness.test.js');
  assert.ok(pkg.scripts['test:control-center'].includes('tests/eprv-001-c2-fip-replacement-readiness.test.js'));
});