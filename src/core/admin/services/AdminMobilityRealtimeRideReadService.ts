import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type RealtimeRideBaseRow = Pick<
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
  | "final_price"
  | "suggested_price"
  | "driver_assigned_at"
  | "driver_accepted_at"
>;

/**
 * G73/G74 SQL references `actual_fare`, but the last generated TS schema snapshot
 * predates that column. Keep the mismatch explicit until remote introspection can
 * regenerate types. `estimated_duration` is intentionally absent because the
 * current generated `ride_requests` contract does not expose such a column.
 */
export type AdminMobilityRealtimeRide = RealtimeRideBaseRow & {
  actual_fare: number | null;
};

type RealtimeRideTableClient = PromiseLike<{
  data: AdminMobilityRealtimeRide[] | null;
  error: ErrorLike;
}> & {
  select(columns: string): RealtimeRideTableClient;
};

type RealtimeRideDbClient = {
  from(table: "ride_requests"): RealtimeRideTableClient;
};

const realtimeRideDb = supabase as unknown as RealtimeRideDbClient;

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
      const { data, error } = await realtimeRideDb
        .from("ride_requests")
        .select(
          "id, status, passenger_profile_id, driver_profile_id, origin, destination, created_at, updated_at, completed_at, cancelled_at, final_price, actual_fare, suggested_price, driver_assigned_at, driver_accepted_at",
        );

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminMobilityRealtimeRideReadService.listMetricRows", error as Error);
      throw error;
    }
  }
}
