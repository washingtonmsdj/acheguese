/**
 * Edge Function: session-rpc
 *
 * Authenticated broker for session/profile RPCs that need privileged database
 * access. Browser clients never pass p_user_id; the broker resolves the user
 * from the JWT and calls service_role-only database helpers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
const ACTIONS = {
  getActiveProfile: true,
  switchActiveProfile: true,
  checkMfaRequired: true,
  revokeSession: true,
  revokeAllSessions: true,
  updateSessionActivity: true,
} as const;

type SessionRpcAction = keyof typeof ACTIONS;
type SupabaseClient = ReturnType<typeof createClient>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
  token: string;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
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

  return { userId: data.user.id, token };
}

async function handleGetActiveProfile(supabaseAdmin: SupabaseClient, userId: string) {
  const { data, error } = await supabaseAdmin.rpc("get_active_profile", {
    p_user_id: userId,
  });

  if (error) throw error;

  const profile = Array.isArray(data) ? data[0] ?? null : data ?? null;
  return { profile };
}

async function handleSwitchActiveProfile(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.profile_id, "profileId");
  const { data, error } = await supabaseAdmin.rpc("switch_active_profile", {
    p_user_id: userId,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return { ok: data === true };
}

async function handleCheckMfaRequired(supabaseAdmin: SupabaseClient, userId: string) {
  const { data, error } = await supabaseAdmin.rpc("check_user_mfa_required", {
    p_user_id: userId,
  });

  if (error) throw error;
  return { required: data === true };
}

function normalizeReason(value: unknown, fallback: string): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || value.length > 240) {
    throw new RequestValidationError("Invalid reason");
  }
  return value;
}

async function handleRevokeSession(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const sessionId = requireUuid(params.sessionId ?? params.session_id, "sessionId");
  const reason = normalizeReason(params.reason, "Revogado pelo usuario");
  const { data, error } = await supabaseAdmin
    .from("user_sessions")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
      revoked_reason: reason,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select("id");

  if (error) throw error;
  return { revoked: Array.isArray(data) && data.length > 0 };
}

async function handleRevokeAllSessions(
  supabaseAdmin: SupabaseClient,
  userId: string,
  token: string,
  params: Record<string, unknown>,
) {
  const exceptCurrent = params.exceptCurrent !== false && params.except_current !== false;
  const reason = normalizeReason(params.reason, "Logout em todos os dispositivos");
  let query = supabaseAdmin
    .from("user_sessions")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: userId,
      revoked_reason: reason,
    })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (exceptCurrent) {
    query = query.neq("session_token", token);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  return { revokedCount: Array.isArray(data) ? data.length : 0 };
}

async function handleUpdateSessionActivity(
  supabaseAdmin: SupabaseClient,
  userId: string,
  token: string,
) {
  const { data, error } = await supabaseAdmin
    .from("user_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("session_token", token)
    .eq("is_active", true)
    .select("id");

  if (error) throw error;
  return { updated: Array.isArray(data) && data.length > 0 };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: SessionRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "getActiveProfile":
      return handleGetActiveProfile(supabaseAdmin, auth.userId);
    case "switchActiveProfile":
      return handleSwitchActiveProfile(supabaseAdmin, auth.userId, params);
    case "checkMfaRequired":
      return handleCheckMfaRequired(supabaseAdmin, auth.userId);
    case "revokeSession":
      return handleRevokeSession(supabaseAdmin, auth.userId, params);
    case "revokeAllSessions":
      return handleRevokeAllSessions(supabaseAdmin, auth.userId, auth.token, params);
    case "updateSessionActivity":
      return handleUpdateSessionActivity(supabaseAdmin, auth.userId, auth.token);
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

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 16_384,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as SessionRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `session_rpc_${safeAction}`,
      resource: "session-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[session-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `session_rpc_${safeAction}`,
      resource: "session-rpc",
      status: "failure",
      details: { action: safeAction, reason: "session_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
