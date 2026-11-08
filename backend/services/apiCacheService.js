'use strict';

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { Pool } = require('pg');
const {
    shouldAllow: circuitShouldAllow,
    recordFailure: circuitRecordFailure,
    recordSuccess: circuitRecordSuccess
} = require('../utils/providerCircuitBreaker');
const { reserveApiCall } = require('./apiQuotaRouter');

function sportKeyForProvider(providerName) {
    const key = String(providerName || '').toLowerCase();
    if (key.includes('cricket') || key.includes('cricapi') || key.includes('cricbuzz')) return 'cricket';
    if (key.includes('basketball')) return 'basketball';
    if (key.includes('baseball')) return 'baseball';
    if (key.includes('hockey')) return 'hockey';
    if (key.includes('rugby')) return 'rugby';
    if (key.includes('mma')) return 'mma';
    return 'football';
}

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
const pgPool = !supabase && DATABASE_URL
    ? new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })
    : null;
const RAPIDAPI_BYPASS_CACHE_WALL = ['1', 'true', 'yes'].includes(
    String(process.env.RAPIDAPI_BYPASS_CACHE_WALL || '').trim().toLowerCase()
);
const cacheMetrics = {
    hits: 0,
    misses: 0,
    writes: 0,
    errors: 0,
    bypasses: 0,
    circuitBlocked: 0
};

function normalizeForHash(value) {
    if (Array.isArray(value)) {
        return value.map(normalizeForHash);
    }

    if (value && typeof value === 'object' && value.constructor === Object) {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
                const normalized = normalizeForHash(value[key]);
                if (normalized !== undefined) {
                    acc[key] = normalized;
                }
                return acc;
            }, {});
    }

    return value;
}

function buildCacheKey(providerName, endpointUrl, params) {
    const paramString = JSON.stringify(normalizeForHash(params || {}));
    const hash = crypto
        .createHash('md5')
        .update(`${providerName}_${endpointUrl}_${paramString}`)
        .digest('hex');

    return `${providerName}_${hash}`;
}

function isNoRowsError(error) {
    if (!error) return false;
    const message = String(error.message || '').toLowerCase();
    return error.code === 'PGRST116' || message.includes('0 rows');
}

function isCacheWallReady() {
    return Boolean(supabase || pgPool);
}

function buildCircuitSignature(providerName, endpointUrl, headers) {
    const provider = String(providerName || '').trim() || 'unknown_provider';
    const endpoint = String(endpointUrl || '').trim() || 'unknown_endpoint';
    const host = String(headers?.['x-rapidapi-host'] || headers?.['X-RapidAPI-Host'] || '').trim() || 'unknown_host';
    return `${provider}|${host}|${endpoint}`;
}

async function readCache(cacheKey) {
    if (!supabase && !pgPool) return null;

    if (supabase) {
        const { data, error } = await supabase
            .from('rapidapi_cache')
            .select('payload, updated_at')
            .eq('cache_key', cacheKey)
            .maybeSingle();

        if (error && !isNoRowsError(error)) {
            console.warn('[Cache Wall] Cache read failed:', error.message);
            return null;
        }

        return data || null;
    }

    try {
        const result = await pgPool.query(`
            SELECT payload, updated_at
            FROM rapidapi_cache
            WHERE cache_key = $1
            LIMIT 1
        `, [cacheKey]);
        return result.rows?.[0] || null;
    } catch (error) {
        console.warn('[Cache Wall] Cache read failed:', error.message);
        return null;
    }
}

async function writeCache(cacheKey, providerName, payload) {
    if (!supabase && !pgPool) return;

    if (supabase) {
        const { error } = await supabase
            .from('rapidapi_cache')
            .upsert({
                cache_key: cacheKey,
                provider_name: providerName,
                payload,
                updated_at: new Date().toISOString()
            }, { onConflict: 'cache_key' });

        if (error) {
            console.warn('[Cache Wall] Cache upsert failed:', error.message);
            cacheMetrics.errors += 1;
        } else {
            cacheMetrics.writes += 1;
        }
        return;
    }

    try {
        await pgPool.query(`
            INSERT INTO rapidapi_cache (cache_key, provider_name, payload, updated_at)
            VALUES ($1, $2, $3::jsonb, NOW())
            ON CONFLICT (cache_key) DO UPDATE SET
                provider_name = EXCLUDED.provider_name,
                payload = EXCLUDED.payload,
                updated_at = NOW()
        `, [cacheKey, providerName, JSON.stringify(payload)]);
        cacheMetrics.writes += 1;
    } catch (error) {
        console.warn('[Cache Wall] Cache upsert failed:', error.message);
        cacheMetrics.errors += 1;
    }
}

