import { logger } from "@/shared/utils/logger";
import { MobilityService } from "@/core/mobility/services/MobilityService.impl";
import { DriverAvailabilityService } from "@/core/mobility/services/DriverAvailabilityService";

export interface DriverActivityStats {
  isCurrentlyOnline: boolean;
  availabilityStatus: "offline" | "online_warming_up" | "online_available" | "busy";
  lastSeenAt: string | null;
  activeRideId: string | null;
  completedRideMinutesTotal: number;
  completedRideCount: number;
  averageCompletedRideMinutes: number;
  completedRideMinutesToday: number;
  completedRideMinutesThisWeek: number;
  completedRideMinutesThisMonth: number;
}

function minutesBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs > 0 ? Math.floor(diffMs / 60_000) : 0;
}

interface RideSession {
  started_at: string | null;
  completed_at: string | null;
}

function completedMinutesSince(
  rides: readonly RideSession[],
  since: Date,
): number {
  return rides.reduce((sum, ride) => {
    if (!ride.started_at || !ride.completed_at) return sum;
    if (new Date(ride.completed_at) < since) return sum;
    return sum + minutesBetween(ride.started_at, ride.completed_at);
  }, 0);
}

/**
 * Read model for the driver activity card.
 *
 * Current presence comes exclusively from driver_availability. Historical
 * duration is intentionally ride duration, not "online time": the product does
 * not persist presence sessions today, so inventing an online-session timeline
 * from ride rows would be semantically incorrect.
 */
export class DriverActivityStatsService {
  static async getStats(driverProfileId: string): Promise<DriverActivityStats | null> {
    try {
      const [availability, rideResult] = await Promise.all([
        DriverAvailabilityService.getStatus(driverProfileId),
        MobilityService.getDriverRideSessions(driverProfileId, 300),
      ]);

      const rides = (rideResult ?? []) as RideSession[];
      const completedRideMinutes = rides
        .map((ride) => {
          if (!ride.started_at || !ride.completed_at) return 0;
          return minutesBetween(ride.started_at, ride.completed_at);
        })
        .filter((duration) => duration > 0);

      const completedRideMinutesTotal = completedRideMinutes.reduce(
        (sum, duration) => sum + duration,
        0,
      );
      const completedRideCount = completedRideMinutes.length;
      const averageCompletedRideMinutes = completedRideCount > 0
        ? Math.round(completedRideMinutesTotal / completedRideCount)
        : 0;

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const monthStart = new Date(now);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      return {
        isCurrentlyOnline: availability?.isOnline ?? false,
        availabilityStatus: availability?.status ?? "offline",
        lastSeenAt: availability?.lastSeenAt ?? null,
        activeRideId: availability?.activeRideId ?? null,
        completedRideMinutesTotal,
        completedRideCount,
        averageCompletedRideMinutes,
        completedRideMinutesToday: completedMinutesSince(rides, todayStart),
        completedRideMinutesThisWeek: completedMinutesSince(rides, weekStart),
        completedRideMinutesThisMonth: completedMinutesSince(rides, monthStart),
      };
    } catch (error) {
      logger.error("DriverActivityStatsService.getStats", error as Error, {
        driverProfileId,
      });
      return null;
    }
  }
}
