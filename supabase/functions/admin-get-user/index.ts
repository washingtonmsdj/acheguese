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
import {
  auditLog,
  getAllSecurityHeaders,
  getCorsHeaders,
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

interface AdminUserProfile {
  id: string;
  profile_type: string;
  name: string;
  username: string;
  avatar_url: string | null;
  public_neighborhood: string | null;
  public_city: string | null;
  verified: boolean;
  is_active: boolean;
  is_suspended: boolean;
  suspended_until: string | null;
  suspension_reason: string | null;
  reputation: number;
  created_at: string;
}

interface ProfileRow {
  id: string;
  user_id: string;
  profile_type: string | null;
  name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  is_active: boolean | null;
  is_suspended: boolean | null;
  suspended_until: string | null;
  suspension_reason: string | null;
  reputation: number | null;
  created_at: string | null;
}

interface PublicProfileRow {
  id: string | null;
  city: string | null;
  neighborhood: string | null;
}

interface RoleRow {
  role_enum: string | null;
}

function mapProfile(
  profile: ProfileRow,
  publicProfileById: Map<string, { public_city: string | null; public_neighborhood: string | null }>,
): AdminUserProfile {
  const publicProfile = publicProfileById.get(profile.id);

  return {
    id: profile.id,
    profile_type: profile.profile_type ?? 'personal',
    name: profile.display_name || profile.name || profile.username || 'Usuario',
    username: profile.username ?? '',
    avatar_url: profile.avatar_url,
    public_city: publicProfile?.public_city ?? null,
    public_neighborhood: publicProfile?.public_neighborhood ?? null,
    verified: profile.verified === true,
    is_active: profile.is_active !== false,
    is_suspended: profile.is_suspended === true,
    suspended_until: profile.suspended_until,
    suspension_reason: profile.suspension_reason,
    reputation: profile.reputation ?? 0,
    created_at: profile.created_at ?? '',
  };
}

function choosePrimaryProfile(profiles: AdminUserProfile[]): AdminUserProfile | null {
  return profiles.find((profile) => profile.profile_type === 'personal') ?? profiles[0] ?? null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders('POST, OPTIONS', req) });
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
    // 3. Buscar dados do auth
    const { data: authData, error: authGetError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authGetError) {
      if (authGetError.message.includes('not found')) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
        );
      }
      throw authGetError;
    }

    // 4. Buscar perfis, roles e histórico em paralelo
    const [profilesResult, publicProfilesResult, rolesResult, roleHistoryResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, user_id, profile_type, name, display_name, username, avatar_url, verified, is_active, is_suspended, suspended_until, suspension_reason, reputation, created_at')
        .eq('user_id', userId),
      supabaseAdmin
        .from('public_profiles')
        .select('id, city, neighborhood')
        .eq('user_id', userId),
      supabaseAdmin.from('user_roles').select('*').eq('user_id', userId).is('revoked_at', null),
      supabaseAdmin
        .from('role_history')
        .select('*')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false })
        .limit(10),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (publicProfilesResult.error) throw publicProfilesResult.error;
    if (rolesResult.error) throw rolesResult.error;

    const publicProfileById = new Map(
      ((publicProfilesResult.data ?? []) as PublicProfileRow[]).filter((profile) => profile.id).map((profile) => [
        profile.id as string,
        {
          public_city: profile.city,
          public_neighborhood: profile.neighborhood,
        },
      ]),
    );

    const profiles = ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => mapProfile(profile, publicProfileById));
    const primaryProfile = choosePrimaryProfile(profiles);

    if (!primaryProfile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found for user' }),
        { status: 404, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
      );
    }

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
          user_id: authData.user.id,
          email: authData.user.email ?? '',
          phone: authData.user.phone ?? '',
          created_at: authData.user.created_at,
          last_sign_in_at: authData.user.last_sign_in_at ?? null,
          email_confirmed: Boolean(authData.user.email_confirmed_at ?? authData.user.confirmed_at),
          app_metadata: authData.user.app_metadata,
          user_metadata: authData.user.user_metadata,
          primary_profile: primaryProfile,
          profiles,
          roles: ((rolesResult.data ?? []) as RoleRow[])
            .filter((role) => role.role_enum)
            .map((role) => role.role_enum as string),
          role_history: roleHistoryResult.data ?? [],
        },
      }),
      { status: 200, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
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
    console.error('[admin-get-user]', message, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
    );
  }
});
