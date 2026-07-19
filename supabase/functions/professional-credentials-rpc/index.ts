/**
 * Authenticated broker for private professional registration credentials.
 * Values never enter public professional rows, search views, or audit logs.
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
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = { getOwned: true, patchOwned: true } as const;

type CredentialsAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
}

interface CredentialPatch {
  licenseNumber?: string | null;
  licenseState?: string | null;
}

class RequestValidationError extends Error {}
class AuthorizationError extends Error {}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function normalizeCredentialPatch(value: unknown): CredentialPatch {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Invalid credentials");
  }

  const source = value as Record<string, unknown>;
  const keys = Object.keys(source);
  if (
    keys.length === 0 ||
    keys.some((key) => key !== "licenseNumber" && key !== "licenseState")
  ) {
    throw new RequestValidationError("Invalid credentials");
  }

  const patch: CredentialPatch = {};
  if (Object.prototype.hasOwnProperty.call(source, "licenseNumber")) {
    if (source.licenseNumber !== null && typeof source.licenseNumber !== "string") {
      throw new RequestValidationError("Invalid licenseNumber");
    }
    const normalized = typeof source.licenseNumber === "string"
      ? source.licenseNumber.trim()
      : null;
    if (
      normalized &&
      (normalized.length < 2 ||
        normalized.length > 64 ||
        !/^[\p{L}\p{N}/. -]+$/u.test(normalized))
    ) {
      throw new RequestValidationError("Invalid licenseNumber");
    }
    patch.licenseNumber = normalized || null;
  }

  if (Object.prototype.hasOwnProperty.call(source, "licenseState")) {
    if (source.licenseState !== null && typeof source.licenseState !== "string") {
      throw new RequestValidationError("Invalid licenseState");
    }
    const normalized = typeof source.licenseState === "string"
      ? source.licenseState.trim().toUpperCase()
      : null;
    if (normalized && !/^[A-Z]{2}$/.test(normalized)) {
      throw new RequestValidationError("Invalid licenseState");
    }
    patch.licenseState = normalized || null;
  }

  return patch;
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

function throwRpcError(error: { message?: string | null }): never {
  const message = error.message ?? "";
  if (message.includes("forbidden") || message.includes("unauthorized")) {
    throw new AuthorizationError("Forbidden");
  }
  if (message.includes("invalid")) {
    throw new RequestValidationError("Invalid credentials request");
  }
  throw error;
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: CredentialsAction,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId, "profileId");
  const rpcParams = {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
  };

  if (action === "getOwned") {
    const { data, error } = await supabaseAdmin.rpc(
      "professional_credentials_rpc_get_owned",
      rpcParams,
    );
    if (error) throwRpcError(error);
    return Array.isArray(data) ? data[0] ?? null : data ?? null;
  }

  const { data, error } = await supabaseAdmin.rpc(
    "professional_credentials_rpc_patch_owned",
    {
      ...rpcParams,
      p_credentials: normalizeCredentialPatch(params.credentials),
    },
  );
  if (error) throwRpcError(error);
  return Array.isArray(data) ? data[0] ?? null : data ?? null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
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

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 4_096,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as CredentialsAction;
  const params = rawBody.data.params && typeof rawBody.data.params === "object"
    ? rawBody.data.params
    : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `professional_credentials_${safeAction}`,
      resource: "professional-credentials-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });
    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }
    if (error instanceof AuthorizationError) {
      return jsonResponse({ error: "Forbidden" }, 403, ALLOWED_METHODS, req);
    }

    console.error("[professional-credentials-rpc] request failed");
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `professional_credentials_${safeAction}`,
      resource: "professional-credentials-rpc",
      status: "failure",
      details: { action: safeAction, reason: "credentials_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
