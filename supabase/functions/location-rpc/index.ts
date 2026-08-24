/**
 * Edge Function: location-rpc
 *
 * Authenticated broker for controlled location reconciliation writes. Browser
 * clients never execute location mutation helpers directly.
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
const STATE_CODE_REGEX = /^[A-Za-z]{2}$/;
const ACTIONS = {
  upsertCanonicalCityByIbge: true,
} as const;

type LocationRpcAction = keyof typeof ACTIONS;
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

function requireStateCode(value: unknown): string {
  if (typeof value !== "string" || !STATE_CODE_REGEX.test(value.trim())) {
    throw new RequestValidationError("Invalid stateCode");
  }
  return value.trim().toUpperCase();
}

function requireCityName(value: unknown): string {
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid cityName");
  }
  const cityName = value.trim();
  if (cityName.length < 1 || cityName.length > 120) {
    throw new RequestValidationError("Invalid cityName");
  }
  return cityName;
}

function requireIbgeCode(value: unknown): string {
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid ibgeCode");
  }
  const ibgeCode = value.replace(/\D/g, "");
  if (ibgeCode.length < 6 || ibgeCode.length > 12) {
    throw new RequestValidationError("Invalid ibgeCode");
  }
  return ibgeCode;
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

async function handleUpsertCanonicalCityByIbge(
  supabaseAdmin: SupabaseClient,
  params: Record<string, unknown>,
) {
  const stateCode = requireStateCode(params.stateCode ?? params.state_code);
  const cityName = requireCityName(params.cityName ?? params.city_name);
  const ibgeCode = requireIbgeCode(params.ibgeCode ?? params.ibge_code);

  const { data, error } = await supabaseAdmin.rpc("rpc_upsert_canonical_city_by_ibge", {
    p_state_code: stateCode,
    p_city_name: cityName,
    p_ibge_code: ibgeCode,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] ?? null : data ?? null;
  return { city: row };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  action: LocationRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "upsertCanonicalCityByIbge":
      return handleUpsertCanonicalCityByIbge(supabaseAdmin, params);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 60, 60_000);
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

  const safeAction = action as LocationRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `location_rpc_${safeAction}`,
      resource: "location-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[location-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `location_rpc_${safeAction}`,
      resource: "location-rpc",
      status: "failure",
      details: { action: safeAction, reason: "location_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});