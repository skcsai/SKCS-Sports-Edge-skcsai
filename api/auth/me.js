'use strict';

const {
  validateMicrosoftToken,
  getLinkedIdentityConfig
} = require('../../backend/middleware/microsoftEdgeIdentity');
const { getProfileById } = require('../../backend/database');

const TENANT_ID = '64b3d112-8a25-4baa-b999-cd356268cd2e';

function extractBearer(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
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
    const linkedIdentity = getLinkedIdentityConfig();
    const verifiedUser = await validateMicrosoftToken(token);
    const profile = await getProfileById(verifiedUser.id);

    if (!profile) {
      res.status(403).json({ authenticated: false, error: 'Linked Edge profile not found' });
      return;
    }

    if (
      String(profile.id || '').toLowerCase() !== linkedIdentity.profileId.toLowerCase() ||
      String(profile.email || '').toLowerCase() !== linkedIdentity.email ||
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
        microsoft_object_id: linkedIdentity.objectId,
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
        ? 'Microsoft customer is not linked to Edge'
        : 'Invalid or expired Microsoft access token'
    });
  }
};
