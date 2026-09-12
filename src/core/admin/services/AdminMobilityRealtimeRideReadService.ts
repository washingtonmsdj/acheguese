import { QUERYABLE_OPEN_RIDE_STATUSES } from "@/core/mobility/core/RideLifecycleStatus";
import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns: string): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
};

type RealtimeRideDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const realtimeRideDb = supabase as unknown as RealtimeRideDbClient;

type RealtimeMetricBaseRow = Pick<
  Tables<"ride_requests">,
  | "status"
  | "created_at"
  | "updated_at"
  | "completed_at"
  | "cancelled_at"
  | "final_price"
  | "driver_assigned_at"
  | "driver_accepted_at"
>;

/**
 * G73/G74 SQL references `actual_fare`, but the last generated TS schema snapshot
 * predates that column. Keep the mismatch explicit until remote introspection can
 * regenerate types.
 */
export type AdminMobilityRealtimeMetricRide = RealtimeMetricBaseRow & {
  actual_fare: number | null;
};

export type AdminMobilityRealtimeOpenRide = Pick<
  Tables<"ride_requests">,
  | "id"
  | "status"
  | "passenger_profile_id"
  | "driver_profile_id"
  | "origin"
  | "destination"
  | "created_at"
  | "final_price"
  | "suggested_price"
>;

/**
 * Realtime admin read boundary.
 *
 * Historical metric rows are deliberately identity/route-free. PII-like profile
 * links and route labels are read only for currently open rides because the UI
 * renders those rows. This preserves all-time metrics without carrying active-ride
 * display fields across the full history.
 */
export class AdminMobilityRealtimeRideReadService {
  static async listMetricRows(): Promise<AdminMobilityRealtimeMetricRide[]> {
    try {
      const { data, error } = await realtimeRideDb
        .from<AdminMobilityRealtimeMetricRide>("ride_requests")
        .select(
          "status, created_at, updated_at, completed_at, cancelled_at, final_price, actual_fare, driver_assigned_at, driver_accepted_at",
        );

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminMobilityRealtimeRideReadService.listMetricRows", error as Error);
      throw error;
    }
  }

  static async listOpenRideRows(): Promise<AdminMobilityRealtimeOpenRide[]> {
    try {
      const { data, error } = await realtimeRideDb
        .from<AdminMobilityRealtimeOpenRide>("ride_requests")
        .select(
          "id, status, passenger_profile_id, driver_profile_id, origin, destination, created_at, final_price, suggested_price",
        )
        .in("status", QUERYABLE_OPEN_RIDE_STATUSES);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminMobilityRealtimeRideReadService.listOpenRideRows", error as Error);
      throw error;
    }
  }
}
