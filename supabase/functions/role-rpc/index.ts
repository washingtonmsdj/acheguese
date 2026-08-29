/**
 * Edge Function: role-rpc
 *
 * Authenticated broker for role read helpers. Browser clients should not call
 * SECURITY DEFINER role helpers directly.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireOperationalAccount } from "../_shared/accountOperational.ts";
import {
  auditLog,
  extractBearerToken,
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
const APP_ROLES = new Set([
  "super_admin",
  "admin",
  "moderator",
  "business_owner",
  "driver",
  "user",
]);
const ACTIONS = {
  hasRole: true,
  getUserRoles: true,
  isAdmin: true,
  isSuperAdmin: true,
} as const;

type RoleRpcAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
  isProjectAdmin: boolean;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

class RequestAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestAuthorizationError";
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

async function isProjectAdmin(supabaseAdmin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("is_admin", {
    p_user_id: userId,
  });

  if (error) throw error;
  return data === true;
}

async function requireUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<UserAuthResult | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse({ error: "Missing or invalid authorization header" }, 401, ALLOWED_METHODS, req);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return jsonResponse({ error: "Invalid or expired token" }, 401, ALLOWED_METHODS, req);
  }

  return {
    userId: data.user.id,
    isProjectAdmin: await isProjectAdmin(supabaseAdmin, data.user.id),
  };
}

function requireAllowedTarget(auth: UserAuthResult, targetUserId: string) {
  if (targetUserId === auth.userId || auth.isProjectAdmin) return;
  throw new RequestAuthorizationError("User cannot read roles for this target");
}

async function handleHasRole(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const targetUserId = requireUuid(params.userId ?? params._user_id, "userId");
  const role = requireAppRole(params.role ?? params._role);
  requireAllowedTarget(auth, targetUserId);

  const { data, error } = await supabaseAdmin.rpc("has_role", {
    _user_id: targetUserId,
    _role: role,
  });

  if (error) throw error;
  return { hasRole: data === true };
}

async function handleGetUserRoles(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const targetUserId = requireUuid(params.userId ?? params._user_id, "userId");
  requireAllowedTarget(auth, targetUserId);

  const { data, error } = await supabaseAdmin.rpc("get_user_roles", {
    _user_id: targetUserId,
  });

  if (error) throw error;
  return { roles: Array.isArray(data) ? data : [] };
}

async function handleIsAdmin(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const targetUserId = requireUuid(params.userId ?? params.p_user_id, "userId");
  requireAllowedTarget(auth, targetUserId);

  const { data, error } = await supabaseAdmin.rpc("is_admin", {
    p_user_id: targetUserId,
  });

  if (error) throw error;
  return { isAdmin: data === true };
}

async function handleIsSuperAdmin(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const targetUserId = requireUuid(params.userId ?? params._user_id, "userId");
  requireAllowedTarget(auth, targetUserId);

  const { data, error } = await supabaseAdmin.rpc("is_super_admin", {
    _user_id: targetUserId,
  });

  if (error) throw error;
  return { isSuperAdmin: data === true };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: RoleRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "hasRole":
      return handleHasRole(supabaseAdmin, auth, params);
    case "getUserRoles":
      return handleGetUserRoles(supabaseAdmin, auth, params);
    case "isAdmin":
      return handleIsAdmin(supabaseAdmin, auth, params);
    case "isSuperAdmin":
      return handleIsSuperAdmin(supabaseAdmin, auth, params);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 120, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseAdmin = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const auth = await requireUser(req, supabaseAdmin);
  if (auth instanceof Response) return auth;

  const accountOperationalError = await requireOperationalAccount(
    supabaseAdmin,
    auth.userId,
    req,
    ALLOWED_METHODS,
  );
  if (accountOperationalError) return accountOperationalError;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 8_192,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as RoleRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `role_rpc_${safeAction}`,
      resource: "role-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }
    if (error instanceof RequestAuthorizationError) {
      return jsonResponse({ error: error.message }, 403, ALLOWED_METHODS, req);
    }

    console.error("[role-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `role_rpc_${safeAction}`,
      resource: "role-rpc",
      status: "failure",
      details: { action: safeAction, reason: "role_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
