import { supabase } from "@/core/supabase";
import { logger } from "@/shared/utils/logger";

export interface DriverPresenceStats {
  is_currently_online: boolean;
  online_since: string | null;
  current_session_minutes: number;
  total_online_time_minutes: number;
  total_sessions: number;
  avg_session_minutes: number;
  online_today_minutes: number;
  online_this_week_minutes: number;
  online_this_month_minutes: number;
}

function minutesBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / 60000);
}

export class DriverPresenceService {
  static async getDriverPresenceStats(driverProfileId: string): Promise<DriverPresenceStats | null> {
    try {
      const [driverDataResult, rideResult] = await Promise.all([
        supabase
          .from("driver_data")
          .select("is_online, last_location_update")
          .eq("profile_id", driverProfileId)
          .maybeSingle(),
        supabase
          .from("ride_requests")
          .select("started_at, completed_at")
          .eq("driver_profile_id", driverProfileId)
          .not("started_at", "is", null)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(300),
      ]);

      if (driverDataResult.error) {
        logger.error("[DriverPresenceService] Error fetching driver_data:", driverDataResult.error);
        return null;
      }
      if (rideResult.error) {
        logger.error("[DriverPresenceService] Error fetching ride sessions:", rideResult.error);
        return null;
      }

      const nowIso = new Date().toISOString();
      const isCurrentlyOnline = Boolean(driverDataResult.data?.is_online);
      const onlineSince = isCurrentlyOnline ? driverDataResult.data?.last_location_update ?? null : null;
      const currentSessionMinutes = onlineSince ? minutesBetween(onlineSince, nowIso) : 0;

      const rides = (rideResult.data ?? []) as Array<{ started_at: string | null; completed_at: string | null }>;
      const rideDurations = rides
        .map((ride) => {
          if (!ride.started_at || !ride.completed_at) return 0;
          return minutesBetween(ride.started_at, ride.completed_at);
        })
        .filter((duration) => duration > 0);

      const totalOnlineMinutesFromRides = rideDurations.reduce((sum, duration) => sum + duration, 0);
      const totalSessions = rideDurations.length;
      const avgSessionMinutes = totalSessions > 0 ? Math.round(totalOnlineMinutesFromRides / totalSessions) : 0;

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      const monthStart = new Date(now);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const onlineTodayMinutes = rides.reduce((sum, ride) => {
        if (!ride.started_at || !ride.completed_at) return sum;
        if (new Date(ride.completed_at) < todayStart) return sum;
        return sum + minutesBetween(ride.started_at, ride.completed_at);
      }, 0);
      const onlineThisWeekMinutes = rides.reduce((sum, ride) => {
        if (!ride.started_at || !ride.completed_at) return sum;
        if (new Date(ride.completed_at) < weekStart) return sum;
        return sum + minutesBetween(ride.started_at, ride.completed_at);
      }, 0);
      const onlineThisMonthMinutes = rides.reduce((sum, ride) => {
        if (!ride.started_at || !ride.completed_at) return sum;
        if (new Date(ride.completed_at) < monthStart) return sum;
        return sum + minutesBetween(ride.started_at, ride.completed_at);
      }, 0);

      return {
        is_currently_online: isCurrentlyOnline,
        online_since: onlineSince,
        current_session_minutes: currentSessionMinutes,
        total_online_time_minutes: totalOnlineMinutesFromRides + currentSessionMinutes,
        total_sessions: totalSessions,
        avg_session_minutes: avgSessionMinutes,
        online_today_minutes: onlineTodayMinutes + currentSessionMinutes,
        online_this_week_minutes: onlineThisWeekMinutes + currentSessionMinutes,
        online_this_month_minutes: onlineThisMonthMinutes + currentSessionMinutes,
      };
    } catch (error) {
      logger.error("[DriverPresenceService] Unexpected error computing presence stats:", error);
      return null;
    }
  }
}

