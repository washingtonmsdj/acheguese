import { supabase } from "@/integrations/supabase";

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
    const { error } = await supabaseAny
      .from("ride_requests")
      .update({
        status: "cancelled_by_passenger",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rideId);

    if (error) throw error;

    await this.logRideStateChange({
      rideId,
      fromState: null,
      toState: "cancelled_by_passenger",
      changedBy: "admin-override",
      reason: `Admin override: ${reason || "Cancelamento operacional"}`,
    });

    return true;
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

    await this.logRideStateChange({
      rideId,
      fromState: null,
      toState: "searching_driver",
      changedBy: "admin-redispatch",
      reason: "Reencaminhamento manual pelo admin",
    });
  }

  private static async logRideStateChange(input: {
    rideId: string;
    fromState: string | null;
    toState: string;
    changedBy: string;
    reason: string;
  }): Promise<void> {
    await supabaseAny.from("ride_state_audit").insert({
      ride_id: input.rideId,
      from_state: input.fromState ?? "none",
      to_state: input.toState,
      changed_by: input.changedBy,
      reason: input.reason,
      created_at: new Date().toISOString(),
    });
  }
}

