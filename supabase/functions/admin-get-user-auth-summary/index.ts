/**
 * Edge Function: admin-get-user-auth-summary
 *
 * Busca resumo de autenticação de um usuário (apenas para admins)
 *
 * @security Requer role admin ou super_admin
 * @rateLimit 200 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  auditLog,
  errorResponse,
  getAllSecurityHeaders,
  getAuditInfo,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';
import { validateBody, getUserSchema, validationErrorResponse, type GetUserBody } from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_METHODS = 'POST, OPTIONS';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  // 1. Autenticação e autorização centralizadas
  const rateLimitResponse = await rateLimitMiddleware(req, 200, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId: requesterId } = auth;

  // 2. Validar body
  const rawBody = await readJsonBody<GetUserBody>(req, {
    maxBytes: 4096,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const validation = validateBody<GetUserBody>(rawBody.data, getUserSchema);
  if (!validation.ok) {
    return validationErrorResponse(validation.errors, ALLOWED_METHODS, req);
  }
  const { userId } = validation.data!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: authData, error: authGetError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authGetError) {
      if (authGetError.message.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) },
        );
      }
      throw authGetError;
    }

    const u = authData.user;

    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_get_user_auth_summary',
      resource: 'users',
      status: 'success',
      details: { targetUserId: userId },
      ...getAuditInfo(req),
    });

    return new Response(
      JSON.stringify({
        summary: {
          userId: u.id,
          email: u.email,
          emailConfirmed: !!u.email_confirmed_at,
          emailConfirmedAt: u.email_confirmed_at,
          phone: u.phone,
          phoneConfirmed: !!u.phone_confirmed_at,
          phoneConfirmedAt: u.phone_confirmed_at,
          createdAt: u.created_at,
          lastSignInAt: u.last_sign_in_at,
          confirmedAt: u.confirmed_at,
          identities: u.identities?.map((identity: { provider: string; created_at: string; last_sign_in_at: string }) => ({
            provider: identity.provider,
            createdAt: identity.created_at,
            lastSignInAt: identity.last_sign_in_at,
          })) ?? [],
          factors: u.factors?.map((factor: { id: string; factor_type: string; status: string; created_at: string; updated_at: string }) => ({
            id: factor.id,
            factorType: factor.factor_type,
            status: factor.status,
            createdAt: factor.created_at,
            updatedAt: factor.updated_at,
          })) ?? [],
          hasMFA: (u.factors?.length ?? 0) > 0,
          appMetadata: u.app_metadata,
          userMetadata: u.user_metadata,
        },
      }),
      { status: 200, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_get_user_auth_summary_error',
      resource: 'users',
      status: 'failure',
      details: { error: message, targetUserId: userId },
      ...getAuditInfo(req),
    });
    return errorResponse('Internal server error', 500, error);
  }
});
