'use strict';

const STORAGE_RESOURCE = 'https://storage.azure.com/';
const IDENTITY_API_VERSION = '2019-08-01';
const STORAGE_API_VERSION = '2023-11-03';

function required(value, label) {
  const text = String(value || '').trim();
  if (!text) throw new Error(label + ' missing');
  return text;
}

function validateLocation(account, container, blob) {
  if (!/^[a-z0-9]{3,24}$/.test(account)) throw new Error('Azure evidence account invalid');
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(container)) {
    throw new Error('Azure evidence container invalid');
  }
  if (!blob || blob.length > 1024 || blob.startsWith('/') || blob.includes('\\')) {
    throw new Error('Azure evidence blob path invalid');
  }
  if (blob.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error('Azure evidence blob path invalid');
  }
}

async function getManagedIdentityToken(fetchImpl = global.fetch) {
  if (typeof fetchImpl !== 'function') throw new Error('Managed identity fetch unavailable');
  const endpoint = required(process.env.IDENTITY_ENDPOINT, 'Managed identity endpoint');
  const identityHeader = required(process.env.IDENTITY_HEADER, 'Managed identity header');
  const clientId = required(
    process.env.AZURE_EVIDENCE_CLIENT_ID || process.env.AZURE_CLIENT_ID,
    'Managed identity client id'
  );

  const url = new URL(endpoint);
  url.searchParams.set('resource', STORAGE_RESOURCE);
  url.searchParams.set('api-version', IDENTITY_API_VERSION);
  url.searchParams.set('client_id', clientId);

  const response = await fetchImpl(url, {
    headers: { 'X-IDENTITY-HEADER': identityHeader },
    redirect: 'error',
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Managed identity token request failed');

  const payload = await response.json();
  if (typeof payload?.access_token !== 'string' || payload.access_token.length < 100) {
    throw new Error('Managed identity token missing');
  }
  return payload.access_token;
}

async function readPrivateBlob(
  { account, container, blob, maxBytes = 5 * 1024 * 1024 },
  fetchImpl = global.fetch
) {
  account = required(account, 'Azure evidence account');
  container = required(container, 'Azure evidence container');
  blob = required(blob, 'Azure evidence blob');

  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 10 * 1024 * 1024) {
    throw new Error('Azure evidence byte limit invalid');
  }
  validateLocation(account, container, blob);

  const token = await getManagedIdentityToken(fetchImpl);
  const encodedBlob = blob.split('/').map(encodeURIComponent).join('/');
  const url =
    `https://${account}.blob.core.windows.net/${encodeURIComponent(container)}/${encodedBlob}`;

  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-ms-version': STORAGE_API_VERSION,
      'x-ms-date': new Date().toUTCString()
    },
    redirect: 'error',
    signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error('Azure evidence blob read failed');

  const declared = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new Error('Azure evidence blob too large');
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1 || bytes.length > maxBytes) throw new Error('Azure evidence blob size invalid');
  return bytes;
}

module.exports = { readPrivateBlob, getManagedIdentityToken };
