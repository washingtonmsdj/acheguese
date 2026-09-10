/**
 * Edge Function: session-rpc
 *
 * Authenticated broker for session/profile RPCs that need privileged database
 * access. Browser clients never pass p_user_id; the broker resolves the user
 * from the JWT and calls service_role-only database helpers.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireOperationalAccount } from "../_shared/accountOperational.ts";
import {
  auditLog,
  extractBearerToken,
  getAllSecurityHeaders,
  getRequiredEnv,
  getTrustedClientIp,
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
  revokeAllSessions: true,
} as const;

type SessionRpcAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

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

function auditInfo(req: Request) {
  return {
    ip: getTrustedClientIp(req) ?? undefined,
    userAgent: req.headers.get("user-agent") ?? "unknown",
  };
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

/**
 * Reconciles the historical policy tracker against Supabase Auth before the
 * policy RPC reads it. `user_mfa_status.mfa_enabled` is therefore a cache of
 * Auth state, never an authority supplied by the browser.
 */
async function reconcileMfaTrackerFromAuth(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: factorData, error: factorError } =
    await supabaseAdmin.auth.admin.mfa.listFactors({ userId });

  if (factorError) throw factorError;
  if (!factorData || !Array.isArray(factorData.factors)) {
    throw new Error("Auth MFA factor authority returned an invalid response");
  }

  const verifiedFactor = factorData.factors.find(
    (factor: { status?: unknown }) => factor?.status === "verified",
  ) as { factor_type?: unknown; status?: unknown } | undefined;
  const mfaEnabled = Boolean(verifiedFactor);
  const factorType = verifiedFactor?.factor_type;
  const mfaMethod =
    factorType === "totp" ? "totp" : factorType === "phone" ? "sms" : null;
  const trackerUpdate = {
    mfa_enabled: mfaEnabled,
    mfa_method: mfaEnabled ? mfaMethod : null,
    // Supabase Auth currently does not provide recovery codes. Historical
    // generated client codes were never an Auth recovery authority.
    backup_codes_generated: false,
    backup_codes_count: 0,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: readError } = await supabaseAdmin
    .from("user_mfa_status")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) throw readError;

  if (existing?.id) {
    const { error: updateError } = await supabaseAdmin
      .from("user_mfa_status")
      .update(trackerUpdate)
      .eq("user_id", userId);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabaseAdmin
      .from("user_mfa_status")
      .insert({ user_id: userId, ...trackerUpdate });
    if (insertError) throw insertError;
  }

  return mfaEnabled;
}

async function handleCheckMfaRequired(supabaseAdmin: SupabaseClient, userId: string) {
  // Synchronize the policy cache from the real Auth factor store immediately
  // before evaluating the database policy. A forged/stale browser flag cannot
  // suppress an MFA requirement.
  await reconcileMfaTrackerFromAuth(supabaseAdmin, userId);

  const { data, error } = await supabaseAdmin.rpc("check_user_mfa_required", {
    p_user_id: userId,
  });

  if (error) throw error;
  if (typeof data !== "boolean") {
    throw new Error("MFA requirement authority returned an invalid response");
  }
  return { required: data };
}

function normalizeReason(value: unknown, fallback: string): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || value.length > 240) {
    throw new RequestValidationError("Invalid reason");
  }
  return value;
}

async function handleRevokeAllSessions(
  supabaseAdmin: SupabaseClient,
  token: string,
  params: Record<string, unknown>,
) {
  const exceptCurrent = params.exceptCurrent !== false && params.except_current !== false;
  normalizeReason(params.reason, "Logout em todos os dispositivos");

  // Supabase Auth is the authoritative session store. The legacy
  // public.user_sessions table is not populated by the current sign-in flow,
  // so mutating it does not revoke real refresh tokens.
  const scope = exceptCurrent ? "others" : "global";
  const { error } = await supabaseAdmin.auth.admin.signOut(token, scope);
  if (error) throw error;

  // Access JWTs already issued can remain valid until exp. The Auth logout
  // revokes the affected refresh-token/session chain; callers requesting
  // global logout must also clear the current client session locally.
  return {
    revoked: true,
    scope,
    requiresLocalSignOut: scope === "global",
  };
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
    case "revokeAllSessions":
      return handleRevokeAllSessions(supabaseAdmin, auth.token, params);
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
      ...auditInfo(req),
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
      ...auditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
