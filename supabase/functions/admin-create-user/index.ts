/**
 * Edge Function: admin-create-user
 *
 * Cria novo usuário (apenas para super_admin).
 * A criação de auth.users dispara o lifecycle canônico de signup, que cria o
 * Profile pessoal e a role `user`. Esta função apenas ajusta a identidade pelo
 * command canônico de Profile e adiciona uma role extra quando solicitada.
 *
 * @security Requer role super_admin
 * @rateLimit 10 req/min
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
import { requireSuperAdmin } from '../_shared/adminAuth.ts';
import {
  validateBody,
  createUserSchema,
  validationErrorResponse,
  type CreateUserBody,
} from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ALLOWED_METHODS = 'POST, OPTIONS';

type ProfileCommandResult = {
  success?: boolean;
  data?: {
    profile_id?: string;
    username?: string;
  };
  error?: string;
};

function conflictResponse(message: string, req: Request): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 409,
    headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
  });
}

function isEmailConflict(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === 'email_exists' || error.code === 'user_already_exists') return true;
  const message = error.message?.toLowerCase() ?? '';
  return message.includes('already') && (message.includes('email') || message.includes('registered'));
}

function isUsernameConflict(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('username already in use') ||
    normalized.includes('reserved username') ||
    normalized.includes('invalid username format')
  );
}

async function rollbackCreatedUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  // profiles e user_roles possuem FK ON DELETE CASCADE para auth.users.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Failed to rollback created auth user: ${error.message}`);
  }
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

  const rateLimitResponse = await rateLimitMiddleware(req, 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireSuperAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId: requesterId } = auth;

  const rawBody = await readJsonBody<CreateUserBody>(req, {
    maxBytes: 8192,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const validation = validateBody<CreateUserBody>(rawBody.data, createUserSchema);
  if (!validation.ok) {
    return validationErrorResponse(validation.errors, ALLOWED_METHODS, req);
  }
  const { email, password, username, fullName, role } = validation.data!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Auth é a autoridade atômica para unicidade de e-mail; não enumeramos usuários.
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username },
    });

    if (userError) {
      if (isEmailConflict(userError)) {
        return conflictResponse('Email already exists', req);
      }
      throw userError;
    }

    const newUserId = userData.user.id;

    // handle_new_user é o único creator do Profile inicial. Reutilizamos esse
    // Profile em vez de criar uma segunda identidade para a mesma conta.
    const { data: triggerProfile, error: triggerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', newUserId)
      .eq('profile_type', 'personal')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (triggerProfileError || !triggerProfile?.id) {
      await rollbackCreatedUser(supabaseAdmin, newUserId);
      throw triggerProfileError ?? new Error('Canonical signup profile was not created');
    }

    const { data: profileCommandRaw, error: profileCommandError } =
      await supabaseAdmin.rpc('profile_rpc_update_owned_profile', {
        p_actor_user_id: newUserId,
        p_profile_id: triggerProfile.id,
        p_patch: {
          name: fullName,
          display_name: fullName,
        },
        p_new_username: username,
      });

    const profileCommand = profileCommandRaw as ProfileCommandResult | null;
    if (profileCommandError || profileCommand?.success !== true) {
      const commandMessage =
        profileCommandError?.message ??
        profileCommand?.error ??
        'Canonical profile update failed';
      await rollbackCreatedUser(supabaseAdmin, newUserId);
      if (isUsernameConflict(commandMessage)) {
        return conflictResponse('Username is unavailable', req);
      }
      throw new Error(commandMessage);
    }

    // O trigger já cria `user`. Somente uma role adicional precisa ser gravada.
    if (role !== 'user') {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role,
          role_enum: role,
          granted_by: requesterId,
          reason: 'Role atribuída por super_admin no cadastro administrativo',
        });

      if (roleError) {
        await rollbackCreatedUser(supabaseAdmin, newUserId);
        throw roleError;
      }
    }

    const { data: newUserData } = await supabaseAdmin.auth.admin.getUserById(newUserId);
    const { data: newProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', triggerProfile.id)
      .single();
    const { data: newRoles } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', newUserId);

    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_create_user',
      resource: 'users',
      status: 'success',
      details: {
        email,
        username,
        role,
        newUserId,
        profileId: profileCommand.data?.profile_id ?? triggerProfile.id,
      },
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
      { status: 201, headers: getAllSecurityHeaders(ALLOWED_METHODS, req) },
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
