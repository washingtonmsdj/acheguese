/**
 * AdminMobilityService
 *
 * Orquestra dados de mobilidade para o painel admin.
 * Todas as queries de banco são delegadas para MobilityAdminQueryService.
 */

import { logger } from "@/shared/utils/logger";
import { MobilityAdminQueryService } from "@/modules/mobility/services";

export interface AdminDriverData {
  id: string;
  profile_id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  rating: number;
  total_rides: number;
  total_earnings: number;
  is_verified: boolean;
  total_rides_accepted: number;
  total_rides_cancelled: number;
  cancellation_rate: number;
  suspension_count: number;
}

export interface AdminRideData {
  id: string;
  passenger_profile_id: string;
  driver_profile_id?: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  created_at: string;
  updated_at: string;
}

export interface AdminRideStats {
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  pending_rides: number;
  total_revenue: number;
}

export type AdminMobilityOperationalFilter =
  | "all"
  | "drivers_online"
  | "rides_in_progress"
  | "deliveries_in_progress";

export interface AdminMobilityOperationalItem {
  id: string;
  kind: "driver" | "ride" | "delivery";
  label: string;
  status: string;
  updated_at: string;
}

export interface AdminMobilityOperationalSnapshot {
  drivers_online: number;
  rides_in_progress: number;
  deliveries_in_progress: number;
  items: AdminMobilityOperationalItem[];
}

class AdminMobilityServiceClass {
  async getDriversWithStats(): Promise<AdminDriverData[]> {
    try {
      const { profileService } = await import("@/core/profiles/services/ProfileService");

      // ✅ Delegado para MobilityAdminQueryService
      const data = await MobilityAdminQueryService.getDriversRaw();

      const profileIds = [...new Set(data.map((d) => d.profile_id))] as string[];
      const profiles = await profileService.getProfilesSummary(profileIds);
      const profilesMap = new Map(profiles.map((p) => [p.id, p]));

      const driversWithStats = await Promise.all(
        data.map(async (driver) => {
          const profile = profilesMap.get(driver.profile_id);

          // ✅ Delegado para MobilityAdminQueryService
          const rideStats = await MobilityAdminQueryService.getDriverRideStatuses(driver.profile_id);

          const totalRidesAccepted = rideStats.filter((r) =>
            ["accepted", "driver_assigned", "in_progress", "completed"].includes(r.status),
          ).length;

          const totalRidesCancelled = rideStats.filter((r) => r.status === "cancelled").length;

          const cancellationRate =
            totalRidesAccepted > 0 ? (totalRidesCancelled / totalRidesAccepted) * 100 : 0;

          // ✅ Delegado para MobilityAdminQueryService
          const suspensionCount = await MobilityAdminQueryService.countDriverSuspensions(driver.user_id);

          return {
            id: driver.id,
            profile_id: driver.profile_id,
            user_id: driver.user_id,
            name: profile?.name || "Motorista",
            avatar_url: (profile as any)?.avatarUrl,
            rating: driver.rating || 0,
            total_rides: driver.total_rides || 0,
            total_earnings: driver.total_earnings || 0,
            is_verified: driver.is_verified || false,
            total_rides_accepted: totalRidesAccepted,
            total_rides_cancelled: totalRidesCancelled,
            cancellation_rate: cancellationRate,
            suspension_count: suspensionCount,
          };
        }),
      );

      return driversWithStats;
    } catch (error) {
      logger.error("Error in getDriversWithStats:", error);
      throw error;
    }
  }

  async getRideStats(): Promise<AdminRideStats> {
    try {
      // ✅ Delegado para MobilityAdminQueryService
      const rides = await MobilityAdminQueryService.getRideStats();

      return {
        total_rides: rides.length,
        completed_rides: rides.filter((r) => r.status === "completed").length,
        cancelled_rides: rides.filter((r) => r.status === "cancelled").length,
        pending_rides: rides.filter((r) => r.status === "pending").length,
        total_revenue: rides
          .filter((r) => r.status === "completed" && r.final_price)
          .reduce((sum, r) => sum + (r.final_price || 0), 0),
      };
    } catch (error) {
      logger.error("Error in getRideStats:", error);
      throw error;
    }
  }

