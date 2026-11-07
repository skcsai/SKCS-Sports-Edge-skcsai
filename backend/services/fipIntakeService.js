'use strict';

const crypto = require('node:crypto');

const FIP_SCHEMA_VERSION = '1.0.0';
const HASH_ALGORITHM = 'scout-fip-sha256-v1';
const SCOUT_FIP_ORIGIN = 'SCOUT_FIP';
const PROOF_FIXTURE_MODE = 'PROOF_FIXTURE';
const FIXED_TIMEZONE = 'Africa/Johannesburg';
const DEFAULT_MAX_FIP_BYTES = 256 * 1024;

const MAX_VALIDATION_AGE_MS = 30 * 60 * 1000;
const MAX_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_KICKOFF_HORIZON_MS = 48 * 60 * 60 * 1000;

const DOMAIN_CODES = Object.freeze({
  FIP_SCHEMA_UNSUPPORTED: 'FIP_SCHEMA_UNSUPPORTED',
  FIP_NOT_VALIDATED: 'FIP_NOT_VALIDATED',
  FIP_HASH_MISMATCH: 'FIP_HASH_MISMATCH',
  FIP_REQUIRED_FIELD_MISSING: 'FIP_REQUIRED_FIELD_MISSING',
  FIP_IDENTITY_INCONSISTENT: 'FIP_IDENTITY_INCONSISTENT',
  FIP_IDEMPOTENCY_DUPLICATE: 'FIP_IDEMPOTENCY_DUPLICATE',
  FIP_INTAKE_UNAUTHORIZED: 'FIP_INTAKE_UNAUTHORIZED',
  FIP_FORBIDDEN_ORIGIN: 'FIP_FORBIDDEN_ORIGIN',
  FIP_ENVELOPE_MAP_FAILED: 'FIP_ENVELOPE_MAP_FAILED',
  FIP_MARRIAGE_GATE_BLOCKED: 'FIP_MARRIAGE_GATE_BLOCKED',
  FIP_FIXTURE_IDENTITY_UNRESOLVED: 'FIP_FIXTURE_IDENTITY_UNRESOLVED',
  FIP_LIFECYCLE_PARENT_MISSING: 'FIP_LIFECYCLE_PARENT_MISSING',
  FIP_D3_MAP_FAILED: 'FIP_D3_MAP_FAILED',
  FIP_INTAKE_EVIDENCE_UNAVAILABLE: 'FIP_INTAKE_EVIDENCE_UNAVAILABLE',
  FIP_PERSISTENCE_FAILED: 'FIP_PERSISTENCE_FAILED',
  FIP_STALE: 'FIP_STALE',
  FIP_TIME_INVALID: 'FIP_TIME_INVALID',
  FIP_PAYLOAD_INVALID: 'FIP_PAYLOAD_INVALID',
  FIP_PAYLOAD_TOO_LARGE: 'FIP_PAYLOAD_TOO_LARGE',
  FIP_FEATURE_DISABLED: 'FIP_FEATURE_DISABLED'
});

const FORBIDDEN_ORIGIN_VALUES = new Set([
  'BUILD_LIVE_DATA',
  'BUILDLIVEDATA',
  'PIPELINE_MANUAL_INJECTION',
  'POST_API_PIPELINE_RUN_MATCHES',
  'POST /API/PIPELINE/RUN { MATCHES }',
  'WORKSPACE_CANDIDATE',
  'SUPABASE_FIP_REPLAY',
  'SUPABASE_REPLAY',
  'API_SPORTS',
  'API-SPORTS',
  'BIG_BALLS',
  'THESPORTSDB',
  'THE_SPORTS_DB',
  'ODDS_API',
  'EXTERNAL_PROVIDER'
]);

const LEGACY_REQUIRED_PATHS = [
  'fip_schema_version',
  'fip_id',
  'proof_mode',
  'validation.status',
  'validation.algorithm',
  'validation.hash',
  'validation.validated_at',
  'fixture.fixture_id',
  'fixture.sport',
  'fixture.kickoff_time',
  'fixture.home_team',
  'fixture.away_team',
  'markets',
  'context'
];

