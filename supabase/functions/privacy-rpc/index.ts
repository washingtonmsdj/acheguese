/**
 * Edge Function: privacy-rpc
 *
 * Authenticated broker for privacy operations that need privileged database
 * access. Browser clients never pass user ids; the broker resolves the user
 * from the JWT and scopes every operation to that identity.
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
const CONSENT_TYPES = new Set([
  "cookies",
  "analytics",
  "marketing",
  "geolocation",
  "notifications",
  "data_processing",
  "third_party",
  "terms_of_service",
  "privacy_policy",
]);
const SAFE_VERSION_REGEX = /^[A-Za-z0-9_.:-]{1,32}$/;
const ACTIONS = {
  recordConsent: true,
} as const;

type PrivacyRpcAction = keyof typeof ACTIONS;
type SupabaseClient = ReturnType<typeof createClient>;

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

function requireConsentType(value: unknown): string {
  if (typeof value !== "string" || !CONSENT_TYPES.has(value)) {
    throw new RequestValidationError("Invalid consentType");
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function normalizeOptionalString(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function normalizeVersion(value: unknown, fallback: string): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !SAFE_VERSION_REGEX.test(value)) {
    throw new RequestValidationError("Invalid version");
  }
  return value;
}

function getTrustedIp(req: Request): string | null {
  const candidate = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip");
  if (!candidate) return null;

  const value = candidate.trim();
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return value;
  if (/^[0-9A-Fa-f:.]{2,45}$/.test(value) && value.includes(":")) return value;
  return null;
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

async function handleRecordConsent(
  req: Request,
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const consentType = requireConsentType(params.consentType ?? params.consent_type);
  const granted = requireBoolean(params.granted, "granted");
  const userAgent = normalizeOptionalString(params.userAgent ?? params.user_agent, "userAgent", 1024);
  const termsVersion = normalizeVersion(params.termsVersion ?? params.terms_version, "1.0");
  const privacyVersion = normalizeVersion(
    params.privacyVersion ?? params.privacy_version,
    "1.0",
  );

  const { data, error } = await supabaseAdmin.rpc("record_consent", {
    p_user_id: userId,
    p_consent_type: consentType,
    p_granted: granted,
    p_ip_address: getTrustedIp(req),
    p_user_agent: userAgent,
    p_terms_version: termsVersion,
    p_privacy_version: privacyVersion,
  });

  if (error) throw error;
  return { consentId: data as string };
}

async function dispatchAction(
  req: Request,
  supabaseAdmin: SupabaseClient,
  userId: string,
  action: PrivacyRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "recordConsent":
      return handleRecordConsent(req, supabaseAdmin, userId, params);
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

  const safeAction = action as PrivacyRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(req, supabaseAdmin, auth.userId, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `privacy_rpc_${safeAction}`,
      resource: "privacy-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[privacy-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `privacy_rpc_${safeAction}`,
      resource: "privacy-rpc",
      status: "failure",
      details: { action: safeAction, reason: "privacy_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
