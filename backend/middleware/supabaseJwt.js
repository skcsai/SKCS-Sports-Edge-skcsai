'use strict';

const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const { isMicrosoftEdgeToken, validateMicrosoftToken } = require('./microsoftEdgeIdentity');
const {
    getProfileById,
    getLatestSubscriptionByUserId,
    getActiveSubscriptionsByUserId,
    upsertProfile
} = require('../database');
const { getPlan, normalizePlanId } = require('../config/subscriptionPlans');
const { ACTIVE_SUBSCRIPTION_STATUSES, buildSubscriptionContext } = require('../services/subscriptionTiming');
const { resolveCanaryRequestPolicy } = require('../startupMode');
const canaryRequestPolicy = resolveCanaryRequestPolicy();

const hasSupabaseConfig =
    typeof config?.supabase?.url === 'string' && config.supabase.url.trim().length > 0 &&
    typeof config?.supabase?.anonKey === 'string' && config.supabase.anonKey.trim().length > 0;

const supabase = hasSupabaseConfig
    ? createClient(config.supabase.url, config.supabase.anonKey)
    : null;

function normalizeSportForAuthContract(value) {
    const key = String(value || '').trim().toLowerCase();
    if (!key || key === 'soccer') return 'football';
    return key;
}

function isPredictionsRequest(req) {
    const originalUrl = String(req?.originalUrl || '');
    const baseUrl = String(req?.baseUrl || '');
    const path = String(req?.path || '');
    return (
        originalUrl.startsWith('/api/predictions')
        || baseUrl === '/api/predictions'
        || path === '/api/predictions'
    );
}

function sendAuthError(req, res, statusCode, message) {
    if (isPredictionsRequest(req)) {
        const sport = normalizeSportForAuthContract(req?.query?.sport);
        return res.status(statusCode).json({
            ok: false,
            predictions: [],
            count: 0,
            sport,
            source: '/api/predictions',
            error: String(message || 'Authentication failed')
        });
    }
    return res.status(statusCode).json({ error: message });
}

function resolveAccessTierFromPlanId(planId) {
    const raw = String(planId || '').trim().toLowerCase();
    if (!raw) return null;

    const normalized = normalizePlanId(raw) || raw;
    if (normalized.includes('deep_vip') || normalized === 'vip_30day') {
        return 'vip';
    }

    const plan = getPlan(normalized);
    if (!plan) return null;
    return plan.tier === 'elite' ? 'elite' : 'core';
}

function resolveAccessContext({ activeSubscriptions = [], profilePlanId = null, isAdmin = false }) {
    if (isAdmin) {
        return {
            owned_tiers: ['core', 'elite', 'vip'],
            access_tiers: ['core', 'elite', 'vip'],
            subscription_plan_ids: [
                'CORE_FREE',
                'CORE_DAILY',
                'CORE_WEEKLY',
                'CORE_MONTHLY',
                'ELITE_DAILY',
                'ELITE_WEEKLY',
                'ELITE_MONTHLY',
                'VIP_30DAY'
            ]
        };
    }

    const plans = new Set();
    const ownedTiers = new Set();

    for (const row of Array.isArray(activeSubscriptions) ? activeSubscriptions : []) {
        const planId = normalizePlanId(row?.tier_id) || String(row?.tier_id || '').trim();
        if (!planId) continue;
        plans.add(planId);
        const tier = resolveAccessTierFromPlanId(planId);
        if (tier) ownedTiers.add(tier);
    }

    const normalizedProfilePlan = normalizePlanId(profilePlanId) || String(profilePlanId || '').trim();
    if (normalizedProfilePlan) {
        plans.add(normalizedProfilePlan);
        const tier = resolveAccessTierFromPlanId(normalizedProfilePlan);
        if (tier) ownedTiers.add(tier);
    }

    const accessTiers = new Set();
    if (ownedTiers.has('vip')) {
        accessTiers.add('vip');
        accessTiers.add('elite');
        accessTiers.add('core');
    }
    if (ownedTiers.has('elite')) {
        accessTiers.add('elite');
        accessTiers.add('core');
    }
    if (ownedTiers.has('core')) {
        accessTiers.add('core');
    }

    if (!ownedTiers.size) {
        ownedTiers.add('core');
        accessTiers.add('core');
        plans.add('CORE_FREE');
    }

    return {
        owned_tiers: Array.from(ownedTiers),
        access_tiers: Array.from(accessTiers),
        subscription_plan_ids: Array.from(plans)
    };
}

function requireSupabaseUser(req, res, next) {
    return requireUser(req, res, next, false);
}

function requirePredictionsUser(req, res, next) {
    return requireUser(req, res, next, true);
}

