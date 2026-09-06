/**
 * Edge Function: business-network-rpc
 *
 * Authenticated structural broker for Business networks. Mutations are executed
 * by service-role-only transactional database commands. actor_user_id always
 * comes from the verified JWT, never from browser params.
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
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACTIONS = {
  convertToNetwork: true,
  createBranch: true,
  setHeadquarters: true,
} as const;

type BusinessNetworkAction = keyof typeof ACTIONS;
// deno-lint-ignore no-explicit-any
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

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function requireText(
  value: unknown,
  field: string,
  maxLength = 160,
): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return normalized;
}

function requireSlug(value: unknown): string {
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid slug");
  }
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/.test(normalized)) {
    throw new RequestValidationError("Invalid slug");
  }
  return normalized;
}

async function requireUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<UserAuthResult | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse(
      { error: "Missing or invalid authorization header" },
      401,
      ALLOWED_METHODS,
      req,
    );
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return jsonResponse(
      { error: "Invalid or expired token" },
      401,
      ALLOWED_METHODS,
      req,
    );
  }

  return { userId: data.user.id };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: BusinessNetworkAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "convertToNetwork": {
      const { data, error } = await supabaseAdmin.rpc(
        "business_network_rpc_convert_to_network",
        {
          p_actor_user_id: auth.userId,
          p_standalone_profile_id: requireUuid(
            params.standaloneProfileId,
            "standaloneProfileId",
          ),
          p_brand_name: requireText(params.brandName, "brandName"),
          p_unit_name: requireText(params.unitName, "unitName"),
        },
      );
      if (error) throw error;
      return data;
    }

    case "createBranch": {
      const isHeadquarters =
        params.isHeadquarters === undefined ? false : params.isHeadquarters;
      if (typeof isHeadquarters !== "boolean") {
        throw new RequestValidationError("Invalid isHeadquarters");
      }

      const { data, error } = await supabaseAdmin.rpc(
        "business_network_rpc_create_branch",
        {
          p_actor_user_id: auth.userId,
          p_brand_hub_id: requireUuid(params.brandHubId, "brandHubId"),
          p_business_name: requireText(params.businessName, "businessName"),
          p_unit_name: requireText(params.unitName, "unitName"),
          p_slug: requireSlug(params.slug),
          p_location_id: requireUuid(params.locationId, "locationId"),
          p_is_headquarters: isHeadquarters,
        },
      );
      if (error) throw error;
      return data;
    }

    case "setHeadquarters": {
      const { data, error } = await supabaseAdmin.rpc(
        "business_network_rpc_set_headquarters",
        {
          p_actor_user_id: auth.userId,
          p_brand_hub_id: requireUuid(params.brandHubId, "brandHubId"),
          p_branch_id: requireUuid(params.branchId, "branchId"),
        },
      );
      if (error) throw error;
      return data;
    }
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: responseHeaders(req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 30, 60_000);
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

  const body = await readJsonBody<RequestBody>(req, {
    maxBytes: 16_384,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const action = body.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse(
      { error: "Invalid action" },
      400,
      ALLOWED_METHODS,
      req,
    );
  }

  const safeAction = action as BusinessNetworkAction;
  const params =
    typeof body.data.params === "object" && body.data.params !== null
      ? body.data.params
      : {};

  try {
    const data = await dispatchAction(
      supabaseAdmin,
      auth,
      safeAction,
      params,
    );

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      (data as { success?: unknown }).success !== true
    ) {
      throw new Error("Business network command returned an invalid result");
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `business_network_${safeAction}`,
      resource: "business-network-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse(
        { error: error.message },
        400,
        ALLOWED_METHODS,
        req,
      );
    }

    const message =
      error instanceof Error ? error.message : "business_network_failed";
    const knownReason = [
      "network_structure_requires_profile_owner",
      "standalone_business_not_found",
      "brand_hub_not_found",
      "branch_not_in_brand_hub",
      "branch_slug_already_exists_in_location",
      "network_handle_already_exists",
      "invalid_branch_location",
    ].find((reason) => message.includes(reason));

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `business_network_${safeAction}`,
      resource: "business-network-rpc",
      status: "failure",
      details: {
        action: safeAction,
        reason: knownReason ?? "business_network_failed",
      },
      ...getAuditInfo(req),
    });

    return jsonResponse(
      { error: knownReason ?? "business_network_failed" },
      knownReason === "network_structure_requires_profile_owner" ? 403 : 400,
      ALLOWED_METHODS,
      req,
    );
  }
});
