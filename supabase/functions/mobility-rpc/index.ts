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
const DRIVER_AVAILABILITY_ACTIONS = new Set([
  "go_online",
  "go_offline",
  "set_available",
  "pause_available",
  "heartbeat",
]);
const DRIVER_RIDE_MODES = new Set(["ride", "motoboy"]);
const ACTIONS = {
  createRide: true,
  createDelivery: true,
  acceptRide: true,
  adminRedispatch: true,
  confirmPassengerCompletion: true,
  transitionRideState: true,
  transitionDeliveryState: true,
  updateFailedDeliveryResolution: true,
  logRideStateChange: true,
  logDispatchAttempt: true,
  updateLatestDispatchAttempt: true,
  cancelPendingOffers: true,
  updateDriverAvailability: true,
  updateDriverLocation: true,
  listDriverOffers: true,
  reconcileStaleDriverAvailability: true,
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


async function requireRequestingProfile(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  profileId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, is_active, is_suspended, suspended, suspended_until")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== auth.userId) {
    throw new RequestAuthorizationError("Passenger profile does not belong to the authenticated user");
  }
  if (data.is_active === false) {
    throw new RequestAuthorizationError("Passenger profile is inactive");
  }

  const suspended =
    data.is_suspended === true ||
    data.suspended === true;
  const suspendedUntil =
    typeof data.suspended_until === "string"
      ? new Date(data.suspended_until)
      : null;
  if (
    suspended &&
    (!suspendedUntil ||
      Number.isNaN(suspendedUntil.getTime()) ||
      suspendedUntil.getTime() > Date.now())
  ) {
    throw new RequestAuthorizationError("Passenger profile is suspended");
  }
}

async function requireEffectiveMobilityRollout(
  supabaseAdmin: SupabaseClient,
  locationId: string,
  requireMotoboy: boolean,
): Promise<void> {
  let currentLocationId: string | null = locationId;

  for (let depth = 0; depth < 16 && currentLocationId; depth += 1) {
    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("id, parent_id, status")
      .eq("id", currentLocationId)
      .maybeSingle();

    if (locationError) throw locationError;
    if (!location) {
      throw new RequestValidationError("Pickup location was not found");
    }

    if (depth === 0 && location.status !== "active") {
      throw new RequestAuthorizationError("Mobility is unavailable in an inactive location");
    }

    if (location.status === "active") {
      const { data: rollout, error: rolloutError } = await supabaseAdmin
        .from("module_rollouts")
        .select("status, config")
        .eq("module_key", "mobility")
        .eq("location_id", currentLocationId)
        .maybeSingle();

      if (rolloutError) throw rolloutError;
      if (rollout) {
        if (rollout.status !== "active") {
          throw new RequestAuthorizationError("Mobility rollout is disabled for this location");
        }

        if (
          requireMotoboy &&
          rollout.config &&
          typeof rollout.config === "object" &&
          !Array.isArray(rollout.config) &&
          (rollout.config as Record<string, unknown>).motoboy_enabled === false
        ) {
          throw new RequestAuthorizationError("Motoboy mode is disabled for this location");
        }
        return;
      }
    }

    currentLocationId =
      typeof location.parent_id === "string" ? location.parent_id : null;
  }

  throw new RequestAuthorizationError("Mobility rollout is not active for this location");
}

