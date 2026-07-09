/**
 * Edge Function: community-rpc
 *
 * Authenticated broker for privileged community content mutations. Browser
 * clients never execute the backing SECURITY DEFINER RPCs directly.
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
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const ACTIONS = {
  createAlert: true,
  createIssue: true,
  incrementAlertEditCount: true,
  markBestAnswer: true,
} as const;

type CommunityRpcAction = keyof typeof ACTIONS;
type SupabaseClient = ReturnType<typeof createClient>;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface UserAuthResult {
  userId: string;
  isProjectAdmin: boolean;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

class RequestAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestAuthorizationError";
  }
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
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

async function isProjectAdmin(supabaseAdmin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .in("role_enum", ["admin", "super_admin"])
    .is("revoked_at", null)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
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

  return {
    userId: data.user.id,
    isProjectAdmin: await isProjectAdmin(supabaseAdmin, data.user.id),
  };
}

async function requireProfileOwnerOrAdmin(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  table: "community_alerts" | "community_questions",
  id: string,
  profileColumn: "profile_id" | "author_profile_id",
) {
  if (auth.isProjectAdmin) return;

  const { data, error } = await supabaseAdmin
    .from(table)
    .select(profileColumn)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestValidationError("Community record was not found");

  const profileId = (data as Record<string, unknown>)[profileColumn];
  if (typeof profileId !== "string") {
    throw new RequestValidationError("Community record has no owner profile");
  }

  if (!await profileBelongsToUser(supabaseAdmin, profileId, auth.userId)) {
    throw new RequestAuthorizationError("User cannot mutate this community record");
  }
}

async function profileBelongsToUser(
  supabaseAdmin: SupabaseClient,
  profileId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function ensureAnswerBelongsToQuestion(
  supabaseAdmin: SupabaseClient,
  questionId: string,
  answerId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("question_answers")
    .select("id")
    .eq("id", answerId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestValidationError("Answer does not belong to question");
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

async function handleCreateIssue(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const payload = requirePayload(params.payload, "payload");
  requireUuid(payload.location_id, "payload.location_id");

  const { data, error } = await supabaseAdmin.rpc("create_community_issue", {
    payload: withTrustedActor(payload, auth.userId),
  });

  if (error) throw error;
  return data ?? { error: "internal_error" };
}

async function handleIncrementAlertEditCount(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const alertId = requireUuid(params.alertId ?? params.p_alert_id, "alertId");
  await requireProfileOwnerOrAdmin(
    supabaseAdmin,
    auth,
    "community_alerts",
    alertId,
    "profile_id",
  );

  const { error } = await supabaseAdmin.rpc("increment_alert_edit_count", {
    p_alert_id: alertId,
  });

  if (error) throw error;
  return { incremented: true };
}

async function handleMarkBestAnswer(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const questionId = requireUuid(params.questionId ?? params._question_id, "questionId");
  const answerId = requireUuid(params.answerId ?? params._answer_id, "answerId");

  await requireProfileOwnerOrAdmin(
    supabaseAdmin,
    auth,
    "community_questions",
    questionId,
    "author_profile_id",
  );
  await ensureAnswerBelongsToQuestion(supabaseAdmin, questionId, answerId);

  const { error } = await supabaseAdmin.rpc("mark_best_answer", {
    _question_id: questionId,
    _answer_id: answerId,
  });

  if (error) throw error;
  return { marked: true };
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
    case "createIssue":
      return handleCreateIssue(supabaseAdmin, auth, params);
    case "incrementAlertEditCount":
      return handleIncrementAlertEditCount(supabaseAdmin, auth, params);
    case "markBestAnswer":
      return handleMarkBestAnswer(supabaseAdmin, auth, params);
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

  const safeAction = action as CommunityRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `community_rpc_${safeAction}`,
      resource: "community-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }
    if (error instanceof RequestAuthorizationError) {
      return jsonResponse({ error: error.message }, 403, ALLOWED_METHODS, req);
    }

    console.error("[community-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `community_rpc_${safeAction}`,
      resource: "community-rpc",
      status: "failure",
      details: { action: safeAction, reason: "community_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
