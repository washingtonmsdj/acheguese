/**
 * Edge Function: billing-entitlements-rpc
 *
 * Authenticated broker for user billing entitlement RPCs. Browser clients never
 * pass p_user_id; the broker resolves the user from the JWT and calls
 * service_role-only database helpers.
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
const SAFE_KEY_REGEX = /^[A-Za-z0-9_.:-]{1,120}$/;
const ACTIONS = {
  getActiveSubscription: true,
  hasPlan: true,
  hasFeature: true,
  getEntitlementLimit: true,
} as const;

type BillingEntitlementsAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
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

function requireSafeKey(value: unknown, field: string): string {
  if (typeof value !== "string" || !SAFE_KEY_REGEX.test(value)) {
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

  return { userId: data.user.id };
}

async function handleGetActiveSubscription(supabaseAdmin: SupabaseClient, userId: string) {
  const { data, error } = await supabaseAdmin.rpc("get_user_active_subscription", {
    p_user_id: userId,
  });

  if (error) throw error;

  const subscription = Array.isArray(data) ? data[0] ?? null : data ?? null;
  return { subscription };
}

async function handleHasPlan(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const planCode = requireSafeKey(params.planCode ?? params.plan_code, "planCode");
  const { data, error } = await supabaseAdmin.rpc("user_has_plan", {
    p_user_id: userId,
    p_plan_code: planCode,
  });

  if (error) throw error;
  return { hasPlan: data === true };
}

async function handleHasFeature(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const feature = requireSafeKey(params.feature, "feature");
  const { data, error } = await supabaseAdmin.rpc("user_has_feature", {
    p_user_id: userId,
    p_feature: feature,
  });

  if (error) throw error;
  return { hasFeature: data === true };
}

async function handleGetEntitlementLimit(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const entitlement = requireSafeKey(params.entitlement, "entitlement");
  const { data, error } = await supabaseAdmin.rpc("get_user_entitlement_limit", {
    p_user_id: userId,
    p_entitlement: entitlement,
  });

  if (error) throw error;
  return { limit: typeof data === "number" ? data : 0 };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  userId: string,
  action: BillingEntitlementsAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "getActiveSubscription":
      return handleGetActiveSubscription(supabaseAdmin, userId);
    case "hasPlan":
      return handleHasPlan(supabaseAdmin, userId, params);
    case "hasFeature":
      return handleHasFeature(supabaseAdmin, userId, params);
    case "getEntitlementLimit":
      return handleGetEntitlementLimit(supabaseAdmin, userId, params);
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

  const safeAction = action as BillingEntitlementsAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth.userId, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `billing_entitlements_rpc_${safeAction}`,
      resource: "billing-entitlements-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[billing-entitlements-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `billing_entitlements_rpc_${safeAction}`,
      resource: "billing-entitlements-rpc",
      status: "failure",
      details: { action: safeAction, reason: "billing_entitlements_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
