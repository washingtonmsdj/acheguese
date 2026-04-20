import { supabase } from "@/integrations/supabase";
import { RideOperationalService, mobilityAuditService } from "@/core/mobility/services";

const supabaseAny = supabase as any;

export interface AdminMotoboyDelivery {
  id: string;
  status: string;
  source_type: string | null;
  source_id: string | null;
  recipient_name: string | null;
  package_size: string | null;
  suggested_price: number | null;
  created_at: string;
  updated_at: string;
  driver_profile_id: string | null;
  pickup_location_id: string | null;
  delivery_notes: string | null;
  failed_delivery_reason: string | null;
}

export class AdminMotoboyOperationsService {
  static async listDeliveries(filters: {
    status?: string;
    sourceType?: string;
  }): Promise<AdminMotoboyDelivery[]> {
    let query = supabaseAny
      .from("ride_requests")
      .select(
        "id, status, source_type, source_id, recipient_name, package_size, suggested_price, created_at, updated_at, driver_profile_id, pickup_location_id, delivery_notes, failed_delivery_reason",
      )
      .eq("ride_mode", "motoboy")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.sourceType && filters.sourceType !== "all") {
      query = query.eq("source_type", filters.sourceType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as AdminMotoboyDelivery[]) || [];
  }

  static async listStatsRows(): Promise<Array<{ status: string; created_at: string; driver_profile_id: string | null }>> {
    const { data, error } = await supabaseAny
      .from("ride_requests")
      .select("id, status, created_at, driver_profile_id")
      .eq("ride_mode", "motoboy");

    if (error) throw error;
    return (data as Array<{ status: string; created_at: string; driver_profile_id: string | null }>) || [];
  }

  static async cancelOperational(rideId: string, reason: string): Promise<boolean> {
    const result = await RideOperationalService.cancelRide({
      rideId,
      cancelledBy: "passenger",
      profileId: "admin-override",
      reason: reason || "Cancelamento operacional pelo admin",
    });

    if (result.success) return true;

    await supabaseAny
      .from("ride_requests")
      .update({
        status: "cancelled_by_passenger",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rideId);

    await mobilityAuditService.logRideStateChange({
      rideId,
      fromState: null,
      toState: "cancelled_by_passenger",
      changedBy: "admin-override",
      reason: `Admin override: ${reason || "Cancelamento operacional"}`,
    });

    return false;
  }

  static async redispatch(rideId: string): Promise<void> {
    await supabaseAny
      .from("ride_requests")
      .update({
        status: "searching_driver",
        driver_profile_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rideId);

    await mobilityAuditService.logRideStateChange({
      rideId,
      fromState: null,
      toState: "searching_driver",
      changedBy: "admin-redispatch",
      reason: "Reencaminhamento manual pelo admin",
    });
  }
}
