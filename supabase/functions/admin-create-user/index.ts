/**
 * Edge Function: admin-create-user
 *
 * Cria novo usuário (apenas para super_admin)
 *
 * @security Requer role super_admin
 * @rateLimit 10 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, auditLog, getAuditInfo, errorResponse } from '../_shared/security.ts';
import { requireSuperAdmin } from '../_shared/adminAuth.ts';
import { validateBody, createUserSchema, validationErrorResponse, type CreateUserBody } from '../_shared/validation.ts';

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
  const auth = await requireSuperAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId: requesterId } = auth;

  // 2. Validar body
  const rawBody = await req.json();
  const validation = validateBody<CreateUserBody>(rawBody, createUserSchema);
  if (!validation.ok) {
    return validationErrorResponse(validation.errors);
  }
  const { email, password, username, fullName, role } = validation.data!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 3. Verificar unicidade de email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUsers?.users.some((u: { email?: string }) => u.email === email)) {
      return new Response(
        JSON.stringify({ error: 'Email already exists' }),
        { status: 409, headers: getAllSecurityHeaders() },
      );
    }

    // 4. Verificar unicidade de username
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: 'Username already exists' }),
        { status: 409, headers: getAllSecurityHeaders() },
      );
    }

    // 5. Criar usuário no auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username },
    });

    if (userError) throw userError;

    const newUserId = userData.user.id;

    // 6. Criar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ user_id: newUserId, username, full_name: fullName });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    // 7. Atribuir role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUserId, role_enum: role, granted_by: requesterId });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId);
      throw roleError;
    }

    // 8. Buscar dados completos
    const { data: newUserData } = await supabaseAdmin.auth.admin.getUserById(newUserId);
    const { data: newProfile } = await supabaseAdmin
      .from('profiles').select('*').eq('user_id', newUserId).single();
    const { data: newRoles } = await supabaseAdmin
      .from('user_roles').select('*').eq('user_id', newUserId);

    // 9. Audit log
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_create_user',
      resource: 'users',
      status: 'success',
      details: { email, username, role, newUserId },
      ...getAuditInfo(req),
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUserId,
          email: newUserData?.user?.email,
          created_at: newUserData?.user?.created_at,
          email_confirmed_at: newUserData?.user?.email_confirmed_at,
          profiles: [newProfile],
          roles: newRoles,
        },
      }),
      { status: 201, headers: getAllSecurityHeaders() },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_create_user_error',
      resource: 'users',
      status: 'failure',
      details: { error: message },
      ...getAuditInfo(req),
    });
    return errorResponse('Internal server error', 500, error);
  }
});
