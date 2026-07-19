/**
 * Edge Function: community-rpc
 *
 * Authenticated broker for privileged community content mutations. Browser
 * clients never execute the backing SECURITY DEFINER RPCs directly.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  extractBearerToken,
  getAllSecurityHeaders,
  getRequiredEnv,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const FUNCTION_NAME = "community-rpc";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const ACTIONS = {
  createAlert: true,
} as const;

type CommunityRpcAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
}

interface DistributedRateLimitRow {
  allowed: boolean;
  remaining: number;
  reset_at: string;
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

function operationalJsonResponse(
  body: unknown,
  status: number,
  req: Request,
  requestId: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...responseHeaders(req),
      "X-Request-ID": requestId,
      ...extraHeaders,
    },
  });
}

function withRequestId(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function recordOperationalAudit(
  supabaseAdmin: SupabaseClient,
  input: {
    action: string;
    durationMs: number;
    errorCode?: string;
    outcome: string;
    requestId: string;
    statusCode: number;
    userId: string;
  },
): Promise<void> {
  const durationMs = Math.max(0, Math.min(Math.round(input.durationMs), 60_000));
  const { error } = await supabaseAdmin.from("function_audit").insert({
    duration_ms: durationMs,
    error: input.errorCode ?? null,
    function_name: FUNCTION_NAME,
    input: {
      action: input.action,
      request_id: input.requestId,
    },
    output: {
      outcome: input.outcome,
      status_code: input.statusCode,
    },
    success: input.statusCode >= 200 && input.statusCode < 400,
    user_id: input.userId,
  });

  const metric = {
    action: input.action,
    duration_ms: durationMs,
    outcome: input.outcome,
    request_id: input.requestId,
    status_code: input.statusCode,
  };
  console.log("[COMMUNITY_RPC_METRIC]", JSON.stringify(metric));

  if (error) {
    console.error("[community-rpc][audit]", {
      code: error.code,
      requestId: input.requestId,
    });
  }
}

async function enforceDistributedRateLimit(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: CommunityRpcAction,
): Promise<
  | { kind: "allowed" }
  | { kind: "denied"; remaining: number; resetAt: Date }
  | { kind: "unavailable" }
> {
  const limit = (() => {
    switch (action) {
      case "createAlert":
        return { maxRequests: 20, windowSeconds: 60 } as const;
    }
  })();
  const { data, error } = await supabaseAdmin.rpc(
    "consume_community_edge_rate_limit",
    {
      p_action: action,
      p_actor_user_id: auth.userId,
      p_function_name: FUNCTION_NAME,
      p_limit: limit.maxRequests,
      p_window_seconds: limit.windowSeconds,
    },
  );

  const row = Array.isArray(data)
    ? (data[0] as DistributedRateLimitRow | undefined)
    : (data as DistributedRateLimitRow | null);
  if (error || !row || typeof row.allowed !== "boolean") {
    console.error("[community-rpc][rate-limit]", {
      code: error?.code ?? "invalid_response",
    });
    return { kind: "unavailable" };
  }

  if (row.allowed) return { kind: "allowed" };
  const resetAt = new Date(row.reset_at);
  if (Number.isNaN(resetAt.getTime())) return { kind: "unavailable" };
  return {
    kind: "denied",
    remaining: Math.max(0, row.remaining),
    resetAt,
  };
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function requirePayload(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value as Record<string, unknown>;
}

function withTrustedActor(
  payload: Record<string, unknown>,
  userId: string,
): Record<string, unknown> {
  const sanitized = { ...payload };
  delete sanitized._actor_user_id;
  delete sanitized.actor_user_id;
  delete sanitized.p_actor_user_id;
  delete sanitized.user_id;
  return { ...sanitized, _actor_user_id: userId };
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

async function handleCreateAlert(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const payload = requirePayload(params.payload, "payload");
  requireUuid(payload.location_id, "payload.location_id");

  const { data, error } = await supabaseAdmin.rpc("create_community_alert", {
    payload: withTrustedActor(payload, auth.userId),
  });

  if (error) throw error;
  return data ?? { error: "internal_error" };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: CommunityRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "createAlert":
      return handleCreateAlert(supabaseAdmin, auth, params);
  }
}

serve(async (req: Request) => {
  const startedAt = performance.now();
  const requestId = crypto.randomUUID();

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
  if (!rawBody.ok) {
    await recordOperationalAudit(supabaseAdmin, {
      action: "invalid",
      durationMs: performance.now() - startedAt,
      errorCode: "invalid_body",
      outcome: "rejected",
      requestId,
      statusCode: rawBody.response.status,
      userId: auth.userId,
    });
    return withRequestId(rawBody.response, requestId);
  }

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    await recordOperationalAudit(supabaseAdmin, {
      action: "invalid",
      durationMs: performance.now() - startedAt,
      errorCode: "invalid_action",
      outcome: "rejected",
      requestId,
      statusCode: 400,
      userId: auth.userId,
    });
    return operationalJsonResponse(
      { error: "Invalid action" },
      400,
      req,
      requestId,
    );
  }

  const safeAction = action as CommunityRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  const distributedLimit = await enforceDistributedRateLimit(
    supabaseAdmin,
    auth,
    safeAction,
  );
  if (distributedLimit.kind === "unavailable") {
    await recordOperationalAudit(supabaseAdmin, {
      action: safeAction,
      durationMs: performance.now() - startedAt,
      errorCode: "rate_limit_unavailable",
      outcome: "blocked_fail_closed",
      requestId,
      statusCode: 503,
      userId: auth.userId,
    });
    return operationalJsonResponse(
      { error: "Service temporarily unavailable" },
      503,
      req,
      requestId,
      { "Retry-After": "5" },
    );
  }
  if (distributedLimit.kind === "denied") {
    const retryAfter = Math.max(
      1,
      Math.ceil((distributedLimit.resetAt.getTime() - Date.now()) / 1000),
    );
    await recordOperationalAudit(supabaseAdmin, {
      action: safeAction,
      durationMs: performance.now() - startedAt,
      errorCode: "distributed_rate_limit_exceeded",
      outcome: "rate_limited",
      requestId,
      statusCode: 429,
      userId: auth.userId,
    });
    return operationalJsonResponse(
      { error: "Rate limit exceeded", retryAfter },
      429,
      req,
      requestId,
      {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": String(distributedLimit.remaining),
        "X-RateLimit-Reset": String(
          Math.ceil(distributedLimit.resetAt.getTime() / 1000),
        ),
      },
    );
  }

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    await recordOperationalAudit(supabaseAdmin, {
      action: safeAction,
      durationMs: performance.now() - startedAt,
      outcome: "completed",
      requestId,
      statusCode: 200,
      userId: auth.userId,
    });

    return operationalJsonResponse({ data }, 200, req, requestId);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      await recordOperationalAudit(supabaseAdmin, {
        action: safeAction,
        durationMs: performance.now() - startedAt,
        errorCode: "request_validation_failed",
        outcome: "rejected",
        requestId,
        statusCode: 400,
        userId: auth.userId,
      });
      return operationalJsonResponse(
        { error: error.message },
        400,
        req,
        requestId,
      );
    }
    console.error("[community-rpc]", error);
    await recordOperationalAudit(supabaseAdmin, {
      action: safeAction,
      durationMs: performance.now() - startedAt,
      errorCode: "community_rpc_failed",
      outcome: "failed",
      requestId,
      statusCode: 500,
      userId: auth.userId,
    });
    return operationalJsonResponse(
      { error: "Internal server error" },
      500,
      req,
      requestId,
    );
  }
});
