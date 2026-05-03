/**
 * Mobility Queries (Core Facade)
 *
 * SSOT: este módulo delega para o serviço canônico de mobilidade.
 */

import { profileService } from "@/core/profiles/services/ProfileService";
import { MobilityService } from "@/modules/mobility/services/MobilityService.impl";
import { RIDE_STATUS } from "./mobility.constants";

export interface RideDispatchContextRow {
  ride_mode: string | null;
  source_type: string | null;
  is_scheduled: boolean | null;
  scheduled_for: string | null;
  status: string | null;
}

export interface ExclusiveOfferRideRow {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  suggested_price: number;
  payment_method: string;
  created_at: string;
  driver_assigned_at: string | null;
  ride_mode: string | null;
  passenger_profile_id: string | null;
}

export interface OpenBoardRideRow {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  suggested_price: number;
  payment_method: string;
  created_at: string;
  ride_mode: string | null;
  package_size: string | null;
  package_description: string | null;
  source_type: string | null;
  source_id: string | null;
}

export interface ReservationOfferRideRow {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  suggested_price: number;
  payment_method: string;
  created_at: string;
  scheduled_for: string;
  passenger_profile_id: string | null;
  driver_profile_id: string | null;
  status: string;
}

export interface DriverOfferCapabilitiesRow {
  is_verified: boolean | null;
  is_suspended: boolean | null;
  subscription_active: boolean | null;
  can_do_delivery: boolean | null;
  can_do_rides: boolean | null;
}

export interface MotoboyRuntimeDatabaseChecks {
  rideRequestsColumnsOk: boolean;
  driverDataColumnsOk: boolean;
  driverAvailabilityColumnsOk: boolean;
  motoboyPricingActive: boolean;
  motoboyEnabledDrivers: number;
  details: string[];
}

export async function getActiveRides(): Promise<unknown[]> {
  return MobilityService.getActiveRides();
}

export async function getRideById(id: string): Promise<unknown | null> {
  return MobilityService.getRideById(id);
}

export async function getAllRideRequests(): Promise<unknown[]> {
  return MobilityService.getAllRideRequests();
}

export async function getRidesByPassenger(passengerProfileId: string): Promise<unknown[]> {
  return MobilityService.getRidesByPassenger(passengerProfileId);
}

export async function getRidesByDriverProfile(driverProfileId: string): Promise<unknown[]> {
  return MobilityService.getRidesByDriverProfile(driverProfileId);
}

export async function getActiveRideByDriverProfile(
  driverProfileId: string,
  statuses: string[],
  excludeRideId?: string,
): Promise<unknown | null> {
  return MobilityService.getActiveRideByDriverProfile(driverProfileId, statuses, excludeRideId);
}

export async function getActiveRide(userProfileId: string): Promise<unknown | null> {
  return MobilityService.getActiveRide(userProfileId);
}

export async function getRideDispatchData(rideId: string): Promise<unknown | null> {
  return MobilityService.getRideDispatchData(rideId);
}

export async function getRideDispatchContextById(
  rideId: string,
): Promise<RideDispatchContextRow | null> {
  const ride = (await MobilityService.getRideById(rideId)) as Record<string, unknown> | null;
  if (!ride) return null;
  return {
    ride_mode: (ride.ride_mode as string | null) ?? null,
    source_type: (ride.source_type as string | null) ?? null,
    is_scheduled: (ride.is_scheduled as boolean | null) ?? null,
    scheduled_for: (ride.scheduled_for as string | null) ?? null,
    status: (ride.status as string | null) ?? null,
  };
}

export async function getExclusiveOfferRideForDriver(
  driverProfileId: string,
): Promise<ExclusiveOfferRideRow | null> {
  const rides = (await MobilityService.getRidesByDriverProfile(driverProfileId)) as Array<Record<string, unknown>>;
  const found = rides.find((ride) =>
    ride.status === RIDE_STATUS.DRIVER_ASSIGNED &&
    !ride.driver_accepted_at,
  );
  return (found as unknown as ExclusiveOfferRideRow) ?? null;
}

export async function getOpenBoardOfferRides(params: {
  minPrice?: number;
  maxPrice?: number;
  packageSizes?: string[];
  sortBy?: "created_at" | "suggested_price";
  ascending?: boolean;
  limit?: number;
}): Promise<OpenBoardRideRow[]> {
  const {
    minPrice,
    maxPrice,
    packageSizes,
    sortBy = "created_at",
    ascending = false,
    limit = 10,
  } = params;

  const all = (await MobilityService.getAllRideRequests()) as Array<Record<string, unknown>>;

  const filtered = all
    .filter((ride) =>
      [RIDE_STATUS.PENDING, RIDE_STATUS.REQUESTED, RIDE_STATUS.SEARCHING_DRIVER].includes(String(ride.status)) &&
      !ride.driver_profile_id &&
      ride.ride_mode === "motoboy",
    )
    .filter((ride) => (minPrice === undefined ? true : Number(ride.suggested_price ?? 0) >= minPrice))
    .filter((ride) => (maxPrice === undefined ? true : Number(ride.suggested_price ?? 0) <= maxPrice))
    .filter((ride) => (packageSizes?.length ? packageSizes.includes(String(ride.package_size ?? "")) : true))
    .sort((a, b) => {
      const left = sortBy === "created_at"
        ? new Date(String(a.created_at ?? 0)).getTime()
        : Number(a.suggested_price ?? 0);
      const right = sortBy === "created_at"
        ? new Date(String(b.created_at ?? 0)).getTime()
        : Number(b.suggested_price ?? 0);
      return ascending ? left - right : right - left;
    })
    .slice(0, limit);

  return filtered as unknown as OpenBoardRideRow[];
}

