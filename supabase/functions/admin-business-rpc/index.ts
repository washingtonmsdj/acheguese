/**
 * Edge Function: admin-business-rpc
 *
 * Admin-only broker for sensitive business flags. Browser clients call this
 * function with a verified user JWT; direct Data API writes to admin-only
 * business_data columns remain blocked for authenticated users.
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
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACTIONS = {
  setVerification: true,
  setPremium: true,
} as const;

type AdminBusinessAction = keyof typeof ACTIONS;

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

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function cleanUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

async function updateBusinessByPublicId(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: ReturnType<typeof createClient<any, any, any>>,
  publicId: string,
  updates: Record<string, unknown>,
) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const byProfile = await supabaseAdmin
    .from("business_data")
    .update(payload)
    .eq("profile_id", publicId)
    .select("id,profile_id,business_name,is_verified,is_premium,status,updated_at")
    .maybeSingle();

  if (byProfile.error) throw byProfile.error;
  if (byProfile.data) return byProfile.data;

  const byBusinessData = await supabaseAdmin
    .from("business_data")
    .update(payload)
    .eq("id", publicId)
    .select("id,profile_id,business_name,is_verified,is_premium,status,updated_at")
    .maybeSingle();

  if (byBusinessData.error) throw byBusinessData.error;
  if (!byBusinessData.data) {
    throw new RequestValidationError("Business not found");
  }

  return byBusinessData.data;
}

function normalizeUpdate(
  action: AdminBusinessAction,
  params: Record<string, unknown>,
): { businessId: string; updates: Record<string, unknown> } {
  const businessId = cleanUuid(params.businessId, "businessId");

  switch (action) {
    case "setVerification":
      return {
        businessId,
        updates: { is_verified: cleanBoolean(params.isVerified, "isVerified") },
      };
    case "setPremium":
      return {
        businessId,
        updates: { is_premium: cleanBoolean(params.isPremium, "isPremium") },
      };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 80, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req);
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

  const safeAction = action as AdminBusinessAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const normalized = normalizeUpdate(safeAction, params);
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const data = await updateBusinessByPublicId(
      supabaseAdmin,
      normalized.businessId,
      normalized.updates,
    );

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_business_${safeAction}`,
      resource: "admin-business-rpc",
      status: "success",
      details: { action: safeAction, businessId: normalized.businessId },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[admin-business-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_business_${safeAction}`,
      resource: "admin-business-rpc",
      status: "failure",
      details: { action: safeAction, reason: "update_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