const CANONICAL_REQUIRED_PATHS = [
  'fip_schema_version',
  'fip_id',
  'validation.status',
  'validation.hash',
  'validation.hash_algorithm',
  'validation.validated_at',
  'scout.fixture_id',
  'provenance.scout_run_id',
  'provenance.source_system',
  'fixture.sport',
  'fixture.league_id',
  'fixture.league',
  'fixture.kickoff_utc',
  'fixture.status',
  'fixture.home_team.id',
  'fixture.home_team.name',
  'fixture.away_team.id',
  'fixture.away_team.name',
  'markets',
  'context'
];

function stableClone(value) {
  if (Array.isArray(value)) {
    return value.map(stableClone);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableClone(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableClone(value));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeToken(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function hasPath(value, path) {
  const parts = path.split('.');
  let cursor = value;

  for (const part of parts) {
    if (
      !cursor ||
      typeof cursor !== 'object' ||
      !Object.prototype.hasOwnProperty.call(cursor, part)
    ) {
      return false;
    }
    cursor = cursor[part];
  }

  return true;
}

function getPath(value, path) {
  const parts = path.split('.');
  let cursor = value;

  for (const part of parts) {
    if (
      !cursor ||
      typeof cursor !== 'object' ||
      !Object.prototype.hasOwnProperty.call(cursor, part)
    ) {
      return undefined;
    }
    cursor = cursor[part];
  }

  return cursor;
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === '';
}

function constantTimeEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

function computeFipHash(fipPayload) {
  const clone = deepClone(fipPayload || {});
  clone.validation = clone.validation && typeof clone.validation === 'object'
    ? clone.validation
    : {};
  clone.validation.hash = '';

  return crypto
    .createHash('sha256')
    .update(stableStringify(clone), 'utf8')
    .digest('hex');
}

function computeIdempotencyKey({ fipId, validationHash, fipSchemaVersion }) {
  return crypto
    .createHash('sha256')
    .update(`${fipId}|${validationHash}|${fipSchemaVersion}`, 'utf8')
    .digest('hex');
}

function buildIntakeId({ fipId, validationHash, receivedAt }) {
  return `efi-${crypto
    .createHash('sha256')
    .update(`${fipId || 'UNKNOWN'}|${validationHash || 'NO_HASH'}|${receivedAt}`, 'utf8')
    .digest('hex')
    .slice(0, 24)}`;
}

function isLegacyProofFipShape(fipPayload) {
  if (!fipPayload || typeof fipPayload !== 'object') {
    return false;
  }

  if (hasPath(fipPayload, 'validation.algorithm')) {
    return true;
  }

  if (
    hasPath(fipPayload, 'fixture.fixture_id') &&
    !hasPath(fipPayload, 'scout.fixture_id')
  ) {
    return true;
  }

  const homeTeam = getPath(fipPayload, 'fixture.home_team');
  return typeof homeTeam === 'string';
}

function normalizeLegacyProofFip(fipPayload) {
  if (!isLegacyProofFipShape(fipPayload)) {
    return deepClone(fipPayload);
  }

  const source = deepClone(fipPayload);
  const fixture = source.fixture || {};
  const validation = source.validation || {};
  const scoutFixtureId = fixture.fixture_id || fixture.match_id || null;

  const homeTeam =
    typeof fixture.home_team === 'string'
      ? { id: fixture.home_team, name: fixture.home_team }
      : deepClone(fixture.home_team || {});
  const awayTeam =
    typeof fixture.away_team === 'string'
      ? { id: fixture.away_team, name: fixture.away_team }
      : deepClone(fixture.away_team || {});

  const markets = deepClone(source.markets || {});
  if (!markets.direct_1x2 && markets.sharp_odds) {
    markets.direct_1x2 = deepClone(markets.sharp_odds);
  }

  const canonical = {
    fip_id: source.fip_id,
    fip_schema_version: source.fip_schema_version,
    validation: {
      status: validation.status,
      hash: validation.hash,
      hash_algorithm: validation.hash_algorithm || validation.algorithm || HASH_ALGORITHM,
      validated_at: validation.validated_at
    },
    scout: {
      fixture_id: scoutFixtureId
    },
    provenance: {
      scout_run_id:
        source.provenance?.scout_run_id ||
        `legacy-proof-${source.fip_id || 'unknown'}`,
      source_system: source.provenance?.source_system || 'SCOUT',
      assembled_at: source.provenance?.assembled_at || validation.validated_at || null
    },
    fixture: {
      sport: fixture.sport,
      league_id: fixture.league_id || fixture.competition || 'legacy-league',
      league: fixture.league || fixture.competition || 'Legacy League',
      kickoff_utc: fixture.kickoff_utc || fixture.kickoff_time,
      status: fixture.status || 'NS',
      home_team: homeTeam,
      away_team: awayTeam,
      country: fixture.country || null,
      venue: fixture.venue || null
    },
    markets,
    context: deepClone(source.context || {}),
    metadata: deepClone(source.metadata || {})
  };

  if (source.proof_mode) {
    canonical.proof_mode = source.proof_mode;
  }

  return canonical;
}

function collectOriginCandidates(fipPayload) {
  return [
    fipPayload?.source,
    fipPayload?.origin,
    fipPayload?.sports_truth_origin,
    fipPayload?.metadata?.source,
    fipPayload?.metadata?.origin,
    fipPayload?.metadata?.sports_truth_origin,
    fipPayload?.transport?.source,
    fipPayload?.transport?.origin,
    fipPayload?.provenance?.source,
    fipPayload?.provenance?.origin,
    fipPayload?.provenance?.source_system
  ].filter((value) => value !== undefined && value !== null);
}

function detectForbiddenOrigin(fipPayload) {
  for (const candidate of collectOriginCandidates(fipPayload)) {
    const raw = String(candidate).trim();
    const normalized = normalizeToken(raw);

    if (FORBIDDEN_ORIGIN_VALUES.has(raw.toUpperCase()) || FORBIDDEN_ORIGIN_VALUES.has(normalized)) {
      return raw;
    }
  }

  return null;
}

function createBaseEvidence(fipPayload, options) {
  const receivedAt = options.receivedAt || new Date().toISOString();
  const canonical = isLegacyProofFipShape(fipPayload)
    ? normalizeLegacyProofFip(fipPayload)
    : fipPayload;
  const fipId = canonical?.fip_id || null;
  const validationHash = canonical?.validation?.hash || null;
  const idempotencyKey = fipId && validationHash
    ? computeIdempotencyKey({
        fipId,
        validationHash,
        fipSchemaVersion: canonical?.fip_schema_version || FIP_SCHEMA_VERSION
      })
    : null;

  return {
    intake_id: buildIntakeId({ fipId, validationHash, receivedAt }),
    received_at: receivedAt,
    fip_id: fipId,
    fip_schema_version: canonical?.fip_schema_version || null,
    validation_hash: validationHash,
    idempotency_key: idempotencyKey,
    caller: options.caller || 'UNKNOWN',
    governed_mode: options.governedMode || PROOF_FIXTURE_MODE,
    scout_edge_marriage_gate: options.scoutEdgeMarriageGate || 'BLOCKED',
    supabase_storage_gate: options.supabaseStorageGate || 'BLOCKED',
    sports_truth_origin: SCOUT_FIP_ORIGIN,
    scout_fixture_id: canonical?.scout?.fixture_id || null,
    scout_run_id: canonical?.provenance?.scout_run_id || null,
    validated_at: canonical?.validation?.validated_at || null
  };
}

function rejectIntake(code, message, fipPayload, options, details = {}) {
  return {
    accepted: false,
    result: 'REJECTED',
    rejection_code: code,
    message,
    evidence: {
      ...createBaseEvidence(fipPayload, options),
      result: 'REJECTED',
      rejection_code: code,
      outcome: 'REJECTED',
      details
    },
    envelope: null,
    canonical_fip: null
  };
}

function validateRequiredPaths(fipPayload, requiredPaths) {
  for (const path of requiredPaths) {
    if (!hasPath(fipPayload, path)) {
      return { ok: false, path, reason: 'missing' };
    }

    const value = getPath(fipPayload, path);
    const requiresValue = !['markets', 'context'].includes(path);

    if (requiresValue && isBlank(value)) {
      return { ok: false, path, reason: 'blank' };
    }
  }

  if (
    !fipPayload.markets ||
    typeof fipPayload.markets !== 'object' ||
    Array.isArray(fipPayload.markets)
  ) {
    return { ok: false, path: 'markets', reason: 'not_object' };
  }

  if (
    !fipPayload.context ||
    typeof fipPayload.context !== 'object' ||
    Array.isArray(fipPayload.context)
  ) {
    return { ok: false, path: 'context', reason: 'not_object' };
  }

  return { ok: true };
}

function validateIdentityConsistency(fipPayload) {
  const scoutFixtureId = getPath(fipPayload, 'scout.fixture_id');
  const legacyFixtureId = getPath(fipPayload, 'fixture.fixture_id');

  if (
    scoutFixtureId &&
    legacyFixtureId &&
    String(scoutFixtureId).trim() !== String(legacyFixtureId).trim()
  ) {
    return {
      ok: false,
      scout_fixture_id: scoutFixtureId,
      fixture_fixture_id: legacyFixtureId
    };
  }

  return { ok: true };
}

function parseTimestamp(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  const utcIsoPattern =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;
  const match = normalized.match(utcIsoPattern);

  if (!match) {
    return null;
  }

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText,
    millisecondText = ''
  ] = match;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const millisecond = Number(millisecondText.padEnd(3, '0'));

  const timestampMs = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond
  );

  if (!Number.isFinite(timestampMs)) {
    return null;
  }

  const parsed = new Date(timestampMs);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day ||
    parsed.getUTCHours() !== hour ||
    parsed.getUTCMinutes() !== minute ||
    parsed.getUTCSeconds() !== second ||
    parsed.getUTCMilliseconds() !== millisecond
  ) {
    return null;
  }

  return timestampMs;
}

