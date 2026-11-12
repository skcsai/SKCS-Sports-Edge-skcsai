'use strict';

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const TENANT_ID = '64b3d112-8a25-4baa-b999-cd356268cd2e';
const CLIENT_ID = 'a95e39bf-6d2c-469a-9f21-4eb3e404d988';
const REQUIRED_SCOPE = 'access_as_user';
const AUTHORITY_HOST = 'skcsaicustomers.ciamlogin.com';
const METADATA_URL =
  'https://' + AUTHORITY_HOST + '/' + TENANT_ID + '/v2.0/.well-known/openid-configuration';

const EXPECTED_ISSUER =
  'https://' + TENANT_ID + '.ciamlogin.com/' + TENANT_ID + '/v2.0';

let cachedMetadata = null;
let cachedKeys = [];
let cachedAt = 0;

function getLinkedIdentityConfig(env = process.env) {
  const objectId = String(env.MICROSOFT_EDGE_EXPECTED_OBJECT_ID || '').trim().toLowerCase();
  const profileId = String(env.MICROSOFT_EDGE_PROFILE_ID || '').trim();
  const email = String(env.MICROSOFT_EDGE_EXPECTED_EMAIL || '').trim().toLowerCase();

  if (!objectId || !profileId || !email) {
    const error = new Error('Microsoft Edge linked identity is not configured');
    error.statusCode = 503;
    throw error;
  }

  return { objectId, profileId, email };
}

function isMicrosoftEdgeToken(token) {
  // The unverified issuer only selects the verifier. It grants no access.
  try {
    return jwt.decode(token)?.iss === EXPECTED_ISSUER;
  } catch {
    return false;
  }
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
  const expectedPrefix = 'https://' + AUTHORITY_HOST + '/' + TENANT_ID + '/';
  if (
    metadata?.issuer !== EXPECTED_ISSUER ||
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

  if (typeof claims.exp !== 'number') throw new Error('Token expiry is required');
  if (claims?.tid !== TENANT_ID) throw new Error('Wrong tenant');

  const linkedIdentity = getLinkedIdentityConfig();
  if (String(claims?.oid || '').toLowerCase() !== linkedIdentity.objectId) {
    const error = new Error('Microsoft customer is not linked to Edge');
    error.statusCode = 403;
    throw error;
  }

  const scopes = new Set(String(claims?.scp || '').split(/\s+/).filter(Boolean));
  if (!scopes.has(REQUIRED_SCOPE)) throw new Error('Required scope missing');
  if (claims?.azp && claims.azp !== CLIENT_ID) throw new Error('Unexpected authorized party');
  if (claims?.ver && claims.ver !== '2.0') throw new Error('Unexpected token version');

  return { id: linkedIdentity.profileId, email: linkedIdentity.email };
}

module.exports = { isMicrosoftEdgeToken, validateMicrosoftToken, getLinkedIdentityConfig };
