// UI2 static acceptance is preserved against its frozen fixture. The active evidence page is covered by nations-league-website.test.js.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const FRONTEND_FILES = [
  'tests/fixtures/sports-match-hub-ui2.html',
  'public/css/sports-match-hub.css',
  'public/js/sports-match-hub.js',
  'public/js/sports-match-hub-mock-data.js'
];

const PACKET_PATH =
  'control-center/SEM-GOV-001D-UI2_STATIC_SPORTS_MATCH_HUB_IMPLEMENTATION_PACKET.v1.md';

const DAY_TOKENS = [
  'TODAY',
  'DAY_2',
  'DAY_3',
  'DAY_4',
  'DAY_5',
  'DAY_6',
  'DAY_7',
  'DAY_8'
];

const STATE_MAP = {
  VISIBLE: 'Listed',
  UNDER_REVIEW: 'Under Review',
  HELD: 'On Hold',
  ELIMINATED: 'Not Publishing',
  FINAL_APPROVED: 'Review Complete',
  CANCELLED: 'Cancelled',
  POSTPONED: 'Postponed',
  ARCHIVED: 'Archived'
};

const STAGE_MAP = {
  ADMITTED: 'Fixture Admitted',
  EVIDENCE_REVIEW: 'Evidence Review',
  CONTEXT_REVIEW: 'Context Review',
  STABILITY_REVIEW: 'Stability Review',
  PUBLICATION_REVIEW: 'Publication Review',
  FINAL_DECISION: 'Final Decision'
};