function getKickoffTimestamp(fipPayload) {
  return parseTimestamp(
    fipPayload?.fixture?.kickoff_utc || fipPayload?.fixture?.kickoff_time
  );
}

function validateFreshness(fipPayload, options = {}) {
  const receivedAt = options.receivedAt || new Date().toISOString();
  const receivedAtMs = parseTimestamp(receivedAt);
  const validatedAtMs = parseTimestamp(fipPayload?.validation?.validated_at);
  const kickoffAtMs = getKickoffTimestamp(fipPayload);

  if (receivedAtMs === null) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_TIME_INVALID,
      message: 'Edge intake receivedAt must be a valid ISO-8601 timestamp.',
      details: {
        field: 'receivedAt',
        value: receivedAt
      }
    };
  }

  if (validatedAtMs === null) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_TIME_INVALID,
      message: 'Scout FIP validation.validated_at must be a valid ISO-8601 timestamp.',
      details: {
        field: 'validation.validated_at',
        value: fipPayload?.validation?.validated_at || null
      }
    };
  }

  if (kickoffAtMs === null) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_TIME_INVALID,
      message: 'Scout FIP fixture kickoff must be a valid ISO-8601 timestamp.',
      details: {
        field: 'fixture.kickoff_utc',
        value: fipPayload?.fixture?.kickoff_utc || fipPayload?.fixture?.kickoff_time || null
      }
    };
  }

  const futureValidationSkewMs = validatedAtMs - receivedAtMs;
  if (futureValidationSkewMs > MAX_FUTURE_CLOCK_SKEW_MS) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_TIME_INVALID,
      message: 'Scout FIP validation time exceeds the permitted future clock-skew allowance.',
      details: {
        validated_at: fipPayload.validation.validated_at,
        received_at: receivedAt,
        future_skew_ms: futureValidationSkewMs,
        maximum_future_skew_ms: MAX_FUTURE_CLOCK_SKEW_MS
      }
    };
  }

  const validationAgeMs = receivedAtMs - validatedAtMs;
  if (validationAgeMs > MAX_VALIDATION_AGE_MS) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_STALE,
      message: 'Scout FIP validation is older than the permitted freshness window.',
      details: {
        validated_at: fipPayload.validation.validated_at,
        received_at: receivedAt,
        validation_age_ms: validationAgeMs,
        maximum_validation_age_ms: MAX_VALIDATION_AGE_MS
      }
    };
  }

  const kickoffDelayMs = kickoffAtMs - receivedAtMs;
  if (kickoffDelayMs <= 0) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_STALE,
      message: 'Scout FIP fixture has already started or reached kickoff.',
      details: {
        kickoff_utc: fipPayload.fixture.kickoff_utc || fipPayload.fixture.kickoff_time,
        received_at: receivedAt,
        kickoff_delay_ms: kickoffDelayMs
      }
    };
  }

  if (kickoffDelayMs > MAX_KICKOFF_HORIZON_MS) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_STALE,
      message: 'Scout FIP fixture kickoff exceeds the permitted intake horizon.',
      details: {
        kickoff_utc: fipPayload.fixture.kickoff_utc || fipPayload.fixture.kickoff_time,
        received_at: receivedAt,
        kickoff_delay_ms: kickoffDelayMs,
        maximum_kickoff_horizon_ms: MAX_KICKOFF_HORIZON_MS
      }
    };
  }

  return {
    ok: true,
    receivedAt
  };
}

