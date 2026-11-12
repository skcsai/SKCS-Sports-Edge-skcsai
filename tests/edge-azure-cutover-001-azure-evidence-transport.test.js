'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { readPrivateBlob } = require('../lib/azurePrivateBlob');
const {
  loadWebsiteSnapshotFromAzureBytes,
  SOURCE_HASH,
  BATCH_HASH
} = require('../lib/nationsLeagueWebsiteSnapshot');

function makeCombinedSnapshot() {
  const fixtures = [];

  for (let i = 0; i < 38; i++) {
    fixtures.push({
      fixture_id: `CANARY:API_SPORTS_FOOTBALL:5:2026:${100000 + i}`,
      provider_fixture_id: 100000 + i,
      home_team: `Home ${i}`,
      away_team: `Away ${i}`,
      competition: 'UEFA Nations League',
      kickoff_at: '2026-11-18T18:00:00.000Z',
      status: 'SAVED_PREMATCH',
      hold_reason: null,
      resolution_status: 'pending',
      market: '1X2',
      prediction: 'home_win',
      confidence_pct: 60,
      raw_top_probability_pct: 60,
      outcome_probabilities_pct: { home_win: 60, draw: 20, away_win: 20 },
      committed_at: '2026-11-12T05:00:00.000Z',
      persisted_at: '2026-11-12T05:10:00.000Z'
    });
  }

  for (let i = 0; i < 14; i++) {
    fixtures.push({
      fixture_id: `CANARY:API_SPORTS_FOOTBALL:5:2026:${200000 + i}`,
      provider_fixture_id: 200000 + i,
      home_team: `Held Home ${i}`,
      away_team: `Held Away ${i}`,
      competition: 'UEFA Nations League',
      kickoff_at: '2026-11-19T18:00:00.000Z',
      status: 'HELD',
      hold_reason: i < 4
        ? 'INSUFFICIENT_COMPLETED_MATCH_HISTORY'
        : 'BELOW_MINIMUM_CONFIDENCE',
      resolution_status: null
    });
  }

  return {
    schema_version: 'soccer-website-evidence-v1',
    project_id: 'SOCCER-WEB-001',
    source_project_id: 'SOCCER-UNL-001',
    test_only: true,
    calibrated: false,
    continuously_updated: false,
    source_observed_at: '2026-11-12T01:00:00.000Z',
    predictions_saved_at: '2026-11-12T05:10:00.000Z',
    source_sha256: SOURCE_HASH,
    prediction_batch_sha256: BATCH_HASH,
    counts: {
      archived: 156,
      historical_evidence_only: 104,
      upcoming_at_cutoff: 52,
      saved_prematch: 38,
      held_history: 4,
      held_confidence: 10
    },
    fixtures
  };
}

test('Azure combined snapshot is hash pinned and structurally governed', () => {
  const bytes = Buffer.from(JSON.stringify(makeCombinedSnapshot()));
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');

  const view = loadWebsiteSnapshotFromAzureBytes(bytes, sha);
  assert.equal(view.fixtures.length, 52);
  assert.equal(view.counts.saved_prematch, 38);
  assert.throws(
    () => loadWebsiteSnapshotFromAzureBytes(bytes, '0'.repeat(64)),
    /hash mismatch/
  );
});

test('Azure private Blob reader uses managed identity and bounds bytes', async () => {
  const before = {
    endpoint: process.env.IDENTITY_ENDPOINT,
    header: process.env.IDENTITY_HEADER,
    client: process.env.AZURE_EVIDENCE_CLIENT_ID
  };
  process.env.IDENTITY_ENDPOINT = 'http://127.0.0.1:42356/msi/token';
  process.env.IDENTITY_HEADER = 'test-header';
  process.env.AZURE_EVIDENCE_CLIENT_ID = '00000000-0000-0000-0000-000000000001';

  const calls = [];
  const payload = Buffer.from('sealed-evidence');
  const fakeFetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (calls.length === 1) {
      return new Response(JSON.stringify({ access_token: 'x'.repeat(128) }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    return new Response(payload, {
      status: 200,
      headers: { 'content-length': String(payload.length) }
    });
  };

  try {
    const bytes = await readPrivateBlob({
      account: 'stskcsedge036zan001',
      container: 'verification-evidence',
      blob: 'edge-azure-cutover-001/2026-11-12/test.json',
      maxBytes: 64
    }, fakeFetch);

    assert.equal(bytes.toString('utf8'), 'sealed-evidence');
    assert.match(calls[0].url, /resource=https%3A%2F%2Fstorage\.azure\.com%2F/);
    assert.match(
      calls[1].url,
      /stskcsedge036zan001\.blob\.core\.windows\.net\/verification-evidence\/edge-azure-cutover-001/
    );
    assert.equal(calls[1].options.headers.Authorization, 'Bearer ' + 'x'.repeat(128));
  } finally {
    if (before.endpoint === undefined) delete process.env.IDENTITY_ENDPOINT;
    else process.env.IDENTITY_ENDPOINT = before.endpoint;
    if (before.header === undefined) delete process.env.IDENTITY_HEADER;
    else process.env.IDENTITY_HEADER = before.header;
    if (before.client === undefined) delete process.env.AZURE_EVIDENCE_CLIENT_ID;
    else process.env.AZURE_EVIDENCE_CLIENT_ID = before.client;
  }
});

test('Docker context and Express route include governed evidence runtime', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const dockerignore = fs.readFileSync(path.join(projectRoot, '.dockerignore'), 'utf8');
  const server = fs.readFileSync(path.join(projectRoot, 'backend', 'server-express.js'), 'utf8');

  assert.doesNotMatch(dockerignore, /^lib\/$/m);
  assert.match(
    server,
    /app\.all\('\/api\/evidence\/nations-league',\s*nationsLeagueEvidenceHandler\)/
  );
});
