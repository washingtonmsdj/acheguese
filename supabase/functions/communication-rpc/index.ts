/**
 * Edge Function: communication-rpc
 *
 * Authenticated broker for communication territorial mutation RPCs. Browser
 * clients call this function with the user's JWT; only this server-side
 * boundary calls privileged database RPCs with service_role.
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
const PUBLICATION_TYPES = new Set(["news", "coverage", "event", "job", "public_utility", "report"]);
const CONTENT_FORMATS = new Set(["article", "update"]);
const CHANNEL_KINDS = new Set([
  "tv_bairro",
  "radio",
  "portal",
  "collective",
  "newspaper",
  "public_utility",
  "other",
]);

const ACTION_TO_RPC = {
  requestChannel: "request_communication_channel",
  createPublication: "create_communication_publication",
  updateDraftPublication: "update_communication_publication_draft",
  publishPublication: "publish_communication_publication",
} as const;

type CommunicationAction = keyof typeof ACTION_TO_RPC;

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

function requireText(value: unknown, field: string, minLength: number, maxLength: number): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return trimmed;
}

function cleanOptionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return trimmed || null;
}

function cleanOptionalUrl(value: unknown, field: string): string | null {
  const url = cleanOptionalText(value, field, 2_048);
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return url;
}

function cleanOptionalUuid(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  return requireUuid(value, field);
}

function cleanEnum(value: unknown, field: string, allowed: Set<string>, fallback?: string): string {
  if ((value === null || value === undefined || value === "") && fallback) {
    return fallback;
  }
  if (typeof value !== "string" || !allowed.has(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanMedia(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Invalid media");
  }
  if (JSON.stringify(value).length > 8_000) {
    throw new RequestValidationError("Invalid media");
  }
  return value as Record<string, unknown>;
}

function objectParam(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value as Record<string, unknown>;
}

async function requireUser(
  req: Request,
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: ReturnType<typeof createClient<any, any, any>>,
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

function normalizeRequestChannelPayload(params: Record<string, unknown>, userId: string) {
  const input = objectParam(params.payload, "payload");
  return {
    actor_user_id: userId,
    requested_location_id: requireUuid(input.requested_location_id, "requested_location_id"),
    requested_profile_id: cleanOptionalUuid(input.requested_profile_id, "requested_profile_id"),
    public_name: requireText(input.public_name, "public_name", 3, 120),
    channel_kind: cleanEnum(input.channel_kind, "channel_kind", CHANNEL_KINDS, "portal"),
    description: requireText(input.description, "description", 20, 2_000),
    website_url: cleanOptionalUrl(input.website_url, "website_url"),
    contact_email: requireText(input.contact_email, "contact_email", 5, 254),
    contact_phone: cleanOptionalText(input.contact_phone, "contact_phone", 40),
  };
}

function normalizePublicationPayload(value: unknown, userId: string, partial = false) {
  const input = objectParam(value, "payload");
  const payload: Record<string, unknown> = { actor_user_id: userId };

  if (!partial || input.channel_id !== undefined) {
    payload.channel_id = requireUuid(input.channel_id, "channel_id");
  }
  if (!partial || input.location_id !== undefined) {
    payload.location_id = requireUuid(input.location_id, "location_id");
  }
  if (!partial || input.publication_type !== undefined) {
    payload.publication_type = cleanEnum(input.publication_type, "publication_type", PUBLICATION_TYPES, "news");
  }
  if (!partial || input.content_format !== undefined) {
    payload.content_format = cleanEnum(input.content_format, "content_format", CONTENT_FORMATS, "article");
  }
  if (!partial || input.title !== undefined) {
    payload.title = requireText(input.title, "title", 5, 180);
  }
  if (!partial || input.summary !== undefined) {
    payload.summary = cleanOptionalText(input.summary, "summary", 500);
  }
  if (!partial || input.body !== undefined) {
    payload.body = requireText(input.body, "body", 20, 20_000);
  }
  if (!partial || input.source_url !== undefined) {
    payload.source_url = cleanOptionalUrl(input.source_url, "source_url");
  }
  if (!partial || input.media !== undefined) {
    payload.media = cleanMedia(input.media);
  }

  return payload;
}

function normalizeRpcParams(
  action: CommunicationAction,
  params: Record<string, unknown>,
  userId: string,
): Record<string, unknown> {
  switch (action) {
    case "requestChannel":
      return { payload: normalizeRequestChannelPayload(params, userId) };
    case "createPublication":
      return { payload: normalizePublicationPayload(params.payload, userId) };
    case "updateDraftPublication":
      return {
        publication_id: requireUuid(params.publicationId ?? params.publication_id, "publicationId"),
        payload: normalizePublicationPayload(params.payload, userId, true),
      };
    case "publishPublication":
      return {
        publication_id: requireUuid(params.publicationId ?? params.publication_id, "publicationId"),
        actor_user_id: userId,
      };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 100, 60_000);
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
    maxBytes: 32_000,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTION_TO_RPC)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as CommunicationAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const rpcParams = normalizeRpcParams(safeAction, params, auth.userId);
    const { data, error } = await supabaseAdmin.rpc(ACTION_TO_RPC[safeAction], rpcParams);
    if (error) throw error;

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `communication_${safeAction}`,
      resource: "communication-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[communication-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `communication_${safeAction}`,
      resource: "communication-rpc",
      status: "failure",
      details: { action: safeAction, reason: "rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
