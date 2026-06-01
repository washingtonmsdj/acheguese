import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface RideStateAuditInput {
  rideId: string;
  fromState: string | null;
  toState: string;
  changedBy: string;
  reason?: string;
}

export interface RideDispatchAttemptInput {
  rideId: string;
  driverProfileId: string;
  attemptNumber: number;
  offeredAt: string;
  timeoutAt: string;
  status: string;
}

export interface RideDispatchAttemptUpdateInput {
  status?: string;
  respondedAt?: string;
}

export class MobilityAuditService {
  async logRideStateChange(input: RideStateAuditInput): Promise<void> {
    try {
      await supabase.from("ride_state_audit").insert({
        ride_id: input.rideId,
        from_state: input.fromState ?? "none",
        to_state: input.toState,
        changed_by: input.changedBy,
        reason: input.reason || "",
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("MobilityAuditService.logRideStateChange", error as Error, input);
    }
  }

  async logDispatchAttempt(input: RideDispatchAttemptInput): Promise<void> {
    try {
      await supabase.from("ride_dispatch_audit").insert({
        ride_id: input.rideId,
        driver_profile_id: input.driverProfileId,
        attempt_number: input.attemptNumber,
        offered_at: input.offeredAt,
        timeout_at: input.timeoutAt,
        status: input.status,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("MobilityAuditService.logDispatchAttempt", error as Error, input);
    }
  }

  async updateLatestDispatchAttempt(
    rideId: string,
    driverProfileId: string,
    updates: RideDispatchAttemptUpdateInput,
  ): Promise<void> {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.respondedAt !== undefined) payload.responded_at = updates.respondedAt;

      if (Object.keys(payload).length === 0) return;

      await supabase
        .from("ride_dispatch_audit")
        .update(payload)
        .eq("ride_id", rideId)
        .eq("driver_profile_id", driverProfileId)
        .order("created_at", { ascending: false })
        .limit(1);
    } catch (error) {
      logger.error("MobilityAuditService.updateLatestDispatchAttempt", error as Error, {
        rideId,
        driverProfileId,
        updates,
      });
    }
  }

  async cancelPendingOffers(rideId: string): Promise<void> {
    try {
      const { error } = await (supabase as any).rpc("cancel_pending_ride_offers", {
        p_ride_id: rideId,
      });

      if (error) throw error;
    } catch (error) {
      logger.error("MobilityAuditService.cancelPendingOffers", error as Error, { rideId });
      throw error;
    }
  }
}

export const mobilityAuditService = new MobilityAuditService();
