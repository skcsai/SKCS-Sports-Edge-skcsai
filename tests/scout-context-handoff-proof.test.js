'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createGovernedFipIntakeComposition } = require('../backend/services/governedFipIntakeComposition');
const { buildSigningPayload, computeSignature, computeSubmittedBodyHash } =
  require('../backend/services/fipIntakeM2MAuthenticator');
const { DEFAULT_MAX_FIP_BYTES } = require('../backend/services/fipIntakeService');
const { runEdgeD1Proof, runSealedEdgeD1Proof, verifyEdgeD1Seal, createEdgeD1ComparisonProof, runPendingEdgeD1Proof } = require('../backend/services/edgeD1Proof');

const scout = process.env.SKCS_SCOUT_PROOF_ROOT;
const fixturePath = 'evidence/cc-nscs-034/crystal-palace-liverpool-20261108.json';
const handoffPath = 'evidence/cc-nscs-037/context-handoff-v2-20261107.json';
const packageSha = '153684f6d7511ce653d26e490c8f507b0a7e0ad23d834d84671d9adea5a65912';
const secret = 'isolated-test-secret';
const caller = 'scout-p0-proof';
const timestamp = '2026-11-06T12:01:00.000Z';
const proofMode = 'PROOF_FIXTURE';

test('real Scout context handoff through governed Edge intake', {
  skip: scout ? false : 'Set SKCS_SCOUT_PROOF_ROOT to the pinned Scout proof checkout.',
}, async t => {
  const source = require(path.resolve(scout, fixturePath));
  const handoff = require(path.resolve(scout, handoffPath));
  const { buildContextHandoffProof } = require(path.resolve(scout, 'edge/consume_scout_match_package.js'));
  const { manifest, evidence } = buildContextHandoffProof(source, handoff, { expectedPackageSha256: packageSha });
  assert.ok(Buffer.byteLength(JSON.stringify(manifest)) < DEFAULT_MAX_FIP_BYTES);
  assert.ok(evidence.length > DEFAULT_MAX_FIP_BYTES);

  let sequence = 0;
  function signed(payload = manifest, governedMode = proofMode, time = timestamp) {
    const nonce = 'scout-p0-proof-nonce-' + ++sequence;
    const bodyHash = computeSubmittedBodyHash(payload);
    const signingPayload = buildSigningPayload({ callerIdentityRef: caller, governedMode, timestamp: time, nonce, bodyHash });
    return { caller, governedMode, auth: { timestamp: time, nonce, bodyHash, signature: computeSignature({ secret, signingPayload }) } };
  }

  function setup(readEvidence, now = timestamp) {
    const nonces = new Set();
    const unexpected = () => assert.fail('Proof must not access the database or persistence');
    return createGovernedFipIntakeComposition({
      db: { query: unexpected, withTransaction: unexpected },
      gateReader: { readGates: async () => ({ scoutEdgeMarriageGate: 'BLOCKED', supabaseStorageGate: 'BLOCKED' }) },
      governor: {},
      clock: { now: () => now },
      intakeIdGenerator: unexpected,
      secretResolver: { getSecretForCaller: async identity => identity === caller ? secret : null },
      nonceStore: {
        hasNonce: async ({ nonce }) => nonces.has(nonce),
        reserveNonce: async ({ nonce }) => nonces.add(nonce),
      },
      featureFlagEnabled: true,
      readContextProofEvidence: readEvidence,
    });
  }

  await t.test('preserves all Scout features and provenance, with no downstream writes', async () => {
    const composition = setup(async (digest, limit) => {
      assert.equal(digest, manifest.evidence_sha256);
      assert.equal(limit, evidence.length);
      return evidence;
    });
    const auth = signed();
    const first = await composition.receiveValidatedFip(manifest, auth);
    assert.equal(first.accepted, true);
    assert.deepEqual(first.context_handoff, handoff);
    assert.deepEqual(first.scout_provenance, source.provenance);
    assert.equal(first.context_handoff.players.length, 60);
    assert.equal(first.context_handoff.players.filter(player => player.history_status === 'NO_VERIFIED_HISTORY').length, 9);
    assert.equal(first.context_handoff.context.availability.home[0].availability_status, 'UNKNOWN');
    assert.equal(first.envelope, null);
    assert.deepEqual(first.downstream_calls, { identity: 0, lifecycle: 0, d3: 0, evidence: 0 });
    const repeat = await composition.receiveValidatedFip(manifest, signed());
    assert.equal(repeat.idempotency_key, first.idempotency_key);
    assert.equal((await composition.receiveValidatedFip(manifest, auth)).rejection_code, 'FIP_AUTH_REPLAY_DETECTED');
  });

  await t.test('denies unconfigured, production, tampered and unauthenticated manifests before evidence access', async () => {
    let reads = 0;
    const composition = setup(async () => { reads += 1; });
    const badSignature = signed();
    badSignature.auth.signature = '0'.repeat(64);
    const cases = [
      [setup(), manifest, signed(), 'FIP_INTAKE_UNAUTHORIZED'],
      [composition, manifest, signed(manifest, 'AUTHORIZED_PRODUCTION'), 'FIP_INTAKE_UNAUTHORIZED'],
      [composition, manifest, badSignature, 'FIP_AUTH_SIGNATURE_INVALID'],
      [composition, { ...manifest, handoff_sha256: '0'.repeat(64) }, signed(), 'FIP_AUTH_BODY_HASH_MISMATCH'],
      [composition, { ...manifest, evidence_bytes: 9 * 1024 * 1024 }, signed(), 'FIP_PAYLOAD_INVALID'],
    ];
    for (const [intake, payload, auth, code] of cases) {
      assert.equal((await intake.receiveValidatedFip(payload, auth)).rejection_code, code);
    }
    assert.equal(reads, 0);
  });

  await t.test('denies unavailable, altered, and out-of-window evidence', async () => {
    const altered = Buffer.from(evidence);
    altered[0] ^= 1;
    assert.equal((await setup(async () => null).receiveValidatedFip(manifest, signed())).rejection_code,
      'SCOUT_CONTEXT_PROOF_EVIDENCE_UNAVAILABLE');
    assert.equal((await setup(async () => altered).receiveValidatedFip(manifest, signed())).rejection_code,
      'SCOUT_CONTEXT_PROOF_EVIDENCE_MISMATCH');
    const late = handoff.fixture.kickoff_at;
    assert.equal((await setup(async () => evidence, late).receiveValidatedFip(manifest, signed(manifest, proofMode, late))).rejection_code,
      'SCOUT_CONTEXT_PROOF_TIME_INVALID');
  });

  await t.test('Edge D1 independently reproduces the verified historical pick and Double Chance', async () => {
    const composition = setup(async () => evidence);
    const result = await runEdgeD1Proof(composition, manifest, signed());
    assert.equal(result.scope, 'LOCAL_HISTORICAL_PROOF_ONLY');
    assert.equal(result.fixture_id, handoff.fixture.canonical_fixture_id);
    assert.deepEqual(result.provenance, {
      source_package_sha256: packageSha,
      handoff_sha256: handoff.handoff_sha256,
      evidence_sha256: manifest.evidence_sha256
    });
    assert.deepEqual(result.rulebook, { id: 'SKCS_SHARED_D1_RULEBOOK_V2',
      sha256: '9aaeccc92f8be4598ac88c6cafb2a7975ce2b0db13c5d816a2855a2af01ad22c' });
    assert.equal(result.decision.outcome, 'away_win');
    assert.equal(result.decision.confidence_pct, 60.53);
    assert.deepEqual(result.decision.probabilities_pct, { home_win: 17.02, draw: 22.45, away_win: 60.53 });
    assert.deepEqual(result.decision.secondary_double_chance, {
      market: 'double_chance_x2', probability_pct: 82.98, confidence_pct: 74
    });
    assert.deepEqual(await runEdgeD1Proof(composition, manifest, signed()), result);
  });

  await t.test('Edge seals its exact historical prediction with a deterministic ID and timestamp', async () => {
    const composition = setup(async () => evidence);
    const clock = { now: () => timestamp };
    const first = await runSealedEdgeD1Proof(composition, manifest, signed(), clock);
    const second = await runSealedEdgeD1Proof(composition, manifest, signed(), clock);
    const originalId = first.seal.commitment_id;
    assert.match(originalId, /^[0-9a-f]{64}$/);
    assert.equal(second.seal.commitment_id, originalId);
    assert.deepEqual(first.seal.payload.prediction, first.prediction);
    assert.equal(first.seal.payload.committed_at, timestamp);
    assert.equal(first.prediction.fixture_id, handoff.fixture.canonical_fixture_id);
    assert.equal(first.prediction.decision.confidence_pct, 60.53);
    assert.equal(first.prediction.decision.secondary_double_chance.confidence_pct, 74);
    assert.throws(() => { first.seal.payload.committed_at = 'changed'; }, TypeError);
    assert.throws(() => { first.prediction.decision.probabilities_pct.draw = 99; }, TypeError);
    assert.throws(() => { first.prediction.decision.secondary_double_chance.market = 'changed'; }, TypeError);
    const decoded = JSON.parse(JSON.stringify(first.seal));
    const verified = verifyEdgeD1Seal(decoded, originalId);
    assert.deepEqual(verified, first.seal.payload);
    assert.notEqual(verified, decoded.payload);
    assert.throws(() => { verified.prediction.rulebook.id = 'changed'; }, TypeError);
    const nextTime = { now: () => '2026-11-06T12:01:01.000Z' };
    const later = await runSealedEdgeD1Proof(composition, manifest, signed(), nextTime);
    assert.notEqual(later.seal.commitment_id, originalId);
    assert.equal(verifyEdgeD1Seal(later.seal, originalId), null);
  });

  await t.test('the original commitment rejects changes even when a replacement is rehashed', async () => {
    const { seal } = await runSealedEdgeD1Proof(setup(async () => evidence), manifest, signed(), { now: () => timestamp });
    const originalId = seal.commitment_id;
    const edits = [
      p => { p.schema_version = 'other'; },
      p => { p.committed_at = '2026-11-06T12:01:01.000Z'; },
      p => { p.prediction.fixture_id = 'OTHER_FIXTURE'; },
      p => { p.prediction.decision.outcome = 'home_win'; },
      p => { p.prediction.decision.confidence_pct = 61; },
      p => { p.prediction.decision.probabilities_pct.draw = 25; },
      p => { p.prediction.decision.secondary_double_chance.confidence_pct = 73; },
      p => { p.prediction.rulebook.sha256 = '0'.repeat(64); },
      p => { p.prediction.provenance.source_package_sha256 = '1'.repeat(64); },
      p => { p.prediction.provenance.handoff_sha256 = '2'.repeat(64); },
      p => { p.prediction.provenance.evidence_sha256 = '3'.repeat(64); },
      p => { p.prediction.decision.reason = NaN; }
    ];
    for (const edit of edits) {
      const replacement = structuredClone(seal);
      edit(replacement.payload);
      assert.equal(verifyEdgeD1Seal(replacement, originalId), null);
      replacement.commitment_id = computeSubmittedBodyHash(replacement.payload);
      assert.equal(verifyEdgeD1Seal(replacement, originalId), null);
    }
    assert.equal(verifyEdgeD1Seal(seal), null);
    assert.equal(verifyEdgeD1Seal(seal, '0'.repeat(64)), null);
  });

  await t.test('Edge produces no seal on rejected evidence or an invalid commitment clock', async () => {
    const rejected = await runSealedEdgeD1Proof(setup(async () => null), manifest, signed(),
      { now: () => assert.fail('An abstention must not use the commitment clock') });
    assert.equal(rejected.prediction.decision.status, 'ABSTAIN');
    assert.equal(rejected.seal, null);
    await assert.rejects(runSealedEdgeD1Proof(setup(async () => evidence), manifest, signed(),
      { now: () => 'invalid time' }), /EDGE_D1_SEAL_INVALID_COMMITMENT_TIME/);
  });

  const shadowRoot = process.env.SKCS_SCOUT_SHADOW_PROOF_ROOT;
  await t.test('the post-seal governor compares the real private Scout result', { skip: !shadowRoot }, async () => {
    const { seal } = await runSealedEdgeD1Proof(setup(async () => evidence), manifest, signed(), { now: () => timestamp });
    const originalId = seal.commitment_id;
    let reads = 0;
    const compare = createEdgeD1ComparisonProof(originalId, request => {
      reads++;
      assert.deepEqual(request, { fixture_id: handoff.fixture.canonical_fixture_id,
        source_package_sha256: packageSha, rulebook_id: seal.payload.prediction.rulebook.id,
        rulebook_sha256: seal.payload.prediction.rulebook.sha256 });
      const { predictShadow } = require(path.resolve(shadowRoot, 'scout/shadow-predictor/shadow_predictor.js'));
      return predictShadow(source);
    });
    const replacement = structuredClone(seal);
    replacement.payload.prediction.decision.confidence_pct = 61;
    replacement.commitment_id = computeSubmittedBodyHash(replacement.payload);
    assert.equal((await compare(replacement)).reason, 'EDGE_D1_ORIGINAL_SEAL_REQUIRED');
    assert.equal(reads, 0);
    const report = await compare(seal);
    assert.equal(reads, 1);
    assert.deepEqual(report, {
      status: 'COMPARISON_COMPLETE', commitment_id: originalId, fixture_id: handoff.fixture.canonical_fixture_id,
      source_package_sha256: packageSha, rulebook: seal.payload.prediction.rulebook,
      differences: { outcome_matches: true, confidence_gap_pct: 0,
        probabilities_gap_pct: { home_win: 0, draw: 0, away_win: 0 },
        secondary_market_matches: true, secondary_confidence_gap_pct: 0, secondary_probability_gap_pct: 0 },
      review: { policy_id: "EDGE_D1_EXACT_MATCH_V1", verdict: "GREEN", reason: "EXACT_MATCH", action: "PASS" },
      soccer_governor: seal.payload.prediction.soccer_governor
    });
  });

  await t.test('the governor reports differences and blocks missing or mismatched Scout evidence', async () => {
    const { seal } = await runSealedEdgeD1Proof(setup(async () => evidence), manifest, signed(), { now: () => timestamp });
    const shadow = { soccer_governor: seal.payload.prediction.soccer_governor, visibility: 'PRIVATE_QC_ONLY', fixture: { canonical_fixture_id: handoff.fixture.canonical_fixture_id },
      rulebook: seal.payload.prediction.rulebook, provenance: { source_package_sha256: packageSha,
        scout_facts_only: true, edge_prediction_seen: false },
      decision: { status: 'PREDICTION_READY', outcome: 'home_win', confidence_pct: 50,
        probabilities_pct: { home_win: 50, draw: 22, away_win: 28 },
        secondary_double_chance: { market: 'double_chance_1x', confidence_pct: 72, probability_pct: 72 } }
    };
    const compareWith = read => createEdgeD1ComparisonProof(seal.commitment_id, read)(seal);
    const report = await compareWith(() => shadow);
    assert.equal(report.review.verdict, "RED");
    assert.equal(report.review.reason, "OUTRIGHT_PICK_MISMATCH");
    assert.equal(report.review.action, "REVIEW_REQUIRED");
    assert.deepEqual(report.differences, { outcome_matches: false, confidence_gap_pct: 10.53,
      probabilities_gap_pct: { home_win: 32.98, draw: 0.45, away_win: 32.53 },
      secondary_market_matches: false, secondary_confidence_gap_pct: 2, secondary_probability_gap_pct: 10.98 });
    for (const change of [
      value => { value.fixture.canonical_fixture_id = 'OTHER'; },
      value => { value.provenance.source_package_sha256 = '0'.repeat(64); },
      value => { value.provenance.edge_prediction_seen = true; },
      value => { value.rulebook.sha256 = '0'.repeat(64); },
    ]) {
      const wrong = structuredClone(shadow);
      change(wrong);
      assert.equal((await compareWith(() => wrong)).reason, 'SCOUT_SHADOW_BINDING_MISMATCH');
    }
    const missing = await compareWith(() => null);
    assert.equal(missing.reason, 'SCOUT_SHADOW_UNAVAILABLE');
    assert.equal(missing.review.verdict, 'RED');

    const matching = { ...shadow, decision: structuredClone(seal.payload.prediction.decision) };
    assert.equal((await compareWith(() => matching)).review.verdict, 'GREEN');
    matching.decision.confidence_pct += 0.004;
    assert.equal((await compareWith(() => matching)).review.verdict, 'GREEN');
    matching.decision.confidence_pct += 0.002;
    const tinyGap = await compareWith(() => matching);
    assert.equal(tinyGap.differences.confidence_gap_pct, 0.01);
    assert.equal(tinyGap.review.verdict, 'AMBER');
    assert.equal(tinyGap.review.action, "REVIEW_REQUIRED");
    const wrongGovernor = structuredClone(matching);
    wrongGovernor.soccer_governor.version = "999";
    assert.equal((await compareWith(() => wrongGovernor)).reason, "SOCCER_GOVERNOR_VERSION_MISMATCH");
    matching.decision.confidence_pct = seal.payload.prediction.decision.confidence_pct;
    matching.decision.secondary_double_chance = null;
    assert.equal((await compareWith(() => matching)).review.verdict, 'AMBER');
    const invalid = await createEdgeD1ComparisonProof(seal.commitment_id,
      () => assert.fail('An invalid seal cannot read Scout'))(null);
    assert.equal(invalid.review.verdict, 'RED');
    assert.equal((await compareWith(() => { throw new Error('private'); })).reason, 'SCOUT_SHADOW_UNAVAILABLE');
    const abstained = { ...shadow, decision: { status: 'ABSTAIN' } };
    assert.equal((await compareWith(() => abstained)).reason, 'SCOUT_SHADOW_UNAVAILABLE');
  });

  await t.test('GREEN prepares only the sealed official recommendation for the Accuracy Center before kickoff', { skip: !shadowRoot }, async () => {
    const { predictShadow } = require(path.resolve(shadowRoot, 'scout/shadow-predictor/shadow_predictor.js'));
    const { aggregateAccuracyRows } = require('../backend/services/gradingAccuracyCore');
    const fixture = { fixture_id: handoff.fixture.canonical_fixture_id, kickoff_at: handoff.fixture.kickoff_at, status: 'scheduled' };
    let now = timestamp;
    let reads = 0;
    const clock = { now: () => now };
    const readVerifiedFixture = () => fixture;
    const readScoutShadow = () => { reads++; return predictShadow(source); };
    const run = options => runPendingEdgeD1Proof(setup(async () => evidence), manifest, signed(),
      { clock, readVerifiedFixture, readScoutShadow, recommendationMarket: 'double_chance_x2', ...options });

    const ready = await run();
    assert.equal(ready.status, 'PENDING_HANDOFF_READY');
    assert.equal(ready.cutoff_at, fixture.kickoff_at);
    assert.equal(ready.prepared_at, timestamp);
    assert.equal(ready.commitment_id, ready.seal.commitment_id);
    assert.equal(verifyEdgeD1Seal(ready.seal, ready.commitment_id).prediction.fixture.kickoff_at, fixture.kickoff_at);
    assert.deepEqual(ready.products.map(row => [row.market, row.predicted_outcome, row.confidence, row.resolution_status]),
      [['double_chance_x2', 'x2', 74, 'pending']]);
    assert.equal(ready.products[0].prediction_type, 'secondary');
    assert.equal(ready.seal.payload.recommendation_market, 'double_chance_x2');
    assert.equal(ready.seal.payload.prediction.decision.outcome, 'away_win');
    const altered = structuredClone(ready.seal);
    altered.payload.recommendation_market = '1X2';
    assert.equal(verifyEdgeD1Seal(altered, ready.commitment_id), null);
    assert.ok(ready.products.every(row => row.event_id === fixture.fixture_id && row.fixture_date === '2026-11-08' &&
      row.is_correct === null && !('prediction_final_id' in row)));
    const linkedRows = ready.products.map((row, i) => ({ ...row, prediction_final_id: i + 1 }));
    const beforeMatch = aggregateAccuracyRows(linkedRows).overall;
    assert.equal(beforeMatch.pending, 1);
    assert.equal(beforeMatch.graded, 0);
    const resolved = linkedRows.map(row => ({ ...row, resolution_status: 'won' }));
    const afterMatch = aggregateAccuracyRows(resolved).overall;
    assert.equal(afterMatch.pending, 0);
    assert.equal(afterMatch.graded, 1);
    assert.equal(afterMatch.wins, 1);
    assert.equal(afterMatch.losses, 0);

    const blocked = { status: 'PENDING_HANDOFF_BLOCKED', reason: 'EDGE_D1_PREMATCH_FIXTURE_REQUIRED' };
    assert.deepEqual(await run({ readVerifiedFixture: () => null }), blocked);
    assert.deepEqual(await run({ readVerifiedFixture: () => ({ ...fixture, status: 'in_progress' }) }), blocked);
    assert.deepEqual(await run({ readVerifiedFixture: () => ({ ...fixture, kickoff_at: '2026-11-08T15:00:00.000Z' }) }), blocked);
    now = fixture.kickoff_at;
    assert.deepEqual(await run(), blocked);
    assert.equal(reads, 1);
    now = timestamp;
    assert.deepEqual(await run({ readScoutShadow: () => { now = fixture.kickoff_at; return predictShadow(source); } }), blocked);
    now = timestamp;
    let statusReads = 0;
    assert.deepEqual(await run({ readVerifiedFixture: () =>
      ({ ...fixture, status: ++statusReads === 1 ? 'scheduled' : 'in_progress' }) }), blocked);
    const amber = await run({ readScoutShadow: () => {
      const result = predictShadow(source);
      result.decision.confidence_pct += 0.01;
      return result;
    } });
    assert.deepEqual(amber, { status: 'PENDING_HANDOFF_BLOCKED', reason: 'PREDICTION_DETAILS_DIFFER' });
    const direct = await run({ recommendationMarket: '1X2' });
    assert.equal(direct.seal.payload.recommendation_market, '1X2');
    assert.deepEqual(direct.products.map(row => [row.prediction_type, row.predicted_outcome]), [['direct', 'away_win']]);
    assert.notEqual(direct.commitment_id, ready.commitment_id);
    assert.equal((await run({ recommendationMarket: undefined })).reason, 'EDGE_D1_OFFICIAL_RECOMMENDATION_REQUIRED');
    assert.equal((await run({ recommendationMarket: 'double_chance_1x' })).reason, 'EDGE_D1_RECOMMENDATION_NOT_ELIGIBLE');
    const red = await run({ readScoutShadow: () => null });
    assert.deepEqual(red, { status: 'PENDING_HANDOFF_BLOCKED', reason: 'SCOUT_SHADOW_UNAVAILABLE' });
  });

  await t.test('Edge D1 proves Home-or-Draw and abstains when form or outright evidence is insufficient', async () => {
    async function replay(editFacts) {
      const revised = JSON.parse(evidence);
      editFacts(revised.handoff);
      for (const field of ['team_form', 'h2h']) {
        revised.handoff.context_sha256[field] = computeSubmittedBodyHash(revised.handoff.context[field]);
      }
      delete revised.handoff.handoff_sha256;
      revised.handoff.handoff_sha256 = computeSubmittedBodyHash(revised.handoff);
      const bytes = Buffer.from(JSON.stringify(revised));
      const revisedManifest = { ...manifest, handoff_sha256: revised.handoff.handoff_sha256,
        evidence_bytes: bytes.length, evidence_sha256: createHash('sha256').update(bytes).digest('hex') };
      return (await runEdgeD1Proof(setup(async () => bytes), revisedManifest, signed(revisedManifest))).decision;
    }

    const home = await replay(({ fixture, context }) => {
      const { home, away } = context.team_form;
      context.team_form.home = { ...away, team_name: fixture.home_team.name };
      context.team_form.away = { ...home, team_name: fixture.away_team.name };
      context.h2h.perspective_team = fixture.home_team.name;
    });
    assert.equal(home.outcome, 'home_win');
    assert.equal(home.secondary_double_chance.market, 'double_chance_1x');
    assert.ok(home.secondary_double_chance.confidence_pct >= 72);
    assert.ok(home.secondary_double_chance.confidence_pct > home.confidence_pct);

    const insufficient = await replay(({ context }) => { context.team_form.home.current_form = ['W']; });
    assert.equal(insufficient.reason, 'INSUFFICIENT_GOVERNED_EVIDENCE');
    assert.equal(insufficient.outcome, null);

    const balanced = await replay(({ fixture, context }) => {
      context.team_form.home = { ...context.team_form.away, team_name: fixture.home_team.name };
      context.h2h = { perspective_team: fixture.away_team.name, played: 4, won: 3, lost: 0 };
    });
    assert.equal(balanced.status, 'ABSTAIN');
    assert.equal(balanced.outcome, null);
    assert.equal(balanced.secondary_double_chance, undefined);

    const capped = await replay(({ context }) => {
      context.team_form.home.current_form = ['W', 'W', 'W'];
      context.team_form.away.current_form = ['L', 'L', 'L'];
      context.team_form.home.season_summary = { won: 9, drawn: 0, lost: 0, goals_for: 36, goals_against: 0 };
      context.team_form.away.season_summary = { won: 0, drawn: 0, lost: 9, goals_for: 0, goals_against: 36 };
    });
    assert.equal(capped.confidence_pct, 74);
    assert.equal(capped.secondary_double_chance, null);
  });

  await t.test('Edge D1 requires proof mode, verified evidence and intact rulebook bytes', async testContext => {
    const rejected = await runEdgeD1Proof(setup(async () => assert.fail('Production proof attempted')),
      manifest, signed(manifest, 'AUTHORIZED_PRODUCTION'));
    assert.equal(rejected.decision.reason, 'EDGE_D1_PROOF_MODE_REQUIRED');
    const badSignature = signed();
    badSignature.auth.signature = '0'.repeat(64);
    const unverified = await runEdgeD1Proof(setup(async () => assert.fail('Unauthenticated evidence access')),
      manifest, badSignature);
    assert.equal(unverified.decision.reason, 'EDGE_D1_VERIFIED_SCOUT_FACTS_REQUIRED');
    assert.equal(unverified.decision.details.rejection_code, 'FIP_AUTH_SIGNATURE_INVALID');

    const fs = require('node:fs');
    const read = fs.readFileSync;
    testContext.mock.method(fs, 'readFileSync', (...args) => {
      const result = read(...args);
      return String(args[0]).endsWith('edgeD1Rulebook.v2.json') ? result + ' ' : result;
    });
    const altered = await runEdgeD1Proof(setup(async () => evidence), manifest, signed());
    assert.equal(altered.decision.reason, 'EDGE_D1_RULEBOOK_INTEGRITY_FAILED');
    assert.equal(altered.decision.outcome, null);
  });

  await t.test('rejects post-cutoff player history even in consistently rehashed evidence', async () => {
    const { handoff: lateHandoff, provenance } = JSON.parse(evidence);
    lateHandoff.players.find(player => player.history_status === 'VERIFIED_HISTORY').available_at = timestamp;
    delete lateHandoff.handoff_sha256;
    lateHandoff.handoff_sha256 = computeSubmittedBodyHash(lateHandoff);
    const lateBytes = Buffer.from(JSON.stringify({ handoff: lateHandoff, provenance }));
    const lateManifest = { ...manifest, handoff_sha256: lateHandoff.handoff_sha256, evidence_bytes: lateBytes.length,
      evidence_sha256: createHash('sha256').update(lateBytes).digest('hex') };
    assert.equal((await setup(async () => lateBytes).receiveValidatedFip(lateManifest, signed(lateManifest))).rejection_code,
      'SCOUT_CONTEXT_PROOF_TIME_INVALID');
  });
});