function mapValidatedFipToD3Dto(fipPayload, metadata = {}) {
  try {
    const canonical = isLegacyProofFipShape(fipPayload)
      ? normalizeLegacyProofFip(fipPayload)
      : deepClone(fipPayload);
    const fixtureUid = String(metadata.fixtureUid || '').trim();
    const intakeId = String(metadata.intakeId || '').trim();
    const idempotencyKey =
      metadata.idempotencyKey ||
      computeIdempotencyKey({
        fipId: canonical.fip_id,
        validationHash: canonical.validation.hash,
        fipSchemaVersion: canonical.fip_schema_version
      });

    if (!fixtureUid || !intakeId) {
      return {
        ok: false,
        code: DOMAIN_CODES.FIP_D3_MAP_FAILED,
        message: 'D3 mapper requires fixtureUid and intakeId.'
      };
    }

    const kickoffAt = parseTimestamp(canonical.fixture.kickoff_utc);
    const metadataFreshAt = parseTimestamp(canonical.validation.validated_at);
    if (kickoffAt === null || metadataFreshAt === null) {
      return {
        ok: false,
        code: DOMAIN_CODES.FIP_D3_MAP_FAILED,
        message: 'D3 mapper requires valid kickoff and validation timestamps.'
      };
    }

    const dto = {
      fixtureUid,
      sport: String(canonical.fixture.sport || '').trim().toLowerCase(),
      scoutFixtureId: String(canonical.scout.fixture_id || '').trim(),
      fipId: String(canonical.fip_id || '').trim(),
      fipSchemaVersion: String(canonical.fip_schema_version || '').trim(),
      fipValidationHash: String(canonical.validation.hash || '').trim(),
      intakeId,
      idempotencyKey,
      homeTeamScoutId: String(canonical.fixture.home_team.id || '').trim(),
      awayTeamScoutId: String(canonical.fixture.away_team.id || '').trim(),
      competitionId: String(canonical.fixture.league_id || '').trim(),
      competitionName: String(canonical.fixture.league || '').trim(),
      kickoffAt: new Date(kickoffAt),
      timezone: FIXED_TIMEZONE,
      homeTeamName: String(canonical.fixture.home_team.name || '').trim(),
      awayTeamName: String(canonical.fixture.away_team.name || '').trim(),
      venue: canonical.fixture.venue || null,
      country: canonical.fixture.country || null,
      homeTeamEmblemRef: canonical.fixture.home_team?.emblem_ref || null,
      awayTeamEmblemRef: canonical.fixture.away_team?.emblem_ref || null,
      metadataFreshAt: new Date(metadataFreshAt)
    };

    const required = [
      'scoutFixtureId',
      'fipId',
      'fipSchemaVersion',
      'fipValidationHash',
      'homeTeamScoutId',
      'awayTeamScoutId',
      'competitionId',
      'competitionName',
      'homeTeamName',
      'awayTeamName'
    ];
    for (const key of required) {
      if (!dto[key]) {
        return {
          ok: false,
          code: DOMAIN_CODES.FIP_D3_MAP_FAILED,
          message: `D3 mapper missing required field: ${key}.`,
          details: { field: key }
        };
      }
    }

    if (dto.sport !== 'football') {
      return {
        ok: false,
        code: DOMAIN_CODES.FIP_D3_MAP_FAILED,
        message: 'D3 mapper only supports football in I7 scope.'
      };
    }

    return { ok: true, dto };
  } catch (err) {
    return {
      ok: false,
      code: DOMAIN_CODES.FIP_D3_MAP_FAILED,
      message: 'D3 mapper failed.',
      details: { reason: 'map_exception' }
    };
  }
}

