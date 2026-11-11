'use strict';

const { createHash } = require('node:crypto');
const { DEFAULT_MAX_FIP_BYTES } = require('./fipIntakeService');
const { computeSubmittedBodyHash } = require('./fipIntakeM2MAuthenticator');

const SCHEMA_VERSION = 'scout-context-proof-manifest-v1';
const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024;
const DIGEST = /^[a-f0-9]{64}$/;

function validManifest(manifest) {
  const fields = ['evidence_bytes', 'evidence_sha256', 'handoff_sha256',
    'schema_version', 'source_package_sha256'];
  return Object.keys(manifest).sort().join(',') === fields.join(',') &&
    [manifest.evidence_sha256, manifest.handoff_sha256, manifest.source_package_sha256]
      .every(value => typeof value === 'string' && DIGEST.test(value)) &&
    Number.isSafeInteger(manifest.evidence_bytes) &&
    manifest.evidence_bytes > 0 && manifest.evidence_bytes <= MAX_EVIDENCE_BYTES &&
    Buffer.byteLength(JSON.stringify(manifest)) <= DEFAULT_MAX_FIP_BYTES;
}

async function readVerifiedProof(manifest, readEvidence, receivedAt) {
  // The reader receives a digest and a hard byte limit, never an input path or URL.
  const bytes = await readEvidence(manifest.evidence_sha256, manifest.evidence_bytes);
  if (bytes == null) {
    throw new Error('SCOUT_CONTEXT_PROOF_EVIDENCE_UNAVAILABLE');
  }
  if (!Buffer.isBuffer(bytes) || bytes.length !== manifest.evidence_bytes ||
      createHash('sha256').update(bytes).digest('hex') !== manifest.evidence_sha256) {
    throw new Error('SCOUT_CONTEXT_PROOF_EVIDENCE_MISMATCH');
  }

  const { handoff, provenance } = JSON.parse(bytes.toString('utf8'));
  if (handoff?.schema_version !== 'CC-NSCS-037-edge-context-handoff-v2' ||
      handoff.source_package_sha256 !== manifest.source_package_sha256 ||
      handoff.handoff_sha256 !== manifest.handoff_sha256 ||
      handoff.fixture?.sport !== 'football' || handoff.fixture?.competition_id !== 39 ||
      handoff.calculation_owner !== 'SCOUT' ||
      handoff.consumer_policy !== 'EDGE_CONSUME_NO_RECOMPUTE' ||
      handoff.read_only_consumer !== true ||
      ['runtime_handoff', 'prediction_execution', 'edge_publish', 'odds']
        .some(field => handoff[field] !== false) ||
      !Array.isArray(handoff.players) || !Array.isArray(provenance?.sources)) {
    throw new Error('SCOUT_CONTEXT_PROOF_EVIDENCE_INVALID');
  }

  const { handoff_sha256: handoffHash, ...handoffBody } = handoff;
  if (computeSubmittedBodyHash(handoffBody) !== handoffHash ||
      computeSubmittedBodyHash(provenance) !== handoff.provenance_sha256) {
    throw new Error('SCOUT_CONTEXT_PROOF_EVIDENCE_MISMATCH');
  }

  const cutoff = Date.parse(handoff.prediction_cutoff);
  const generated = Date.parse(handoff.generated_at);
  const received = Date.parse(receivedAt);
  const kickoff = Date.parse(handoff.fixture.kickoff_at);
  if (!(cutoff <= generated && generated <= received && received < kickoff) ||
      handoff.players.some(player => player.history_status === 'VERIFIED_HISTORY' &&
        !(Date.parse(player.available_at) <= cutoff))) {
    throw new Error('SCOUT_CONTEXT_PROOF_TIME_INVALID');
  }

  return { handoff, provenance };
}

module.exports = { SCHEMA_VERSION, validManifest, readVerifiedProof };
