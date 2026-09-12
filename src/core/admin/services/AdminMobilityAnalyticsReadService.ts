import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type AnalyticsRideRow = Pick<
  Tables<"ride_requests">,
  | "status"
  | "created_at"
  | "updated_at"
  | "completed_at"
  | "cancelled_at"
  | "final_price"
  | "actual_fare"
  | "driver_profile_id"
>;

export type AdminMobilityAnalyticsRide = AnalyticsRideRow;

function assertValidStartIso(startIso: string): void {
  if (!Number.isFinite(Date.parse(startIso))) {
    throw new Error("Invalid analytics window start timestamp");
  }
}

/**
 * Interim row reader for admin mobility analytics while G104 remains pending.
 *
 * The selected period has two independent clocks:
 * - rides created in the period use created_at;
 * - closed rides resolved in the period use completed_at/cancelled_at, with
 *   updated_at as the legacy read-model fallback used by G103.
 *
 * The OR therefore keeps rows that can affect either calculation without
 * downloading the entire ride_requests history. No route, address, passenger
 * identity, notes, metadata, custody payload, or operational presence is read.
 *
 * G104 will replace this implementation with the aggregated admin RPC while
 * preserving this service as the frontend boundary.
 */
export class AdminMobilityAnalyticsReadService {
  static async listWindowRides(startIso: string): Promise<AdminMobilityAnalyticsRide[]> {
    assertValidStartIso(startIso);

    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          "status, created_at, updated_at, completed_at, cancelled_at, final_price, actual_fare, driver_profile_id",
        )
        .or(
          `created_at.gte.${startIso},completed_at.gte.${startIso},cancelled_at.gte.${startIso},updated_at.gte.${startIso}`,
        );

      if (error) throw error;
      return (data ?? []) as AdminMobilityAnalyticsRide[];
    } catch (error) {
      logger.error("AdminMobilityAnalyticsReadService.listWindowRides", error as Error, {
        startIso,
      });
      throw error;
    }
  }
}