async function resolveManagedBusinessForDelivery(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  sourceType: "business" | "gastronomy",
  authoritySourceId: string,
): Promise<{ businessId: string; profileId: string }> {
  let business: { id: string; profile_id: string | null } | null = null;

  const { data: byId, error: byIdError } = await supabaseAdmin
    .from("business_data")
    .select("id, profile_id")
    .eq("id", authoritySourceId)
    .maybeSingle();
  if (byIdError) throw byIdError;
  business = byId;

  if (!business) {
    const { data: byProfile, error: byProfileError } = await supabaseAdmin
      .from("business_data")
      .select("id, profile_id")
      .eq("profile_id", authoritySourceId)
      .maybeSingle();
    if (byProfileError) throw byProfileError;
    business = byProfile;
  }

  if (!business) {
    const { data: gastronomy, error: gastronomyError } = await supabaseAdmin
      .from("gastronomy_profiles")
      .select("business_id")
      .eq("id", authoritySourceId)
      .maybeSingle();
    if (gastronomyError) throw gastronomyError;

    if (gastronomy?.business_id) {
      const { data: byGastronomyBusiness, error: businessError } =
        await supabaseAdmin
          .from("business_data")
          .select("id, profile_id")
          .eq("id", gastronomy.business_id)
          .maybeSingle();
      if (businessError) throw businessError;
      business = byGastronomyBusiness;
    }
  }

  if (!business?.id || !business.profile_id) {
    throw new RequestAuthorizationError("Business authority source was not found");
  }

  if (sourceType === "gastronomy") {
    const { data: gastronomy, error: gastronomyError } = await supabaseAdmin
      .from("gastronomy_profiles")
      .select("id")
      .eq("business_id", business.id)
      .maybeSingle();
    if (gastronomyError) throw gastronomyError;
    if (!gastronomy) {
      throw new RequestAuthorizationError("Source is not an active gastronomy business");
    }
  }

  const { data: canManage, error: managementError } = await supabaseAdmin.rpc(
    "broker_user_can_manage_profile",
    {
      p_user_id: auth.userId,
      p_profile_id: business.profile_id,
    },
  );
  if (managementError) throw managementError;
  if (canManage !== true) {
    throw new RequestAuthorizationError("User cannot manage this business");
  }

  return { businessId: business.id, profileId: business.profile_id };
}

function resolveBusinessDeliveryEntitlements(
  planCode: string,
  catalogItem: Record<string, unknown> | null,
  contractSnapshot: Record<string, unknown> | null,
): { canUseMotoboyNetwork: boolean; canRequestDelivery: boolean } {
  const normalizedPlan = planCode.replace(/^base-/, "").toLowerCase();
  const planTier =
    typeof catalogItem?.plan_tier === "string"
      ? catalogItem.plan_tier
      : normalizedPlan;
  const baselineDelivery = planTier === "delivery";

  const rawPolicy = catalogItem?.catalog_entitlement_policy;
  const policy =
    Array.isArray(rawPolicy)
      ? (rawPolicy[0] as Record<string, unknown> | undefined)
      : rawPolicy && typeof rawPolicy === "object"
        ? (rawPolicy as Record<string, unknown>)
        : undefined;
  const extras =
    policy?.additional_entitlements &&
    typeof policy.additional_entitlements === "object" &&
    !Array.isArray(policy.additional_entitlements)
      ? policy.additional_entitlements as Record<string, unknown>
      : {};

  let canUseMotoboyNetwork =
    typeof policy?.can_use_motoboy_network === "boolean"
      ? policy.can_use_motoboy_network
      : typeof extras.canUseMotoboyNetwork === "boolean"
        ? extras.canUseMotoboyNetwork
        : baselineDelivery;
  let canRequestDelivery =
    typeof extras.canRequestDelivery === "boolean"
      ? extras.canRequestDelivery
      : baselineDelivery;

  const snapshotCatalog =
    contractSnapshot?.catalog_item &&
    typeof contractSnapshot.catalog_item === "object" &&
    !Array.isArray(contractSnapshot.catalog_item)
      ? contractSnapshot.catalog_item as Record<string, unknown>
      : null;

  if (!catalogItem && snapshotCatalog) {
    const direct =
      snapshotCatalog.entitlements &&
      typeof snapshotCatalog.entitlements === "object" &&
      !Array.isArray(snapshotCatalog.entitlements)
        ? snapshotCatalog.entitlements as Record<string, unknown>
        : null;
    if (direct) {
      if (typeof direct.canUseMotoboyNetwork === "boolean") {
        canUseMotoboyNetwork = direct.canUseMotoboyNetwork;
      }
      if (typeof direct.canRequestDelivery === "boolean") {
        canRequestDelivery = direct.canRequestDelivery;
      }
    }
  }

  const overrides =
    contractSnapshot?.overrides &&
    typeof contractSnapshot.overrides === "object" &&
    !Array.isArray(contractSnapshot.overrides)
      ? contractSnapshot.overrides as Record<string, unknown>
      : null;
  if (overrides) {
    if (typeof overrides.canUseMotoboyNetwork === "boolean") {
      canUseMotoboyNetwork = overrides.canUseMotoboyNetwork;
    }
    if (typeof overrides.canRequestDelivery === "boolean") {
      canRequestDelivery = overrides.canRequestDelivery;
    }
  }

  return { canUseMotoboyNetwork, canRequestDelivery };
}

