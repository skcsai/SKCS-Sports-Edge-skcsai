'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const CONTRACT = path.join(ROOT, 'control-center', 'EPRV-001_C4_SCOUT_CONTEXT_TRANSPORT_FIELD_CONTRACT.v1.md');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const contract = () => fs.readFileSync(CONTRACT, 'utf8');

test('C4 defines only the three upstream-existing context roots', () => {
  const c = contract();
  for (const root of ['context.availability','context.h2h','context.team_form']) assert.ok(c.includes('`' + root + '`'));
  assert.ok(c.includes('Weather and news/context are explicitly out of scope'));
  assert.ok(c.includes('**OUT_OF_SCOPE / UPSTREAM_ABSENT**'));
});

test('availability transport preserves exact Scout fields and UNKNOWN semantics', () => {
  const c = contract();
  for (const field of ['name','availability_status','injury_status','suspension_status','reason','source_id']) assert.ok(c.includes('`' + field + '`'));
  assert.ok(c.includes('`UNKNOWN` is a valid governed evidence state'));
  assert.ok(c.includes('It must not be converted to'));
  assert.ok(c.includes('Known values such as `OUT` and `DOUBTFUL` are transported as Scout-owned facts'));
});

test('H2H transport preserves perspective, source identity and meeting rows', () => {
  const c = contract();
  for (const field of ['perspective_team','source_id','played','won','drawn','lost','recent_meetings','kickoff_at','competition','home_team','away_team','home_score','away_score']) assert.ok(c.includes('`' + field + '`'));
  assert.ok(c.includes('must not silently invert the summary or recalculate historical results'));
});

test('team-form transport preserves both sides, source identity and season summary', () => {
  const c = contract();
  for (const field of ['team_name','source_id','current_form','season_summary','goals_for','goals_against']) assert.ok(c.includes('`' + field + '`'));
  assert.ok(c.includes('Edge must not regenerate form from its own fixture store'));
});

test('C4 binds class transport to FIP timing/provenance and Scout ownership', () => {
  const c = contract();
  assert.ok(c.includes('Scout FIP package validation status and canonical hash'));
  assert.ok(c.includes('prediction/evidence cutoff time'));
  assert.ok(c.includes('`calculation_owner = SCOUT`'));
  assert.ok(c.includes('`edge_consumer_policy = EDGE_CONSUME_NO_RECOMPUTE`'));
  assert.ok(c.includes('Scout no-prediction boundary'));
});

test('C4 remains contract-only and keeps provider-removal/global gates blocked', () => {
  const c = contract();
  const ledger = readJson('control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json');
  const c4 = ledger.tasks.find((x) => x.task_id === 'EPRV-001-C4');
  const parent = ledger.tasks.find((x) => x.task_id === 'EPRV-001');
  assert.equal(c4.status, 'TESTED');
  assert.equal(c4.startable, false);
  assert.equal(parent.status, 'PARTIAL');
  assert.equal(ledger.scout_edge_marriage_gate, 'BLOCKED');
  assert.equal(ledger.supabase_storage_gate, 'BLOCKED');
  assert.ok(c.includes('C4 defines the transport contract only'));
});

test('C4 future fail-closed law forbids filling unknowns and silent provider fallback', () => {
  const c = contract();
  assert.ok(c.includes('explicit `UNKNOWN` is preserved, not filled'));
  assert.ok(c.includes('no external provider fallback may silently replace a rejected Scout class'));
  assert.ok(c.includes('weather/news absence cannot be substituted into these three classes'));
});