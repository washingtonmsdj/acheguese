/**
 * Edge Function: mobility-rpc
 *
 * Authenticated broker for mobility dispatch and availability helpers. Browser
 * clients never execute the backing privileged RPCs directly.
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
const SAFE_STATUS_REGEX = /^[a-z0-9_:-]{1,64}$/i;
const MAX_AUDIT_REASON_LENGTH = 1000;
const FINAL_RIDE_STATUSES = new Set([
  "completed",
  "cancelled_by_passenger",
  "cancelled_by_driver",
  "expired",
  "failed",
]);
const CANCELLATION_STATUSES = new Set(["cancelled_by_passenger", "cancelled_by_driver"]);
const DISPATCH_STRATEGIES = new Set(["exclusive_offer", "open_board", "reservation_board"]);
const ACTIONS = {
  acceptRide: true,
  adminRedispatch: true,
  transitionRideState: true,
  transitionDeliveryState: true,
  updateFailedDeliveryResolution: true,
  logRideStateChange: true,
  logDispatchAttempt: true,
  updateLatestDispatchAttempt: true,
  cancelPendingOffers: true,
  releaseDriverAvailabilityForRide: true,
} as const;

type MobilityRpcAction = keyof typeof ACTIONS;
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

interface RideRow {
  id: string;
  passenger_profile_id: string | null;
  driver_profile_id: string | null;
  status: string;
  ride_mode: string;
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

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireUuid(value, field);
}

function requireAttemptNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 1000) {
    throw new RequestValidationError("Invalid attemptNumber");
  }
  return value;
}

function optionalStatus(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !SAFE_STATUS_REGEX.test(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function requireStatus(value: unknown, field: string): string {
  const status = optionalStatus(value, field);
  if (!status) throw new RequestValidationError(`Invalid ${field}`);
  return status;
}

function optionalAuditReason(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid reason");
  }
  const normalized = value.trim();
  if (normalized.length > MAX_AUDIT_REASON_LENGTH) {
    throw new RequestValidationError("Audit reason is too long");
  }
  return normalized;
}

function requireDispatchStrategy(value: unknown): string {
  const strategy = requireStatus(value, "strategy");
  if (!DISPATCH_STRATEGIES.has(strategy)) {
    throw new RequestValidationError("Invalid strategy");
  }
  return strategy;
}

function requireTimestamp(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return date.toISOString();
}

function optionalTimestamp(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireTimestamp(value, field);
}

function requireObject(value: unknown, field: string): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value as Record<string, unknown>;
}

function optionalFiniteNumber(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

async function isProjectAdmin(supabaseAdmin: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("is_admin", {
    p_user_id: userId,
  });

  if (error) throw error;
  return data === true;
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

async function getRide(supabaseAdmin: SupabaseClient, rideId: string): Promise<RideRow> {
  const { data, error } = await supabaseAdmin
    .from("ride_requests")
    .select("id, passenger_profile_id, driver_profile_id, status, ride_mode")
    .eq("id", rideId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestValidationError("Ride was not found");
  return data as RideRow;
}

async function profileBelongsToUser(
  supabaseAdmin: SupabaseClient,
  profileId: string | null,
  userId: string,
): Promise<boolean> {
  if (!profileId) return false;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function canWriteDispatchAudit(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  ride: RideRow,
  driverProfileId: string,
): Promise<boolean> {
  if (auth.isProjectAdmin) return true;

  if (await profileBelongsToUser(supabaseAdmin, ride.passenger_profile_id, auth.userId)) {
    return true;
  }

  return profileBelongsToUser(supabaseAdmin, driverProfileId, auth.userId);
}

async function canAccessRideAsParticipantOrAdmin(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  ride: RideRow,
  explicitDriverProfileId?: string | null,
): Promise<boolean> {
  if (auth.isProjectAdmin) return true;

  if (await profileBelongsToUser(supabaseAdmin, ride.passenger_profile_id, auth.userId)) {
    return true;
  }

  if (await profileBelongsToUser(supabaseAdmin, ride.driver_profile_id, auth.userId)) {
    return true;
  }

  return profileBelongsToUser(supabaseAdmin, explicitDriverProfileId ?? null, auth.userId);
}

async function requireRideTransitionActor(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  ride: RideRow,
  toState: string,
  requestedActor: unknown,
): Promise<string> {
  if (
    toState === "driver_assigned" ||
    toState === "driver_accepted" ||
    toState === "expired" ||
    toState === "pickup_confirmed" ||
    toState === "delivered" ||
    toState === "failed_delivery"
  ) {
    throw new RequestAuthorizationError("Transition is reserved for dispatch or a dedicated command");
  }

  if (auth.isProjectAdmin) {
    return `admin:${auth.userId}`;
  }

  const passengerOwned = await profileBelongsToUser(
    supabaseAdmin,
    ride.passenger_profile_id,
    auth.userId,
  );
  const driverOwned = await profileBelongsToUser(
    supabaseAdmin,
    ride.driver_profile_id,
    auth.userId,
  );

  if (toState === "searching_driver" || toState === "cancelled_by_passenger") {
    if (!passengerOwned) {
      throw new RequestAuthorizationError("Only the ride passenger can perform this transition");
    }
    return ride.passenger_profile_id as string;
  }

  const driverStates = new Set([
    "driver_arriving",
    "passenger_boarded",
    "in_progress",
    "pickup_confirmed",
    "in_delivery",
    "delivered",
    "failed_delivery",
    "completed",
    "failed",
    "cancelled_by_driver",
  ]);

  if (driverStates.has(toState)) {
    if (!driverOwned || !ride.driver_profile_id) {
      throw new RequestAuthorizationError("Only the assigned driver can perform this transition");
    }

    if (
      requestedActor !== undefined &&
      requestedActor !== null &&
      requestedActor !== "system" &&
      requestedActor !== ride.driver_profile_id
    ) {
      throw new RequestAuthorizationError("Actor profile does not match the assigned driver");
    }

    return ride.driver_profile_id;
  }

  throw new RequestAuthorizationError("Transition is not exposed to browser clients");
}

async function requireBoardingVerification(
  supabaseAdmin: SupabaseClient,
  rideId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("operational_verifications")
    .select("is_required, status")
    .eq("ride_id", rideId)
    .maybeSingle();

  if (error) throw error;
  if (data?.is_required === true && data.status !== "verified") {
    throw new RequestAuthorizationError("PIN verification is required before boarding");
  }
}

async function requireDeliveryTransitionActor(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  ride: RideRow,
  requestedActor: unknown,
): Promise<string> {
  if (auth.isProjectAdmin) {
    return `admin:${auth.userId}`;
  }

  if (
    !ride.driver_profile_id ||
    !await profileBelongsToUser(
      supabaseAdmin,
      ride.driver_profile_id,
      auth.userId,
    )
  ) {
    throw new RequestAuthorizationError(
      "Only the assigned driver can perform this delivery command",
    );
  }

  if (
    requestedActor !== undefined &&
    requestedActor !== null &&
    requestedActor !== ride.driver_profile_id
  ) {
    throw new RequestAuthorizationError(
      "Actor profile does not match the assigned driver",
    );
  }

  return ride.driver_profile_id;
}

async function requireDeliveryVerification(
  supabaseAdmin: SupabaseClient,
  rideId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("operational_verifications")
    .select("is_required, status")
    .eq("ride_id", rideId)
    .maybeSingle();

  if (error) throw error;
  if (data?.is_required === true && data.status !== "verified") {
    throw new RequestAuthorizationError(
      "PIN verification is required before delivery confirmation",
    );
  }
}

async function resolveAuditActor(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  ride: RideRow,
  requestedActor: unknown,
): Promise<string> {
  if (auth.isProjectAdmin) {
    return `admin:${auth.userId}`;
  }

  if (
    typeof requestedActor === "string" &&
    UUID_REGEX.test(requestedActor) &&
    await profileBelongsToUser(supabaseAdmin, requestedActor, auth.userId)
  ) {
    return requestedActor;
  }

  if (await profileBelongsToUser(supabaseAdmin, ride.passenger_profile_id, auth.userId)) {
    return ride.passenger_profile_id as string;
  }

  if (await profileBelongsToUser(supabaseAdmin, ride.driver_profile_id, auth.userId)) {
    return ride.driver_profile_id as string;
  }

  throw new RequestAuthorizationError("User cannot write audit events for this ride");
}

async function requireDispatchWriteAccess(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  rideId: string,
  driverProfileId: string,
): Promise<RideRow> {
  const ride = await getRide(supabaseAdmin, rideId);
  if (!await canWriteDispatchAudit(supabaseAdmin, auth, ride, driverProfileId)) {
    throw new RequestAuthorizationError("User cannot write dispatch audit for this ride");
  }
  return ride;
}

async function handleTransitionRideState(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const expectedFromState = requireStatus(
    params.expectedFromState ?? params.expected_from_state,
    "expectedFromState",
  );
  const toState = requireStatus(params.toState ?? params.to_state, "toState");
  const reason = optionalAuditReason(params.reason);
  const ride = await getRide(supabaseAdmin, rideId);

  if (ride.status !== expectedFromState) {
    throw new RequestValidationError("Ride state changed during transition");
  }

  if (toState === "passenger_boarded") {
    await requireBoardingVerification(supabaseAdmin, rideId);
  }

  const changedBy = await requireRideTransitionActor(
    supabaseAdmin,
    auth,
    ride,
    toState,
    params.actorProfileId ?? params.actor_profile_id ?? params.actor,
  );

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_transition_ride_state_atomic",
    {
      p_ride_id: rideId,
      p_expected_from_state: expectedFromState,
      p_to_state: toState,
      p_changed_by: changedBy,
      p_reason: reason || null,
    },
  );

  if (error) throw error;
  return data ?? {
    updated: false,
    ride_id: rideId,
    from_state: expectedFromState,
    to_state: toState,
  };
}

async function handleTransitionDeliveryState(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const expectedFromState = requireStatus(
    params.expectedFromState ?? params.expected_from_state,
    "expectedFromState",
  );
  const command = requireStatus(params.command, "command");
  const reason = optionalAuditReason(params.reason);
  const ride = await getRide(supabaseAdmin, rideId);

  if (ride.ride_mode !== "motoboy") {
    throw new RequestValidationError("Delivery command requires motoboy ride");
  }

  if (ride.status !== expectedFromState) {
    throw new RequestValidationError("Ride state changed during delivery command");
  }

  const allowedCommands = new Set([
    "confirm_pickup",
    "confirm_delivery",
    "fail_delivery",
  ]);
  if (!allowedCommands.has(command)) {
    throw new RequestValidationError("Invalid delivery command");
  }

  const changedBy = await requireDeliveryTransitionActor(
    supabaseAdmin,
    auth,
    ride,
    params.actorProfileId ?? params.actor_profile_id ?? params.actor,
  );

  let proofOfDelivery: Record<string, unknown> | null = null;
  let failedDeliveryMetadata: Record<string, unknown> | null = null;
  let finalPrice: number | null = null;

  if (command === "confirm_delivery") {
    await requireDeliveryVerification(supabaseAdmin, rideId);
    proofOfDelivery = requireObject(
      params.proofOfDelivery ?? params.proof_of_delivery,
      "proofOfDelivery",
    );
    finalPrice = optionalFiniteNumber(
      params.finalPrice ?? params.final_price,
      "finalPrice",
    );
  } else if (command === "fail_delivery") {
    failedDeliveryMetadata = requireObject(
      params.failedDeliveryMetadata ?? params.failed_delivery_metadata,
      "failedDeliveryMetadata",
    );
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_transition_delivery_state_atomic",
    {
      p_ride_id: rideId,
      p_expected_from_state: expectedFromState,
      p_command: command,
      p_changed_by: changedBy,
      p_reason: reason || null,
      p_proof_of_delivery: proofOfDelivery,
      p_final_price: finalPrice,
      p_failed_delivery_metadata: failedDeliveryMetadata,
    },
  );

  if (error) throw error;
  return data ?? {
    updated: false,
    ride_id: rideId,
    from_state: expectedFromState,
  };
}

async function handleUpdateFailedDeliveryResolution(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const resolutionUpdate = requireObject(
    params.resolutionUpdate ?? params.resolution_update,
    "resolutionUpdate",
  );
  const ride = await getRide(supabaseAdmin, rideId);

  if (ride.ride_mode !== "motoboy" || ride.status !== "failed_delivery") {
    throw new RequestValidationError("Ride is not a failed motoboy delivery");
  }

  if (!await canAccessRideAsParticipantOrAdmin(supabaseAdmin, auth, ride)) {
    throw new RequestAuthorizationError(
      "User cannot update failed delivery resolution for this ride",
    );
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_update_failed_delivery_resolution_atomic",
    {
      p_ride_id: rideId,
      p_resolution_update: resolutionUpdate,
    },
  );

  if (error) throw error;
  return data ?? { updated: false, ride_id: rideId };
}

async function handleLogRideStateChange(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const toState = requireStatus(params.toState ?? params.to_state, "toState");
  const fromState =
    optionalStatus(params.fromState ?? params.from_state, "fromState") ?? "none";
  const reason = optionalAuditReason(params.reason);
  const ride = await getRide(supabaseAdmin, rideId);

  if (!await canAccessRideAsParticipantOrAdmin(supabaseAdmin, auth, ride)) {
    throw new RequestAuthorizationError("User cannot write audit events for this ride");
  }

  if (ride.status !== toState) {
    throw new RequestValidationError("Ride state does not match audit target");
  }

  const changedBy = await resolveAuditActor(
    supabaseAdmin,
    auth,
    ride,
    params.actorProfileId ?? params.actor_profile_id ?? params.changedBy ?? params.changed_by,
  );

  const { error } = await supabaseAdmin.from("ride_state_audit").insert({
    ride_id: rideId,
    from_state: fromState,
    to_state: toState,
    changed_by: changedBy,
    reason,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
  return { logged: true };
}

async function handleAcceptRide(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const driverProfileId = requireUuid(
    params.driverProfileId ?? params.driver_profile_id,
    "driverProfileId",
  );
  const strategy = requireDispatchStrategy(params.strategy ?? params.p_strategy);

  await getRide(supabaseAdmin, rideId);

  if (
    !auth.isProjectAdmin &&
    !await profileBelongsToUser(supabaseAdmin, driverProfileId, auth.userId)
  ) {
    throw new RequestAuthorizationError("User cannot accept rides with this driver profile");
  }

  const { data, error } = await supabaseAdmin.rpc("mobility_accept_ride_atomic", {
    p_ride_id: rideId,
    p_driver_profile_id: driverProfileId,
    p_strategy: strategy,
  });

  if (error) throw error;
  return data ?? { success: false, reason: "error", error: "Empty accept ride response" };
}

async function handleAdminRedispatch(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  if (!auth.isProjectAdmin) {
    throw new RequestAuthorizationError("Admin authority is required for redispatch");
  }

  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const reason = optionalAuditReason(params.reason);
  const ride = await getRide(supabaseAdmin, rideId);

  if (ride.ride_mode !== "motoboy") {
    throw new RequestValidationError("Admin redispatch requires motoboy ride");
  }

  if (ride.status !== "driver_assigned" && ride.status !== "driver_accepted") {
    throw new RequestValidationError("Ride is not eligible for admin redispatch");
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_admin_redispatch_atomic",
    {
      p_ride_id: rideId,
      p_changed_by: `admin:${auth.userId}`,
      p_reason: reason || "Admin redispatch",
    },
  );

  if (error) throw error;
  return data ?? { success: false, reason: "empty_response", ride_id: rideId };
}

async function handleLogDispatchAttempt(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const driverProfileId = requireUuid(
    params.driverProfileId ?? params.driver_profile_id,
    "driverProfileId",
  );
  const attemptNumber = requireAttemptNumber(params.attemptNumber ?? params.attempt_number);
  const offeredAt = requireTimestamp(params.offeredAt ?? params.offered_at, "offeredAt");
  const timeoutAt = requireTimestamp(params.timeoutAt ?? params.timeout_at, "timeoutAt");
  const status = requireStatus(params.status, "status");

  await requireDispatchWriteAccess(supabaseAdmin, auth, rideId, driverProfileId);

  const { error } = await supabaseAdmin.rpc("log_ride_dispatch_attempt", {
    p_ride_id: rideId,
    p_driver_profile_id: driverProfileId,
    p_attempt_number: attemptNumber,
    p_offered_at: offeredAt,
    p_timeout_at: timeoutAt,
    p_status: status,
  });

  if (error) throw error;
  return { logged: true };
}

async function handleUpdateLatestDispatchAttempt(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const driverProfileId = requireUuid(
    params.driverProfileId ?? params.driver_profile_id,
    "driverProfileId",
  );
  const status = optionalStatus(params.status, "status");
  const respondedAt = optionalTimestamp(
    params.respondedAt ?? params.responded_at,
    "respondedAt",
  );

  if (!status && !respondedAt) {
    throw new RequestValidationError("No update fields provided");
  }

  await requireDispatchWriteAccess(supabaseAdmin, auth, rideId, driverProfileId);

  const { error } = await supabaseAdmin.rpc("update_latest_ride_dispatch_attempt", {
    p_ride_id: rideId,
    p_driver_profile_id: driverProfileId,
    p_status: status,
    p_responded_at: respondedAt,
  });

  if (error) throw error;
  return { updated: true };
}

async function handleCancelPendingOffers(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const ride = await getRide(supabaseAdmin, rideId);

  if (!CANCELLATION_STATUSES.has(ride.status)) {
    throw new RequestValidationError("Ride must be cancelled before cancelling pending offers");
  }

  if (!await canAccessRideAsParticipantOrAdmin(supabaseAdmin, auth, ride)) {
    throw new RequestAuthorizationError("User cannot cancel offers for this ride");
  }

  const { data, error } = await supabaseAdmin.rpc("cancel_pending_ride_offers", {
    p_ride_id: rideId,
  });

  if (error) throw error;
  return { cancelledCount: typeof data === "number" ? data : 0 };
}

async function handleReleaseDriverAvailability(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const driverProfileId = requireUuid(
    params.driverProfileId ?? params.driver_profile_id,
    "driverProfileId",
  );
  const ride = await getRide(supabaseAdmin, rideId);

  if (!FINAL_RIDE_STATUSES.has(ride.status)) {
    throw new RequestValidationError("Ride must be final before releasing driver availability");
  }

  if (!await canAccessRideAsParticipantOrAdmin(supabaseAdmin, auth, ride, driverProfileId)) {
    throw new RequestAuthorizationError("User cannot release this driver availability");
  }

  const { data, error } = await supabaseAdmin.rpc("release_driver_availability_for_ride", {
    p_driver_profile_id: driverProfileId,
    p_ride_id: rideId,
  });

  if (error) throw error;
  return { released: data === true };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: MobilityRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "acceptRide":
      return handleAcceptRide(supabaseAdmin, auth, params);
    case "adminRedispatch":
      return handleAdminRedispatch(supabaseAdmin, auth, params);
    case "transitionRideState":
      return handleTransitionRideState(supabaseAdmin, auth, params);
    case "transitionDeliveryState":
      return handleTransitionDeliveryState(supabaseAdmin, auth, params);
    case "updateFailedDeliveryResolution":
      return handleUpdateFailedDeliveryResolution(supabaseAdmin, auth, params);
    case "logRideStateChange":
      return handleLogRideStateChange(supabaseAdmin, auth, params);
    case "logDispatchAttempt":
      return handleLogDispatchAttempt(supabaseAdmin, auth, params);
    case "updateLatestDispatchAttempt":
      return handleUpdateLatestDispatchAttempt(supabaseAdmin, auth, params);
    case "cancelPendingOffers":
      return handleCancelPendingOffers(supabaseAdmin, auth, params);
    case "releaseDriverAvailabilityForRide":
      return handleReleaseDriverAvailability(supabaseAdmin, auth, params);
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

  const safeAction = action as MobilityRpcAction;
  const params =
    typeof rawBody.data.params === "object" && rawBody.data.params !== null
      ? rawBody.data.params
      : {};

  try {
    const data = await dispatchAction(supabaseAdmin, auth, safeAction, params);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `mobility_rpc_${safeAction}`,
      resource: "mobility-rpc",
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

    console.error("[mobility-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `mobility_rpc_${safeAction}`,
      resource: "mobility-rpc",
      status: "failure",
      details: { action: safeAction, reason: "mobility_rpc_failed" },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: "Internal server error" }, 500, ALLOWED_METHODS, req);
  }
});