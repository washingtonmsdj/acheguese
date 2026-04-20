/**
 * EDGE FUNCTION: admin-verify-profile
 * Verifica (badge) um perfil. Requer role admin (super_admin ou moderator).
 *
 * POST /functions/v1/admin-verify-profile
 * Body: { profile_id: string, reason?: string }
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
  sanitizeString,
} from '../_shared/security.ts';

interface VerifyRequest {
  profile_id: string;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  const auditInfo = getAuditInfo(req);
  const origin = req.headers.get('origin');

  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse({ error: 'Origin not allowed' }, 403);
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 204, 
      headers: getAllSecurityHeaders('POST, OPTIONS'),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(req, 20, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  // 1. Validar admin
  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  // 2. Parse body
  let body: VerifyRequest;
  try {
    body = await req.json();
  } catch {
    auditLog({
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      action: 'verify_profile_failed',
      resource: 'profiles',
      status: 'failure',
      details: { reason: 'invalid_json' },
      ...auditInfo,
    });
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  // 3. Validar entrada
  if (!body.profile_id?.trim() || !isValidUUID(body.profile_id)) {
    return jsonResponse({ error: 'Valid profile_id is required' }, 400);
  }

  const sanitizedReason = body.reason?.trim() 
    ? sanitizeString(body.reason, 500) 
    : null;

  // 4. Executar via service_role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc('verify_profile', {
    p_profile_id: body.profile_id,
    p_admin_user_id: authResult.userId,
    p_reason: sanitizedReason,
  });

  if (error) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      action: 'verify_profile_failed',
      resource: 'profiles',
      status: 'failure',
      details: { profileId: body.profile_id, error: error.message },
      ...auditInfo,
    });
    return jsonResponse({ error: 'Failed to verify profile' }, 500);
  }

  // Audit log de sucesso
  auditLog({
    timestamp: new Date().toISOString(),
    userId: authResult.userId,
    action: 'verify_profile',
    resource: 'profiles',
    status: 'success',
    details: { profileId: body.profile_id, reason: sanitizedReason },
    ...auditInfo,
  });

  return jsonResponse(data);
});

