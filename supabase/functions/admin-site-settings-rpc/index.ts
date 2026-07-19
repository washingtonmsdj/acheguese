/**
 * Edge Function: admin-site-settings-rpc
 *
 * Admin-only broker for site branding/settings RPCs. Browser clients call this
 * function with a verified user JWT; privileged database functions remain
 * service_role-only.
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

const ACTIONS = {
  getAllSettings: true,
  upsertSetting: true,
} as const;

const SETTING_KEYS = {
  LOGO_URL: "logo_url",
  LOGO_MOBILE_URL: "logo_mobile_url",
  FAVICON_URL: "favicon_url",
  PRIMARY_COLOR: "primary_color",
  SECONDARY_COLOR: "secondary_color",
  SITE_NAME: "site_name",
  SITE_TAGLINE: "site_tagline",
} as const;

const ALLOWED_SETTING_KEYS: Set<string> = new Set(Object.values(SETTING_KEYS));
const COLOR_KEYS: Set<string> = new Set([SETTING_KEYS.PRIMARY_COLOR, SETTING_KEYS.SECONDARY_COLOR]);
const ASSET_URL_KEYS: Set<string> = new Set([
  SETTING_KEYS.LOGO_URL,
  SETTING_KEYS.LOGO_MOBILE_URL,
  SETTING_KEYS.FAVICON_URL,
]);

type AdminSiteSettingsAction = keyof typeof ACTIONS;

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

function cleanSettingKey(value: unknown): string {
  if (typeof value !== "string" || !ALLOWED_SETTING_KEYS.has(value)) {
    throw new RequestValidationError("Invalid setting key");
  }
  return value;
}

function cleanSettingValue(key: string, value: unknown): string {
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid setting value");
  }

  const trimmed = value.trim();
  if (COLOR_KEYS.has(key)) {
    if (!/^#[0-9a-f]{6}$/i.test(trimmed)) {
      throw new RequestValidationError("Invalid color value");
    }
    return trimmed.toLowerCase();
  }

  if (ASSET_URL_KEYS.has(key)) {
    if (trimmed.length > 2_048) {
      throw new RequestValidationError("Invalid asset URL");
    }
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("/")) {
      throw new RequestValidationError("Invalid asset URL");
    }
    return trimmed;
  }

  const maxLength = key === SETTING_KEYS.SITE_NAME ? 80 : 160;
  if (!trimmed || trimmed.length > maxLength) {
    throw new RequestValidationError("Invalid text setting value");
  }
  return trimmed;
}

function normalizeRpcParams(
  action: AdminSiteSettingsAction,
  params: Record<string, unknown>,
): Record<string, unknown> {
  switch (action) {
    case "getAllSettings":
      return {};
    case "upsertSetting": {
      const key = cleanSettingKey(params.key);
      return {
        key,
        value: cleanSettingValue(key, params.value),
        description: cleanOptionalText(params.description, "description", 240),
      };
    }
  }
}

// deno-lint-ignore no-explicit-any
async function getAllSettings(supabaseAdmin: ReturnType<typeof createClient<any, any, any>>) {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("key,value,description,updated_at")
    .order("key", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function upsertSetting(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: ReturnType<typeof createClient<any, any, any>>,
  params: Record<string, unknown>,
  updatedByUserId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .upsert(
      {
        key: params.key,
        value: params.value,
        description: params.description,
        updated_by: updatedByUserId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
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

  const safeAction = action as AdminSiteSettingsAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const normalizedParams = normalizeRpcParams(safeAction, params);
    const supabaseAdmin = createClient(
      getRequiredEnv("SUPABASE_URL"),
      getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const data =
      safeAction === "getAllSettings"
        ? await getAllSettings(supabaseAdmin)
        : await upsertSetting(supabaseAdmin, normalizedParams, auth.userId);

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_site_settings_${safeAction}`,
      resource: "admin-site-settings-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[admin-site-settings-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_site_settings_${safeAction}`,
      resource: "admin-site-settings-rpc",
      status: "failure",
      details: { action: safeAction, reason: "rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