function mapToEdgeAnalysisEnvelope(fipPayload, evidence) {
  const canonical = isLegacyProofFipShape(fipPayload)
    ? normalizeLegacyProofFip(fipPayload)
    : deepClone(fipPayload);
  const fixture = canonical.fixture;
  const markets = canonical.markets;
  const context = canonical.context;

  const matchId = canonical.scout?.fixture_id || fixture.fixture_id || fixture.match_id;
  const sharpOdds =
    markets.direct_1x2 && typeof markets.direct_1x2 === 'object'
      ? markets.direct_1x2
      : markets.sharp_odds && typeof markets.sharp_odds === 'object'
        ? markets.sharp_odds
        : null;

  if (!matchId || !sharpOdds) {
    throw new Error('FIP_ENVELOPE_MAP_FAILED');
  }

  const contextualIntelligence =
    context?.contextual_intelligence &&
    typeof context.contextual_intelligence === 'object' &&
    !Array.isArray(context.contextual_intelligence)
      ? deepClone(context.contextual_intelligence)
      : context && typeof context === 'object' && !Array.isArray(context)
        ? deepClone(context)
        : {};

  return {
    match_info: {
      match_id: matchId,
      fixture_id: matchId,
      sport: fixture.sport,
      home_team: fixture.home_team?.name || fixture.home_team,
      away_team: fixture.away_team?.name || fixture.away_team,
      home_team_id: fixture.home_team?.id || null,
      away_team_id: fixture.away_team?.id || null,
      kickoff_time: fixture.kickoff_utc || fixture.kickoff_time || null,
      competition: fixture.league || fixture.competition || null,
      country: fixture.country || null,
      sports_truth_origin: SCOUT_FIP_ORIGIN
    },
    sharp_odds: sharpOdds,
    contextual_intelligence: contextualIntelligence,
    metadata: {
      sports_truth_origin: SCOUT_FIP_ORIGIN,
      fip_id: canonical.fip_id,
      fip_schema_version: canonical.fip_schema_version,
      validation_hash_algorithm: canonical.validation.hash_algorithm,
      validation_hash: canonical.validation.hash,
      validation_validated_at: canonical.validation.validated_at,
      scout_run_id: canonical.provenance?.scout_run_id || null,
      idempotency_key: evidence.idempotency_key,
      intake_id: evidence.intake_id,
      proof_mode: canonical.proof_mode || evidence.governed_mode,
      scout_edge_marriage_gate: evidence.scout_edge_marriage_gate,
      supabase_storage_gate: evidence.supabase_storage_gate
    }
  };
}

