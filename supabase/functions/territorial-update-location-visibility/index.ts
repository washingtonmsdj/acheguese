/**
 * Edge Function: territorial-update-location-visibility
 *
 * Authenticated admin gateway for canonical territorial visibility flags.
 * The database RPC owns the mutation transaction and the recursive descendant
 * cascade. This Edge owns authentication/MFA, input validation and audit.
 *
 * IMPORTANT: deploy this source only together with the promoted
 * `territorial_update_location_visibility` migration.
 *
 * @security Requer role admin ou super_admin + MFA/AAL2 via requireAdmin
 * @rateLimit 100 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  isValidUUID,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';

interface UpdateLocationVisibilityRequest {
  locationId?: string;
  id?: string;
  flag: CanonicalVisibilityFlag;
  value: boolean;
}

type CanonicalVisibilityFlag = 'is_selector_active' | 'is_landing_enabled' | 'is_navigable';
type JsonRecord = Record<string, unknown>;

const ALLOWED_METHODS = 'POST, OPTIONS';

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCanonicalFlag(flag: UpdateLocationVisibilityRequest['flag']): CanonicalVisibilityFlag | null {
  if (flag === 'is_selector_active' || flag === 'is_landing_enabled' || flag === 'is_navigable') {
    return flag;
  }

  return null;
}

function rpcReason(errorMessage: string): 'location_not_found' | 'invalid_request' | null {
  if (errorMessage.includes('location_not_found')) return 'location_not_found';
  if (
    errorMessage.includes('invalid_location_id') ||
    errorMessage.includes('invalid_actor_user_id') ||
    errorMessage.includes('invalid_visibility_flag') ||
    errorMessage.includes('invalid_visibility_value')
  ) {
    return 'invalid_request';
  }
  return null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rl = await rateLimitMiddleware(req, 100, 60_000);
  if (rl) return rl;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const rawBody = await readJsonBody<UpdateLocationVisibilityRequest>(req, {
    maxBytes: 4_096,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const body = rawBody.data;
  const locationId = body.locationId ?? body.id;
  const canonicalFlag = normalizeCanonicalFlag(body.flag);

  if (!locationId || !isValidUUID(locationId)) {
    return jsonResponse({ error: 'Invalid location ID' }, 400, ALLOWED_METHODS, req);
  }

  if (!canonicalFlag) {
    return jsonResponse(
      { error: 'Invalid flag. Must be a canonical visibility flag' },
      400,
      ALLOWED_METHODS,
      req,
    );
  }

  if (typeof body.value !== 'boolean') {
    return jsonResponse(
      { error: 'Invalid value. Must be boolean' },
      400,
      ALLOWED_METHODS,
      req,
    );
  }

  try {
    const supabaseAdmin = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await supabaseAdmin.rpc(
      'territorial_update_location_visibility',
      {
        p_location_id: locationId,
        p_flag: canonicalFlag,
        p_value: body.value,
        p_actor_user_id: userId,
      },
    );

    if (error) {
      const reason = rpcReason(error.message);
      if (reason === 'location_not_found') {
        return jsonResponse({ error: 'Location not found' }, 404, ALLOWED_METHODS, req);
      }
      if (reason === 'invalid_request') {
        return jsonResponse({ error: 'Invalid request' }, 400, ALLOWED_METHODS, req);
      }
      throw error;
    }

    if (!isRecord(data) || !isRecord(data.location)) {
      throw new Error('Transactional visibility RPC returned an invalid acknowledgement');
    }

    const updatedLocation = data.location;
    const metadata = isRecord(updatedLocation.metadata) ? updatedLocation.metadata : null;
    const affectedCount = data.affectedCount;
    const cascaded = data.cascaded;
    const shouldCascade = canonicalFlag === 'is_selector_active' && body.value === false;

    if (
      updatedLocation.id !== locationId ||
      !metadata ||
      metadata[canonicalFlag] !== body.value ||
      typeof affectedCount !== 'number' ||
      !Number.isSafeInteger(affectedCount) ||
      affectedCount < 1 ||
      cascaded !== shouldCascade
    ) {
      throw new Error('Transactional visibility RPC acknowledgement mismatch');
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'territorial_update_location_visibility',
      resource: 'territorial-update-location-visibility',
      status: 'success',
      details: {
        locationId,
        flag: canonicalFlag,
        value: body.value,
        affectedCount,
        cascaded,
      },
      ...getAuditInfo(req),
    });

    return jsonResponse(
      {
        success: true,
        location: updatedLocation,
        affectedCount,
        cascaded,
      },
      200,
      ALLOWED_METHODS,
      req,
    );
  } catch (error) {
    console.error('Error in territorial-update-location-visibility:', error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId,
      action: 'territorial_update_location_visibility',
      resource: 'territorial-update-location-visibility',
      status: 'failure',
      details: { locationId, flag: canonicalFlag, reason: 'transactional_update_failed' },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: 'Internal server error' }, 500, ALLOWED_METHODS, req);
  }
});
