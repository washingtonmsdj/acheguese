/**
 * Authenticated broker for the Core Platform contact-channel boundary.
 * Contact values stay in private.entity_contact_channels and never enter
 * generic Business, Professional, Profile, search, or listing payloads.
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
const ACTIONS = { getVisible: true, patchOwned: true } as const;
const CHANNEL_TYPES = new Set(["phone", "whatsapp", "email"]);
const VISIBILITIES = new Set(["private", "authenticated"]);

type ContactRpcAction = keyof typeof ACTIONS;
type ContactEntityType = "business" | "professional";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
}

interface ContactChannelInput {
  channelType: "phone" | "whatsapp" | "email";
  value: string | null;
  visibility: "private" | "authenticated";
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

function optionalUuidArray(value: unknown, field: string): string[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length > 50) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return [...new Set(value.map((item) => requireUuid(item, field)))];
}

function requireEntityType(value: unknown): ContactEntityType {
  if (value !== "business" && value !== "professional") {
    throw new RequestValidationError("Invalid entityType");
  }
  return value;
}

function normalizeChannels(value: unknown): ContactChannelInput[] {
  if (!Array.isArray(value) || value.length > 3) {
    throw new RequestValidationError("Invalid channels");
  }

  const seen = new Set<string>();
  return value.map((raw): ContactChannelInput => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new RequestValidationError("Invalid channel");
    }

    const input = raw as Record<string, unknown>;
    const channelType = input.channelType;
    const visibility = input.visibility ?? "authenticated";
    if (
      typeof channelType !== "string" ||
      !CHANNEL_TYPES.has(channelType) ||
      seen.has(channelType)
    ) {
      throw new RequestValidationError("Invalid or duplicate channelType");
    }
    if (typeof visibility !== "string" || !VISIBILITIES.has(visibility)) {
      throw new RequestValidationError("Invalid visibility");
    }

    const rawValue = input.value;
    if (rawValue !== null && typeof rawValue !== "string") {
      throw new RequestValidationError("Invalid contact value");
    }
    const normalizedValue = typeof rawValue === "string" ? rawValue.trim() : null;
    if (normalizedValue && normalizedValue.length > 254) {
      throw new RequestValidationError("Contact value exceeds limit");
    }

    seen.add(channelType);
    return {
      channelType: channelType as ContactChannelInput["channelType"],
      value: normalizedValue || null,
      visibility: visibility as ContactChannelInput["visibility"],
    };
  });
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

function throwRpcError(error: { message?: string | null }): never {
  const message = error.message ?? "";
  if (message.includes("forbidden") || message.includes("unauthorized")) {
    throw new AuthorizationError("Forbidden");
  }
  if (
    message.includes("invalid") ||
    message.includes("scope") ||
    message.includes("limit")
  ) {
    throw new RequestValidationError("Invalid contact request");
  }
  throw error;
}

async function handleGetVisible(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const businessIds = optionalUuidArray(params.businessIds, "businessIds");
  const professionalIds = optionalUuidArray(params.professionalIds, "professionalIds");
  if ((businessIds?.length ?? 0) === 0 && (professionalIds?.length ?? 0) === 0) {
    throw new RequestValidationError("Contact scope is required");
  }

  const { data, error } = await supabaseAdmin.rpc("contact_rpc_get_visible_channels", {
    p_actor_user_id: auth.userId,
    p_business_ids: businessIds,
    p_professional_ids: professionalIds,
  });
  if (error) throwRpcError(error);
  return data ?? [];
}

async function handlePatchOwned(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const entityType = requireEntityType(params.entityType);
  const entityId = requireUuid(params.entityId, "entityId");
  const channels = normalizeChannels(params.channels);

  const { data, error } = await supabaseAdmin.rpc("contact_rpc_patch_owned_channels", {
    p_actor_user_id: auth.userId,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_channels: channels,
  });
  if (error) throwRpcError(error);
  return data ?? [];
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
    maxBytes: 16_384,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as ContactRpcAction;
  const params =
    rawBody.data.params && typeof rawBody.data.params === "object"
      ? rawBody.data.params
      : {};

  try {
    const data = safeAction === "getVisible"
      ? await handleGetVisible(supabaseAdmin, auth, params)
      : await handlePatchOwned(supabaseAdmin, auth, params);

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `contact_rpc_${safeAction}`,
      resource: "contact-rpc",
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

    console.error("[contact-rpc] request failed");
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `contact_rpc_${safeAction}`,
      resource: "contact-rpc",
      status: "failure",
      details: { action: safeAction, reason: "contact_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