/**
 * Universal fetcher with strict quota protection.
 * @param {string} providerName - e.g., 'sofascore', 'f1_motorsport', 'cricket_api'
 * @param {string} endpointUrl - Full RapidAPI URL
 * @param {object} headers - RapidAPI headers (Key and Host)
 * @param {object} params - Query parameters
 * @param {number} cacheDurationMinutes - How long before a fresh pull is allowed (minutes)
 * @returns {Promise<*>}
 */
async function fetchWithCache(
    providerName,
    endpointUrl,
    headers,
    params = {},
    cacheDurationMinutes = 1440,
    quotaOptions = null
) {
    const safeProvider = String(providerName || '').trim();
    const safeEndpoint = String(endpointUrl || '').trim();

    if (!safeProvider) throw new Error('providerName is required');
    if (!safeEndpoint) throw new Error('endpointUrl is required');

    const circuitSignature = buildCircuitSignature(safeProvider, safeEndpoint, headers);
    if (!circuitShouldAllow(circuitSignature)) {
        cacheMetrics.circuitBlocked += 1;
        console.warn(`[Cache Wall] Circuit breaker blocked call for ${safeProvider} (${circuitSignature})`);
        return null;
    }

    if (!supabase && !pgPool) {
        if (!RAPIDAPI_BYPASS_CACHE_WALL) {
            console.error(`[Cache Wall] Supabase is not configured. Blocking uncached RapidAPI request for ${safeProvider}.`);
            cacheMetrics.errors += 1;
            return null;
        }

        try {
            console.warn(`[Cache Wall] Bypass enabled. Making uncached RapidAPI request for ${safeProvider}.`);
            cacheMetrics.bypasses += 1;
            const gate = await reserveApiCall({
                sport: sportKeyForProvider(safeProvider),
                provider: safeProvider,
                source: `apiCacheService.bypass.${safeEndpoint}`
            });
            if (!gate.allowed) {
                return null;
            }
            const response = await axios.get(safeEndpoint, {
                headers,
                params,
                timeout: 15000
            });
            circuitRecordSuccess(circuitSignature);
            return response.data;
        } catch (error) {
            console.error(`[Cache Wall] Bypass fetch failed for ${safeProvider}:`, error.message);
            cacheMetrics.errors += 1;
            const status = Number(error?.response?.status || 0);
            if (status === 403 || status === 429) {
                circuitRecordFailure(circuitSignature, status);
            }
            return null;
        }
    }

    const cacheKey = buildCacheKey(safeProvider, safeEndpoint, params);

    try {
        const cachedData = await readCache(cacheKey);
        if (cachedData) {
            const cacheAgeMinutes = (Date.now() - new Date(cachedData.updated_at).getTime()) / (1000 * 60);
            if (cacheAgeMinutes < cacheDurationMinutes) {
                console.log(`[Cache Wall] quota saved via cache: ${safeProvider}`);
                cacheMetrics.hits += 1;
                return cachedData.payload;
            }
        }

        console.log(`[Cache Wall] cache miss/expired: ${safeProvider}. consuming 1 RapidAPI call.`);
        cacheMetrics.misses += 1;
        const gate = await reserveApiCall({
            sport: sportKeyForProvider(safeProvider),
            provider: safeProvider,
            source: `apiCacheService.${safeEndpoint}`
        });
        if (!gate.allowed) {
            return null;
        }
        const response = await axios.get(safeEndpoint, {
            headers,
            params,
            timeout: 15000
        });
        const payload = response.data;

        await writeCache(cacheKey, safeProvider, payload);
        circuitRecordSuccess(circuitSignature);

        return payload;
    } catch (error) {
        console.error(`[Cache Wall] Fetch failed for ${safeProvider}:`, error.message);
        cacheMetrics.errors += 1;
        const status = Number(error?.response?.status || 0);
        if (status === 403 || status === 429) {
            circuitRecordFailure(circuitSignature, status);
        }
        return null;
    }
}

function resetCacheMetrics() {
    cacheMetrics.hits = 0;
    cacheMetrics.misses = 0;
    cacheMetrics.writes = 0;
    cacheMetrics.errors = 0;
    cacheMetrics.bypasses = 0;
    cacheMetrics.circuitBlocked = 0;
}

function getCacheMetricsSnapshot() {
    return { ...cacheMetrics };
}

module.exports = {
    fetchWithCache,
    isCacheWallReady,
    resetCacheMetrics,
    getCacheMetricsSnapshot
};
