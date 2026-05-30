/**
 * EDGE FUNCTION: admin-suspend-profile
 * Suspende um perfil. Requer role admin (super_admin ou moderator).
 *
 * POST /functions/v1/admin-suspend-profile
 * Body: { profile_id: string, reason: string }
 * Headers: Authorization: Bearer <user_jwt>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdmin, jsonResponse } from '../_shared/adminAuth.ts';
import { 
  getAllSecurityHeaders,
  rateLimitMiddleware,
  auditLog,
  getAuditInfo,
  isOriginAllowed,
  isValidUUID,
  readJsonBody,
  requireHttpMethod,
  sanitizeString,
} from '../_shared/security.ts';

interface SuspendRequest {
  profile_id: string;
  reason: string;
}

const ALLOWED_METHODS = 'POST, OPTIONS';

Deno.serve(async (req: Request) => {
  const auditInfo = getAuditInfo(req);
  const origin = req.headers.get('origin');
  const respond = (body: unknown, status = 200) => jsonResponse(body, status, ALLOWED_METHODS, req);

  if (origin && !isOriginAllowed(origin)) {
    return respond({ error: 'Origin not allowed' }, 403);
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 204, 
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  // Rate limiting (mais restritivo para operações admin)
  const rateLimitResponse = await rateLimitMiddleware(req, 20, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  // 1. Validar admin
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  // 2. Parse body
  const rawBody = await readJsonBody<SuspendRequest>(req, {
    maxBytes: 4096,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      action: 'suspend_profile_failed',
      resource: 'profiles',
      status: 'failure',
      details: { reason: 'invalid_json' },
      ...auditInfo,
    });
    return rawBody.response;
  }
  const body = rawBody.data;

  // 3. Validar entrada
  if (!body.profile_id?.trim() || !isValidUUID(body.profile_id)) {
    return respond({ error: 'Valid profile_id is required' }, 400);
  }

  if (!body.reason?.trim()) {
    return respond({ error: 'reason is required for suspension' }, 400);
  }

  const sanitizedReason = sanitizeString(body.reason, 500);

  // 4. Executar via service_role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc('suspend_profile', {
    p_profile_id: body.profile_id,
    p_admin_user_id: authResult.userId,
    p_reason: sanitizedReason,
  });

  if (error) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      action: 'suspend_profile_failed',
      resource: 'profiles',
      status: 'failure',
      details: { profileId: body.profile_id, error: error.message },
      ...auditInfo,
    });
    return respond({ error: 'Failed to suspend profile' }, 500);
  }

  // Audit log de sucesso
  auditLog({
    timestamp: new Date().toISOString(),
    userId: authResult.userId,
    action: 'suspend_profile',
    resource: 'profiles',
    status: 'success',
    details: { profileId: body.profile_id, reason: sanitizedReason },
    ...auditInfo,
  });

  return respond(data);
});

