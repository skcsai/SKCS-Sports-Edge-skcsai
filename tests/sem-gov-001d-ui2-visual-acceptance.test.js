// UI2 static acceptance is preserved against its frozen fixture. The active evidence page is covered by nations-league-website.test.js.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'tests/fixtures/sports-match-hub-ui2.html');
const CSS_PATH = path.join(ROOT, 'public/css/sports-match-hub.css');
const JS_PATH = path.join(ROOT, 'public/js/sports-match-hub.js');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, minColumns: 2 },
  { name: 'tablet', width: 768, minColumns: 1 },
  { name: 'mobile', width: 390, minColumns: 1 }
];

const UI_STATES = [
  'normal',
  'empty',
  'stale',
  'unavailable',
  'detail'
];

const STAGE_LABELS = [
  'Fixture Admitted',
  'Evidence Review',
  'Context Review',
  'Stability Review',
  'Publication Review',
  'Final Decision'
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('CSS defines dark dashboard shell and touch targets', () => {
  const css = read('public/css/sports-match-hub.css');
  assert.match(css, /\.smh-dashboard/);
  assert.match(css, /\.smh-control-strip/);
  assert.match(css, /\.smh-funnel/);
  assert.match(css, /\.smh-movement/);
  assert.match(css, /\.smh-edgemind-panel/);
  assert.match(css, /\.smh-legend/);
  assert.match(css, /\.fixture-table/);
  assert.match(css, /min-height:\s*var\(--smh-touch\)/);
  assert.match(css, /--smh-touch:\s*44px/);
  assert.match(css, /@media \(max-width: 1199px\)/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css, /\.fixture-grid/);
  assert.doesNotMatch(css, /background:\s*#fff/);
});

test('HTML defines four numbered control groups and dashboard regions', () => {
  const html = read('tests/fixtures/sports-match-hub-ui2.html');
  assert.match(html, /data-control="1"/);
  assert.match(html, /data-control="2"/);
  assert.match(html, /data-control="3"/);
  assert.match(html, /data-control="4"/);
  assert.match(html, /id="day-tabs"/);
  assert.match(html, /id="lifecycle-funnel"/);
  assert.match(html, /id="movement-counters"/);
  assert.match(html, /id="edgemind-panel"/);
  assert.match(html, /id="lifecycle-legend"/);
  assert.match(html, /Rolling 8-Day Window/i);
  assert.match(html, /Lifecycle State/i);
});

test('HTML supports viewport states via query parameters', () => {
  const html = read('tests/fixtures/sports-match-hub-ui2.html');
  assert.match(html, /ui-state-demo/);
  for (const state of ['loading', 'empty', 'stale', 'unavailable', 'error']) {
    assert.match(html, new RegExp('value="' + state + '"'));
  }
});

test('JavaScript implements detail view, funnel, EdgeMind and filter URL state', () => {
  const js = read('public/js/sports-match-hub.js');
  assert.match(js, /readState/);
  assert.match(js, /writeState/);
  assert.match(js, /renderDetail/);
  assert.match(js, /renderFunnel/);
  assert.match(js, /renderMovement/);
  assert.match(js, /renderEdgeMind/);
  assert.match(js, /renderLegend/);
  assert.match(js, /renderFixtureTable/);
  assert.match(js, /DEBOUNCE_MS\s*=\s*300/);
  assert.match(js, /MIN_SEARCH\s*=\s*2/);
  assert.match(js, /ArrowRight/);
  assert.match(js, /closeDetail/);
});

test('six lifecycle stages and six movement counters are rendered in JS', () => {
  const js = read('public/js/sports-match-hub.js');
  const mock = read('public/js/sports-match-hub-mock-data.js');
  for (const label of STAGE_LABELS) {
    assert.match(mock, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(js, /MOVEMENT_LABELS/);
  assert.match(js, /getLifecycleFunnel/);
  assert.match(js, /getMovementSummary/);
});

test('fixture table headers and mobile card treatment are defined', () => {
  const js = read('public/js/sports-match-hub.js');
  const css = read('public/css/sports-match-hub.css');
  assert.match(js, /Status \/ EdgeMind BOT Summary/);
  assert.match(js, /data-label=/);
  assert.match(css, /\.fixture-table thead/);
  assert.match(css, /\.fixture-table tr/);
  assert.match(css, /data-label/);
});

for (const vp of VIEWPORTS) {
  test(`static structure supports ${vp.name} viewport (${vp.width}px)`, () => {
    const html = read('tests/fixtures/sports-match-hub-ui2.html');
    const css = read('public/css/sports-match-hub.css');
    assert.match(html, /viewport/);
    if (vp.width <= 767) {
      assert.match(css, /smh-nav-toggle/);
      assert.match(css, /grid-template-columns:\s*1fr/);
      assert.match(css, /\.fixture-table thead[\s\S]*display:\s*none/);
    }
    if (vp.width >= 1200) {
      assert.match(css, /smh-main-grid/);
      assert.match(css, /smh-guide-rail/);
    }
    if (vp.width <= 960) {
      assert.match(css, /smh-main-grid[\s\S]*grid-template-columns:\s*1fr/);
    }
  });
}

for (const state of UI_STATES) {
  test(`UI state "${state}" is representable in static demo`, () => {
    const html = read('tests/fixtures/sports-match-hub-ui2.html');
    const js = read('public/js/sports-match-hub.js');
    if (state === 'detail') {
      assert.match(js, /detail/);
      assert.match(js, /fixture-detail/);
      return;
    }
    if (state === 'normal') {
      assert.match(js, /filterFixtures/);
      return;
    }
    assert.match(html, new RegExp('value="' + state + '"'));
    assert.match(js, new RegExp("ui === '" + state + "'|uiState"));
  });
}

test('fixture detail preserves back navigation contract', () => {
  const js = read('public/js/sports-match-hub.js');
  assert.match(js, /closeDetail/);
  assert.match(js, /lastFocusedCard/);
  assert.match(js, /Back to fixtures/);
});

test('no horizontal overflow guards in mobile CSS', () => {
  const css = read('public/css/sports-match-hub.css');
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /min-width:\s*0/);
});

test('visual contract prevents light-page and card-grid regression', () => {
  const html = read('tests/fixtures/sports-match-hub-ui2.html');
  const css = read('public/css/sports-match-hub.css');
  assert.doesNotMatch(html, /class="smh-context"/);
  assert.doesNotMatch(html, /class="smh-filters filter-sheet"/);
  assert.doesNotMatch(css, /\.smh-filters/);
  assert.doesNotMatch(css, /\.fixture-grid/);
  assert.doesNotMatch(css, /--smh-bg:\s*#f4f7fb/);
  assert.match(css, /\.smh-funnel-panel/);
  assert.match(css, /\.smh-edgemind-panel/);
  assert.match(css, /\.smh-legend-panel/);
});
