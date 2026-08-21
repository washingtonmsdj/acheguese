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
  getDeletionStatus: true,
  requestAccountDeletion: true,
  cancelAccountDeletion: true,
} as const;

type PrivacyRpcAction = keyof typeof ACTIONS;
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

class PrivacyRpcHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PrivacyRpcHttpError";
    this.status = status;
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
  if (isSafeIpv4(value)) return value;
  if (isSafeIpv6Like(value)) return value;
  return null;
}

function isSafeIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!part || part.length > 3) return false;
    for (let index = 0; index < part.length; index += 1) {
      const code = part.charCodeAt(index);
      if (code < 48 || code > 57) return false;
    }
    const octet = Number(part);
    return Number.isInteger(octet) && octet >= 0 && octet <= 255;
  });
}

function isSafeIpv6Like(value: string): boolean {
  if (!value.includes(":") || value.length < 2 || value.length > 45) return false;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isDigit = code >= 48 && code <= 57;
    const isUpperHex = code >= 65 && code <= 70;
    const isLowerHex = code >= 97 && code <= 102;
    const isSeparator = code === 46 || code === 58;
    if (!isDigit && !isUpperHex && !isLowerHex && !isSeparator) return false;
  }

  return true;
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

async function handleGetDeletionStatus(
  supabaseAdmin: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabaseAdmin.rpc(
    "get_account_deletion_status_for_user",
    { p_user_id: userId },
  );

  if (error) throw error;
  return data ?? null;
}

function mapDeletionRequestError(error: unknown): never {
  const message = error instanceof Error
    ? error.message
    : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : String(error);

  if (message.includes("ACCOUNT_DELETION_ADMIN_REQUIRES_DPO")) {
    throw new PrivacyRpcHttpError(
      "Contas administrativas devem solicitar exclusao ao DPO.",
      403,
    );
  }
  if (message.includes("ACCOUNT_DELETION_ACTIVE_BUSINESS")) {
    throw new PrivacyRpcHttpError(
      "Transfira ou encerre os negocios vinculados antes de excluir a conta.",
      409,
    );
  }
  if (message.includes("ACCOUNT_DELETION_ACTIVE_RIDE")) {
    throw new PrivacyRpcHttpError(
      "Conclua ou cancele as corridas e entregas em andamento antes de excluir a conta.",
      409,
    );
  }
  if (message.includes("ACCOUNT_DELETION_ACTIVE_ORDER")) {
    throw new PrivacyRpcHttpError(
      "Conclua os pedidos e pendencias financeiras antes de excluir a conta.",
      409,
    );
  }

  throw error;
}

async function handleRequestAccountDeletion(
  supabaseAdmin: SupabaseClient,
  userId: string,
  params: Record<string, unknown>,
) {
  const reason = normalizeOptionalString(params.reason, "reason", 1000);
  const exportRequested = params.exportRequested === undefined
    ? false
    : requireBoolean(params.exportRequested, "exportRequested");

  const { data, error } = await supabaseAdmin.rpc(
    "request_account_deletion_for_user",
    {
      p_user_id: userId,
      p_reason: reason,
      p_export_requested: exportRequested,
    },
  );

  if (error) mapDeletionRequestError(error);
  if (!data) throw new Error("Deletion request authority returned no data");

  return data;
}

async function handleCancelAccountDeletion(
  supabaseAdmin: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabaseAdmin.rpc(
    "cancel_account_deletion_for_user",
    {
      p_user_id: userId,
      p_reason: "user_self_service",
    },
  );

  if (error) throw error;
  return { cancelled: data === true };
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
    case "getDeletionStatus":
      return handleGetDeletionStatus(supabaseAdmin, userId);
    case "requestAccountDeletion":
      return handleRequestAccountDeletion(supabaseAdmin, userId, params);
    case "cancelAccountDeletion":
      return handleCancelAccountDeletion(supabaseAdmin, userId);
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
    if (error instanceof PrivacyRpcHttpError) {
      return jsonResponse({ error: error.message }, error.status, ALLOWED_METHODS, req);
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
