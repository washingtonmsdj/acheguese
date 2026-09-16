import type { SupabaseClient as SupabaseClientBase } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
type SupabaseClient = SupabaseClientBase<any, any, any>;

export type MobilityDeliverySourceType =
  | "passenger"
  | "business"
  | "gastronomy"
  | "service";

export class MobilityCreationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MobilityCreationValidationError";
  }
}

export class MobilityCreationAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MobilityCreationAuthorizationError";
  }
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

export async function requireRequestingProfile(
  supabaseAdmin: SupabaseClient,
  userId: string,
  profileId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, is_active, is_suspended, suspended, suspended_until")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.user_id !== userId) {
    throw new MobilityCreationAuthorizationError(
      "Passenger profile does not belong to the authenticated user",
    );
  }
  if (data.is_active === false) {
    throw new MobilityCreationAuthorizationError("Passenger profile is inactive");
  }

  const suspended = data.is_suspended === true || data.suspended === true;
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
    throw new MobilityCreationAuthorizationError("Passenger profile is suspended");
  }
}

export async function requireEffectiveMobilityRollout(
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
      throw new MobilityCreationValidationError("Pickup location was not found");
    }

    if (depth === 0 && location.status !== "active") {
      throw new MobilityCreationAuthorizationError(
        "Mobility is unavailable in an inactive location",
      );
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
          throw new MobilityCreationAuthorizationError(
            "Mobility rollout is disabled for this location",
          );
        }

        if (
          requireMotoboy &&
          rollout.config &&
          typeof rollout.config === "object" &&
          !Array.isArray(rollout.config) &&
          (rollout.config as Record<string, unknown>).motoboy_enabled === false
        ) {
          throw new MobilityCreationAuthorizationError(
            "Motoboy mode is disabled for this location",
          );
        }
        return;
      }
    }

    currentLocationId =
      typeof location.parent_id === "string" ? location.parent_id : null;
  }

  throw new MobilityCreationAuthorizationError(
    "Mobility rollout is not active for this location",
  );
}

async function resolveManagedBusinessForDelivery(
  supabaseAdmin: SupabaseClient,
  userId: string,
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
    throw new MobilityCreationAuthorizationError(
      "Business authority source was not found",
    );
  }

  if (sourceType === "gastronomy") {
    const { data: gastronomy, error: gastronomyError } = await supabaseAdmin
      .from("gastronomy_profiles")
      .select("id")
      .eq("business_id", business.id)
      .maybeSingle();
    if (gastronomyError) throw gastronomyError;
    if (!gastronomy) {
      throw new MobilityCreationAuthorizationError(
        "Source is not an active gastronomy business",
      );
    }
  }

  const { data: canManage, error: managementError } = await supabaseAdmin.rpc(
    "broker_user_can_manage_profile",
    {
      p_user_id: userId,
      p_profile_id: business.profile_id,
    },
  );
  if (managementError) throw managementError;
  if (canManage !== true) {
    throw new MobilityCreationAuthorizationError("User cannot manage this business");
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
    throw new MobilityCreationAuthorizationError(
      "Business has no active delivery entitlement",
    );
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
    throw new MobilityCreationAuthorizationError(
      "Business plan does not allow this delivery operation",
    );
  }
}

export async function requireDeliveryCreationAuthority(
  supabaseAdmin: SupabaseClient,
  userId: string,
  sourceType: MobilityDeliverySourceType,
  authoritySourceId: string | null,
  passengerProfileId: string,
): Promise<{ businessId: string; profileId: string } | null> {
  await requireRequestingProfile(supabaseAdmin, userId, passengerProfileId);

  if (sourceType === "passenger") return null;
  if (!authoritySourceId) {
    throw new MobilityCreationValidationError(
      "authorizationSourceId is required for this source type",
    );
  }

  if (sourceType === "service") {
    if (!await profileBelongsToUser(supabaseAdmin, authoritySourceId, userId)) {
      throw new MobilityCreationAuthorizationError(
        "User is not associated with this service profile",
      );
    }
    return null;
  }

  const business = await resolveManagedBusinessForDelivery(
    supabaseAdmin,
    userId,
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

export async function requireGastronomyOrderSourceBinding(
  supabaseAdmin: SupabaseClient,
  sourceId: string | null,
  business: { businessId: string; profileId: string } | null,
): Promise<void> {
  if (!sourceId) {
    throw new MobilityCreationValidationError(
      "Gastronomy delivery requires sourceId=order.id",
    );
  }
  if (!business) {
    throw new MobilityCreationAuthorizationError(
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
    throw new MobilityCreationValidationError(
      "Gastronomy source order was not found",
    );
  }

  if (
    order.merchant_profile_id !== business.profileId ||
    order.source_type !== "gastronomy" ||
    order.source_id !== business.businessId
  ) {
    throw new MobilityCreationAuthorizationError(
      "Gastronomy order does not belong to the authorized business",
    );
  }

  if (["delivered", "canceled", "failed"].includes(order.logistics_status)) {
    throw new MobilityCreationValidationError(
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
    throw new MobilityCreationValidationError(
      "Gastronomy order already has an active delivery ride",
    );
  }
}
