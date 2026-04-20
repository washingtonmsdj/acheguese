/**
 * Edge Function: admin-list-users
 *
 * Lista usuários com paginação (apenas para admins)
 *
 * @security Requer role admin ou super_admin
 * @rateLimit 100 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, auditLog, getAuditInfo } from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';
import { validateBody, listUsersSchema, validationErrorResponse, type ListUsersBody } from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null | undefined;
  email_confirmed_at: string | null | undefined;
  profiles: unknown[];
  roles: unknown[];
}

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
  const validation = validateBody<ListUsersBody>(rawBody, listUsersSchema);
  if (!validation.ok) {
    return validationErrorResponse(validation.errors, getAllSecurityHeaders());
  }
  const { page = 0, pageSize = 20, search } = validation.data!;

  if (pageSize < 1 || pageSize > 100) {
    return new Response(
      JSON.stringify({ error: 'pageSize must be between 1 and 100' }),
      { status: 400, headers: getAllSecurityHeaders() },
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 3. Buscar usuários do auth
    const { data: authData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
      page: page + 1,
      perPage: pageSize,
    });

    if (authListError) throw authListError;

    const users = authData.users ?? [];
    const userIds = users.map((u: { id: string }) => u.id);

    // 4. Buscar perfis e roles em paralelo
    let profilesQuery = supabaseAdmin
      .from('profiles')
      .select('id, user_id, username, full_name, avatar_url, created_at')
      .in('user_id', userIds);

    if (search) {
      profilesQuery = profilesQuery.or(`username.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const [profilesResult, rolesResult] = await Promise.all([
      profilesQuery,
      supabaseAdmin
        .from('user_roles')
        .select('user_id, role_enum, granted_at')
        .in('user_id', userIds)
        .is('revoked_at', null),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (rolesResult.error) throw rolesResult.error;

    // 5. Combinar dados
    let adminUsers: AdminUser[] = users.map((authUser: {
      id: string;
      email?: string;
      created_at: string;
      last_sign_in_at?: string | null;
      email_confirmed_at?: string | null;
    }) => ({
      id: authUser.id,
      email: authUser.email ?? '',
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at,
      email_confirmed_at: authUser.email_confirmed_at,
      profiles: (profilesResult.data ?? []).filter((p: { user_id: string }) => p.user_id === authUser.id),
      roles: (rolesResult.data ?? []).filter((r: { user_id: string }) => r.user_id === authUser.id),
    }));

    // 6. Filtro de busca por email
    if (search) {
      const searchLower = search.toLowerCase();
      adminUsers = adminUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          (u.profiles as Array<{ username?: string; full_name?: string }>).some(
            (p) =>
              p.username?.toLowerCase().includes(searchLower) ||
              p.full_name?.toLowerCase().includes(searchLower),
          ),
      );
    }

    // 7. Audit log
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_list_users',
      resource: 'users',
      status: 'success',
      details: { page, pageSize, search, resultCount: adminUsers.length },
      ...getAuditInfo(req),
    });

    return new Response(
      JSON.stringify({
        users: adminUsers,
        total: authData.total ?? 0,
        page,
        pageSize,
      }),
      { status: 200, headers: getAllSecurityHeaders() },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_list_users_error',
      resource: 'users',
      status: 'failure',
      details: { error: message },
      ...getAuditInfo(req),
    });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: getAllSecurityHeaders() },
    );
  }
});