async function requireUser(req, res, next, allowMicrosoft) {
    const authHeader = String(req.headers['authorization'] || '').trim();
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = bearerMatch?.[1]?.trim() || '';
    const isMicrosoft = allowMicrosoft && isMicrosoftEdgeToken(token);

    if (!isMicrosoft && !supabase) {
        sendAuthError(req, res, 500, 'Supabase Auth is not configured (missing SUPABASE_URL / SUPABASE_ANON_KEY)');
        return;
    }

    if (!token) {
        sendAuthError(req, res, 401, 'Access token required');
        return;
    }

    try {
        let user;
        if (isMicrosoft) {
            user = await validateMicrosoftToken(token);
        } else {
            const { data, error } = await supabase.auth.getUser(token);
            if (error || !data?.user) {
                console.error('[SUPABASE_JWT] Token validation failed:', error?.message || 'Unknown error');
                sendAuthError(req, res, 401, 'Invalid or expired token');
                return;
            }
            user = data.user;
        }

        let profile = await getProfileById(user.id);
        if (isMicrosoft && (!profile || profile.email?.toLowerCase() !== user.email)) {
            sendAuthError(req, res, 403, 'Linked Edge profile not available');
            return;
        }
        if (!profile && (canaryRequestPolicy.readOnly || process.env.SKCS_C14_LINKED_SUBSCRIPTIONS === 'true')) {
            sendAuthError(req, res, 403, 'Linked Edge profile not available');
            return;
        }
        if (!profile) {
            profile = await upsertProfile({
                id: user.id,
                email: user.email,
                subscription_status: 'inactive',
                is_test_user: false
            });
        }

        const latestSubscription = await getLatestSubscriptionByUserId(user.id);
        const activeSubscriptions = await getActiveSubscriptionsByUserId(user.id, new Date());
        const subscriptionContext = buildSubscriptionContext({
            profile,
            subscription: latestSubscription,
            now: new Date()
        });

        const userMetadata = user.user_metadata && typeof user.user_metadata === 'object'
            ? user.user_metadata
            : {};
        const profileRole = String(profile?.role || '').trim().toLowerCase();
        const profileIsAdmin =
            profile?.is_admin === true
            || profileRole === 'admin';

        const accessContext = resolveAccessContext({
            activeSubscriptions,
            profilePlanId: subscriptionContext?.plan_id || profile?.plan_id || null,
            isAdmin: profileIsAdmin
        });
        const verificationStatus = String(
            profile?.verification_status
            || userMetadata?.verification_status
            || 'approved'
        ).trim().toLowerCase();
        const hasActiveSubscriptions = Array.isArray(activeSubscriptions) && activeSubscriptions.length > 0;

        req.user = {
            id: user.id,
            email: user.email,
            first_name: profile?.first_name || userMetadata?.first_name || null,
            last_name: profile?.last_name || userMetadata?.last_name || userMetadata?.surname || null,
            id_number: profile?.id_number || userMetadata?.id_number || null,
            phone: userMetadata?.phone || null,
            street: userMetadata?.street || null,
            town: userMetadata?.town || null,
            country: profile?.country || userMetadata?.country || null,
            role: profileIsAdmin ? 'admin' : (profileRole || 'user'),
            is_admin: profileIsAdmin,
            isAdmin: profileIsAdmin,
            verification_status: verificationStatus,
            id_document_uploaded: userMetadata?.id_document_uploaded === true,
            selfie_uploaded: userMetadata?.selfie_uploaded === true,
            active_subscriptions: activeSubscriptions,
            subscription_tiers: accessContext.owned_tiers,
            access_tiers: accessContext.access_tiers,
            subscription_plan_ids: accessContext.subscription_plan_ids,
            ...subscriptionContext,
            is_test_user: profile?.is_test_user === true
        };

        if (hasActiveSubscriptions && !ACTIVE_SUBSCRIPTION_STATUSES.has(req.user.subscription_status)) {
            req.user.subscription_status = 'active';
        }

        next();
    } catch (err) {
        console.error('[supabaseJwt] error:', err);
        sendAuthError(req, res, 401, 'Invalid or expired token');
    }
}

function isTestUserSubscriptionBypassEnabled() {
    const environment = String(process.env.NODE_ENV || '').trim().toLowerCase();
    const enabled = String(
        process.env.ALLOW_TEST_USER_SUBSCRIPTION_BYPASS || ''
    ).trim().toLowerCase() === 'true';

    return environment !== 'production' && enabled;
}

function requireActiveSubscription(req, res, next) {
    const user = req.user;

    if (!user) {
        res.status(401).json({ error: 'Access token required' });
        return;
    }

    if (user.is_admin === true || user.isAdmin === true) {
        next();
        return;
    }

    if (
        user.is_test_user === true
        && isTestUserSubscriptionBypassEnabled()
    ) {
        next();
        return;
    }

    if (!ACTIVE_SUBSCRIPTION_STATUSES.has(
        String(user.subscription_status || '').trim().toLowerCase()
    )) {
        res.status(403).json({ error: 'Active subscription required' });
        return;
    }

    next();
}

module.exports = {
    isTestUserSubscriptionBypassEnabled,
    requireSupabaseUser,
    requirePredictionsUser,
    requireActiveSubscription
};
