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

type ErrorLike = { message?: string | null } | null;

type RideDispatchAuditUpdateRow = {
  status?: string;
  responded_at?: string;
};

type MobilityAuditRpcClient = {
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

type MobilityAuditDbClient = {
  from(table: "ride_state_audit"): {
    insert(values: {
      ride_id: string;
      from_state: string;
      to_state: string;
      changed_by: string;
      reason: string;
      created_at: string;
    }): Promise<{ error: ErrorLike }>;
  };
  from(table: "ride_dispatch_audit"): {
    insert(values: {
      ride_id: string;
      driver_profile_id: string;
      attempt_number: number;
      offered_at: string;
      timeout_at: string;
      status: string;
      created_at: string;
    }): Promise<{ error: ErrorLike }>;
    update(values: RideDispatchAuditUpdateRow): {
      eq(column: "ride_id", value: string): {
        eq(column: "driver_profile_id", value: string): {
          order(column: "created_at", options: { ascending: boolean }): {
            limit(count: number): Promise<{ error: ErrorLike }>;
          };
        };
      };
    };
  };
};

const mobilityAuditRpc = supabase as unknown as MobilityAuditRpcClient;
const mobilityAuditDb = supabase as unknown as MobilityAuditDbClient;

export class MobilityAuditService {
  async logRideStateChange(input: RideStateAuditInput): Promise<void> {
    try {
      const { error } = await mobilityAuditDb.from("ride_state_audit").insert({
        ride_id: input.rideId,
        from_state: input.fromState ?? "none",
        to_state: input.toState,
        changed_by: input.changedBy,
        reason: input.reason ?? "",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      logger.error("MobilityAuditService.logRideStateChange", error as Error, input);
    }
  }

  async logDispatchAttempt(input: RideDispatchAttemptInput): Promise<void> {
    try {
      const { error } = await mobilityAuditDb.from("ride_dispatch_audit").insert({
        ride_id: input.rideId,
        driver_profile_id: input.driverProfileId,
        attempt_number: input.attemptNumber,
        offered_at: input.offeredAt,
        timeout_at: input.timeoutAt,
        status: input.status,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
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
      const payload: RideDispatchAuditUpdateRow = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.respondedAt !== undefined) payload.responded_at = updates.respondedAt;

      if (Object.keys(payload).length === 0) return;

      const { error } = await mobilityAuditDb
        .from("ride_dispatch_audit")
        .update(payload)
        .eq("ride_id", rideId)
        .eq("driver_profile_id", driverProfileId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
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
      const { error } = await mobilityAuditRpc.rpc("cancel_pending_ride_offers", {
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