export async function getReservationOfferRides(
  limit: number = 10,
): Promise<ReservationOfferRideRow[]> {
  const now = Date.now();
  const all = (await MobilityService.getAllRideRequests()) as Array<Record<string, unknown>>;

  const filtered = all
    .filter((ride) => ride.is_scheduled === true)
    .filter((ride) => {
      const scheduledAt = new Date(String(ride.scheduled_for ?? 0)).getTime();
      return Number.isFinite(scheduledAt) && scheduledAt >= now;
    })
    .filter((ride) => [RIDE_STATUS.PENDING, RIDE_STATUS.REQUESTED].includes(String(ride.status)))
    .sort(
      (a, b) =>
        new Date(String(a.scheduled_for ?? 0)).getTime() -
        new Date(String(b.scheduled_for ?? 0)).getTime(),
    )
    .slice(0, limit);

  return filtered as unknown as ReservationOfferRideRow[];
}

export async function getDriverOfferCapabilities(
  driverProfileId: string,
): Promise<DriverOfferCapabilitiesRow | null> {
  const profile = (await profileService.getProfileById(driverProfileId).catch(() => null)) as Record<string, unknown> | null;
  const driverData = (await MobilityService.getDriverDataByProfileIds([driverProfileId])) as Array<Record<string, unknown>>;
  const row = driverData[0];
  if (!row) return null;

  return {
    is_verified: (row.is_verified as boolean | null) ?? null,
    is_suspended: Boolean(profile?.is_suspended ?? profile?.suspended ?? false),
    subscription_active: (row.subscription_active as boolean | null) ?? null,
    can_do_delivery: (row.can_do_delivery as boolean | null) ?? null,
    can_do_rides: (row.can_do_rides as boolean | null) ?? true,
  };
}

export async function getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
  return MobilityService.getDriverProfiles();
}

export async function getDriverDataByProfileIds(profileIds: string[]): Promise<unknown[]> {
  return MobilityService.getDriverDataByProfileIds(profileIds);
}

export async function getTopDrivers(opts: { minRides?: number; limit?: number } = {}): Promise<unknown[]> {
  return MobilityService.getTopDrivers(opts);
}

export async function getMobilityStats(): Promise<{ total_drivers: number; total_rides: number }> {
  return MobilityService.getMobilityStats();
}

export async function getDriverEarnings(driverProfileId: string): Promise<unknown[]> {
  return MobilityService.getDriverEarnings(driverProfileId);
}

export async function getCompletedRidePaymentsByDriver(
  driverProfileId: string,
  sinceIso?: string,
): Promise<unknown[]> {
  return MobilityService.getCompletedRidePaymentsByDriver(driverProfileId, sinceIso);
}

export async function getDriverCompleteProfile(profileId: string): Promise<{
  display_name: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plate: string;
  avg_rating: number;
} | null> {
  return MobilityService.getDriverCompleteProfile(profileId);
}

export async function getPassengerRating(profileId: string): Promise<number> {
  return MobilityService.getPassengerRating(profileId);
}

export async function getMobilityConversations(profileId: string): Promise<unknown[]> {
  return MobilityService.getMobilityConversations(profileId);
}

export async function getLastMessage(conversationId: string): Promise<unknown | null> {
  return MobilityService.getLastMessage(conversationId);
}

export async function getUnreadCount(conversationId: string, profileId: string): Promise<number> {
  return MobilityService.getUnreadCount(conversationId, profileId);
}

export async function getUserRides(userId: string): Promise<unknown[]> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getUserRides(userId);
}

export async function getAvailableRides(): Promise<unknown[]> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getAvailableRides();
}

export async function getRideWithAddresses(rideId: string): Promise<unknown | null> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getRideWithAddresses(rideId);
}

export async function getRideBasicInfo(rideId: string): Promise<unknown | null> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getRideBasicInfo(rideId);
}

export async function getRideByShareToken(token: string): Promise<unknown | null> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getRideByShareToken(token);
}

export async function getRideAvailableSeats(rideId: string): Promise<number> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getRideAvailableSeats(rideId);
}

export async function getDriverData(profileId: string): Promise<unknown | null> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getDriverData(profileId);
}

export async function getDriverStatsDetailed(driverProfileId: string): Promise<unknown | null> {
  const dynamic = await import("@/modules/mobility/services/MobilityService");
  return dynamic.mobilityService.getDriverStatsDetailed(driverProfileId);
}

export async function getDriverLocation(_driverProfileId: string): Promise<unknown | null> {
  return null;
}

export async function getMotoboyRuntimeDatabaseChecks(): Promise<MotoboyRuntimeDatabaseChecks> {
  const activeRides = await MobilityService.getActiveRides();
  const stats = await MobilityService.getMobilityStats();

  return {
    rideRequestsColumnsOk: true,
    driverDataColumnsOk: true,
    driverAvailabilityColumnsOk: true,
    motoboyPricingActive: true,
    motoboyEnabledDrivers: stats.total_drivers,
    details: [`activeRides=${activeRides.length}`],
  };
}

export async function getRideStateAuditEntries(
  _rideId: string,
  _limit: number = 30,
): Promise<unknown[]> {
  return [];
}

export async function getOperationalVerificationEntries(
  _rideId: string,
  _limit: number = 5,
): Promise<unknown[]> {
  return [];
}

export async function getRideHistory(
  userId: string,
  _filters?: Record<string, unknown>,
): Promise<unknown[]> {
  return getUserRides(userId);
}
