/**
 * Mobility runtime service (singleton).
 *
 * Centralizes write/runtime operations and keeps static/admin reads isolated.
 */

import { supabase } from "@/integrations/supabase";
import type { Tables, TablesUpdate } from "@/integrations/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import type { RideRequest } from "../types/types";
import { RIDE_STATUS } from "../constants";
import { toRideRequestContract } from "./RideCanonicalAdapter";
import { sanitizeDriverSelfServiceUpdate } from "./driverDataSelfService";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | Record<string, unknown>[]): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  is(column: string, value: null): TableClient<TRow>;
  or(filter: string): TableClient<TRow>;
  gte(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
  single(): Promise<SingleQueryPayload<TRow>>;
};

type MobilityRuntimeDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

const db = supabase as unknown as MobilityRuntimeDbClient;

type DriverDataRecord = Tables<"driver_data">;
type RideRequestRecord = Tables<"ride_requests">;
type DriverCompleteProfileRecord = {
  profile_id: string;
  display_name: string;
  avg_rating: number;
  total_rides: number;
  avatar_url?: string | null;
  created_at?: string;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  vehicle_plate?: string | null;
};
type DriverVerificationStatusRow = {
  is_verified: boolean | null;
  is_online: boolean | null;
  subscription_active: boolean | null;
};
type DriverStatsDetailedRow = Pick<
  DriverDataRecord,
  | "rating"
  | "total_rides"
  | "total_rides_completed"
  | "total_rides_cancelled"
  | "acceptance_rate"
  | "cancellation_rate"
  | "is_online"
  | "is_verified"
  | "subscription_active"
>;
type AddressSummaryRow = {
  street: string | null;
  latitude: number | null;
  longitude: number | null;
};
type LocationNameRow = { name: string | null };
type RideWithAddressRow = RideRequestRecord & {
  pickup_address?: AddressSummaryRow | null;
  dropoff_address?: AddressSummaryRow | null;
};
type RideWithAddressesRow = RideRequestRecord & {
  pickup_address?: AddressSummaryRow | null;
  dropoff_address?: AddressSummaryRow | null;
  pickup_location?: LocationNameRow | null;
  dropoff_location?: LocationNameRow | null;
};
type RideAvailableSeatsRow = { available_seats: number | null };
type RideBasicInfoRow = {
  id: string;
  origin: string | null;
  destination: string | null;
  status: string | null;
  final_price: number | null;
  suggested_price: number | null;
};

class MobilityServiceInstance {
  private async resolveDriverProfileId(identifier: string): Promise<string | null> {
    try {
      const profile = await profileService.getProfileById(identifier);
      if (profile?.profile_type === "driver") {
        return profile.id;
      }
    } catch (error) {
      logger.warn("mobilityService.resolveDriverProfileId:getProfileById", {
        identifier,
        error,
      });
    }

    try {
      const driverProfile = await profileService.getProfileByType(identifier, "driver");
      return driverProfile?.id ?? null;
    } catch (error) {
      logger.error(
        "mobilityService.resolveDriverProfileId:getProfileByType",
        error as Error,
        { identifier },
      );
      return null;
    }
  }

  // -- Driver --------------------------------------------------------------

  async createAdminDriverProfile(userId: string): Promise<DriverDataRecord | null> {
    try {
      const driverProfile = await profileService.ensureDriverProfileForUser(userId);
      if (!driverProfile?.id) return null;

      const { data: existing } = await db
        .from<DriverDataRecord>("driver_data")
        .select("*")
        .eq("profile_id", driverProfile.id)
        .maybeSingle();

      if (existing) return existing;

      const { data: driverData, error: driverError } = await db.rpc<DriverDataRecord>(
        "ensure_admin_driver_data",
        { p_profile_id: driverProfile.id },
      );

      if (driverError) throw driverError;

      logger.info("mobilityService.createAdminDriverProfile - ensured", {
        userId,
        profileId: driverProfile.id,
      });
      return driverData;
    } catch (error) {
      logger.error("mobilityService.createAdminDriverProfile", error as Error);
      return null;
    }
  }