  async getRecentRides(limit = 50): Promise<AdminRideData[]> {
    return MobilityAdminQueryService.getRecentRides(limit) as Promise<AdminRideData[]>;
  }

  async getUserRides(userId: string): Promise<AdminRideData[]> {
    return MobilityAdminQueryService.getUserRides(userId) as Promise<AdminRideData[]>;
  }

  async getTopDrivers(limit = 10): Promise<AdminDriverData[]> {
    const drivers = await this.getDriversWithStats();
    return drivers.sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  async getHighCancellationDrivers(threshold = 25): Promise<AdminDriverData[]> {
    const drivers = await this.getDriversWithStats();
    return drivers
      .filter((d) => d.cancellation_rate > threshold)
      .sort((a, b) => b.cancellation_rate - a.cancellation_rate);
  }

  async getAllDriversComplete(): Promise<unknown[]> {
    return MobilityAdminQueryService.getAllDriversComplete();
  }

  async getAllRideRatings(): Promise<Array<{ rating: number }>> {
    return MobilityAdminQueryService.getAllRideRatings();
  }

  async getAllRides(): Promise<AdminRideData[]> {
    return MobilityAdminQueryService.getAllRides() as Promise<AdminRideData[]>;
  }

  async getOperationalSnapshot(
    filter: AdminMobilityOperationalFilter = "all",
    limit = 50,
  ): Promise<AdminMobilityOperationalSnapshot> {
    const [drivers, rides, profileService] = await Promise.all([
      MobilityAdminQueryService.getActiveDriversForMap(),
      MobilityAdminQueryService.getActiveRidesForMap(),
      import("@/core/profiles/services/ProfileService").then((m) => m.profileService),
    ]);

    const profileIds = [
      ...new Set([
        ...drivers.map((driver) => driver.profile_id),
        ...rides
          .map((ride) => ride.driver_profile_id)
          .filter((profileId): profileId is string => Boolean(profileId)),
      ]),
    ];

    const profileSummaries = profileIds.length
      ? await profileService.getProfilesSummary(profileIds)
      : [];
    const profileMap = new Map(profileSummaries.map((profile) => [profile.id, profile]));

    const driverItems: AdminMobilityOperationalItem[] = drivers.map((driver) => {
      const profile = profileMap.get(driver.profile_id);
      return {
        id: `driver-${driver.profile_id}`,
        kind: "driver",
        label: profile?.name || `Motorista ${driver.profile_id.slice(0, 8)}`,
        status: driver.is_available ? "online_available" : "online",
        updated_at: driver.last_location_update || new Date().toISOString(),
      };
    });

    const rideItems: AdminMobilityOperationalItem[] = rides.map((ride) => {
      const isDelivery = ride.ride_mode === "motoboy";
      const profile = ride.driver_profile_id
        ? profileMap.get(ride.driver_profile_id)
        : undefined;
      return {
        id: ride.id,
        kind: isDelivery ? "delivery" : "ride",
        label: isDelivery
          ? `Entrega ${ride.id.slice(0, 8)}`
          : `Corrida ${ride.id.slice(0, 8)}${profile?.name ? ` (${profile.name})` : ""}`,
        status: ride.status,
        updated_at: ride.updated_at || ride.created_at,
      };
    });

    const allItems = [...driverItems, ...rideItems].sort((left, right) =>
      right.updated_at.localeCompare(left.updated_at),
    );

    const filteredItems = allItems.filter((item) => {
      if (filter === "all") return true;
      if (filter === "drivers_online") return item.kind === "driver";
      if (filter === "rides_in_progress") return item.kind === "ride";
      return item.kind === "delivery";
    });

    return {
      drivers_online: driverItems.length,
      rides_in_progress: rideItems.filter((item) => item.kind === "ride").length,
      deliveries_in_progress: rideItems.filter((item) => item.kind === "delivery").length,
      items: filteredItems.slice(0, limit),
    };
  }
}

export const adminMobilityService = new AdminMobilityServiceClass();

