/**
 * Edge Function: admin-role-rpc
 *
 * Server-authoritative writer for global role lifecycle. The browser may choose
 * the target user, role and business input (expiry/reason), but never the
 * administrative actor. `requireSuperAdmin` derives the actor from the JWT and
 * enforces the shared MFA/AAL2 policy before any mutation.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperAdmin } from "../_shared/adminAuth.ts";
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_REASON_LENGTH = 500;
const APP_ROLES = new Set([
  "super_admin",
  "admin",
  "moderator",
  "business_owner",
  "driver",
  "user",
]);
const ACTIONS = {
  grantRole: true,
  revokeRole: true,
  renewRole: true,
} as const;

type AdminRoleAction = keyof typeof ACTIONS;
// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

class ResourceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceConflictError";
  }
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function requireAppRole(value: unknown): string {
  if (typeof value !== "string" || !APP_ROLES.has(value)) {
    throw new RequestValidationError("Invalid role");
  }
  return value;
}

function optionalReason(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid reason");
  }
  const reason = value.trim();
  if (!reason || reason.length > MAX_REASON_LENGTH) {
    throw new RequestValidationError("Invalid reason");
  }
  return reason;
}

function optionalFutureTimestamp(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time <= Date.now()) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return new Date(time).toISOString();
}

function requiredFutureTimestamp(value: unknown, field: string): string {
  const timestamp = optionalFutureTimestamp(value, field);
  if (!timestamp) throw new RequestValidationError(`Invalid ${field}`);
  return timestamp;
}

async function ensureTargetUserExists(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new RequestValidationError("Target user not found");
  }
}

async function grantRole(
  supabaseAdmin: SupabaseClient,
  actorUserId: string,
  params: Record<string, unknown>,
) {
  const userId = requireUuid(params.userId, "userId");
  const role = requireAppRole(params.role);
  const expiresAt = optionalFutureTimestamp(params.expiresAt, "expiresAt");
  const reason = optionalReason(params.reason);

  await ensureTargetUserExists(supabaseAdmin, userId);

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .insert({
      user_id: userId,
      role,
      role_enum: role,
      granted_by: actorUserId,
      granted_at: now,
      expires_at: expiresAt,
      is_active: true,
      revoked_at: null,
      revoked_by: null,
      reason,
    })
    .select("id,user_id,role_enum,granted_by,granted_at,expires_at,is_active,revoked_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ResourceConflictError("Role is already active for this user");
    }
    throw error;
  }
  if (!data || data.user_id !== userId || data.role_enum !== role || data.granted_by !== actorUserId) {
    throw new Error("Role grant returned an invalid acknowledgement");
  }

  return {
    action: "grantRole" as const,
    userId,
    role,
    roleRecordId: data.id,
    expiresAt: data.expires_at ?? null,
  };
}

async function revokeRole(
  supabaseAdmin: SupabaseClient,
  actorUserId: string,
  params: Record<string, unknown>,
) {
  const userId = requireUuid(params.userId, "userId");
  const role = requireAppRole(params.role);
  const reason = optionalReason(params.reason);
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .update({
      is_active: false,
      revoked_at: now,
      revoked_by: actorUserId,
      reason,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("role_enum", role)
    .eq("is_active", true)
    .is("revoked_at", null)
    .select("id,user_id,role_enum,revoked_by,is_active,revoked_at")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestValidationError("Active role not found");
  if (
    data.user_id !== userId ||
    data.role_enum !== role ||
    data.revoked_by !== actorUserId ||
    data.is_active !== false ||
    !data.revoked_at
  ) {
    throw new Error("Role revocation returned an invalid acknowledgement");
  }

  return {
    action: "revokeRole" as const,
    userId,
    role,
    roleRecordId: data.id,
  };
}

async function renewRole(
  supabaseAdmin: SupabaseClient,
  params: Record<string, unknown>,
) {
  const userId = requireUuid(params.userId, "userId");
  const role = requireAppRole(params.role);
  const newExpiresAt = requiredFutureTimestamp(params.newExpiresAt, "newExpiresAt");
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .update({ expires_at: newExpiresAt, updated_at: now })
    .eq("user_id", userId)
    .eq("role_enum", role)
    .eq("is_active", true)
    .is("revoked_at", null)
    .select("id,user_id,role_enum,expires_at,is_active,revoked_at")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestValidationError("Active role not found");
  if (
    data.user_id !== userId ||
    data.role_enum !== role ||
    data.expires_at !== newExpiresAt ||
    data.is_active !== true ||
    data.revoked_at !== null
  ) {
    throw new Error("Role renewal returned an invalid acknowledgement");
  }

  return {
    action: "renewRole" as const,
    userId,
    role,
    roleRecordId: data.id,
    expiresAt: data.expires_at,
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 60, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireSuperAdmin(req);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 8_192,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as AdminRoleAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    let data;
    switch (safeAction) {
      case "grantRole":
        data = await grantRole(supabaseAdmin, auth.userId, params);
        break;
      case "revokeRole":
        data = await revokeRole(supabaseAdmin, auth.userId, params);
        break;
      case "renewRole":
        data = await renewRole(supabaseAdmin, params);
        break;
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_role_${safeAction}`,
      resource: "admin-role-rpc",
      status: "success",
      details: {
        action: safeAction,
        targetUserId: data.userId,
        role: data.role,
        roleRecordId: data.roleRecordId,
      },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }
    if (error instanceof ResourceConflictError) {
      return jsonResponse({ error: error.message }, 409, ALLOWED_METHODS, req);
    }

    console.error("[admin-role-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_role_${safeAction}`,
      resource: "admin-role-rpc",
      status: "failure",
      details: { action: safeAction, reason: "role_mutation_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
