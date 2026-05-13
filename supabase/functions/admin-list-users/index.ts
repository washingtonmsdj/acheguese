/**
 * Edge Function: admin-list-users
 *
 * Lista usuarios com paginacao (apenas para admins).
 *
 * @security Requer role admin ou super_admin
 * @rateLimit 100 req/min
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllSecurityHeaders, getCorsHeaders, auditLog, getAuditInfo } from '../_shared/security.ts';
import { requireAdmin } from '../_shared/adminAuth.ts';
import { validateBody, listUsersSchema, validationErrorResponse, type ListUsersBody } from '../_shared/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface AdminUser {
  user_id: string;
  email: string;
  phone: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  primary_profile: AdminUserProfile;
  profiles: AdminUserProfile[];
  roles: string[];
}

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
  user_id: string;
  role_enum: string | null;
}

interface AuthUserRow {
  id: string;
  email?: string;
  phone?: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
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

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
    );
  }

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId: requesterId } = auth;

  const rawBody = await req.json();
  const validation = validateBody<ListUsersBody>(rawBody, listUsersSchema);
  if (!validation.ok) {
    return validationErrorResponse(validation.errors);
  }
  const { page = 0, pageSize = 20, search } = validation.data!;

  if (pageSize < 1 || pageSize > 100) {
    return new Response(
      JSON.stringify({ error: 'pageSize must be between 1 and 100' }),
      { status: 400, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
    );
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    let profilesPageQuery = supabaseAdmin
      .from('profiles')
      .select('id, user_id, profile_type, name, display_name, username, avatar_url, verified, is_active, is_suspended, suspended_until, suspension_reason, reputation, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (search) {
      const term = search.replaceAll('%', '').replaceAll(',', ' ').trim();
      profilesPageQuery = profilesPageQuery.or(`username.ilike.%${term}%,name.ilike.%${term}%,display_name.ilike.%${term}%`);
    }

    const profilesPageResult = await profilesPageQuery.range(page * pageSize, page * pageSize + pageSize - 1);

    if (profilesPageResult.error) throw profilesPageResult.error;

    const profilePageRows = (profilesPageResult.data ?? []) as ProfileRow[];
    const userIds = [...new Set(profilePageRows.map((profile) => profile.user_id))];

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ users: [], total: 0, page, pageSize }),
        { status: 200, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
      );
    }

    const [profilesResult, publicProfilesResult, rolesResult, authUsersResults] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, user_id, profile_type, name, display_name, username, avatar_url, verified, is_active, is_suspended, suspended_until, suspension_reason, reputation, created_at')
        .in('user_id', userIds),
      supabaseAdmin.from('public_profiles').select('id, city, neighborhood').in('user_id', userIds),
      supabaseAdmin
        .from('user_roles')
        .select('user_id, role_enum, granted_at')
        .in('user_id', userIds)
        .is('revoked_at', null),
      Promise.all(userIds.map((userId) => supabaseAdmin.auth.admin.getUserById(userId))),
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

    const authUserById = new Map<string, AuthUserRow>();
    authUsersResults.forEach((result, index) => {
      if (!result.error && result.data?.user) {
        authUserById.set(userIds[index], result.data.user as AuthUserRow);
      }
    });

    let adminUsers: AdminUser[] = userIds.map((userId) => {
      const profiles = ((profilesResult.data ?? []) as ProfileRow[])
        .filter((profile) => profile.user_id === userId)
        .map((profile) => mapProfile(profile, publicProfileById));

      const primaryProfile = choosePrimaryProfile(profiles);
      if (!primaryProfile) return null;

      const authUser = authUserById.get(userId);

      return {
        user_id: userId,
        email: authUser?.email ?? '',
        phone: authUser?.phone ?? '',
        created_at: authUser?.created_at ?? primaryProfile.created_at,
        last_sign_in_at: authUser?.last_sign_in_at ?? null,
        email_confirmed: Boolean(authUser?.email_confirmed_at ?? authUser?.confirmed_at),
        primary_profile: primaryProfile,
        profiles,
        roles: ((rolesResult.data ?? []) as RoleRow[])
          .filter((role) => role.user_id === userId && role.role_enum)
          .map((role) => role.role_enum as string),
      };
    }).filter((user): user is AdminUser => user !== null);

    if (search) {
      const searchLower = search.toLowerCase();
      adminUsers = adminUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.profiles.some(
            (profile) =>
              profile.username.toLowerCase().includes(searchLower) ||
              profile.name.toLowerCase().includes(searchLower),
          ),
      );
    }

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
        total: search ? adminUsers.length : (profilesPageResult.count ?? adminUsers.length),
        page,
        pageSize,
      }),
      { status: 200, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: 'admin_list_users_error',
      resource: 'users',
      status: 'failure',
      details: { error: message },
      ...getAuditInfo(req),
    });
    console.error('[admin-list-users]', message, error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: getAllSecurityHeaders('POST, OPTIONS', req) },
    );
  }
});
