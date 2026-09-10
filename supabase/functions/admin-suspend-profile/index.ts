/**
 * EDGE FUNCTION: admin-suspend-profile
 *
 * Broker administrativo único para suspender/reativar um Profile ou todos os
 * Profiles de uma conta. O bearer token prova o ator; o Postgres revalida a
 * role antes de qualquer mudança.
 */
import {
  getSupabaseAdminClient,
  jsonResponse,
  requireAdmin,
} from "../_shared/adminAuth.ts";
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  isOriginAllowed,
  isValidUUID,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
  sanitizeString,
} from "../_shared/security.ts";

type ModerationAction = "suspend" | "unsuspend";
type ModerationTargetKind = "profile" | "user";

interface ModerationRequest {
  action: ModerationAction;
  target_kind: ModerationTargetKind;
  target_id: string;
  reason?: string | null;
  suspended_until?: string | null;
}

const ALLOWED_METHODS = "POST, OPTIONS";

function isModerationAction(value: unknown): value is ModerationAction {
  return value === "suspend" || value === "unsuspend";
}

function isTargetKind(value: unknown): value is ModerationTargetKind {
  return value === "profile" || value === "user";
}

Deno.serve(async (req: Request) => {
  const auditInfo = getAuditInfo(req);
  const origin = req.headers.get("origin");
  const respond = (body: unknown, status = 200) =>
    jsonResponse(body, status, ALLOWED_METHODS, req);

  if (origin && !isOriginAllowed(origin)) {
    return respond({ error: "Origin not allowed" }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 20, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  const rawBody = await readJsonBody<ModerationRequest>(req, {
    maxBytes: 4096,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      action: "profile_moderation_failed",
      resource: "profiles",
      status: "failure",
      details: { reason: "invalid_json" },
      ...auditInfo,
    });
    return rawBody.response;
  }

  const body = rawBody.data;
  if (!isModerationAction(body.action)) {
    return respond({ error: "Valid action is required" }, 400);
  }
  if (!isTargetKind(body.target_kind)) {
    return respond({ error: "Valid target_kind is required" }, 400);
  }
  if (!body.target_id?.trim() || !isValidUUID(body.target_id)) {
    return respond({ error: "Valid target_id is required" }, 400);
  }

  const isSuspending = body.action === "suspend";
  const sanitizedReason =
    typeof body.reason === "string"
      ? sanitizeString(body.reason, 500).trim()
      : "";

  if (isSuspending && !sanitizedReason) {
    return respond({ error: "reason is required for suspension" }, 400);
  }

  let suspendedUntil: string | null = null;
  if (isSuspending && body.suspended_until) {
    const parsed = new Date(body.suspended_until);
    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.getTime() <= Date.now()
    ) {
      return respond({ error: "suspended_until must be a future timestamp" }, 400);
    }
    suspendedUntil = parsed.toISOString();
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.rpc(
    "admin_profile_rpc_set_suspension",
    {
      p_actor_user_id: authResult.userId,
      p_target_kind: body.target_kind,
      p_target_id: body.target_id,
      p_suspended: isSuspending,
      p_reason: sanitizedReason || null,
      p_suspended_until: suspendedUntil,
    },
  );

  if (error) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      action: "profile_moderation_failed",
      resource: "profiles",
      status: "failure",
      details: {
        moderationAction: body.action,
        targetKind: body.target_kind,
        targetId: body.target_id,
        error: error.message,
      },
      ...auditInfo,
    });
    return respond({ error: "Failed to update suspension state" }, 500);
  }

  auditLog({
    timestamp: new Date().toISOString(),
    userId: authResult.userId,
    action: isSuspending ? "suspend_profile" : "unsuspend_profile",
    resource: "profiles",
    status: "success",
    details: {
      targetKind: body.target_kind,
      targetId: body.target_id,
      reason: sanitizedReason || undefined,
      suspendedUntil,
    },
    ...auditInfo,
  });

  return respond(data);
});
