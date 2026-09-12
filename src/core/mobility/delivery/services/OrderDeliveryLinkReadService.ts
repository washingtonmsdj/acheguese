import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type RideRow = Tables<"ride_requests">;

export type OrderDeliveryLinkRide = Pick<
  RideRow,
  | "id"
  | "status"
  | "source_type"
  | "source_id"
  | "ride_mode"
  | "passenger_profile_id"
  | "driver_profile_id"
  | "origin"
  | "destination"
  | "origin_lat"
  | "origin_lng"
  | "destination_lat"
  | "destination_lng"
  | "proof_of_delivery"
  | "final_price"
  | "suggested_price"
  | "created_at"
>;

const ORDER_DELIVERY_LINK_SELECT = [
  "id",
  "status",
  "source_type",
  "source_id",
  "ride_mode",
  "passenger_profile_id",
  "driver_profile_id",
  "origin",
  "destination",
  "origin_lat",
  "origin_lng",
  "destination_lat",
  "destination_lng",
  "proof_of_delivery",
  "final_price",
  "suggested_price",
  "created_at",
].join(", ");

/**
 * Read boundary for the order <-> delivery link.
 *
 * It intentionally excludes recipient contact data, operational failure
 * metadata and unrelated ride fields. Driver GPS remains in the tracking
 * authority and is never read here.
 */
export class OrderDeliveryLinkReadService {
  static async getLatestByOrderId(
    orderId: string,
  ): Promise<OrderDeliveryLinkRide | null> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select(ORDER_DELIVERY_LINK_SELECT)
        .eq("source_type", "gastronomy")
        .eq("source_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as OrderDeliveryLinkRide | null) ?? null;
    } catch (error) {
      logger.error("OrderDeliveryLinkReadService.getLatestByOrderId", error as Error, {
        orderId,
      });
      throw error;
    }
  }

  static async getByRideId(
    rideId: string,
  ): Promise<OrderDeliveryLinkRide | null> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select(ORDER_DELIVERY_LINK_SELECT)
        .eq("id", rideId)
        .maybeSingle();

      if (error) throw error;
      return (data as OrderDeliveryLinkRide | null) ?? null;
    } catch (error) {
      logger.error("OrderDeliveryLinkReadService.getByRideId", error as Error, {
        rideId,
      });
      throw error;
    }
  }

  static async getOrderIdByRideId(rideId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select("source_id")
        .eq("id", rideId)
        .eq("source_type", "gastronomy")
        .maybeSingle();

      if (error) throw error;
      return data?.source_id ?? null;
    } catch (error) {
      logger.error("OrderDeliveryLinkReadService.getOrderIdByRideId", error as Error, {
        rideId,
      });
      throw error;
    }
  }
}
