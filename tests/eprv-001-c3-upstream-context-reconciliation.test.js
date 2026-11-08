'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const CONTRACT = path.join(ROOT, 'control-center', 'EPRV-001_C3_UPSTREAM_CONTEXT_AVAILABILITY_RECONCILIATION.v1.md');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));

test('C3 records immutable Scout source identity and preserves no-prediction boundary', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  assert.ok(c.includes('8647e2d0fdb73da4fa4a958af46e35a01888092d'));
  assert.ok(c.includes('153684f6d7511ce653d26e490c8f507b0a7e0ad23d834d84671d9adea5a65912'));
  assert.ok(c.includes('| Scout prediction execution | **false** |'));
  assert.ok(c.includes('Scout does not predict. Edge remains the prediction system.'));
});

test('C3 proves three upstream-existing transport gaps', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  for (const factClass of ['Injuries / availability', 'H2H', 'Team form']) {
    const line = c.split(/\r?\n/).find((x) => x.startsWith('| ' + factClass + ' |'));
    assert.ok(line, 'missing row ' + factClass);
    assert.ok(line.includes('**UPSTREAM_EXISTS_NOT_TRANSPORTED**'));
  }
  assert.ok(c.includes('Crystal Palace availability rows: **29**'));
  assert.ok(c.includes('Liverpool availability rows: **31**'));
  assert.ok(c.includes('**3 OUT** and **1 DOUBTFUL**'));
  assert.ok(c.includes('`played: 34`'));
  assert.ok(c.includes('current five-result form sequence'));
});

test('C3 proves weather and news are upstream-absent in inspected package', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  for (const factClass of ['Weather', 'News / contextual events']) {
    const line = c.split(/\r?\n/).find((x) => x.startsWith('| ' + factClass + ' |'));
    assert.ok(line, 'missing row ' + factClass);
    assert.ok(line.includes('**UPSTREAM_ABSENT**'));
  }
  assert.ok(c.includes('no top-level `weather`, `news`, or `team_news` field'));
  assert.ok(c.includes('does not authorize guessing, synthetic defaults, or third-party fallback'));
});

test('C3 routes transport gaps and collection gaps to different owners', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  assert.ok(c.includes('Scout FIP output/transport contract + Edge EFI/FIP intake mapping'));
  assert.ok(c.includes('Separate Scout weather collection/governance work before transport'));
  assert.ok(c.includes('Separate Scout news/context evidence-admission/governance work before transport'));
});

test('C3 preserves provider-removal HOLD and runtime gates', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  const ledger = readJson('control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json');
  const parent = ledger.tasks.find((x) => x.task_id === 'EPRV-001');
  const c3 = ledger.tasks.find((x) => x.task_id === 'EPRV-001-C3');
  assert.equal(parent.status, 'PARTIAL');
  assert.equal(c3.status, 'IN_PROGRESS');
  assert.equal(c3.startable, true);
  assert.equal(ledger.scout_edge_marriage_gate, 'BLOCKED');
  assert.equal(ledger.supabase_storage_gate, 'BLOCKED');
  assert.ok(c.includes('No runtime/provider/prediction behaviour changed.'));
});

test('C3 result is exactly three transport blockers plus two upstream blockers', () => {
  const c = fs.readFileSync(CONTRACT, 'utf8');
  assert.ok(c.includes('**3 transport/contract blockers**'));
  assert.ok(c.includes('**2 genuine upstream collection/governance blockers**'));
});