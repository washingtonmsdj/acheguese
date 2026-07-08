/**
 * Edge Function: profile-rpc
 *
 * Authenticated broker for privileged profile mutations. Browser clients never
 * execute the backing SECURITY DEFINER RPCs directly.
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
  createProfile: true,
  updateHandle: true,
  deleteProfile: true,
  transferOwnership: true,
  inviteMemberByEmail: true,
} as const;

type ProfileRpcAction = keyof typeof ACTIONS;
type SupabaseClient = ReturnType<typeof createClient>;
type ProfileType = "personal" | "business" | "professional" | "driver";
type ProfileMemberRole = "member" | "admin";

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

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function requireString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return normalized;
}

function optionalString(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return normalized || null;
}

function requireEmail(value: unknown): string {
  const email = requireString(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new RequestValidationError("Invalid email");
  }
  return email;
}

function requireProfileType(value: unknown): ProfileType {
  if (
    value !== "personal" &&
    value !== "business" &&
    value !== "professional" &&
    value !== "driver"
  ) {
    throw new RequestValidationError("Invalid profileType");
  }
  return value;
}

function optionalExtensionData(value: unknown): Record<string, unknown> | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Invalid extensionData");
  }

  const sanitized = { ...(value as Record<string, unknown>) };
  delete sanitized._actor_user_id;
  delete sanitized.actor_user_id;
  delete sanitized.p_actor_user_id;
  delete sanitized.user_id;
  return sanitized;
}

function requireInviteRole(value: unknown): ProfileMemberRole {
  if (value === undefined || value === null || value === "") return "member";
  if (value !== "member" && value !== "admin") {
    throw new RequestValidationError("Invalid role");
  }
  return value;
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

async function handleCreateProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileType = requireProfileType(params.profileType ?? params.p_profile_type);
  const handle = requireString(params.handle ?? params.p_handle, "handle", 100);
  const displayName = requireString(params.displayName ?? params.p_display_name, "displayName", 160);
  const avatarUrl = optionalString(params.avatarUrl ?? params.p_avatar_url, "avatarUrl", 2048);
  const bio = optionalString(params.bio ?? params.p_bio, "bio", 4000);
  const extensionData = optionalExtensionData(params.extensionData ?? params.p_extension_data);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_create_profile_with_extension", {
    p_actor_user_id: auth.userId,
    p_profile_type: profileType,
    p_handle: handle,
    p_display_name: displayName,
    p_avatar_url: avatarUrl,
    p_bio: bio,
    p_extension_data: extensionData,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleUpdateHandle(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");
  const newHandle = requireString(params.newHandle ?? params.p_new_handle, "newHandle", 100);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_update_profile_handle", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_new_handle: newHandle,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleDeleteProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_delete_profile", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleTransferOwnership(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");
  const newOwnerUserId = requireUuid(
    params.newOwnerUserId ?? params.p_new_owner_user_id,
    "newOwnerUserId",
  );

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_transfer_profile_ownership", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_new_owner_user_id: newOwnerUserId,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function handleInviteMemberByEmail(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const profileId = requireUuid(params.profileId ?? params.p_profile_id, "profileId");
  const email = requireEmail(params.email ?? params.p_email);
  const role = requireInviteRole(params.role ?? params.p_role);

  const { data, error } = await supabaseAdmin.rpc("profile_rpc_invite_profile_member_by_email", {
    p_actor_user_id: auth.userId,
    p_profile_id: profileId,
    p_email: email,
    p_role: role,
  });

  if (error) throw error;
  return data ?? { success: false, error: "Profile RPC returned no data" };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: ProfileRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "createProfile":
      return handleCreateProfile(supabaseAdmin, auth, params);
    case "updateHandle":
      return handleUpdateHandle(supabaseAdmin, auth, params);
    case "deleteProfile":
      return handleDeleteProfile(supabaseAdmin, auth, params);
    case "transferOwnership":
      return handleTransferOwnership(supabaseAdmin, auth, params);
    case "inviteMemberByEmail":
      return handleInviteMemberByEmail(supabaseAdmin, auth, params);
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

  const safeAction = action as ProfileRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `profile_rpc_${safeAction}`,
      resource: "profile-rpc",
      status: "success",
      details: { action: safeAction },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[profile-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `profile_rpc_${safeAction}`,
      resource: "profile-rpc",
      status: "failure",
      details: { action: safeAction, reason: "profile_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});
