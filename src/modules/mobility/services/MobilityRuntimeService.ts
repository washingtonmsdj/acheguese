/**
 * Mobility runtime service (singleton).
 *
 * Runtime/write operations extracted from MobilityService.impl
 * to keep static/admin queries isolated.
 */

import { supabase } from "@/core/infrastructure/supabase";
import type { Tables, TablesUpdate } from "@/core/infrastructure/supabase/types.generated";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RIDE_STATUS } from "../constants";

const db = supabase as any;

type DriverDataRecord = Tables<"driver_data">;
type RideRequestRecord = Tables<"ride_requests">;
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

  async getAvailableRides(): Promise<unknown[]> {
    try {
      const { data, error } = await db
        .from("ride_requests")
        .select(`
          *,
          pickup_address:addresses!pickup_address_id(street, latitude, longitude),
          dropoff_address:addresses!dropoff_address_id(street, latitude, longitude)
        `)
        .in("status", [RIDE_STATUS.PENDING, RIDE_STATUS.REQUESTED, RIDE_STATUS.SEARCHING_DRIVER])
        .is("driver_profile_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Normalizar campos de endereço para compatibilidade com DriverRidesList
      type RideWithAddress = RideRequestRecord & {
        pickup_address?: { street: string | null; latitude: number | null; longitude: number | null } | null;
        dropoff_address?: { street: string | null; latitude: number | null; longitude: number | null } | null;
      };
      const rows: RideWithAddress[] = data || [];
      return rows.map((r) => ({
        ...r,
        origin: r.origin || r.pickup_address?.street || "Origem nao informada",
        destination: r.destination || r.dropoff_address?.street || "Destino não informado",
        origin_lat: r.origin_lat || r.pickup_address?.latitude,
        origin_lng: r.origin_lng || r.pickup_address?.longitude,
        destination_lat: r.destination_lat || r.dropoff_address?.latitude,
        destination_lng: r.destination_lng || r.dropoff_address?.longitude,
      }));
    } catch (error) {
      logger.error("mobilityService.getAvailableRides", error as Error);
      return [];
    }
  }

  async createAdminDriverProfile(userId: string): Promise<unknown | null> {
    try {
      // Buscar ou criar profile de motorista via serviço canônico de perfis
      const driverProfile = await profileService.ensureDriverProfileForUser(userId);
      if (!driverProfile?.id) return null;

      // Criar driver_data se não existir
      const { data: existing } = await db
        .from('driver_data')
        .select('*')
        .eq('profile_id', driverProfile.id)
        .maybeSingle();

      if (existing) return existing;

      const { data: driverData, error: driverError } = await db
        .from('driver_data')
        .insert({
          profile_id: driverProfile.id,
          is_online: false,
          is_verified: true,
          subscription_active: true,
          rating: 5.0,
          total_rides: 0,
          total_rides_completed: 0,
          total_rides_cancelled: 0,
          acceptance_rate: 100.0,
          cancellation_rate: 0.0,
        })
        .select('*')
        .single();

      if (driverError) throw driverError;

      logger.info('mobilityService.createAdminDriverProfile - created', { userId, profileId: driverProfile.id });
      return driverData;
    } catch (error) {
      logger.error('mobilityService.createAdminDriverProfile', error as Error);
      return null;
    }
  }

  async getDriverData(identifier: string): Promise<DriverDataRecord | null> {
    try {
      const driverProfileId = await this.resolveDriverProfileId(identifier);
      if (!driverProfileId) return null;

      const { data, error } = await db
        .from("driver_data")
        .select("*")
        .eq("profile_id", driverProfileId)
        .maybeSingle();

      if (error) throw error;
      return (data || null) as DriverDataRecord | null;
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

      const { data, error } = await db
        .from("driver_data")
        .update(updates)
        .eq("profile_id", driverProfileId)
        .select("*")
        .single();

      if (error) throw error;
      return data as DriverDataRecord;
    } catch (error) {
      logger.error("mobilityService.updateDriverData", error as Error, {
        identifier,
        updates,
      });
      throw error;
    }
  }

  async getRidesByDriver(identifier: string): Promise<unknown[]> {
    try {
      const driverProfileId = await this.resolveDriverProfileId(identifier);
      if (!driverProfileId) return [];

      const { data, error } = await db
        .from("ride_requests")
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

  async getDriverProfiles(): Promise<{ data: unknown[]; error: unknown }> {
    try {
      const { data, error } = await db
        .from("driver_complete_profile")
        .select("*")
        .order("created_at", { ascending: false });
      return { data: data || [], error };
    } catch (error) {
      logger.error("mobilityService.getDriverProfiles", error as Error);
      return { data: [], error };
    }
  }

  // -- Ride actions (delegam para RideService) ------------------------------

  async acceptRide(rideId: string, driverProfileId: string): Promise<void> {
    const { rideService } = await import('./RideService');
    await rideService.acceptRide(rideId, driverProfileId);
  }

  async startRide(rideId: string): Promise<void> {
    const { rideService } = await import('./RideService');
    await rideService.startRide(rideId);
  }

  async completeRide(rideId: string): Promise<void> {
    const { rideService } = await import('./RideService');
    await rideService.completeRide(rideId, 0, 0, 0);
  }

  async cancelRide(rideId: string): Promise<void> {
    const { rideService } = await import('./RideService');
    await rideService.cancelRide(rideId);
  }

  async checkSuspensionExpiry(profileId: string): Promise<void> {
    try {
      // Verificar se suspensão expirou e reativar se necessário
      const profile = await profileService.getProfileById(profileId);

      if (!profile?.is_suspended || !profile?.suspended_until) return;

      const suspendedUntil = new Date(profile.suspended_until);
      if (suspendedUntil < new Date()) {
        await profileService.updateProfile(profileId, {
          is_suspended: false,
          suspended: false,
          suspended_until: null,
        });

        logger.info('mobilityService.checkSuspensionExpiry - suspension lifted', { profileId });
      }
    } catch (error) {
      logger.error('mobilityService.checkSuspensionExpiry', error as Error);
    }
  }

  async updateDriverOnlineStatus(driverProfileId: string, isOnline: boolean): Promise<void> {
    await this.updateDriverData(driverProfileId, {
      is_online: isOnline,
      is_available: isOnline ? undefined : false,
      updated_at: new Date().toISOString(),
    });
  }

  async getDriverStatsDetailed(driverProfileId: string): Promise<unknown | null> {
    try {
      const { data, error } = await db
        .from("driver_data")
        .select("rating, total_rides, total_rides_completed, total_rides_cancelled, acceptance_rate, cancellation_rate, is_online, is_verified, subscription_active")
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
        .from("driver_data")
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
        .from("ride_requests")
        .select("final_price")
        .eq("driver_profile_id", driverProfileId)
        .eq("status", RIDE_STATUS.COMPLETED)
        .gte("updated_at", since.toISOString());

      if (error) throw error;
      const rows: Pick<RideRequestRecord, "final_price">[] = data || [];
      return rows.reduce((sum: number, r) => sum + (r.final_price || 0), 0);
    } catch (error) {
      logger.error("mobilityService.getDriverEarnings", error as Error);
      return 0;
    }
  }

  // -- Ride ----------------------------------------------------------------

  async getRideById(rideId: string): Promise<unknown | null> {
    try {
      const { data, error } = await db
        .from("ride_requests")
        .select("*")
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("mobilityService.getRideById", error as Error);
      return null;
    }
  }

  async confirmRideCompletionByPassenger(rideId: string, passengerProfileId: string): Promise<void> {
    const now = new Date().toISOString();
    const { data, error } = await db
      .from("ride_requests")
      .update({
        passenger_confirmed_at: now,
        updated_at: now,
      })
      .eq("id", rideId)
      .eq("passenger_profile_id", passengerProfileId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Ride not found or passenger not authorized");
  }

  async getRideWithAddresses(rideId: string): Promise<unknown | null> {
    try {
      const { data, error } = await db
        .from("ride_requests")
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

  async getUserRides(userId: string): Promise<unknown[]> {
    try {
      const activeProfile = await profileService.getActiveProfile(userId);
      if (!activeProfile?.id) return [];

      const { data, error } = await db
        .from("ride_requests")
        .select("*")
        .or(`passenger_profile_id.eq.${activeProfile.id},driver_profile_id.eq.${activeProfile.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("mobilityService.getUserRides", error as Error);
      return [];
    }
  }

  async getRideBasicInfo(rideId: string): Promise<unknown | null> {
    try {
      const { data, error } = await db
        .from("ride_requests")
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

  async getRideByShareToken(token: string): Promise<unknown | null> {
    try {
      const { data, error } = await db
        .from("ride_requests")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("mobilityService.getRideByShareToken", error as Error);
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

  // -- Seats ----------------------------------------------------------------

  async getRideAvailableSeats(rideId: string): Promise<number> {
    try {
      const { data, error } = await db
        .from("ride_requests")
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
