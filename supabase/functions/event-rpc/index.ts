/**
 * Edge Function: event-rpc
 *
 * Authenticated broker for atomic event participation and check-in mutations.
 * Browser clients never execute the backing SECURITY DEFINER RPCs directly.
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
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = {
  joinEvent: true,
  leaveEvent: true,
  checkInEvent: true,
  checkInEventByCode: true,
} as const;

type EventRpcAction = keyof typeof ACTIONS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

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

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
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

function actorParams(auth: UserAuthResult) {
  return {
    p_actor_user_id: auth.userId,
    p_is_project_admin: auth.isProjectAdmin,
  };
}

async function handleJoinEvent(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const eventId = requireUuid(params.eventId ?? params.event_id, "eventId");
  const profileId = requireUuid(params.profileId ?? params.profile_id, "profileId");

  const { data, error } = await supabaseAdmin.rpc("join_event_participation", {
    p_event_id: eventId,
    p_profile_id: profileId,
    ...actorParams(auth),
  });

  if (error) throw error;
  return data ?? { joined: false };
}

async function handleLeaveEvent(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const eventId = requireUuid(params.eventId ?? params.event_id, "eventId");
  const profileId = requireUuid(params.profileId ?? params.profile_id, "profileId");

  const { data, error } = await supabaseAdmin.rpc("leave_event_participation", {
    p_event_id: eventId,
    p_profile_id: profileId,
    ...actorParams(auth),
  });

  if (error) throw error;
  return data ?? { left: false };
}

async function handleCheckInEvent(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const eventId = requireUuid(params.eventId ?? params.event_id, "eventId");
  const profileId = requireUuid(params.profileId ?? params.profile_id, "profileId");

  const { data, error } = await supabaseAdmin.rpc("check_in_event_participation", {
    p_event_id: eventId,
    p_profile_id: profileId,
    ...actorParams(auth),
  });

  if (error) throw error;
  return data ?? { error: "internal_error" };
}

async function handleCheckInEventByCode(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const eventId = requireUuid(params.eventId ?? params.event_id, "eventId");
  const checkinCode = requireUuid(params.checkinCode ?? params.checkin_code, "checkinCode");

  const { data, error } = await supabaseAdmin.rpc("check_in_event_participation_by_code", {
    p_event_id: eventId,
    p_checkin_code: checkinCode,
    ...actorParams(auth),
  });

  if (error) throw error;
  return data ?? { error: "internal_error" };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: EventRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "joinEvent":
      return handleJoinEvent(supabaseAdmin, auth, params);
    case "leaveEvent":
      return handleLeaveEvent(supabaseAdmin, auth, params);
    case "checkInEvent":
      return handleCheckInEvent(supabaseAdmin, auth, params);
    case "checkInEventByCode":
      return handleCheckInEventByCode(supabaseAdmin, auth, params);
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

  const safeAction = action as EventRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `event_rpc_${safeAction}`,
      resource: "event-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[event-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `event_rpc_${safeAction}`,
      resource: "event-rpc",
      status: "failure",
      details: { action: safeAction, reason: "event_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