const PROHIBITED_MOCK_FIELDS = [
  'fixture_uid',
  'confidence',
  'probability',
  'risk_tier',
  'riskTier',
  'scout',
  'transition_version',
  'reason_detail_safe'
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function readJson(rel) {
  return JSON.parse(read(rel));
}

test('UI2 frontend files exist and page references approved assets only', () => {
  for (const rel of FRONTEND_FILES) {
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing ${rel}`);
  }
  const html = read('tests/fixtures/sports-match-hub-ui2.html');
  assert.match(html, /sports-match-hub\.css/);
  assert.match(html, /sports-match-hub-mock-data\.js/);
  assert.match(html, /sports-match-hub\.js/);
  assert.doesNotMatch(html, /smh-hub\.js/);
  assert.doesNotMatch(html, /\/api\//);
  assert.doesNotMatch(html, /output\.css/);
});

test('mock data exposes canonical day tokens without DAY_1', () => {
  const src = read('public/js/sports-match-hub-mock-data.js');
  assert.doesNotMatch(src, /\bDAY_1\b/);
  for (const token of DAY_TOKENS) {
    const count = (src.match(new RegExp("'" + token + "'", 'g')) || []).length;
    assert.ok(count >= 1, `expected ${token} in mock authority`);
  }
  assert.match(src, /Africa\/Johannesburg/);
  assert.match(src, /Day 2/);
  assert.match(src, /getLifecycleFunnel/);
  assert.match(src, /getMovementSummary/);
  assert.match(src, /getDayNarrative/);
});

test('lifecycle state and stage mappings match UI1 contract', () => {
  const mockSrc = read('public/js/sports-match-hub-mock-data.js');
  for (const [code, label] of Object.entries(STATE_MAP)) {
    assert.match(mockSrc, new RegExp(code + ": '" + label.replace(/'/g, "\\'") + "'"));
  }
  for (const [code, label] of Object.entries(STAGE_MAP)) {
    assert.match(mockSrc, new RegExp(code + ": '" + label.replace(/'/g, "\\'") + "'"));
  }
});

test('UI2 JavaScript has no network, API, or Supabase callers', () => {
  const js = read('public/js/sports-match-hub.js');
  const mock = read('public/js/sports-match-hub-mock-data.js');
  for (const src of [js, mock]) {
    assert.doesNotMatch(src, /\bfetch\s*\(/);
    assert.doesNotMatch(src, /XMLHttpRequest/);
    assert.doesNotMatch(src, /supabase/i);
    assert.doesNotMatch(src, /\/api\//);
  }
});

test('mock fixtures exclude prohibited internal fields', () => {
  const mock = read('public/js/sports-match-hub-mock-data.js');
  for (const field of PROHIBITED_MOCK_FIELDS) {
    assert.doesNotMatch(mock, new RegExp('\\b' + field + '\\b'));
  }
  assert.match(mock, /public_fixture_id/);
});

test('hub page includes required landmarks and ARIA structures', () => {
  const html = read('tests/fixtures/sports-match-hub-ui2.html');
  assert.match(html, /<header\b/);
  assert.match(html, /<nav\b/);
  assert.match(html, /<main\b/);
  assert.match(html, /<footer\b/);
  assert.match(html, /<h1\b/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /aria-live/);
  assert.match(html, /id="lifecycle-funnel"/);
  assert.match(html, /id="movement-counters"/);
  assert.match(html, /id="edgemind-panel"/);
  assert.match(html, /id="lifecycle-legend"/);
  const js = read('public/js/sports-match-hub.js');
  assert.match(js, /<time datetime=/);
  assert.match(js, /renderFunnel/);
  assert.match(js, /renderFixtureTable/);
});

test('dark dashboard visual contract is present in HTML and CSS', () => {
  const html = read('tests/fixtures/sports-match-hub-ui2.html');
  const css = read('public/css/sports-match-hub.css');
  assert.match(html, /smh-dashboard/);
  assert.match(html, /smh-control-strip/);
  assert.match(html, /data-control="1"/);
  assert.match(html, /data-control="4"/);
  assert.match(html, /smh-funnel-panel/);
  assert.match(html, /smh-guide-rail/);
  assert.doesNotMatch(html, /smh-context/);
  assert.doesNotMatch(css, /\.fixture-grid/);
  assert.match(css, /\.fixture-table/);
  assert.match(css, /--smh-bg:\s*#/);
  assert.match(css, /body\.smh-page[\s\S]*background:\s*var\(--smh-bg\)/);
  assert.doesNotMatch(css, /background:\s*#fff/);
  assert.doesNotMatch(css, /background:\s*#f4f7fb/);
});

test('index.html links to Sports Match Hub', () => {
  const index = read('public/index.html');
  assert.match(index, /href="sports-match-hub\.html"/);
  assert.match(index, /Open Sports Match Hub/);
  assert.doesNotMatch(index, /sports-match-hub\.js/);
});

test('UI2 packet and ledger register IN PROGRESS with blocked gates', () => {
  const packet = read(PACKET_PATH);
  assert.match(packet, /SEM-GOV-001D-UI2/);
  assert.match(packet, /81b618f2a4db1a105ba5cf28e716e06d60c0b156/);
  assert.match(packet, /IN PROGRESS|TESTED/);
  assert.match(packet, /NOT APPLIED/i);
  assert.match(packet, /UI3.*NOT STARTED/i);
  assert.match(packet, /UI4.*NOT STARTED/i);

  const ledger = readJson('control-center/EDGE_BUILD_CONTROL_LEDGER.v1.json');
  const task = ledger.tasks.find((t) => t.task_id === 'SEM-GOV-001D-UI2');
  assert.ok(task);
  assert.equal(ledger.scout_edge_marriage_gate, 'BLOCKED');
  assert.equal(ledger.supabase_storage_gate, 'BLOCKED');
  assert.equal(ledger.unified_lifecycle_governor, 'BLOCKED');
});

test('project register mirrors SEM-GOV-001D-UI2', () => {
  const register = readJson('control-center/EDGE_MASTER_PROJECT_REGISTER.v1.json');
  const project = register.projects.find((p) => p.project_id === 'SEM-GOV-001D-UI2');
  assert.ok(project);
  assert.match(project.current_status, /IN PROGRESS|TESTED/);
});
