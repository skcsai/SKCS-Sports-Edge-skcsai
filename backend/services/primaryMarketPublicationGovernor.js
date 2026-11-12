'use strict';

const ONE_X_TWO_STRONG_MIN = 75;
const ONE_X_TWO_REVIEW_MIN = 70;
const REVIEW_MIN_INDEPENDENT_SUPPORTS = 2;

const MARKET_FAMILY_ORDER = Object.freeze([
  '1X2',
  'SECONDARY_OUTCOMES',
  'SAME_MATCH_BET',
  'DOUBLE_CHANCE_AND_COMBINATIONS'
]);

function finitePct(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

function normalizeShadowStatus(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeFactor(factor = {}) {
  return {
    family: String(factor.family || '').trim().toLowerCase(),
    direction: String(factor.direction || '').trim().toUpperCase(),
    governed: factor.governed === true,
    independent_from_model: factor.independent_from_model === true,
    material: factor.material !== false,
    quality: String(factor.quality || '').trim().toUpperCase(),
    source_ref: factor.source_ref || null,
    note: factor.note || null
  };
}

function factorCanCountAsSupport(factor) {
  return Boolean(
    factor.family
    && factor.direction === 'SUPPORTS'
    && factor.governed
    && factor.independent_from_model
    && factor.material
    && ['SUFFICIENT', 'STRONG', 'VERIFIED'].includes(factor.quality)
  );
}

function factorIsMaterialContradiction(factor) {
  return Boolean(
    factor.direction === 'CONTRADICTS'
    && factor.governed
    && factor.material
    && ['SUFFICIENT', 'STRONG', 'VERIFIED'].includes(factor.quality)
  );
}

function evaluate1X2Publication(input = {}) {
  const probabilityPct = finitePct(input.probability_pct);
  const factors = Array.isArray(input.factors) ? input.factors.map(normalizeFactor) : [];
  const shadowStatus = normalizeShadowStatus(input.shadow_status);

  const base = {
    probability_pct: probabilityPct,
    probability_changed: false,
    market_family_order: MARKET_FAMILY_ORDER.slice(),
    secondary_remains_customer_selectable: true,
    same_match_remains_customer_selectable: true,
    double_chance_remains_customer_selectable: true,
    review_supports: [],
    review_contradictions: [],
    review_support_count: 0
  };

  if (probabilityPct === null) {
    return {
      ...base,
      zone: 'INVALID',
      primary_1x2_status: 'HOLD',
      preferred_family: 'NONE',
      reason: 'INVALID_1X2_PROBABILITY'
    };
  }

  const hardGateFailures = [];
  if (input.sealed_before_kickoff !== true) hardGateFailures.push('NOT_PROVEN_PREMATCH');
  if (input.fixture_evidence_valid !== true) hardGateFailures.push('FIXTURE_EVIDENCE_NOT_VALID');
  if (input.contradiction_free !== true) hardGateFailures.push('PUBLISHED_MARKET_CONTRADICTION');
  if (input.hard_veto === true) hardGateFailures.push('HARD_CONTEXT_VETO');
  if (shadowStatus !== 'GREEN') hardGateFailures.push('SCOUT_SHADOW_NOT_GREEN');

  if (hardGateFailures.length) {
    return {
      ...base,
      zone: probabilityPct >= ONE_X_TWO_STRONG_MIN
        ? 'STRONG'
        : probabilityPct >= ONE_X_TWO_REVIEW_MIN ? 'REVIEW' : 'FALLBACK',
      primary_1x2_status: 'HOLD',
      preferred_family: 'NONE',
      reason: 'HARD_GATE_FAILED',
      hard_gate_failures: hardGateFailures
    };
  }

  if (probabilityPct >= ONE_X_TWO_STRONG_MIN) {
    return {
      ...base,
      zone: 'STRONG',
      primary_1x2_status: 'PASS',
      preferred_family: '1X2',
      reason: 'STRONG_ZONE_WITH_CLEAN_HARD_GATES'
    };
  }

  if (probabilityPct < ONE_X_TWO_REVIEW_MIN) {
    return {
      ...base,
      zone: 'FALLBACK',
      primary_1x2_status: 'ROUTE_TO_SECONDARY',
      preferred_family: 'SECONDARY_OUTCOMES',
      reason: 'BELOW_PROVISIONAL_1X2_REVIEW_BAND'
    };
  }

  const contradictions = factors.filter(factorIsMaterialContradiction);
  const supportsByFamily = new Map();
  for (const factor of factors.filter(factorCanCountAsSupport)) {
    if (!supportsByFamily.has(factor.family)) supportsByFamily.set(factor.family, factor);
  }
  const supports = Array.from(supportsByFamily.values());

  if (contradictions.length) {
    return {
      ...base,
      zone: 'REVIEW',
      primary_1x2_status: 'ROUTE_TO_SECONDARY',
      preferred_family: 'SECONDARY_OUTCOMES',
      reason: 'MATERIAL_REVIEW_CONTRADICTION',
      review_supports: supports,
      review_contradictions: contradictions,
      review_support_count: supports.length
    };
  }

  if (supports.length >= REVIEW_MIN_INDEPENDENT_SUPPORTS) {
    return {
      ...base,
      zone: 'REVIEW',
      primary_1x2_status: 'REVIEW_QUALIFIED',
      preferred_family: '1X2',
      reason: 'REVIEW_BAND_INDEPENDENT_CORROBORATION',
      review_supports: supports,
      review_contradictions: [],
      review_support_count: supports.length
    };
  }

  return {
    ...base,
    zone: 'REVIEW',
    primary_1x2_status: 'ROUTE_TO_SECONDARY',
    preferred_family: 'SECONDARY_OUTCOMES',
    reason: 'INSUFFICIENT_INDEPENDENT_CORROBORATION',
    review_supports: supports,
    review_contradictions: [],
    review_support_count: supports.length
  };
}

function normalizeSelection(selection = {}) {
  const market = String(selection.market || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const prediction = String(selection.prediction ?? selection.pick ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return { market, prediction };
}

function resultSet(selection) {
  const { market, prediction } = normalizeSelection(selection);

  if (['1x2', 'match_result', 'match_winner'].includes(market)) {
    if (['1', 'home', 'home_win'].includes(prediction)) return new Set(['H']);
    if (['x', 'draw'].includes(prediction)) return new Set(['D']);
    if (['2', 'away', 'away_win'].includes(prediction)) return new Set(['A']);
  }
  if (market === 'home_win') return new Set(['H']);
  if (market === 'draw') return new Set(['D']);
  if (market === 'away_win') return new Set(['A']);

  const dcToken = market.includes('double_chance') ? prediction || market : prediction;
  if (market === 'double_chance_1x' || dcToken === '1x') return new Set(['H', 'D']);
  if (market === 'double_chance_x2' || dcToken === 'x2') return new Set(['D', 'A']);
  if (market === 'double_chance_12' || dcToken === '12') return new Set(['H', 'A']);

  return null;
}

function totalDescriptor(selection) {
  const { market, prediction } = normalizeSelection(selection);
  const key = market || prediction;
  const match = key.match(/^(over|under)_(\d+)_(\d+)$/);
  if (!match) return null;
  return { side: match[1], line: Number(match[2] + '.' + match[3]) };
}

function bttsDescriptor(selection) {
  const { market, prediction } = normalizeSelection(selection);
  if (market === 'btts_yes' || (market === 'btts' && prediction === 'yes')) return 'YES';
  if (market === 'btts_no' || (market === 'btts' && prediction === 'no')) return 'NO';
  return null;
}

function arePublishedMarketsLogicallyCompatible(a, b) {
  const A = normalizeSelection(a);
  const B = normalizeSelection(b);

  if (!A.market || !B.market) return true;
  if (A.market === B.market && A.prediction && B.prediction && A.prediction !== B.prediction) return false;

  const resultA = resultSet(A);
  const resultB = resultSet(B);
  if (resultA && resultB) {
    for (const outcome of resultA) if (resultB.has(outcome)) return true;
    return false;
  }

  const bttsA = bttsDescriptor(A);
  const bttsB = bttsDescriptor(B);
  if (bttsA && bttsB) return bttsA === bttsB;

  const totalA = totalDescriptor(A);
  const totalB = totalDescriptor(B);
  if (totalA && totalB) {
    if (totalA.side === totalB.side) return true;
    const over = totalA.side === 'over' ? totalA : totalB;
    const under = totalA.side === 'under' ? totalA : totalB;
    return over.line < under.line;
  }

  // Different independent market families are compatible unless a specific
  // governed logical contradiction is proven. Correlation is not contradiction.
  return true;
}

function validatePublishedMarketSet(markets = []) {
  const valid = [];
  const conflicts = [];
  for (const candidate of Array.isArray(markets) ? markets : []) {
    const conflicting = valid.find(existing => !arePublishedMarketsLogicallyCompatible(existing, candidate));
    if (conflicting) {
      conflicts.push({ existing: conflicting, candidate, reason: 'LOGICAL_CONTRADICTION' });
    } else {
      valid.push(candidate);
    }
  }
  return { is_valid: conflicts.length === 0, valid, conflicts };
}

module.exports = {
  ONE_X_TWO_STRONG_MIN,
  ONE_X_TWO_REVIEW_MIN,
  REVIEW_MIN_INDEPENDENT_SUPPORTS,
  MARKET_FAMILY_ORDER,
  evaluate1X2Publication,
  arePublishedMarketsLogicallyCompatible,
  validatePublishedMarketSet
};
