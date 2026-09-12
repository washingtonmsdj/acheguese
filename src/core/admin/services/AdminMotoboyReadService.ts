import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type RideRequestRow = Tables<"ride_requests">;

export type AdminMotoboyDelivery = Pick<
  RideRequestRow,
  | "id"
  | "status"
  | "source_type"
  | "source_id"
  | "recipient_name"
  | "package_size"
  | "suggested_price"
  | "created_at"
  | "updated_at"
  | "driver_profile_id"
  | "pickup_location_id"
  | "delivery_notes"
  | "failed_delivery_reason"
>;

export type AdminMotoboyStatsRow = Pick<
  RideRequestRow,
  "status" | "created_at" | "driver_profile_id"
>;

const DELIVERY_SELECT = [
  "id",
  "status",
  "source_type",
  "source_id",
  "recipient_name",
  "package_size",
  "suggested_price",
  "created_at",
  "updated_at",
  "driver_profile_id",
  "pickup_location_id",
  "delivery_notes",
  "failed_delivery_reason",
].join(", ");

/**
 * Admin-only read boundary for motoboy operational screens and aggregates.
 *
 * Commands remain owned by RideOperationalService/MobilityRpcService. This
 * service owns only bounded admin reads over the motoboy projection.
 */
export class AdminMotoboyReadService {
  static async listDeliveries(filters: {
    status?: string;
    sourceType?: string;
    limit?: number;
  }): Promise<AdminMotoboyDelivery[]> {
    try {
      let query = supabase
        .from("ride_requests")
        .select(DELIVERY_SELECT)
        .eq("ride_mode", "motoboy")
        .order("created_at", { ascending: false })
        .limit(filters.limit ?? 200);

      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.sourceType && filters.sourceType !== "all") {
        query = query.eq("source_type", filters.sourceType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as AdminMotoboyDelivery[] | null) ?? [];
    } catch (error) {
      logger.error("AdminMotoboyReadService.listDeliveries", error as Error, {
        status: filters.status ?? null,
        sourceType: filters.sourceType ?? null,
      });
      throw error;
    }
  }

  static async listStatsRows(): Promise<AdminMotoboyStatsRow[]> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select("status, created_at, driver_profile_id")
        .eq("ride_mode", "motoboy");

      if (error) throw error;
      return (data as AdminMotoboyStatsRow[] | null) ?? [];
    } catch (error) {
      logger.error("AdminMotoboyReadService.listStatsRows", error as Error);
      throw error;
    }
  }

  static async countDeliveredBySource(
    sourceType: string,
    sourceId: string,
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("ride_requests")
        .select("id", { count: "exact", head: true })
        .eq("ride_mode", "motoboy")
        .eq("source_type", sourceType)
        .eq("source_id", sourceId)
        .eq("status", "delivered");

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error("AdminMotoboyReadService.countDeliveredBySource", error as Error, {
        sourceType,
        sourceId,
      });
      throw error;
    }
  }

  static async countDeliveredTotal(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("ride_requests")
        .select("id", { count: "exact", head: true })
        .eq("ride_mode", "motoboy")
        .eq("status", "delivered");

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error("AdminMotoboyReadService.countDeliveredTotal", error as Error);
      throw error;
    }
  }
}
