/**
 * Edge Function: admin-get-user
 *
 * Busca detalhes de um usuário específico (apenas para admins)
 *
 * @security Requer role admin ou super_admin
 * @rateLimit 200 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, auditLog, getAuditInfo, errorResponse } from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';
import { validateBody, getUserSchema, validationErrorResponse, type GetUserBody } from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders('POST, OPTIONS') });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: getAllSecurityHeaders() },
    );
  }

  // 1. Autenticação e autorização centralizadas
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId: requesterId } = auth;

  // 2. Validar body
  const rawBody = await req.json();
  const validation = validateBody<GetUserBody>(rawBody, getUserSchema);
  if (!validation.ok) {
    return validationErrorResponse(validation.errors);
  }
  const { userId } = validation.data!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 3. Buscar dados do auth
    const { data: authData, error: authGetError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authGetError) {
      if (authGetError.message.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: getAllSecurityHeaders() },
        );
      }
      throw authGetError;
    }

    // 4. Buscar perfis, roles e histórico em paralelo
    const [profilesResult, rolesResult, roleHistoryResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('user_id', userId),
      supabaseAdmin.from('user_roles').select('*').eq('user_id', userId).is('revoked_at', null),
      supabaseAdmin
        .from('role_history')
        .select('*')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false })
        .limit(10),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (rolesResult.error) throw rolesResult.error;

    // 5. Audit log
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_get_user',
      resource: 'users',
      status: 'success',
      details: { targetUserId: userId },
      ...getAuditInfo(req),
    });

    return new Response(
      JSON.stringify({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          created_at: authData.user.created_at,
          last_sign_in_at: authData.user.last_sign_in_at,
          email_confirmed_at: authData.user.email_confirmed_at,
          phone: authData.user.phone,
          confirmed_at: authData.user.confirmed_at,
          app_metadata: authData.user.app_metadata,
          user_metadata: authData.user.user_metadata,
          profiles: profilesResult.data ?? [],
          roles: rolesResult.data ?? [],
          role_history: roleHistoryResult.data ?? [],
        },
      }),
      { status: 200, headers: getAllSecurityHeaders() },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_get_user_error',
      resource: 'users',
      status: 'failure',
      details: { error: message, targetUserId: userId },
      ...getAuditInfo(req),
    });
    return errorResponse('Internal server error', 500, error);
  }
});
