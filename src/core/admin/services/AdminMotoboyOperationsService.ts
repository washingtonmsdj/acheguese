import { supabase } from "@/integrations/supabase";
import { MobilityService } from "@/core/mobility/services/runtime";

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
    const data = await MobilityService.listMotoboyDeliveries(filters);
    return (data as AdminMotoboyDelivery[]) || [];
  }

  static async listStatsRows(): Promise<Array<{ status: string; created_at: string; driver_profile_id: string | null }>> {
    return MobilityService.listMotoboyStatsRows();
  }

  static async cancelOperational(rideId: string, reason: string): Promise<boolean> {
    await MobilityService.updateRide(rideId, {
        status: "cancelled_by_passenger",
        updated_at: new Date().toISOString(),
    });

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
    await MobilityService.updateRide(rideId, {
      status: "searching_driver",
      driver_profile_id: null,
      updated_at: new Date().toISOString(),
    });

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
    await supabase.from("ride_state_audit").insert({
      ride_id: input.rideId,
      from_state: input.fromState ?? "none",
      to_state: input.toState,
      changed_by: input.changedBy,
      reason: input.reason,
      created_at: new Date().toISOString(),
    });
  }
}

