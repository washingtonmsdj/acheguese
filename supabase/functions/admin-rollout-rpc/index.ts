/**
 * Edge Function: admin-rollout-rpc
 *
 * Admin-only mutation broker for module_rollouts. Public/browser reads remain
 * direct and column-scoped; INSERT/UPDATE/DELETE stay service_role-owned.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  isValidUUID,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";
import {
  getSupabaseAdminClient,
  requireAdmin,
} from "../_shared/adminAuth.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MAX_CONFIG_BYTES = 8_192;
const MAX_CONFIG_KEYS = 50;

const ACTIONS = {
  upsertRollout: true,
  deleteRollout: true,
} as const;

const MODULE_KEYS = new Set([
  "community",
  "business",
  "services",
  "mobility",
  "classifieds",
  "promotions",
  "gastronomy",
  "events",
  "jobs",
]);

const ROLLOUT_STATUSES = new Set(["active", "inactive"]);

type AdminRolloutAction = keyof typeof ACTIONS;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface RolloutParams {
  moduleKey: string;
  locationId: string;
  status?: string;
  config?: Record<string, unknown> | null;
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

function cleanModuleKey(value: unknown): string {
  if (typeof value !== "string" || !MODULE_KEYS.has(value)) {
    throw new RequestValidationError("Invalid module key");
  }
  return value;
}

function cleanLocationId(value: unknown): string {
  if (!isValidUUID(value)) {
    throw new RequestValidationError("Invalid location id");
  }
  return value;
}

function cleanStatus(value: unknown): string {
  if (typeof value !== "string" || !ROLLOUT_STATUSES.has(value)) {
    throw new RequestValidationError("Invalid rollout status");
  }
  return value;
}

function cleanConfig(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Invalid rollout config");
  }

  const config = value as Record<string, unknown>;
  if (Object.keys(config).length > MAX_CONFIG_KEYS) {
    throw new RequestValidationError("Rollout config has too many keys");
  }

  let encoded: string;
  try {
    encoded = JSON.stringify(config);
  } catch {
    throw new RequestValidationError("Invalid rollout config");
  }

  if (new TextEncoder().encode(encoded).length > MAX_CONFIG_BYTES) {
    throw new RequestValidationError("Rollout config is too large");
  }

  return config;
}

function normalizeParams(
  action: AdminRolloutAction,
  params: Record<string, unknown>,
): RolloutParams {
  const base = {
    moduleKey: cleanModuleKey(params.module_key),
    locationId: cleanLocationId(params.location_id),
  };

  if (action === "deleteRollout") return base;

  return {
    ...base,
    status: cleanStatus(params.status),
    config: cleanConfig(params.config),
  };
}

async function requireActiveLocation(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>,
  locationId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("locations")
    .select("id,status")
    .eq("id", locationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestValidationError("Location not found");
  if (data.status !== "active") {
    throw new RequestValidationError("Location is not active");
  }
}

async function upsertRollout(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>,
  params: RolloutParams,
  actorUserId: string,
) {
  await requireActiveLocation(supabaseAdmin, params.locationId);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("module_rollouts")
    .select("id")
    .eq("module_key", params.moduleKey)
    .eq("location_id", params.locationId)
    .maybeSingle();

  if (existingError) throw existingError;

  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("module_rollouts")
      .update({
        status: params.status,
        config: params.config ?? null,
        updated_by: actorUserId,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("id,module_key,location_id,status,config,created_at,updated_at")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from("module_rollouts")
    .insert({
      module_key: params.moduleKey,
      location_id: params.locationId,
      status: params.status,
      config: params.config ?? null,
      created_by: actorUserId,
      updated_by: actorUserId,
      updated_at: now,
    })
    .select("id,module_key,location_id,status,config,created_at,updated_at")
    .single();

  if (error) throw error;
  return data;
}

async function deleteRollout(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>,
  params: RolloutParams,
) {
  const { data, error } = await supabaseAdmin
    .from("module_rollouts")
    .delete()
    .eq("module_key", params.moduleKey)
    .eq("location_id", params.locationId)
    .select("id");

  if (error) throw error;
  return { removed: (data ?? []).length > 0 };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    60,
    60_000,
    ALLOWED_METHODS,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req, ALLOWED_METHODS);
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

  const safeAction = action as AdminRolloutAction;
  const rawParams =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const params = normalizeParams(safeAction, rawParams);
    const supabaseAdmin = getSupabaseAdminClient();
    const data =
      safeAction === "upsertRollout"
        ? await upsertRollout(supabaseAdmin, params, auth.userId)
        : await deleteRollout(supabaseAdmin, params);

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_rollout_${safeAction}`,
      resource: "admin-rollout-rpc",
      status: "success",
      details: {
        moduleKey: params.moduleKey,
        locationId: params.locationId,
      },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[admin-rollout-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_rollout_${safeAction}`,
      resource: "admin-rollout-rpc",
      status: "failure",
      details: { reason: "mutation_failed" },
      ...getAuditInfo(req),
    });

    return jsonResponse(
      { error: "Internal server error" },
      500,
      ALLOWED_METHODS,
      req,
    );
  }
});
