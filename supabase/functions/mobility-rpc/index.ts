/**
 * Edge Function: mobility-rpc
 *
 * Authenticated broker for mobility dispatch, driver presence and operational
 * transitions. Ride/delivery creation belongs exclusively to mobility-create-rpc.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireOperationalAccount } from "../_shared/accountOperational.ts";
import { evaluateUserMfaPolicy } from "../_shared/mfaPolicy.ts";
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
const DISPATCH_STRATEGIES = new Set([
  "exclusive_offer",
  "open_board",
  "reservation_board",
]);
const DRIVER_AVAILABILITY_ACTIONS = new Set([
  "go_online",
  "go_offline",
  "set_available",
  "pause_available",
  "heartbeat",
]);
const DRIVER_RIDE_MODES = new Set(["ride", "motoboy"]);

const ACTIONS = {
  createDriverProfile: true,
  ensureAdminDriverProfile: true,
  acceptRide: true,
  adminRedispatch: true,
  confirmPassengerCompletion: true,
  transitionRideState: true,
  transitionDeliveryState: true,
  updateFailedDeliveryResolution: true,
  updateDriverAvailability: true,
  updateDriverLocation: true,
  listDriverOffers: true,
  findAvailableDriversForRide: true,
  reconcileStaleDriverAvailability: true,
  getDriverRideHistory: true,
  getDriverEarningsHistory: true,
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
  token: string;
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

function requireDriverAvailabilityAction(value: unknown): string {
  const action = requireStatus(value, "availabilityAction");
  if (!DRIVER_AVAILABILITY_ACTIONS.has(action)) {
    throw new RequestValidationError("Invalid availabilityAction");
  }
  return action;
}

function optionalDriverRideMode(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const mode = requireStatus(value, "rideMode");
  if (!DRIVER_RIDE_MODES.has(mode)) {
    throw new RequestValidationError("Invalid rideMode");
  }
  return mode;
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
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
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

function optionalTrimmedString(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`${field} is too long`);
  }
  return normalized;
}

function requireTrimmedString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  const normalized = optionalTrimmedString(value, field, maxLength);
  if (!normalized) throw new RequestValidationError(`Invalid ${field}`);
  return normalized;
}

function optionalBoundedNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  const parsed = optionalFiniteNumber(value, field);
  if (parsed === null) return null;
  if (parsed < min || parsed > max) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return parsed;
}

function optionalInteger(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  const parsed = optionalFiniteNumber(value, field);
  if (parsed === null) return null;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return parsed;
}

const DRIVER_LICENSE_CATEGORIES = new Set(["A", "B", "AB", "C", "D", "E"]);
const DRIVER_VEHICLE_TYPES = new Set(["car", "motorcycle", "van", "truck"]);
const BRAZIL_STATE_CODES = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
]);
const DRIVER_REGISTRATION_FIELDS = new Set([
  "license_number",
  "license_category",
  "license_expiry",
  "license_state",
  "vehicle_type",
  "vehicle_plate",
  "vehicle_model",
  "vehicle_year",
  "vehicle_color",
  "can_do_delivery",
  "can_do_rides",
]);

function sanitizeDriverRegistrationExtension(value: unknown): Record<string, unknown> {
  const input = requireObject(value, "extensionData");

  for (const key of Object.keys(input)) {
    if (!DRIVER_REGISTRATION_FIELDS.has(key)) {
      throw new RequestValidationError(
        `Unsupported driver registration field: ${key}`,
      );
    }
  }

  const licenseNumber = requireTrimmedString(
    input.license_number,
    "license_number",
    32,
  );
  const licenseCategory = requireTrimmedString(
    input.license_category,
    "license_category",
    3,
  ).toUpperCase();
  if (!DRIVER_LICENSE_CATEGORIES.has(licenseCategory)) {
    throw new RequestValidationError("Invalid license_category");
  }

  const licenseExpiry = requireTrimmedString(
    input.license_expiry,
    "license_expiry",
    10,
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(licenseExpiry)) {
    throw new RequestValidationError("Invalid license_expiry");
  }
  const expiryDate = new Date(`${licenseExpiry}T00:00:00Z`);
  if (
    Number.isNaN(expiryDate.getTime()) ||
    expiryDate.getTime() < Date.now() - 86_400_000
  ) {
    throw new RequestValidationError("Driver license is expired");
  }

  const licenseState = requireTrimmedString(
    input.license_state,
    "license_state",
    2,
  ).toUpperCase();
  if (!BRAZIL_STATE_CODES.has(licenseState)) {
    throw new RequestValidationError("Invalid license_state");
  }

  const vehicleType = requireTrimmedString(
    input.vehicle_type,
    "vehicle_type",
    24,
  ).toLowerCase();
  if (!DRIVER_VEHICLE_TYPES.has(vehicleType)) {
    throw new RequestValidationError("Invalid vehicle_type");
  }

  const vehiclePlate = requireTrimmedString(
    input.vehicle_plate,
    "vehicle_plate",
    16,
  ).toUpperCase();
  if (!/^[A-Z0-9-]{5,10}$/.test(vehiclePlate)) {
    throw new RequestValidationError("Invalid vehicle_plate");
  }

  const vehicleModel = requireTrimmedString(
    input.vehicle_model,
    "vehicle_model",
    100,
  );
  const vehicleYear = optionalInteger(
    input.vehicle_year,
    "vehicle_year",
    1900,
    new Date().getUTCFullYear() + 1,
  );
  if (vehicleYear === null) {
    throw new RequestValidationError("Invalid vehicle_year");
  }
  const vehicleColor = requireTrimmedString(
    input.vehicle_color,
    "vehicle_color",
    64,
  );

  if (
    typeof input.can_do_delivery !== "boolean" ||
    typeof input.can_do_rides !== "boolean"
  ) {
    throw new RequestValidationError("Driver operational mode is required");
  }

  const canDoDelivery = input.can_do_delivery === true;
  const canDoRides = input.can_do_rides === true;
  if (canDoDelivery === canDoRides) {
    throw new RequestValidationError(
      "Driver registration must select exactly one initial operational mode",
    );
  }

  return {
    license_number: licenseNumber,
    license_category: licenseCategory,
    license_expiry: licenseExpiry,
    license_state: licenseState,
    vehicle_type: vehicleType,
    vehicle_plate: vehiclePlate,
    vehicle_model: vehicleModel,
    vehicle_year: vehicleYear,
    vehicle_color: vehicleColor,
    documents_verified: false,
    documents_verified_at: null,
    background_check_status: "pending",
    background_check_date: null,
    is_available: false,
    can_do_delivery: canDoDelivery,
    can_do_rides: canDoRides,
  };
}

async function isProjectAdmin(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: roles, error } = await supabaseAdmin.rpc("get_user_roles", {
    _user_id: userId,
  });
  if (error) throw error;
  return Array.isArray(roles) &&
    (roles.includes("admin") || roles.includes("super_admin"));
}

async function requireUser(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<UserAuthResult | Response> {
  const token = extractBearerToken(req);
  if (!token) {
    return jsonResponse(
      { error: "Missing or invalid authorization header" },
      401,
      ALLOWED_METHODS,
      req,
    );
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return jsonResponse(
      { error: "Invalid or expired token" },
      401,
      ALLOWED_METHODS,
      req,
    );
  }

  return {
    userId: data.user.id,
    token,
    isProjectAdmin: await isProjectAdmin(supabaseAdmin, data.user.id),
  };
}

async function requireAdminMfa(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  operation: string,
): Promise<void> {
  if (!auth.isProjectAdmin) {
    throw new RequestAuthorizationError("Project admin authority is required");
  }

  const mfaPolicy = await evaluateUserMfaPolicy(
    supabaseAdmin,
    auth.userId,
    auth.token,
  );
  if (
    mfaPolicy.enforced === true &&
    mfaPolicy.required === false &&
    mfaPolicy.reason === "satisfied"
  ) {
    return;
  }

  auditLog({
    timestamp: new Date().toISOString(),
    userId: auth.userId,
    action: "mobility_admin_mfa_required",
    resource: "mobility-rpc",
    status: "failure",
    details: {
      operation,
      reason: mfaPolicy.reason,
      currentLevel: mfaPolicy.currentLevel,
      hasVerifiedFactor: mfaPolicy.hasVerifiedFactor,
    },
  });

  if (mfaPolicy.reason === "enrollment_required") {
    throw new RequestAuthorizationError(
      "MFA enrollment required for admin mobility action",
    );
  }
  if (mfaPolicy.reason === "verification_required") {
    throw new RequestAuthorizationError(
      "MFA verification required for admin mobility action",
    );
  }
  throw new RequestAuthorizationError("Admin MFA policy is not satisfied");
}

async function getRide(
  supabaseAdmin: SupabaseClient,
  rideId: string,
): Promise<RideRow> {
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

async function requireRideTransitionActor(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  ride: RideRow,
  toState: string,
  requestedActor: unknown,
): Promise<string> {
  if (
    [
      "driver_assigned",
      "driver_accepted",
      "expired",
      "pickup_confirmed",
      "delivered",
      "failed_delivery",
    ].includes(toState)
  ) {
    throw new RequestAuthorizationError(
      "Transition is reserved for dispatch or a dedicated command",
    );
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

  const passengerTransition =
    toState === "searching_driver" || toState === "cancelled_by_passenger";
  const driverTransition = new Set([
    "driver_arriving",
    "passenger_boarded",
    "in_progress",
    "completed",
    "failed",
    "cancelled_by_driver",
  ]).has(toState);

  if (passengerTransition && passengerOwned && ride.passenger_profile_id) {
    return ride.passenger_profile_id;
  }

  if (driverTransition && driverOwned && ride.driver_profile_id) {
    if (
      requestedActor !== undefined &&
      requestedActor !== null &&
      requestedActor !== "system" &&
      requestedActor !== ride.driver_profile_id
    ) {
      throw new RequestAuthorizationError(
        "Actor profile does not match the assigned driver",
      );
    }
    return ride.driver_profile_id;
  }

  if (auth.isProjectAdmin) {
    await requireAdminMfa(supabaseAdmin, auth, "transitionRideState");
    return `admin:${auth.userId}`;
  }

  if (passengerTransition) {
    throw new RequestAuthorizationError(
      "Only the ride passenger can perform this transition",
    );
  }
  if (driverTransition) {
    throw new RequestAuthorizationError(
      "Only the assigned driver can perform this transition",
    );
  }
  throw new RequestAuthorizationError(
    "Transition is not exposed to browser clients",
  );
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
    throw new RequestAuthorizationError(
      "PIN verification is required before boarding",
    );
  }
}

async function requireDeliveryTransitionActor(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  ride: RideRow,
  requestedActor: unknown,
): Promise<string> {
  const driverOwned = Boolean(
    ride.driver_profile_id &&
      await profileBelongsToUser(
        supabaseAdmin,
        ride.driver_profile_id,
        auth.userId,
      ),
  );

  if (driverOwned && ride.driver_profile_id) {
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

  if (auth.isProjectAdmin) {
    await requireAdminMfa(supabaseAdmin, auth, "transitionDeliveryState");
    return `admin:${auth.userId}`;
  }

  throw new RequestAuthorizationError(
    "Only the assigned driver can perform this delivery command",
  );
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

async function handleCreateDriverProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const handle = requireTrimmedString(params.handle, "handle", 100);
  const displayName = requireTrimmedString(
    params.displayName,
    "displayName",
    160,
  );
  const avatarUrl = optionalTrimmedString(
    params.avatarUrl,
    "avatarUrl",
    2048,
  );
  const bio = optionalTrimmedString(params.bio, "bio", 4000);
  const extensionData = sanitizeDriverRegistrationExtension(params.extensionData);

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_rpc_create_driver_profile",
    {
      p_actor_user_id: auth.userId,
      p_handle: handle,
      p_display_name: displayName,
      p_avatar_url: avatarUrl,
      p_bio: bio,
      p_extension_data: extensionData,
    },
  );
  if (error) throw error;
  return data ?? {
    success: false,
    error: "Driver profile RPC returned no data",
  };
}

async function handleEnsureAdminDriverProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
) {
  await requireAdminMfa(supabaseAdmin, auth, "ensureAdminDriverProfile");
  const { data, error } = await supabaseAdmin.rpc(
    "mobility_rpc_ensure_admin_driver_profile",
    { p_actor_user_id: auth.userId },
  );
  if (error) throw error;
  return data ?? {
    success: false,
    error: "Admin driver bootstrap returned no data",
  };
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
  const ownsDriverProfile = await profileBelongsToUser(
    supabaseAdmin,
    driverProfileId,
    auth.userId,
  );
  if (!ownsDriverProfile) {
    if (!auth.isProjectAdmin) {
      throw new RequestAuthorizationError(
        "User cannot accept rides with this driver profile",
      );
    }
    await requireAdminMfa(supabaseAdmin, auth, "acceptRide");
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_accept_ride_atomic",
    {
      p_actor_user_id: auth.userId,
      p_ride_id: rideId,
      p_driver_profile_id: driverProfileId,
      p_strategy: strategy,
    },
  );
  if (error) throw error;
  return data ?? {
    success: false,
    reason: "error",
    error: "Empty accept ride response",
  };
}

async function handleAdminRedispatch(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  await requireAdminMfa(supabaseAdmin, auth, "adminRedispatch");
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const reason = optionalAuditReason(params.reason);
  const ride = await getRide(supabaseAdmin, rideId);

  if (ride.ride_mode !== "motoboy") {
    throw new RequestValidationError("Admin redispatch requires motoboy ride");
  }
  if (ride.status !== "driver_assigned" && ride.status !== "driver_accepted") {
    throw new RequestValidationError(
      "Ride is not eligible for admin redispatch",
    );
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
  return data ?? {
    success: false,
    reason: "empty_response",
    ride_id: rideId,
  };
}

async function handleConfirmPassengerCompletion(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const ride = await getRide(supabaseAdmin, rideId);

  if (ride.status !== "completed") {
    throw new RequestValidationError(
      "Ride must be completed before passenger confirmation",
    );
  }
  if (
    !ride.passenger_profile_id ||
    !await profileBelongsToUser(
      supabaseAdmin,
      ride.passenger_profile_id,
      auth.userId,
    )
  ) {
    throw new RequestAuthorizationError(
      "Only the ride passenger can confirm completion",
    );
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_confirm_passenger_completion_atomic",
    { p_ride_id: rideId },
  );
  if (error) throw error;
  return data ?? {
    success: false,
    reason: "empty_response",
    ride_id: rideId,
  };
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
    throw new RequestValidationError(
      "Ride state changed during delivery command",
    );
  }
  if (!new Set(["confirm_pickup", "confirm_delivery", "fail_delivery"]).has(command)) {
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

  if (command === "confirm_delivery") {
    await requireDeliveryVerification(supabaseAdmin, rideId);
    proofOfDelivery = requireObject(
      params.proofOfDelivery ?? params.proof_of_delivery,
      "proofOfDelivery",
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
  await requireAdminMfa(
    supabaseAdmin,
    auth,
    "updateFailedDeliveryResolution",
  );
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const resolutionUpdate = requireObject(
    params.resolutionUpdate ?? params.resolution_update,
    "resolutionUpdate",
  );
  const ride = await getRide(supabaseAdmin, rideId);

  if (ride.ride_mode !== "motoboy" || ride.status !== "failed_delivery") {
    throw new RequestValidationError(
      "Ride is not a failed motoboy delivery",
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

async function handleUpdateDriverAvailability(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const driverProfileId = requireUuid(
    params.driverProfileId ?? params.driver_profile_id,
    "driverProfileId",
  );
  if (!await profileBelongsToUser(supabaseAdmin, driverProfileId, auth.userId)) {
    throw new RequestAuthorizationError(
      "User cannot change availability for this driver profile",
    );
  }

  const availabilityAction = requireDriverAvailabilityAction(
    params.availabilityAction ?? params.availability_action,
  );
  const rideMode = optionalDriverRideMode(params.rideMode ?? params.ride_mode);
  const lat = optionalBoundedNumber(params.lat, "lat", -90, 90);
  const lng = optionalBoundedNumber(params.lng, "lng", -180, 180);

  if (availabilityAction === "set_available" && (lat === null || lng === null)) {
    throw new RequestValidationError(
      "Valid coordinates are required to become available",
    );
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_update_driver_availability",
    {
      p_actor_user_id: auth.userId,
      p_profile_id: driverProfileId,
      p_action: availabilityAction,
      p_lat: lat,
      p_lng: lng,
      p_ride_mode: rideMode,
    },
  );
  if (error) throw error;
  return data ?? { success: false, reason: "empty_response" };
}

async function handleUpdateDriverLocation(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const driverProfileId = requireUuid(
    params.driverProfileId ?? params.driver_profile_id,
    "driverProfileId",
  );
  if (!await profileBelongsToUser(supabaseAdmin, driverProfileId, auth.userId)) {
    throw new RequestAuthorizationError(
      "User cannot publish location for this driver profile",
    );
  }

  const lat = optionalBoundedNumber(params.lat, "lat", -90, 90);
  const lng = optionalBoundedNumber(params.lng, "lng", -180, 180);
  if (lat === null || lng === null) {
    throw new RequestValidationError("Valid driver coordinates are required");
  }

  const accuracy = optionalBoundedNumber(
    params.accuracy,
    "accuracy",
    0,
    100000,
  );
  const heading = optionalBoundedNumber(params.heading, "heading", 0, 360);
  const speed = optionalBoundedNumber(params.speed, "speed", 0, 1000);
  const altitude = optionalBoundedNumber(
    params.altitude,
    "altitude",
    -1000,
    20000,
  );

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_update_driver_location",
    {
      p_actor_user_id: auth.userId,
      p_driver_profile_id: driverProfileId,
      p_lat: lat,
      p_lng: lng,
      p_accuracy: accuracy,
      p_heading: heading,
      p_speed: speed,
      p_altitude: altitude,
    },
  );
  if (error) throw error;
  return data ?? { success: false, reason: "empty_response" };
}

async function handleListDriverOffers(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const driverProfileId = requireUuid(
    params.driverProfileId ?? params.driver_profile_id,
    "driverProfileId",
  );
  if (!await profileBelongsToUser(supabaseAdmin, driverProfileId, auth.userId)) {
    throw new RequestAuthorizationError(
      "User cannot list offers for this driver profile",
    );
  }

  const strategy = requireDispatchStrategy(params.strategy);
  const limit = optionalInteger(params.limit, "limit", 1, 50) ?? 10;
  const minPrice = optionalBoundedNumber(
    params.minPrice,
    "minPrice",
    0,
    1_000_000,
  );
  const maxPrice = optionalBoundedNumber(
    params.maxPrice,
    "maxPrice",
    0,
    1_000_000,
  );
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw new RequestValidationError("minPrice cannot exceed maxPrice");
  }

  const packageSizes = Array.isArray(params.packageSizes)
    ? params.packageSizes.map((value) =>
        requireTrimmedString(value, "packageSize", 64)
      )
    : null;
  if (packageSizes && packageSizes.length > 20) {
    throw new RequestValidationError("Too many package sizes");
  }

  const sortBy = requireStatus(params.sortBy ?? "created_at", "sortBy");
  if (!["created_at", "suggested_price", "departure_time"].includes(sortBy)) {
    throw new RequestValidationError("Invalid offer sort");
  }
  const ascending = params.ascending === undefined ? false : params.ascending === true;

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_list_driver_offers",
    {
      p_actor_user_id: auth.userId,
      p_driver_profile_id: driverProfileId,
      p_strategy: strategy,
      p_limit: limit,
      p_min_price: minPrice,
      p_max_price: maxPrice,
      p_package_sizes: packageSizes,
      p_sort_by: sortBy,
      p_ascending: ascending,
    },
  );
  if (error) throw error;
  return data ?? { offers: [] };
}

async function handleFindAvailableDriversForRide(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rideId = requireUuid(params.rideId ?? params.ride_id, "rideId");
  const radiusKm = optionalBoundedNumber(
    params.radiusKm ?? params.radius_km,
    "radiusKm",
    0.1,
    100,
  ) ?? 15;
  const limit = optionalInteger(params.limit, "limit", 1, 100) ?? 25;

  const ride = await getRide(supabaseAdmin, rideId);
  const requesterOwned = await profileBelongsToUser(
    supabaseAdmin,
    ride.passenger_profile_id,
    auth.userId,
  );
  if (!requesterOwned) {
    if (!auth.isProjectAdmin) {
      throw new RequestAuthorizationError(
        "Only the ride requester or admin can discover drivers",
      );
    }
    await requireAdminMfa(
      supabaseAdmin,
      auth,
      "findAvailableDriversForRide",
    );
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_find_available_drivers_for_ride",
    {
      p_actor_user_id: auth.userId,
      p_ride_id: rideId,
      p_radius_km: radiusKm,
      p_limit: limit,
    },
  );
  if (error) throw error;
  return data ?? { drivers: [] };
}

async function handleReconcileStaleDriverAvailability(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  await requireAdminMfa(
    supabaseAdmin,
    auth,
    "reconcileStaleDriverAvailability",
  );
  const thresholdMinutes = optionalInteger(
    params.thresholdMinutes ?? params.threshold_minutes,
    "thresholdMinutes",
    1,
    1440,
  ) ?? 5;

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_reconcile_stale_driver_availability",
    { p_threshold_minutes: thresholdMinutes },
  );
  if (error) throw error;

  const result =
    data && typeof data === "object"
      ? data as Record<string, unknown>
      : {};
  if (typeof result.staleBusy === "number" && result.staleBusy > 0) {
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: "mobility_stale_busy_detected",
      resource: "driver_availability",
      status: "failure",
      details: {
        staleBusy: result.staleBusy,
        thresholdMinutes,
        requires_manual_review: true,
      },
    });
  }
  return result;
}

async function handleGetDriverRideHistory(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const limit = optionalInteger(params.limit, "limit", 1, 200) ?? 100;
  const offset = optionalInteger(params.offset, "offset", 0, 10000) ?? 0;
  const { data, error } = await supabaseAdmin.rpc(
    "mobility_get_driver_ride_history",
    {
      p_actor_user_id: auth.userId,
      p_limit: limit,
      p_offset: offset,
    },
  );
  if (error) throw error;
  return data ?? { rides: [] };
}

async function handleGetDriverEarningsHistory(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const since = optionalTimestamp(params.since, "since");
  const limit = optionalInteger(params.limit, "limit", 1, 1000) ?? 500;
  const { data, error } = await supabaseAdmin.rpc(
    "mobility_get_driver_earnings_history",
    {
      p_actor_user_id: auth.userId,
      p_since: since,
      p_limit: limit,
    },
  );
  if (error) throw error;
  return data ?? { earnings: [] };
}

async function dispatchAction(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  action: MobilityRpcAction,
  params: Record<string, unknown>,
) {
  switch (action) {
    case "createDriverProfile":
      return handleCreateDriverProfile(supabaseAdmin, auth, params);
    case "ensureAdminDriverProfile":
      return handleEnsureAdminDriverProfile(supabaseAdmin, auth);
    case "acceptRide":
      return handleAcceptRide(supabaseAdmin, auth, params);
    case "adminRedispatch":
      return handleAdminRedispatch(supabaseAdmin, auth, params);
    case "confirmPassengerCompletion":
      return handleConfirmPassengerCompletion(supabaseAdmin, auth, params);
    case "transitionRideState":
      return handleTransitionRideState(supabaseAdmin, auth, params);
    case "transitionDeliveryState":
      return handleTransitionDeliveryState(supabaseAdmin, auth, params);
    case "updateFailedDeliveryResolution":
      return handleUpdateFailedDeliveryResolution(supabaseAdmin, auth, params);
    case "updateDriverAvailability":
      return handleUpdateDriverAvailability(supabaseAdmin, auth, params);
    case "updateDriverLocation":
      return handleUpdateDriverLocation(supabaseAdmin, auth, params);
    case "listDriverOffers":
      return handleListDriverOffers(supabaseAdmin, auth, params);
    case "findAvailableDriversForRide":
      return handleFindAvailableDriversForRide(supabaseAdmin, auth, params);
    case "reconcileStaleDriverAvailability":
      return handleReconcileStaleDriverAvailability(supabaseAdmin, auth, params);
    case "getDriverRideHistory":
      return handleGetDriverRideHistory(supabaseAdmin, auth, params);
    case "getDriverEarningsHistory":
      return handleGetDriverEarningsHistory(supabaseAdmin, auth, params);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: responseHeaders(req),
    });
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
    return jsonResponse(
      { error: "Invalid action" },
      400,
      ALLOWED_METHODS,
      req,
    );
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
      return jsonResponse(
        { error: error.message },
        400,
        ALLOWED_METHODS,
        req,
      );
    }
    if (error instanceof RequestAuthorizationError) {
      return jsonResponse(
        { error: error.message },
        403,
        ALLOWED_METHODS,
        req,
      );
    }

    console.error("[mobility-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `mobility_rpc_${safeAction}`,
      resource: "mobility-rpc",
      status: "failure",
      details: {
        action: safeAction,
        reason: "mobility_rpc_failed",
      },
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