'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

let dbCalls = 0;
function blockedDbCall() {
  dbCalls += 1;
  throw new Error('EPI_D1_R1_TEST_DB_CALL_FORBIDDEN');
}

function installStub(relativePath, exportsValue) {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: exportsValue,
    children: [],
    paths: []
  };
}

installStub('../backend/db.js', {
  query: blockedDbCall,
  withTransaction: blockedDbCall
});
installStub('../backend/database.js', {
  pool: { query: blockedDbCall, connect: blockedDbCall },
  query: blockedDbCall,
  withTransaction: blockedDbCall
});
installStub('../backend/core/verificationController.js', Object.freeze({
  evaluateControlPlane() {
    return {
      state: 'HEALTHY',
      healthScore: 100,
      reasons: [],
      actions: { quarantine: false, allowPublish: true, allowEnrichment: false, capConfidence: false }
    };
  }
}));
installStub('../backend/services/aiProvider.js', {
  isDolphinAvailable: async () => false,
  analyzeWithDolphin: async () => { throw new Error('E2E_X1_DOLPHIN_FORBIDDEN'); }
});

const { mapToEdgeAnalysisEnvelope } = require('../backend/services/fipIntakeService');
const { validateRawPredictionInput } = require('../backend/utils/validation');
const {
  buildGovernedFipProvenanceMetadata,
  buildRawPredictionFromProviderItem
} = require('../backend/services/aiPipeline').__test;
const { scoreMatch } = require('../backend/services/aiScoring');

const REQUIRED = [
  'fip_id',
  'fip_schema_version',
  'validation_hash',
  'validation_validated_at',
  'scout_run_id',
  'intake_id',
  'idempotency_key'
];

function canonicalFip() {
  return {
    fip_id: 'scout-fip-d1-r1-001',
    fip_schema_version: '1.0.0',
    validation: {
      status: 'VALID',
      hash: 'a'.repeat(64),
      hash_algorithm: 'sha256',
      validated_at: '2026-11-07T18:00:00.000Z'
    },
    scout: { fixture_id: 'fixture-001' },
    provenance: {
      scout_run_id: 'scout-run-001',
      source_system: 'SCOUT'
    },
    fixture: {
      sport: 'football',
      league_id: '39',
      league: 'Premier League',
      kickoff_utc: '2026-11-08T16:30:00.000Z',
      status: 'NS',
      home_team: { id: '1', name: 'Home FC' },
      away_team: { id: '2', name: 'Away FC' },
      country: 'England'
    },
    markets: {
      direct_1x2: { home: 2.1, draw: 3.2, away: 3.5 }
    },
    context: {}
  };
}

function intakeEvidence() {
  return {
    idempotency_key: 'b'.repeat(64),
    intake_id: 'efi-d1-r1-001',
    governed_mode: 'PROOF_FIXTURE',
    scout_edge_marriage_gate: 'BLOCKED',
    supabase_storage_gate: 'BLOCKED'
  };
}

function completeScoutItem() {
  const envelope = mapToEdgeAnalysisEnvelope(canonicalFip(), intakeEvidence());
  return {
    ...envelope,
    metadata: {
      ...envelope.metadata,
      fip_body: { forbidden: true },
      raw_fip: { forbidden: true },
      scout_evidence: ['forbidden'],
      provider_payload: { forbidden: true },
      secret_values: ['forbidden']
    }
  };
}

test.after(() => {
  assert.equal(dbCalls, 0, 'D1/R1 focused proof must not contact a database');
});

test('EFI envelope exposes the complete minimal R1 provenance reference', () => {
  const envelope = mapToEdgeAnalysisEnvelope(canonicalFip(), intakeEvidence());
  assert.equal(envelope.metadata.sports_truth_origin, 'SCOUT_FIP');
  assert.equal(envelope.metadata.fip_id, 'scout-fip-d1-r1-001');
  assert.equal(envelope.metadata.fip_schema_version, '1.0.0');
  assert.equal(envelope.metadata.validation_hash, 'a'.repeat(64));
  assert.equal(envelope.metadata.validation_validated_at, '2026-11-07T18:00:00.000Z');
  assert.equal(envelope.metadata.scout_run_id, 'scout-run-001');
  assert.equal(envelope.metadata.intake_id, 'efi-d1-r1-001');
  assert.equal(envelope.metadata.idempotency_key, 'b'.repeat(64));
});

