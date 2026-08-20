/**
 * Edge Function: admin-list-users
 *
 * Lista usuarios com paginacao (apenas para admins).
 *
 * @security Requer role admin ou super_admin
 * @rateLimit 100 req/min
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  auditLog,
  getAllSecurityHeaders,
  getCorsHeaders,
  getAuditInfo,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";
import {
  validateBody,
  listUsersSchema,
  validationErrorResponse,
  type ListUsersBody,
} from "../_shared/validation.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_METHODS = "POST, OPTIONS";

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

interface UserAccountContextRow {
  user_id: string | null;
  total_count: number | string;
  profiles: unknown;
  roles: unknown;
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseAccountProfiles(value: unknown): AdminUserProfile[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.id !== "string") return [];
    if (!isUuid(candidate.id)) return [];

    const reputation = Number(candidate.reputation ?? 0);
    return [
      {
        id: candidate.id,
        profile_type: optionalString(candidate.profile_type) ?? "personal",
        name:
          optionalString(candidate.name) ??
          optionalString(candidate.username) ??
          "Usuario",
        username: optionalString(candidate.username) ?? "",
        avatar_url: optionalString(candidate.avatar_url),
        public_neighborhood: optionalString(candidate.public_neighborhood),
        public_city: optionalString(candidate.public_city),
        verified: candidate.verified === true,
        is_active: candidate.is_active !== false,
        is_suspended: candidate.is_suspended === true,
        suspended_until: optionalString(candidate.suspended_until),
        suspension_reason: optionalString(candidate.suspension_reason),
        reputation: Number.isFinite(reputation) ? reputation : 0,
        created_at: optionalString(candidate.created_at) ?? "",
      },
    ];
  });
}

function parseAccountRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((role): role is string => typeof role === "string"),
    ),
  ];
}

function getErrorDiagnostic(error: unknown): {
  code: string;
  status: number | null;
} {
  if (!isRecord(error)) return { code: "unknown", status: null };
  return {
    code: typeof error.code === "string" ? error.code : "unknown",
    status: typeof error.status === "number" ? error.status : null,
  };
}

async function fetchAuthUsersById(
  supabaseAdmin: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<Map<string, AuthUserRow>> {
  const authUserById = new Map<string, AuthUserRow>();

  for (const userId of userIds) {
    if (!isUuid(userId)) continue;

    try {
      const result = await supabaseAdmin.auth.admin.getUserById(userId);
      if (result.error) {
        console.warn("[admin-list-users] failed to fetch auth user", {
          ...getErrorDiagnostic(result.error),
          userId,
        });
      } else if (result.data?.user) {
        authUserById.set(userId, result.data.user as AuthUserRow);
      }
    } catch (error: unknown) {
      console.warn("[admin-list-users] failed to fetch auth user", {
        ...getErrorDiagnostic(error),
        userId,
      });
    }
  }

  return authUserById;
}

function choosePrimaryProfile(
  profiles: AdminUserProfile[],
): AdminUserProfile | null {
  return (
    profiles.find((profile) => profile.profile_type === "personal") ??
    profiles[0] ??
    null
  );
}

function normalizeAdminUserSearch(value: string | undefined): string | null {
  if (!value) return null;

  const normalized = value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}@._\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);

  return normalized.length > 0 ? normalized : null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders("POST, OPTIONS", req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 100, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { userId: requesterId } = auth;

  const rawBody = await readJsonBody<ListUsersBody>(req, {
    maxBytes: 4096,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const validation = validateBody<ListUsersBody>(rawBody.data, listUsersSchema);
  if (!validation.ok) {
    return validationErrorResponse(validation.errors, ALLOWED_METHODS, req);
  }
  const { page = 0, pageSize = 20, search } = validation.data!;
  const normalizedSearch = normalizeAdminUserSearch(search);

  if (pageSize < 1 || pageSize > 100) {
    return new Response(
      JSON.stringify({ error: "pageSize must be between 1 and 100" }),
      { status: 400, headers: getAllSecurityHeaders("POST, OPTIONS", req) },
    );
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "[admin-list-users] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: getAllSecurityHeaders("POST, OPTIONS", req),
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const accountContextsResult = await supabaseAdmin.rpc(
      "admin_list_user_account_contexts",
      {
        p_page: page,
        p_page_size: pageSize,
        p_search: normalizedSearch,
      },
    );
    if (accountContextsResult.error) throw accountContextsResult.error;

    const accountRows = (accountContextsResult.data ??
      []) as UserAccountContextRow[];
    const userIds = accountRows
      .map((row) => row.user_id)
      .filter((userId): userId is string => Boolean(userId && isUuid(userId)));
    const total = Number(accountRows[0]?.total_count ?? 0);

    if (!Number.isSafeInteger(total) || total < 0) {
      throw new Error("Invalid account total returned by database");
    }

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ users: [], total, page, pageSize }),
        { status: 200, headers: getAllSecurityHeaders("POST, OPTIONS", req) },
      );
    }

    const accountContextById = new Map(
      accountRows
        .filter((row): row is UserAccountContextRow & { user_id: string } =>
          Boolean(row.user_id && isUuid(row.user_id)),
        )
        .map((row) => [row.user_id, row]),
    );

    const authUserById = await fetchAuthUsersById(supabaseAdmin, userIds);

    const adminUsers: AdminUser[] = userIds
      .map((userId) => {
        const context = accountContextById.get(userId);
        const profiles = parseAccountProfiles(context?.profiles);

        const primaryProfile = choosePrimaryProfile(profiles);
        if (!primaryProfile) return null;

        const authUser = authUserById.get(userId);

        return {
          user_id: userId,
          email: authUser?.email ?? "",
          phone: authUser?.phone ?? "",
          created_at: authUser?.created_at ?? primaryProfile.created_at,
          last_sign_in_at: authUser?.last_sign_in_at ?? null,
          email_confirmed: Boolean(
            authUser?.email_confirmed_at ?? authUser?.confirmed_at,
          ),
          primary_profile: primaryProfile,
          profiles,
          roles: parseAccountRoles(context?.roles),
        };
      })
      .filter((user): user is AdminUser => user !== null);

    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: "admin_list_users",
      resource: "users",
      status: "success",
      details: {
        page,
        pageSize,
        resultCount: adminUsers.length,
        searchApplied: normalizedSearch !== null,
      },
      ...getAuditInfo(req),
    });

    return new Response(
      JSON.stringify({
        users: adminUsers,
        total,
        page,
        pageSize,
      }),
      { status: 200, headers: getAllSecurityHeaders("POST, OPTIONS", req) },
    );
  } catch (error: unknown) {
    const diagnostic = getErrorDiagnostic(error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: requesterId,
      action: "admin_list_users_error",
      resource: "users",
      status: "failure",
      details: { errorCode: diagnostic.code, errorStatus: diagnostic.status },
      ...getAuditInfo(req),
    });
    console.error("[admin-list-users] request failed", diagnostic);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: getAllSecurityHeaders("POST, OPTIONS", req),
    });
  }
});
