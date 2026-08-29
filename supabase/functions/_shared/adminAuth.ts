/**
 * ADMIN AUTH HELPER
 * Valida permissoes administrativas para Edge Functions.
 *
 * SSOT de decisao: public.get_user_roles(UUID), broker-only/service-role.
 * A funcao aplica o contrato canonico de validade de role: ativa, nao
 * revogada e nao expirada. Este adapter apenas autentica o bearer token e
 * transforma o resultado canonico em AdminAuthResult.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getAllSecurityHeaders,
  auditLog,
  getTrustedClientIp,
  errorResponse,
} from './security.ts';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminAuthResult {
  isAdmin: boolean;
  userId: string;
  role: AdminRole;
}

function getAdminAuditInfo(req: Request): { ip?: string; userAgent: string } {
  const ip = getTrustedClientIp(req);
  return {
    ...(ip ? { ip } : {}),
    userAgent: req.headers.get('user-agent') || 'unknown',
  };
}

export function getSupabaseAdminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function resolveAdminRole(roles: unknown): AdminRole | null {
  if (!Array.isArray(roles)) return null;
  if (roles.includes('super_admin')) return 'super_admin';
  if (roles.includes('admin')) return 'admin';
  return null;
}

/**
 * Valida se o request vem de um admin (admin ou super_admin).
 * Retorna AdminAuthResult em caso de sucesso, Response em caso de falha.
 */
export async function requireAdmin(req: Request): Promise<AdminAuthResult | Response> {
  const auditInfo = getAdminAuditInfo(req);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'admin_auth_failed',
        resource: req.url,
        status: 'failure',
        details: { reason: 'missing_auth_header' },
        ...auditInfo,
      });
      return errorResponse('Missing or invalid authorization header', 401);
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      auditLog({
        timestamp: new Date().toISOString(),
        action: 'admin_auth_failed',
        resource: req.url,
        status: 'failure',
        details: { reason: 'invalid_token', error: authError?.message },
        ...auditInfo,
      });
      return errorResponse('Invalid or expired token', 401);
    }

    const { data: roles, error: rolesError } = await supabase.rpc('get_user_roles', {
      _user_id: user.id,
    });

    if (rolesError) {
      return errorResponse('Failed to verify permissions', 500);
    }

    const adminRole = resolveAdminRole(roles);
    if (!adminRole) {
      auditLog({
        timestamp: new Date().toISOString(),
        userId: user.id,
        action: 'admin_auth_failed',
        resource: req.url,
        status: 'failure',
        details: { reason: 'insufficient_role' },
        ...auditInfo,
      });
      return errorResponse('Forbidden: Admin access required', 403);
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: user.id,
      action: 'admin_auth_success',
      resource: req.url,
      status: 'success',
      details: { role: adminRole },
      ...auditInfo,
    });

    return {
      isAdmin: true,
      userId: user.id,
      role: adminRole,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    auditLog({
      timestamp: new Date().toISOString(),
      action: 'admin_auth_error',
      resource: req.url,
      status: 'failure',
      details: { error: message },
      ...auditInfo,
    });
    return errorResponse('Authentication failed', 500);
  }
}

/** Variante que exige especificamente super_admin. */
export async function requireSuperAdmin(req: Request): Promise<AdminAuthResult | Response> {
  const result = await requireAdmin(req);
  if (result instanceof Response) return result;

  if (result.role !== 'super_admin') {
    return errorResponse('Forbidden: Super admin access required', 403);
  }

  return result;
}

export function jsonResponse(
  body: unknown,
  status = 200,
  methods = 'POST, OPTIONS',
  req?: Request,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: getAllSecurityHeaders(methods, req),
  });
}
