/**
 * AdminMobilityService
 *
 * Orquestra dados de mobilidade para o painel admin.
 * Queries de banco ficam nos read services dedicados; este servico apenas
 * compoe identidades, lifecycle e snapshots administrativos.
 */

import { AdminDriverLifecycleMetricsService } from "@/core/admin/services/AdminDriverLifecycleMetricsService";
import { MobilityAdminQueryService } from "@/core/admin/services/MobilityAdminQueryService";
import {
  isCancelledRideStatus,
  isOpenRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
import { RIDE_STATE } from "@/core/mobility/core/RideStateMachine";
import { getMobilityStats as getMobilityRecordCounts } from "@/core/mobility/services/MobilityServiceDriverQueries";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";

export interface AdminDriverData {
  id: string;
  profile_id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  rating: number;
  total_rides: number;
  is_verified: boolean;
  assigned_ride_count: number;
  driver_cancelled_ride_count: number;
  driver_cancellation_rate: number;
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
  open_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  failed_rides: number;
  expired_rides: number;
  completed_value: number;
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

type ProfileSummaryWithAvatar = {
  displayName?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
};

class AdminMobilityServiceClass {
  async getDriversWithStats(): Promise<AdminDriverData[]> {
    try {
      const data = await MobilityAdminQueryService.getDriversRaw();
      const profileIds = [...new Set(data.map((driver) => driver.profile_id))];

      const [profiles, lifecycleByProfile] = await Promise.all([
        profileIds.length ? profileService.getProfilesSummary(profileIds) : Promise.resolve([]),
        AdminDriverLifecycleMetricsService.load(profileIds),
      ]);
      const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));

      return data.map((driver) => {
        const profile = profilesMap.get(driver.profile_id);
        const lifecycle = lifecycleByProfile.get(driver.profile_id) ?? {
          assignedRideCount: 0,
          driverCancelledRideCount: 0,
          driverCancellationRate: 0,
          suspensionCount: 0,
        };
        const profileWithAvatar = profile as ProfileSummaryWithAvatar | undefined;

        return {
          id: driver.id,
          profile_id: driver.profile_id,
          user_id: driver.user_id,
          name: profile?.displayName || "Motorista",
          avatar_url:
            profileWithAvatar?.avatar_url ?? profileWithAvatar?.avatarUrl ?? undefined,
          rating: driver.rating || 0,
          total_rides: driver.total_rides || 0,
          is_verified: driver.is_verified || false,
          assigned_ride_count: lifecycle.assignedRideCount,
          driver_cancelled_ride_count: lifecycle.driverCancelledRideCount,
          driver_cancellation_rate: lifecycle.driverCancellationRate,
          suspension_count: lifecycle.suspensionCount,
        };
      });
    } catch (error) {
      logger.error("Error in getDriversWithStats:", error);
      throw error;
    }
  }

  async getRideStats(): Promise<AdminRideStats> {
    try {
      const rides = await MobilityAdminQueryService.getRideStats();
      const completedRides = rides.filter((ride) => ride.status === RIDE_STATE.COMPLETED);

      return {
        total_rides: rides.length,
        open_rides: rides.filter((ride) => isOpenRideStatus(ride.status)).length,
        completed_rides: completedRides.length,
        cancelled_rides: rides.filter((ride) => isCancelledRideStatus(ride.status)).length,
        failed_rides: rides.filter((ride) => ride.status === RIDE_STATE.FAILED).length,
        expired_rides: rides.filter((ride) => ride.status === RIDE_STATE.EXPIRED).length,
        completed_value: completedRides.reduce(
          (sum, ride) => sum + (ride.final_price ?? 0),
          0,
        ),
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

  async getAllDriversComplete(): Promise<unknown[]> {
    return MobilityAdminQueryService.getAllDriversComplete();
  }

  async getAllRideRatings(): Promise<Array<{ rating: number }>> {
    return MobilityAdminQueryService.getAllRideRatings();
  }

  async getAllRides(): Promise<AdminRideData[]> {
    return MobilityAdminQueryService.getAllRides() as Promise<AdminRideData[]>;
  }

  async getMobilityStats(): Promise<{ total_drivers: number; total_rides: number }> {
    return getMobilityRecordCounts();
  }

  async getOperationalSnapshot(
    filter: AdminMobilityOperationalFilter = "all",
    limit = 50,
  ): Promise<AdminMobilityOperationalSnapshot> {
    const [drivers, rides, profileServiceRef] = await Promise.all([
      MobilityAdminQueryService.getActiveDriversForMap(),
      MobilityAdminQueryService.getActiveRidesForMap(),
      Promise.resolve(profileService),
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
      ? await profileServiceRef.getProfilesSummary(profileIds)
      : [];
    const profileMap = new Map(profileSummaries.map((profile) => [profile.id, profile]));

    const driverItems: AdminMobilityOperationalItem[] = drivers.map((driver) => {
      const profile = profileMap.get(driver.profile_id) as ProfileSummaryWithAvatar | undefined;
      return {
        id: `driver-${driver.profile_id}`,
        kind: "driver",
        label: profile?.displayName || `Motorista ${driver.profile_id.slice(0, 8)}`,
        status: driver.is_available ? "online_available" : "online",
        updated_at: driver.last_location_update || new Date().toISOString(),
      };
    });

    const rideItems: AdminMobilityOperationalItem[] = rides.map((ride) => {
      const isDelivery = ride.ride_mode === "motoboy";
      const profile = (ride.driver_profile_id
        ? profileMap.get(ride.driver_profile_id)
        : undefined) as ProfileSummaryWithAvatar | undefined;
      return {
        id: ride.id,
        kind: isDelivery ? "delivery" : "ride",
        label: isDelivery
          ? `Entrega ${ride.id.slice(0, 8)}`
          : `Corrida ${ride.id.slice(0, 8)}${profile?.displayName ? ` (${profile.displayName})` : ""}`,
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