async function requireBusinessDeliveryEntitlement(
  supabaseAdmin: SupabaseClient,
  businessId: string,
  required: "canUseMotoboyNetwork" | "canRequestDelivery",
): Promise<void> {
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("user_subscriptions")
    .select("plan_code, status_v2, contract_snapshot")
    .eq("business_id", businessId)
    .eq("subscription_scope", "business")
    .in("status_v2", ["active", "trialing"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) throw subscriptionError;
  if (!subscription?.plan_code) {
    throw new RequestAuthorizationError("Business has no active delivery entitlement");
  }

  const normalizedPlan = subscription.plan_code.replace(/^base-/, "").toLowerCase();
  const itemCode = `base-${normalizedPlan}`;
  const { data: catalogItem, error: catalogError } = await supabaseAdmin
    .from("catalog_item")
    .select(
      "plan_tier, catalog_entitlement_policy(can_use_motoboy_network, additional_entitlements), commercial_catalog_version!inner(status)",
    )
    .eq("item_code", itemCode)
    .eq("commercial_catalog_version.status", "published")
    .maybeSingle();

  if (catalogError) throw catalogError;

  const snapshot =
    subscription.contract_snapshot &&
    typeof subscription.contract_snapshot === "object" &&
    !Array.isArray(subscription.contract_snapshot)
      ? subscription.contract_snapshot as Record<string, unknown>
      : null;
  const entitlements = resolveBusinessDeliveryEntitlements(
    subscription.plan_code,
    catalogItem as Record<string, unknown> | null,
    snapshot,
  );

  if (entitlements[required] !== true) {
    throw new RequestAuthorizationError("Business plan does not allow this delivery operation");
  }
}

async function requireDeliveryCreationAuthority(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  sourceType: "passenger" | "business" | "gastronomy" | "service",
  authoritySourceId: string | null,
  passengerProfileId: string,
): Promise<{ businessId: string; profileId: string } | null> {
  await requireRequestingProfile(supabaseAdmin, auth, passengerProfileId);

  if (sourceType === "passenger") return null;
  if (!authoritySourceId) {
    throw new RequestValidationError("authorizationSourceId is required for this source type");
  }

  if (sourceType === "service") {
    if (!await profileBelongsToUser(supabaseAdmin, authoritySourceId, auth.userId)) {
      throw new RequestAuthorizationError("User is not associated with this service profile");
    }
    return null;
  }

  const business = await resolveManagedBusinessForDelivery(
    supabaseAdmin,
    auth,
    sourceType,
    authoritySourceId,
  );
  await requireBusinessDeliveryEntitlement(
    supabaseAdmin,
    business.businessId,
    sourceType === "business"
      ? "canUseMotoboyNetwork"
      : "canRequestDelivery",
  );
  return business;
}

async function requireGastronomyOrderSourceBinding(
  supabaseAdmin: SupabaseClient,
  sourceId: string | null,
  business: { businessId: string; profileId: string } | null,
): Promise<void> {
  if (!sourceId) {
    throw new RequestValidationError(
      "Gastronomy delivery requires sourceId=order.id",
    );
  }
  if (!business) {
    throw new RequestAuthorizationError(
      "Gastronomy business authority was not resolved",
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, merchant_profile_id, source_type, source_id, logistics_status")
    .eq("id", sourceId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) {
    throw new RequestValidationError("Gastronomy source order was not found");
  }

  if (
    order.merchant_profile_id !== business.profileId ||
    order.source_type !== "gastronomy" ||
    order.source_id !== business.businessId
  ) {
    throw new RequestAuthorizationError(
      "Gastronomy order does not belong to the authorized business",
    );
  }

  if (["delivered", "canceled", "failed"].includes(order.logistics_status)) {
    throw new RequestValidationError(
      "Gastronomy order is already in a terminal logistics state",
    );
  }

  const { data: existingRide, error: existingRideError } = await supabaseAdmin
    .from("ride_requests")
    .select("id")
    .eq("source_type", "gastronomy")
    .eq("source_id", sourceId)
    .in("status", [
      "requested",
      "searching_driver",
      "driver_assigned",
      "driver_accepted",
      "driver_arriving",
      "pickup_confirmed",
      "in_delivery",
      "delivered",
    ])
    .limit(1)
    .maybeSingle();

  if (existingRideError) throw existingRideError;
  if (existingRide) {
    throw new RequestValidationError(
      "Gastronomy order already has an active delivery ride",
    );
  }
}

function rideCreationRpcParams(params: Record<string, unknown>) {
  const suggestedPrice = optionalBoundedNumber(
    params.suggestedPrice ?? params.suggested_price,
    "suggestedPrice",
    5,
    1_000_000,
  );
  return {
    p_passenger_profile_id: requireUuid(
      params.passengerProfileId ?? params.passenger_profile_id,
      "passengerProfileId",
    ),
    p_pickup_address_id: requireUuid(
      params.pickupAddressId ?? params.pickup_address_id,
      "pickupAddressId",
    ),
    p_dropoff_address_id: requireUuid(
      params.dropoffAddressId ?? params.dropoff_address_id,
      "dropoffAddressId",
    ),
    p_pickup_location_id: requireUuid(
      params.pickupLocationId ?? params.pickup_location_id,
      "pickupLocationId",
    ),
    p_dropoff_location_id: requireUuid(
      params.dropoffLocationId ?? params.dropoff_location_id,
      "dropoffLocationId",
    ),
    p_origin: optionalTrimmedString(params.origin, "origin", 500),
    p_destination: optionalTrimmedString(params.destination, "destination", 500),
    p_origin_lat: optionalBoundedNumber(params.originLat ?? params.origin_lat, "originLat", -90, 90),
    p_origin_lng: optionalBoundedNumber(params.originLng ?? params.origin_lng, "originLng", -180, 180),
    p_destination_lat: optionalBoundedNumber(
      params.destinationLat ?? params.destination_lat,
      "destinationLat",
      -90,
      90,
    ),
    p_destination_lng: optionalBoundedNumber(
      params.destinationLng ?? params.destination_lng,
      "destinationLng",
      -180,
      180,
    ),
    p_suggested_price: suggestedPrice,
    p_available_seats:
      optionalInteger(params.availableSeats ?? params.available_seats, "availableSeats", 1, 8) ?? 1,
    p_observation: optionalTrimmedString(params.observation, "observation", 1000),
    p_payment_method: optionalTrimmedString(
      params.paymentMethod ?? params.payment_method,
      "paymentMethod",
      80,
    ),
    p_departure_time: optionalTimestamp(
      params.departureTime ?? params.departure_time,
      "departureTime",
    ),
  };
}

async function handleCreateRide(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const rpcParams = rideCreationRpcParams(params);
  await requireRequestingProfile(
    supabaseAdmin,
    auth,
    rpcParams.p_passenger_profile_id,
  );
  await requireEffectiveMobilityRollout(
    supabaseAdmin,
    rpcParams.p_pickup_location_id,
    false,
  );

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_create_ride_atomic",
    rpcParams,
  );
  if (error) throw error;
  return data ?? { success: false, reason: "empty_response" };
}

async function handleCreateDelivery(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  const base = rideCreationRpcParams(params);
  const sourceType = requireStatus(
    params.sourceType ?? params.source_type,
    "sourceType",
  );
  if (!["passenger", "business", "gastronomy", "service"].includes(sourceType)) {
    throw new RequestValidationError("Invalid sourceType");
  }

  const sourceId = optionalUuid(params.sourceId ?? params.source_id, "sourceId");
  const authoritySourceId = optionalUuid(
    params.authorizationSourceId ?? params.authorization_source_id ?? sourceId,
    "authorizationSourceId",
  );

  await requireEffectiveMobilityRollout(
    supabaseAdmin,
    base.p_pickup_location_id,
    true,
  );
  const businessAuthority = await requireDeliveryCreationAuthority(
    supabaseAdmin,
    auth,
    sourceType as "passenger" | "business" | "gastronomy" | "service",
    authoritySourceId,
    base.p_passenger_profile_id,
  );

  if (sourceType === "gastronomy") {
    await requireGastronomyOrderSourceBinding(
      supabaseAdmin,
      sourceId,
      businessAuthority,
    );
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_create_delivery_atomic",
    {
      p_passenger_profile_id: base.p_passenger_profile_id,
      p_pickup_address_id: base.p_pickup_address_id,
      p_dropoff_address_id: base.p_dropoff_address_id,
      p_pickup_location_id: base.p_pickup_location_id,
      p_dropoff_location_id: base.p_dropoff_location_id,
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_recipient_name: requireTrimmedString(
        params.recipientName ?? params.recipient_name,
        "recipientName",
        200,
      ),
      p_recipient_phone: optionalTrimmedString(
        params.recipientPhone ?? params.recipient_phone,
        "recipientPhone",
        80,
      ),
      p_delivery_notes: optionalTrimmedString(
        params.deliveryNotes ?? params.delivery_notes,
        "deliveryNotes",
        1000,
      ),
      p_package_description: optionalTrimmedString(
        params.packageDescription ?? params.package_description,
        "packageDescription",
        1000,
      ),
      p_package_size:
        optionalStatus(params.packageSize ?? params.package_size, "packageSize") ?? "small",
      p_origin: base.p_origin,
      p_destination: base.p_destination,
      p_origin_lat: base.p_origin_lat,
      p_origin_lng: base.p_origin_lng,
      p_destination_lat: base.p_destination_lat,
      p_destination_lng: base.p_destination_lng,
      p_suggested_price: base.p_suggested_price,
      p_observation: base.p_observation,
      p_payment_method: base.p_payment_method,
      p_departure_time: base.p_departure_time,
    },
  );
  if (error) throw error;
  return data ?? { success: false, reason: "empty_response" };
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

  const accuracy = optionalBoundedNumber(params.accuracy, "accuracy", 0, 100000);
  const heading = optionalBoundedNumber(params.heading, "heading", 0, 360);
  const speed = optionalBoundedNumber(params.speed, "speed", 0, 1000);
  const altitude = optionalBoundedNumber(params.altitude, "altitude", -1000, 20000);

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
  const minPrice = optionalBoundedNumber(params.minPrice, "minPrice", 0, 1_000_000);
  const maxPrice = optionalBoundedNumber(params.maxPrice, "maxPrice", 0, 1_000_000);
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

  const sortByRaw = params.sortBy ?? "created_at";
  const sortBy = requireStatus(sortByRaw, "sortBy");
  if (!["created_at", "suggested_price", "departure_time"].includes(sortBy)) {
    throw new RequestValidationError("Invalid offer sort");
  }
  const ascending =
    params.ascending === undefined ? false : params.ascending === true;

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

async function handleReconcileStaleDriverAvailability(
  supabaseAdmin: SupabaseClient,
  auth: UserAuthResult,
  params: Record<string, unknown>,
) {
  if (!auth.isProjectAdmin) {
    throw new RequestAuthorizationError(
      "Admin authority is required to reconcile stale drivers",
    );
  }

  const thresholdMinutes =
    optionalInteger(params.thresholdMinutes ?? params.threshold_minutes, "thresholdMinutes", 1, 1440)
    ?? 5;

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
    case "createRide":
      return handleCreateRide(supabaseAdmin, auth, params);
    case "createDelivery":
      return handleCreateDelivery(supabaseAdmin, auth, params);
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
    case "logRideStateChange":
      return handleLogRideStateChange(supabaseAdmin, auth, params);
    case "logDispatchAttempt":
      return handleLogDispatchAttempt(supabaseAdmin, auth, params);
    case "updateLatestDispatchAttempt":
      return handleUpdateLatestDispatchAttempt(supabaseAdmin, auth, params);
    case "cancelPendingOffers":
      return handleCancelPendingOffers(supabaseAdmin, auth, params);
    case "updateDriverAvailability":
      return handleUpdateDriverAvailability(supabaseAdmin, auth, params);
    case "updateDriverLocation":
      return handleUpdateDriverLocation(supabaseAdmin, auth, params);
    case "listDriverOffers":
      return handleListDriverOffers(supabaseAdmin, auth, params);
    case "reconcileStaleDriverAvailability":
      return handleReconcileStaleDriverAvailability(supabaseAdmin, auth, params);
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