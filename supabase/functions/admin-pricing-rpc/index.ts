/**
 * Edge Function: admin-pricing-rpc
 *
 * Admin-only broker for privileged pricing RPCs. Browser clients call this
 * function with the user's JWT; only this server-side boundary calls the
 * SECURITY DEFINER database RPCs with service_role.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
import { requireAdmin } from "../_shared/adminAuth.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MAX_MONEY_VALUE = 100_000;
const PRICING_MODES = new Set(["ride", "delivery", "mototaxi", "motoboy", "custom"]);

const ACTION_TO_RPC = {
  activatePricingRule: "activate_pricing_rule",
  createActivePricingRule: "create_active_pricing_rule",
} as const;

type AdminPricingAction = keyof typeof ACTION_TO_RPC;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface NormalizedRequest {
  rpcParams: Record<string, unknown>;
  performedBy: string;
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

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function requireUuid(value: unknown, field: string): string {
  if (!isUuid(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function requireText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return trimmed;
}

function requirePricingMode(value: unknown): string {
  const mode = requireText(value, "mode", 32);
  if (!PRICING_MODES.has(mode)) {
    throw new RequestValidationError("Invalid mode");
  }
  return mode;
}

function requireMoney(value: unknown, field: string): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > MAX_MONEY_VALUE
  ) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return value;
}

function optionalMoney(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  return requireMoney(value, field);
}

function optionalTimestamp(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return new Date(parsed).toISOString();
}

function optionalMetadata(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Invalid metadata");
  }
  return value as Record<string, unknown>;
}

function normalizeRpcParams(
  action: AdminPricingAction,
  params: Record<string, unknown>,
): NormalizedRequest {
  switch (action) {
    case "activatePricingRule": {
      const performedBy = requireUuid(params.performedBy, "performedBy");
      return {
        performedBy,
        rpcParams: {
          p_rule_id: requireUuid(params.ruleId, "ruleId"),
          p_performed_by: performedBy,
        },
      };
    }
    case "createActivePricingRule": {
      const performedBy = requireUuid(params.performedBy, "performedBy");
      return {
        performedBy,
        rpcParams: {
          p_mode: requirePricingMode(params.mode),
          p_name: requireText(params.name, "name", 120),
          p_base_fare: requireMoney(params.baseFare, "baseFare"),
          p_price_per_km: requireMoney(params.pricePerKm, "pricePerKm"),
          p_price_per_minute: requireMoney(params.pricePerMinute, "pricePerMinute"),
          p_minimum_fare: requireMoney(params.minimumFare, "minimumFare"),
          p_maximum_fare: optionalMoney(params.maximumFare, "maximumFare"),
          p_is_active: true,
          p_valid_from: optionalTimestamp(params.validFrom, "validFrom"),
          p_valid_until: optionalTimestamp(params.validUntil, "validUntil"),
          p_metadata: optionalMetadata(params.metadata),
          p_performed_by: performedBy,
        },
      };
    }
  }
}

async function assertProfileBelongsToUser(
  supabaseAdmin: ReturnType<typeof createClient>,
  profileId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 60, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 12_000,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTION_TO_RPC)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as AdminPricingAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const normalized = normalizeRpcParams(safeAction, params);
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const ownsProfile = await assertProfileBelongsToUser(
      supabaseAdmin,
      normalized.performedBy,
      auth.userId,
    );
    if (!ownsProfile) {
      auditLog({
        timestamp: new Date().toISOString(),
        userId: auth.userId,
        action: `admin_pricing_${safeAction}`,
        resource: "admin-pricing-rpc",
        status: "failure",
        details: { action: safeAction, reason: "profile_mismatch" },
        ...getAuditInfo(req),
      });
      return jsonResponse({ error: "Forbidden" }, 403, ALLOWED_METHODS, req);
    }

    const { data, error } = await supabaseAdmin.rpc(
      ACTION_TO_RPC[safeAction],
      normalized.rpcParams,
    );
    if (error) throw error;

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_pricing_${safeAction}`,
      resource: "admin-pricing-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[admin-pricing-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_pricing_${safeAction}`,
      resource: "admin-pricing-rpc",
      status: "failure",
      details: { action: safeAction, reason: "rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
