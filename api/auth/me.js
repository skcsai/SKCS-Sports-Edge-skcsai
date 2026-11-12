'use strict';

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const TENANT_ID = '64b3d112-8a25-4baa-b999-cd356268cd2e';
const CLIENT_ID = 'a95e39bf-6d2c-469a-9f21-4eb3e404d988';
const EXPECTED_MICROSOFT_OBJECT_ID = '06aebbef-2448-42ba-a73c-008021f8b40b';
const EDGE_PROFILE_ID = '7dab62ea-8a25-42f7-9e28-032e7fa34a26';
const EXPECTED_EMAIL = 'sfynn13433@gmail.com';
const REQUIRED_SCOPE = 'access_as_user';
const AUTHORITY_HOST = 'skcsaicustomers.ciamlogin.com';
const METADATA_URL =
  'https://' + AUTHORITY_HOST + '/' + TENANT_ID + '/v2.0/.well-known/openid-configuration';

let cachedMetadata = null;
let cachedKeys = [];
let cachedAt = 0;

function extractBearer(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Identity metadata request failed');
  return response.json();
}

function validateMetadata(metadata) {
  const expectedIssuer =
    'https://' + TENANT_ID + '.ciamlogin.com/' + TENANT_ID + '/v2.0';
  const expectedPrefix = 'https://' + AUTHORITY_HOST + '/' + TENANT_ID + '/';
  if (
    metadata?.issuer !== expectedIssuer ||
    typeof metadata?.jwks_uri !== 'string' ||
    !metadata.jwks_uri.startsWith(expectedPrefix)
  ) {
    throw new Error('Identity metadata failed authority validation');
  }
  return metadata;
}

async function getMetadataAndKeys(force = false) {
  if (!force && cachedMetadata && cachedKeys.length && Date.now() - cachedAt < 15 * 60 * 1000) {
    return { metadata: cachedMetadata, keys: cachedKeys };
  }

  const metadata = validateMetadata(await fetchJson(METADATA_URL));
  const jwks = await fetchJson(metadata.jwks_uri);
  const keys = Array.isArray(jwks?.keys)
    ? jwks.keys.filter((key) => key?.kty === 'RSA' && key?.use === 'sig' && key?.kid)
    : [];
  if (!keys.length) throw new Error('No acceptable Microsoft signing keys');

  cachedMetadata = metadata;
  cachedKeys = keys;
  cachedAt = Date.now();
  return { metadata, keys };
}

async function validateMicrosoftToken(token) {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded?.header?.kid;
  const alg = decoded?.header?.alg;
  if (!kid || alg !== 'RS256') throw new Error('Unsupported token header');

  let { metadata, keys } = await getMetadataAndKeys(false);
  let jwk = keys.find((item) => item.kid === kid);
  if (!jwk) {
    ({ metadata, keys } = await getMetadataAndKeys(true));
    jwk = keys.find((item) => item.kid === kid);
  }
  if (!jwk) throw new Error('Signing key not found');

  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const claims = jwt.verify(token, key, {
    algorithms: ['RS256'],
    issuer: metadata.issuer,
    audience: CLIENT_ID,
    clockTolerance: 30
  });

  if (claims?.tid !== TENANT_ID) throw new Error('Wrong tenant');
  if (String(claims?.oid || '').toLowerCase() !== EXPECTED_MICROSOFT_OBJECT_ID) {
    const error = new Error('Microsoft customer is not linked for C13');
    error.statusCode = 403;
    throw error;
  }

  const scopes = new Set(String(claims?.scp || '').split(/\s+/).filter(Boolean));
  if (!scopes.has(REQUIRED_SCOPE)) throw new Error('Required scope missing');
  if (claims?.azp && claims.azp !== CLIENT_ID) throw new Error('Unexpected authorized party');
  if (claims?.ver && claims.ver !== '2.0') throw new Error('Unexpected token version');

  return claims;
}

function getSupabaseAdmin() {
  const url = String(process.env.SUPABASE_URL || '').trim();
  const serviceKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || ''
  ).trim();
  if (!url || !serviceKey) throw new Error('Server-side profile store is not configured');

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.status(405).json({ authenticated: false, error: 'Method not allowed' });
    return;
  }

  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ authenticated: false, error: 'Microsoft access token required' });
    return;
  }

  try {
    const claims = await validateMicrosoftToken(token);
    const supabase = getSupabaseAdmin();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'id,email,subscription_status,is_test_user,plan_id,plan_tier,plan_expires_at,created_at'
      )
      .eq('id', EDGE_PROFILE_ID)
      .maybeSingle();

    if (error) throw new Error('Live Edge profile read failed');
    if (!profile) {
      res.status(403).json({ authenticated: false, error: 'Linked Edge profile not found' });
      return;
    }

    if (
      String(profile.id || '').toLowerCase() !== EDGE_PROFILE_ID ||
      String(profile.email || '').toLowerCase() !== EXPECTED_EMAIL ||
      profile.subscription_status !== 'active' ||
      profile.plan_id !== 'elite_30day_deep_vip' ||
      profile.plan_tier !== 'elite'
    ) {
      res.status(403).json({ authenticated: false, error: 'Linked Edge profile failed access guard' });
      return;
    }

    res.status(200).json({
      authenticated: true,
      duplicate_profile_created: false,
      linkage: {
        microsoft_tenant_id: TENANT_ID,
        microsoft_object_id: claims.oid,
        edge_profile_id: profile.id,
        source_auth_user_id: profile.id,
        email_used_for_runtime_lookup: false
      },
      profile: {
        email: profile.email,
        subscription_status: profile.subscription_status,
        is_test_user: profile.is_test_user,
        plan_id: profile.plan_id,
        plan_tier: profile.plan_tier,
        plan_expires_at: profile.plan_expires_at,
        profile_created_at: profile.created_at,
        identity_provider: 'microsoft-entra-external-id',
        is_admin: false
      }
    });
  } catch (error) {
    const status = Number(error?.statusCode) === 403 ? 403 : 401;
    res.status(status).json({
      authenticated: false,
      error: status === 403
        ? 'Microsoft customer is not linked for C13'
        : 'Invalid or expired Microsoft access token'
    });
  }
};