  async getDriverData(identifier: string): Promise<DriverDataRecord | null> {
    try {
      const driverProfileId = await this.resolveDriverProfileId(identifier);
      if (!driverProfileId) return null;

      const { data, error } = await db
        .from<DriverDataRecord>("driver_data")
        .select("*")
        .eq("profile_id", driverProfileId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      logger.error("mobilityService.getDriverData", error as Error);
      return null;
    }
  }

  async updateDriverData(
    identifier: string,
    updates: TablesUpdate<"driver_data">,
  ): Promise<DriverDataRecord | null> {
    try {
      const driverProfileId = await this.resolveDriverProfileId(identifier);
      if (!driverProfileId) {
        throw new Error("Driver profile not found");
      }

      const safeUpdates = sanitizeDriverSelfServiceUpdate(
        updates as Record<string, unknown>,
      );
      if (Object.keys(safeUpdates).length === 0) {
        return this.getDriverData(driverProfileId);
      }

      const { data, error } = await db.rpc<DriverDataRecord>(
        "update_owned_driver_data",
        {
          p_profile_id: driverProfileId,
          p_updates: safeUpdates,
        },
      );

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("mobilityService.updateDriverData", error as Error, {
        identifier,
        updates,
      });
      throw error;
    }
  }

  async getRidesByDriver(identifier: string): Promise<RideRequestRecord[]> {
    try {
      const driverProfileId = await this.resolveDriverProfileId(identifier);
      if (!driverProfileId) return [];

      const { data, error } = await db
        .from<RideRequestRecord>("ride_requests")
        .select("*")
        .eq("driver_profile_id", driverProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("mobilityService.getRidesByDriver", error as Error);
      return [];
    }
  }

  async getDriverProfiles(): Promise<{
    data: DriverCompleteProfileRecord[];
    error: unknown;
  }> {
    try {
      const { data, error } = await db
        .from<DriverCompleteProfileRecord>("driver_complete_profile")
        .select("*")
        .order("created_at", { ascending: false });

      return { data: data || [], error };
    } catch (error) {
      logger.error("mobilityService.getDriverProfiles", error as Error);
      return { data: [], error };
    }
  }

  // Ride lifecycle mutations are owned by RideOperationalService/mobility-rpc.

  async checkSuspensionExpiry(profileId: string): Promise<void> {
    try {
      const profile = await profileService.getProfileById(profileId);

      if (!profile?.is_suspended || !profile?.suspended_until) return;

      const suspendedUntil = new Date(profile.suspended_until);
      if (suspendedUntil < new Date()) {
        await profileService.updateProfile(profileId, {
          is_suspended: false,
          suspended: false,
          suspended_until: null,
        });

        logger.info("mobilityService.checkSuspensionExpiry - suspension lifted", { profileId });
      }
    } catch (error) {
      logger.error("mobilityService.checkSuspensionExpiry", error as Error);
    }
  }

  async updateDriverOnlineStatus(driverProfileId: string, isOnline: boolean): Promise<void> {
    await this.updateDriverData(driverProfileId, {
      is_online: isOnline,
      is_available: isOnline ? undefined : false,
      updated_at: new Date().toISOString(),
    });
  }

  async getDriverStatsDetailed(driverProfileId: string): Promise<DriverStatsDetailedRow | null> {
    try {
      const { data, error } = await db
        .from<DriverStatsDetailedRow>("driver_data")
        .select(
          "rating, total_rides, total_rides_completed, total_rides_cancelled, acceptance_rate, cancellation_rate, is_online, is_verified, subscription_active",
        )
        .eq("profile_id", driverProfileId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("mobilityService.getDriverStatsDetailed", error as Error);
      return null;
    }
  }

  async getDriverVerificationStatus(driverProfileId: string): Promise<{
    is_verified: boolean;
    is_online: boolean;
    subscription_active: boolean;
  }> {
    try {
      const { data, error } = await db
        .from<DriverVerificationStatusRow>("driver_data")
        .select("is_verified, is_online, subscription_active")
        .eq("profile_id", driverProfileId)
        .maybeSingle();

      if (error) throw error;
      return {
        is_verified: data?.is_verified ?? false,
        is_online: data?.is_online ?? false,
        subscription_active: data?.subscription_active ?? false,
      };
    } catch (error) {
      logger.error("mobilityService.getDriverVerificationStatus", error as Error);
      return { is_verified: false, is_online: false, subscription_active: false };
    }
  }

  async getDriverEarnings(driverProfileId: string, days = 30): Promise<number> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await db
        .from<Pick<RideRequestRecord, "final_price">>("ride_requests")
        .select("final_price")
        .eq("driver_profile_id", driverProfileId)
        .eq("status", RIDE_STATUS.COMPLETED)
        .gte("updated_at", since.toISOString());

      if (error) throw error;
      const rows = data || [];
      return rows.reduce((sum, ride) => sum + (ride.final_price || 0), 0);
    } catch (error) {
      logger.error("mobilityService.getDriverEarnings", error as Error);
      return 0;
    }
  }

  // -- Ride ---------------------------------------------------------------

  async getRideById(rideId: string): Promise<RideRequest | null> {
    try {
      const { data, error } = await db
        .from<RideRequestRecord>("ride_requests")
        .select("*")
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return data ? toRideRequestContract(data) : null;
    } catch (error) {
      logger.error("mobilityService.getRideById", error as Error);
      return null;
    }
  }

  async getRideWithAddresses(rideId: string): Promise<RideWithAddressesRow | null> {
    try {
      const { data, error } = await db
        .from<RideWithAddressesRow>("ride_requests")
        .select(`
          *,
          pickup_address:addresses!pickup_address_id(street, latitude, longitude),
          dropoff_address:addresses!dropoff_address_id(street, latitude, longitude),
          pickup_location:locations!pickup_location_id(name),
          dropoff_location:locations!dropoff_location_id(name)
        `)
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("mobilityService.getRideWithAddresses", error as Error);
      return null;
    }
  }

  async getUserRides(userId: string): Promise<RideRequest[]> {
    try {
      const activeProfile = await profileService.getActiveProfile(userId);
      if (!activeProfile?.id) return [];

      const { data, error } = await db
        .from<RideRequestRecord>("ride_requests")
        .select("*")
        .or(`passenger_profile_id.eq.${activeProfile.id},driver_profile_id.eq.${activeProfile.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(toRideRequestContract);
    } catch (error) {
      logger.error("mobilityService.getUserRides", error as Error);
      return [];
    }
  }

  async getRideBasicInfo(rideId: string): Promise<RideBasicInfoRow | null> {
    try {
      const { data, error } = await db
        .from<RideBasicInfoRow>("ride_requests")
        .select("id, origin, destination, status, final_price, suggested_price")
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("mobilityService.getRideBasicInfo", error as Error);
      return null;
    }
  }


  async incrementRideViewCount(rideId: string): Promise<void> {
    try {
      await db.rpc("increment_ride_view_count", { ride_id: rideId });
    } catch (error) {
      logger.warn("mobilityService.incrementRideViewCount", error);
    }
  }

  // -- Seats --------------------------------------------------------------

  async getRideAvailableSeats(rideId: string): Promise<number> {
    try {
      const { data, error } = await db
        .from<RideAvailableSeatsRow>("ride_requests")
        .select("available_seats")
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return data?.available_seats ?? 0;
    } catch (error) {
      logger.error("mobilityService.getRideAvailableSeats", error as Error);
      return 0;
    }
  }

  async decrementRideSeats(rideId: string): Promise<void> {
    const { error } = await db.rpc("decrement_ride_seats", { ride_id: rideId });
    if (error) {
      logger.error("mobilityService.decrementRideSeats", error);
      throw error;
    }
  }
}

export const mobilityService = new MobilityServiceInstance();