function validatePayloadSize(fipPayload, maxBytes = DEFAULT_MAX_FIP_BYTES) {
  const size = Buffer.byteLength(stableStringify(fipPayload), 'utf8');
  if (size > maxBytes) {
    return {
      ok: false,
      size,
      maxBytes
    };
  }
  return { ok: true, size };
}

function validateCanonicalFipIntake(fipPayload, options = {}) {
  if (!fipPayload || typeof fipPayload !== 'object' || Array.isArray(fipPayload)) {
    return rejectIntake(
      DOMAIN_CODES.FIP_PAYLOAD_INVALID,
      'FIP intake requires an object payload.',
      fipPayload,
      options
    );
  }

  const sizeCheck = validatePayloadSize(fipPayload, options.maxFipBytes || DEFAULT_MAX_FIP_BYTES);
  if (!sizeCheck.ok) {
    return rejectIntake(
      DOMAIN_CODES.FIP_PAYLOAD_TOO_LARGE,
      'FIP payload exceeds the configured byte ceiling.',
      fipPayload,
      options,
      sizeCheck
    );
  }

  const forbiddenOrigin = detectForbiddenOrigin(fipPayload);
  if (forbiddenOrigin) {
    return rejectIntake(
      DOMAIN_CODES.FIP_FORBIDDEN_ORIGIN,
      'FIP intake rejected a forbidden non-Scout source.',
      fipPayload,
      options,
      { forbidden_origin: forbiddenOrigin }
    );
  }

  const legacy = isLegacyProofFipShape(fipPayload);
  const hashInput = deepClone(fipPayload);

  if (fipPayload.fip_schema_version !== FIP_SCHEMA_VERSION) {
    return rejectIntake(
      DOMAIN_CODES.FIP_SCHEMA_UNSUPPORTED,
      'FIP intake only accepts Scout FIP schema version 1.0.0.',
      fipPayload,
      options,
      { expected: FIP_SCHEMA_VERSION, actual: fipPayload.fip_schema_version || null }
    );
  }

  if (legacy) {
    if (fipPayload.proof_mode !== PROOF_FIXTURE_MODE) {
      return rejectIntake(
        DOMAIN_CODES.FIP_INTAKE_UNAUTHORIZED,
        'Legacy EFI-001 proof fixtures only accept PROOF_FIXTURE mode.',
        fipPayload,
        options,
        { expected: PROOF_FIXTURE_MODE, actual: fipPayload.proof_mode || null }
      );
    }
  }

  if (fipPayload.validation?.status !== 'VALIDATED') {
    return rejectIntake(
      DOMAIN_CODES.FIP_NOT_VALIDATED,
      'Scout FIP validation.status must be VALIDATED.',
      fipPayload,
      options,
      { actual: fipPayload.validation?.status || null }
    );
  }

  const hashAlgorithm = legacy
    ? fipPayload.validation?.algorithm
    : fipPayload.validation?.hash_algorithm;

  if (hashAlgorithm !== HASH_ALGORITHM) {
    return rejectIntake(
      DOMAIN_CODES.FIP_SCHEMA_UNSUPPORTED,
      'Scout FIP validation.hash_algorithm is not supported.',
      fipPayload,
      options,
      { expected: HASH_ALGORITHM, actual: hashAlgorithm || null }
    );
  }

  const required = validateRequiredPaths(
    fipPayload,
    legacy ? LEGACY_REQUIRED_PATHS : CANONICAL_REQUIRED_PATHS
  );
  if (!required.ok) {
    return rejectIntake(
      DOMAIN_CODES.FIP_REQUIRED_FIELD_MISSING,
      'Scout FIP payload is missing a required field.',
      fipPayload,
      options,
      required
    );
  }

  const identity = validateIdentityConsistency(
    legacy ? normalizeLegacyProofFip(fipPayload) : fipPayload
  );
  if (!identity.ok) {
    return rejectIntake(
      DOMAIN_CODES.FIP_IDENTITY_INCONSISTENT,
      'Scout fixture identity fields are inconsistent.',
      fipPayload,
      options,
      identity
    );
  }

  const expectedHash = computeFipHash(hashInput);
  if (!constantTimeEqual(fipPayload.validation.hash, expectedHash)) {
    return rejectIntake(
      DOMAIN_CODES.FIP_HASH_MISMATCH,
      'Scout FIP validation.hash does not match the canonical payload hash.',
      fipPayload,
      options,
      {
        expected: expectedHash,
        actual: fipPayload.validation.hash
      }
    );
  }

  const freshness = validateFreshness(fipPayload, options);
  if (!freshness.ok) {
    return rejectIntake(
      freshness.code,
      freshness.message,
      fipPayload,
      {
        ...options,
        receivedAt: freshness.receivedAt || options.receivedAt
      },
      freshness.details
    );
  }

  if (
    options.governedMode === 'AUTHORIZED_PRODUCTION' &&
    options.scoutEdgeMarriageGate !== 'CLEARED'
  ) {
    return rejectIntake(
      DOMAIN_CODES.FIP_MARRIAGE_GATE_BLOCKED,
      'Production Scout FIP intake is blocked until explicit marriage gate clearance.',
      fipPayload,
      options,
      {
        scout_edge_marriage_gate: options.scoutEdgeMarriageGate || 'BLOCKED'
      }
    );
  }

  const canonical = legacy ? normalizeLegacyProofFip(fipPayload) : deepClone(fipPayload);
  if (canonical.validation?.algorithm) {
    delete canonical.validation.algorithm;
  }
  canonical.validation.hash_algorithm = HASH_ALGORITHM;

  const evidence = {
    ...createBaseEvidence(canonical, options),
    result: 'ACCEPTED',
    rejection_code: null,
    outcome: 'ACCEPTED'
  };

  let envelope;
  try {
    envelope = mapToEdgeAnalysisEnvelope(canonical, evidence);
  } catch (err) {
    return rejectIntake(
      DOMAIN_CODES.FIP_ENVELOPE_MAP_FAILED,
      'Scout FIP could not be mapped to EdgeAnalysisEnvelope.',
      fipPayload,
      options
    );
  }

  return {
    accepted: true,
    result: 'ACCEPTED',
    rejection_code: null,
    message: 'Scout FIP accepted by governed intake validation.',
    evidence,
    envelope,
    canonical_fip: canonical,
    idempotency_key: evidence.idempotency_key,
    intake_id: evidence.intake_id
  };
}

function receiveValidatedFip(fipPayload, options = {}) {
  return validateCanonicalFipIntake(fipPayload, options);
}

module.exports = {
  FIP_SCHEMA_VERSION,
  HASH_ALGORITHM,
  SCOUT_FIP_ORIGIN,
  PROOF_FIXTURE_MODE,
  FIXED_TIMEZONE,
  DEFAULT_MAX_FIP_BYTES,
  DOMAIN_CODES,
  MAX_VALIDATION_AGE_MS,
  MAX_FUTURE_CLOCK_SKEW_MS,
  MAX_KICKOFF_HORIZON_MS,
  receiveValidatedFip,
  validateCanonicalFipIntake,
  validateFreshness,
  validatePayloadSize,
  computeFipHash,
  computeIdempotencyKey,
  buildIntakeId,
  stableStringify,
  stableClone,
  constantTimeEqual,
  isLegacyProofFipShape,
  normalizeLegacyProofFip,
  mapValidatedFipToD3Dto,
  mapToEdgeAnalysisEnvelope,
  detectForbiddenOrigin
};
