/**
 * Edge Function: admin-notifications-rpc
 *
 * Admin-only broker for notification dashboard RPCs. Browser clients call this
 * function with the user's JWT; only this server-side boundary calls the
 * privileged database RPCs with service_role.
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
  getSettingsStats: "admin_notifications_get_settings_stats",
  getSettingsUserIds: "admin_notifications_get_settings_user_ids",
  getUserSettings: "admin_notifications_get_user_settings",
  getChannelStats: "admin_notifications_get_channel_stats",
  getTemplateStats: "admin_notifications_get_template_stats",
  getEmailDeliveryAudit: "admin_notifications_get_delivery_audit",
} as const;

type AdminNotificationsAction = keyof typeof ACTION_TO_RPC;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
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

function cleanNullableText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanPositiveInt(value: unknown, fallback: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return fallback;
  }
  return Math.min(value, max);
}

function normalizeRpcParams(action: AdminNotificationsAction, params: Record<string, unknown>) {
  switch (action) {
    case "getSettingsStats":
    case "getChannelStats":
      return {};
    case "getSettingsUserIds": {
      const userIds = Array.isArray(params.userIds)
        ? params.userIds.filter(isUuid).slice(0, 200)
        : [];
      return { p_user_ids: userIds };
    }
    case "getUserSettings": {
      if (!isUuid(params.userId)) {
        throw new Error("Invalid userId");
      }
      return { p_user_id: params.userId };
    }
    case "getTemplateStats":
      return { p_limit: cleanPositiveInt(params.limit, 10, 100) };
    case "getEmailDeliveryAudit":
      return {
        p_page: cleanPositiveInt(params.page, 1, 10_000),
        p_limit: cleanPositiveInt(params.limit, 20, 100),
        p_template: cleanNullableText(params.template, 120),
        p_status: cleanNullableText(params.status, 80),
        p_search: cleanNullableText(params.search, 160),
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

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 8192,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTION_TO_RPC)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as AdminNotificationsAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const rpcParams = normalizeRpcParams(safeAction, params);
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data, error } = await supabaseAdmin.rpc(ACTION_TO_RPC[safeAction], rpcParams);
    if (error) throw error;

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_notifications_${safeAction}`,
      resource: "admin-notifications-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    console.error("[admin-notifications-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_notifications_${safeAction}`,
      resource: "admin-notifications-rpc",
      status: "failure",
      details: { action: safeAction, reason: "rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
