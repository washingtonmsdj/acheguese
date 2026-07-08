/**
 * Edge Function: admin-communication-rpc
 *
 * Admin-only broker for privileged communication territorial RPCs. Browser
 * clients call this function with the user's JWT; only this server-side
 * boundary calls the SECURITY DEFINER database RPCs with service_role.
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

const ACTION_TO_RPC = {
  approveRequest: "admin_approve_communication_channel",
  rejectRequest: "admin_reject_communication_channel_request",
} as const;

type AdminCommunicationAction = keyof typeof ACTION_TO_RPC;

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

function cleanOptionalSlug(value: unknown): string | null {
  const slug = cleanOptionalText(value, "slug", 120);
  if (!slug) return null;

  if (!isSafeSlug(slug)) {
    throw new RequestValidationError("Invalid slug");
  }

  return slug;
}

function isSafeSlug(value: string): boolean {
  if (!value || value.startsWith("-") || value.endsWith("-")) return false;

  let previousWasHyphen = false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isDigit = code >= 48 && code <= 57;
    const isLowercaseLetter = code >= 97 && code <= 122;
    const isHyphen = code === 45;

    if (isHyphen) {
      if (previousWasHyphen) return false;
      previousWasHyphen = true;
      continue;
    }

    if (!isDigit && !isLowercaseLetter) return false;
    previousWasHyphen = false;
  }

  return true;
}

function cleanApprovePayload(value: unknown, adminUserId: string): Record<string, unknown> {
  if (value !== null && value !== undefined && (typeof value !== "object" || Array.isArray(value))) {
    throw new RequestValidationError("Invalid payload");
  }

  const input = (value ?? {}) as Record<string, unknown>;
  const payload: Record<string, unknown> = { admin_user_id: adminUserId };
  const slug = cleanOptionalSlug(input.slug);
  const legalName = cleanOptionalText(input.legal_name, "legal_name", 160);
  const adminNotes = cleanOptionalText(input.admin_notes, "admin_notes", 1_000);

  if (slug) payload.slug = slug;
  if (legalName) payload.legal_name = legalName;
  if (adminNotes) payload.admin_notes = adminNotes;

  return payload;
}

function normalizeRpcParams(
  action: AdminCommunicationAction,
  params: Record<string, unknown>,
  adminUserId: string,
): Record<string, unknown> {
  const requestId = requireUuid(params.requestId ?? params.request_id, "requestId");

  switch (action) {
    case "approveRequest":
      return {
        request_id: requestId,
        payload: cleanApprovePayload(params.payload, adminUserId),
      };
    case "rejectRequest":
      return {
        request_id: requestId,
        admin_notes: cleanOptionalText(params.adminNotes ?? params.admin_notes, "adminNotes", 1_000),
        admin_user_id: adminUserId,
      };
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

  const safeAction = action as AdminCommunicationAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const rpcParams = normalizeRpcParams(safeAction, params, auth.userId);
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await supabaseAdmin.rpc(
      ACTION_TO_RPC[safeAction],
      rpcParams,
    );
    if (error) throw error;

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_communication_${safeAction}`,
      resource: "admin-communication-rpc",
      status: "success",
      details: { action: safeAction, requestId: rpcParams.request_id },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[admin-communication-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_communication_${safeAction}`,
      resource: "admin-communication-rpc",
      status: "failure",
      details: { action: safeAction, reason: "rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
