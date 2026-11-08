'use strict';

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireSupabaseUser } = require('../middleware/supabaseJwt');

const router = express.Router();

console.log('[cricketCount] Router loaded successfully');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
);

// Status mapping for tolerant filtering
const STATUS_MAP = {
    completed: ['complete', 'completed', 'finished', 'ft', 'stumps', 'abandoned', 'cancelled', 'canceled'],
    active: ['active', 'live', 'in progress', 'in_progress', 'started'],
    upcoming: ['upcoming', 'scheduled', 'not started', 'not_started', 'pre-match', 'prematch', 'preview']
};

function getStatusCategory(status) {
    const normalized = String(status || '').toLowerCase();
    
    for (const [category, values] of Object.entries(STATUS_MAP)) {
        if (values.some(value => normalized.includes(value))) {
            return category;
        }
    }
    
    return 'unknown';
}

function filterByStatus(data, statusFilter) {
    if (!data || !Array.isArray(data)) return [];
    
    return data.filter(row => {
        const statusCategory = getStatusCategory(row.status);
        const kickoffMs = row.start_time ? new Date(row.start_time).getTime() : NaN;
        const nowMs = Date.now();
        const hasFutureKickoff = Number.isFinite(kickoffMs) && kickoffMs >= (nowMs - (15 * 60 * 1000));
        
        switch (statusFilter) {
            case 'active':
                return statusCategory === 'active' || statusCategory === 'upcoming' || (statusCategory === 'unknown' && hasFutureKickoff);
            case 'upcoming':
                return statusCategory === 'upcoming' || (statusCategory === 'unknown' && hasFutureKickoff);
            case 'complete':
                return statusCategory === 'completed';
            case 'all':
                return true;
            default:
                return statusCategory === 'active' || statusCategory === 'upcoming' || (statusCategory === 'unknown' && hasFutureKickoff);
        }
    });
}

// Cricket count endpoint
router.get('/', requireSupabaseUser, async (req, res) => {
    console.log('[cricket-count] Route hit successfully');
    try {
        const status = String(req.query.status || 'active').trim().toLowerCase();
        const includeExpired = String(req.query.include_expired || '').trim() === '1';

        let query = supabase
            .from('cricket_insights_final')
            .select('*')
            .eq('sport', 'cricket');
        
        if (!includeExpired) {
            query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[cricket-count] query failed:', error.message);
            return res.status(500).json({ error: 'Failed to load cricket count', details: error.message });
        }

        const allData = data || [];
        const filtered = filterByStatus(allData, status);
        
        // Count direct market insights for cricket
        const directCount = filtered.filter(row => 
            String(row.market_group || '').toLowerCase() === 'direct'
        ).length;

        return res.json({
            ok: true,
            sport: 'cricket',
            status: status,
            direct_count: directCount,
            total_count: filtered.length
        });
    } catch (err) {
        console.error('[cricket-count] failed:', err);
        return res.status(500).json({ error: 'Failed to load cricket count', details: err.message });
    }
});

module.exports = router;