test('SCOUT_FIP D1 provenance is an exact whitelist and excludes forbidden payload fields', () => {
  const item = completeScoutItem();
  const actual = buildGovernedFipProvenanceMetadata(item);
  assert.deepEqual(actual, {
    sports_truth_origin: 'SCOUT_FIP',
    fip_id: 'scout-fip-d1-r1-001',
    fip_schema_version: '1.0.0',
    validation_hash: 'a'.repeat(64),
    validation_validated_at: '2026-11-07T18:00:00.000Z',
    scout_run_id: 'scout-run-001',
    intake_id: 'efi-d1-r1-001',
    idempotency_key: 'b'.repeat(64)
  });
  for (const forbidden of ['fip_body', 'raw_fip', 'scout_evidence', 'provider_payload', 'secret_values']) {
    assert.equal(Object.prototype.hasOwnProperty.call(actual, forbidden), false, forbidden);
  }
});

test('SCOUT_FIP D1 provenance fails closed when any required R1 field is missing', () => {
  for (const field of REQUIRED) {
    const item = completeScoutItem();
    item.metadata[field] = '';
    assert.throws(
      () => buildGovernedFipProvenanceMetadata(item),
      (error) => error && error.code === 'EPI_D1_R1_PROVENANCE_INCOMPLETE' && error.missing_fields.includes(field),
      field
    );
  }
});

test('provider and non-Scout inputs receive no invented FIP provenance', () => {
  assert.deepEqual(buildGovernedFipProvenanceMetadata({ metadata: { provider: 'legacy-provider' } }), {});
  assert.deepEqual(
    buildGovernedFipProvenanceMetadata({
      metadata: {
        sports_truth_origin: 'PROVIDER',
        fip_id: 'must-not-propagate',
        validation_hash: 'must-not-propagate'
      }
    }),
    {}
  );
});

test('existing raw prediction validation accepts D1 metadata with minimal R1 provenance', () => {
  const metadata = buildGovernedFipProvenanceMetadata(completeScoutItem());
  assert.doesNotThrow(() => validateRawPredictionInput({
    match_id: 'fixture-001',
    sport: 'Football',
    market: '1X2',
    prediction: 'home_win',
    confidence: 67,
    volatility: 'medium',
    odds: 2.1,
    metadata
  }));
});


test('Scout sharp odds use the existing odds scoring law instead of generic fallback', async () => {
  const scored = await scoreMatch({
    match_id: 'scout-odds-001',
    home_team: 'Home FC',
    away_team: 'Away FC',
    sharp_odds: { home: 2.1, draw: 3.2, away: 3.5 }
  });
  assert.equal(scored.source, 'odds');
  assert.equal(scored.winner, 'home');
  assert.ok(scored.confidence > 50);
});

test('non-Scout no-signal scoring preserves the existing generic fallback', async () => {
  const scored = await scoreMatch({
    match_id: 'provider-empty-001',
    home_team: 'Home FC',
    away_team: 'Away FC'
  });
  assert.deepEqual(scored, { confidence: 58, volatility: 'high', winner: 'home', source: 'fallback' });
});

test('Scout FIP without governed prediction signal abstains instead of fabricating a 58% home win', async () => {
  const item = completeScoutItem();
  item.data_mode = 'scout_fip';
  item.sharp_odds = { home: null, draw: null, away: null };
  item.match_info.home_team = 'Crystal Palace';
  item.match_info.away_team = 'Liverpool';
  item.match_info.match_id = 'FIXT_cbf67cd74c69e3843b83';
  item.metadata.sports_truth_origin = 'SCOUT_FIP';

  const result = await buildRawPredictionFromProviderItem(item);
  assert.equal(result.rejected, true);
  assert.equal(result.reason, 'insufficient_governed_prediction_signal');
  assert.equal(result.rejection_code, 'EPI_D1_GOVERNED_SIGNAL_REQUIRED');
  assert.equal(result.scoring_source, 'fallback');
});
