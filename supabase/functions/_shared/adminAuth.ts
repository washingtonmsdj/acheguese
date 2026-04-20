/**
 * ADMIN AUTH HELPER
 * Valida permissões administrativas para edge functions
 *
 * SSOT: Tabela `user_roles` com campo `role_enum` (app_role)
 * Roles admin válidas: 'admin', 'super_admin'
 *
 * @see supabase/migrations/*_migrate_user_roles_to_new_structure.sql
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getAllSecurityHeaders,
  auditLog,
  getAuditInfo,
  errorResponse,
} from './security.ts';

export type AdminRole = 'admin' | 'super_admin';

export interface AdminAuthResult {
  isAdmin: boolean;
  userId: string;
  role: AdminRole;
}

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL');
  // Suporta novo formato (SUPABASE_SECRET_KEY) e legado (SUPABASE_SERVICE_ROLE_KEY)
  const key = Deno.env.get('SUPABASE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY env vars');
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Valida se o request vem de um admin (admin ou super_admin).
 * Retorna AdminAuthResult em caso de sucesso, Response em caso de falha.
 *
 * Uso:
 *   const auth = await requireAdmin(req);
 *   if (auth instanceof Response) return auth;
 *   const { userId, role } = auth;
 */
export async function requireAdmin(req: Request): Promise<AdminAuthResult | Response> {
  const auditInfo = getAuditInfo(req);

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
    const supabase = getSupabaseClient();

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

    // SSOT: verificar roles em user_roles
    // Verifica revoked_at IS NULL **e** is_active = true para garantir
    // que roles desativados (is_active=false) não concedam acesso admin.
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_enum')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('revoked_at', null);

    if (rolesError) {
      return errorResponse('Failed to verify permissions', 500);
    }

    const adminRole = roles?.find(
      (r: { role_enum: string }) => r.role_enum === 'admin' || r.role_enum === 'super_admin',
    );

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
      details: { role: adminRole.role_enum },
      ...auditInfo,
    });

    return {
      isAdmin: true,
      userId: user.id,
      role: adminRole.role_enum as AdminRole,
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

/**
 * Variante que exige especificamente super_admin.
 */
export async function requireSuperAdmin(req: Request): Promise<AdminAuthResult | Response> {
  const result = await requireAdmin(req);
  if (result instanceof Response) return result;

  if (result.role !== 'super_admin') {
    return errorResponse('Forbidden: Super admin access required', 403);
  }

  return result;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: getAllSecurityHeaders(),
  });
}
