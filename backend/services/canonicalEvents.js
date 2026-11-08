'use strict';

const { createClient } = require('@supabase/supabase-js');
const {
    CANONICAL_FOOTBALL_PROVIDER,
    evaluateCanonicalIngest,
    createEmptyFirewallStats,
    recordFirewallAccept,
    recordFirewallRejection
} = require('./canonicalIngestFirewall');

// Supabase client for Universal Intake Valve
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

function normalizeSport(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key) return 'unknown';

    if (key === 'soccer' || key === 'football' || key.startsWith('soccer_')) return 'Football';
    if (key === 'nba' || key === 'basketball' || key.startsWith('basketball_')) return 'Basketball';
    if (key === 'nfl' || key === 'american_football' || key.startsWith('americanfootball_')) return 'NFL';
    if (key === 'nhl' || key === 'hockey' || key.startsWith('icehockey_')) return 'NHL';
    if (key === 'mlb' || key === 'baseball' || key.startsWith('baseball_')) return 'MLB';
    if (key === 'rugby' || key.startsWith('rugbyunion_')) return 'Rugby';
    if (key === 'afl' || key.startsWith('aussierules_')) return 'AFL';
    if (key === 'volleyball') return 'Volleyball';
    if (key === 'handball') return 'Handball';
    if (key === 'f1' || key === 'formula1') return 'F1';
    if (key === 'mma') return 'MMA';
    if (key === 'golf') return 'Golf';
    if (key === 'boxing') return 'Boxing';
    if (key === 'tennis') return 'Tennis';
    if (key === 'cricket') return 'Cricket';
    if (key === 'esports') return 'Esports';
    if (key === 'darts') return 'Darts';

    return value;
}

function extractProviderEventId(item, payloadOverride = null) {
    const raw = payloadOverride || item?.raw_provider_data || {};
    const direct = raw?.fixture?.id || item?.match_id || raw?.id || raw?.game?.id || raw?.fight?.id || raw?.race?.id || null;
    return direct === null || typeof direct === 'undefined' ? null : String(direct);
}

function extractCompetitionName(item) {
    const raw = item?.raw_provider_data || {};
    return item?.league || raw?.league?.name || raw?.competition?.name || raw?.tournament?.name || 'Unknown Competition';
}

function extractSeason(item) {
    const raw = item?.raw_provider_data || {};
    const explicit = raw?.league?.season || raw?.season || item?.season || null;
    if (explicit !== null && typeof explicit !== 'undefined' && String(explicit).trim()) {
        return String(explicit);
    }

    const kickoff = item?.date || raw?.fixture?.date || raw?.date || raw?.game?.date || raw?.fight?.date || raw?.race?.date || null;
    if (kickoff) {
        const parsed = new Date(kickoff);
        if (!Number.isNaN(parsed.getTime())) {
            return String(parsed.getUTCFullYear());
        }
    }

    return 'unknown';
}

function extractStartTime(item) {
    const raw = item?.raw_provider_data || {};
    return item?.date || raw?.fixture?.date || raw?.date || raw?.game?.date || raw?.fight?.date || raw?.race?.date || null;
}

function extractStatus(item) {
    const raw = item?.raw_provider_data || {};
    return raw?.fixture?.status?.short || raw?.fixture?.status?.long || raw?.status?.long || raw?.game?.status?.long || item?.status || 'Not Started';
}

function extractProviderName(item) {
    return item?.provider_name || item?.provider || 'unknown';
}

function extractFieldsFromPayload(item, payload) {
    const merged = { ...item, raw_provider_data: payload };
    return {
        competitionName: extractCompetitionName(merged),
        season: extractSeason(merged),
        startTime: extractStartTime(merged),
        status: extractStatus(merged)
    };
}

/**
 * Upsert football canonical events — API-Sports fixture payloads only.
 * @see docs/canonical_ingest_firewall.spec.md
 * @returns {Promise<{ accepted: number, rejected: number, byReason: Record<string, number> }>}
 */
async function upsertCanonicalEvents(items = [], options = {}) {
    const stats = createEmptyFirewallStats();

    if (!supabase) {
        console.error('[canonicalEvents] Supabase client not initialized — cannot ingest events');
        return stats;
    }

    const rows = Array.isArray(items) ? items : [];
    const requireGoals = Boolean(options.requireGoals);
    const logRejections = options.logRejections !== false;

    for (const item of rows) {
        const gate = evaluateCanonicalIngest(item, {
            requireGoals,
            sport: item?.sport,
            allowSportsDataIo: Boolean(options.allowSportsDataIo)
        });

        if (!gate.accept || !gate.payload) {
            recordFirewallRejection(stats, gate.reason);
            if (logRejections) {
                console.warn(
                    '[canonicalFirewall] REJECT provider=%s reason=%s match_id=%s',
                    gate.provider || extractProviderName(item),
                    gate.reason,
                    item?.match_id || item?.raw_provider_data?.id || 'unknown'
                );
            }
            continue;
        }

        const payload = gate.payload;
        const providerEventId = extractProviderEventId(item, payload);
        const fields = extractFieldsFromPayload(item, payload);
        const startTime = fields.startTime;

        if (!providerEventId || !startTime) {
            recordFirewallRejection(stats, 'missing_fixture_id_or_kickoff');
            continue;
        }

        const cleanData = {
            p_provider_name: gate.provider || CANONICAL_FOOTBALL_PROVIDER,
            p_provider_event_id: providerEventId,
            p_sport: normalizeSport(item?.sport),
            p_competition_name: fields.competitionName,
            p_season: fields.season,
            p_start_time_utc: new Date(startTime).toISOString(),
            p_status: fields.status,
            p_raw_payload: payload
        };

        const { error } = await supabase.rpc('upsert_canonical_event', cleanData);

        if (error) {
            recordFirewallRejection(stats, `rpc_error:${error.message}`);
            console.error(`[canonicalFirewall] RPC failed ${cleanData.p_provider_event_id}:`, error.message);
        } else {
            recordFirewallAccept(stats);
            console.log(`[canonicalFirewall] ACCEPT fixture=${cleanData.p_provider_event_id} → canonical`);
        }
    }

    if (rows.length > 0) {
        console.log('[canonicalFirewall] summary', JSON.stringify(stats));
    }

    return stats;
}

module.exports = {
    upsertCanonicalEvents
};
