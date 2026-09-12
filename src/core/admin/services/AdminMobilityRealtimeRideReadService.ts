import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export type AdminMobilityRealtimeRide = Pick<
  Tables<"ride_requests">,
  | "id"
  | "status"
  | "passenger_profile_id"
  | "driver_profile_id"
  | "origin"
  | "destination"
  | "created_at"
  | "updated_at"
  | "completed_at"
  | "cancelled_at"
  | "estimated_duration"
  | "final_price"
  | "actual_fare"
  | "suggested_price"
  | "driver_assigned_at"
  | "driver_accepted_at"
>;

/**
 * Minimal lifecycle/value read model used by the realtime admin dashboard.
 *
 * This is intentionally still an all-history read because the current product
 * contract exposes all-time completion rate and all-time driver response time.
 * G110 removes the dangerous/wasteful `select("*")` without silently changing
 * those metrics. A later server-side aggregation gate can remove the remaining
 * row-count scaling cost while preserving the same contract.
 */
export class AdminMobilityRealtimeRideReadService {
  static async listMetricRows(): Promise<AdminMobilityRealtimeRide[]> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          "id, status, passenger_profile_id, driver_profile_id, origin, destination, created_at, updated_at, completed_at, cancelled_at, estimated_duration, final_price, actual_fare, suggested_price, driver_assigned_at, driver_accepted_at",
        );

      if (error) throw error;
      return (data ?? []) as AdminMobilityRealtimeRide[];
    } catch (error) {
      logger.error("AdminMobilityRealtimeRideReadService.listMetricRows", error as Error);
      throw error;
    }
  }
}
