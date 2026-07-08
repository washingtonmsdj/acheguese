import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { MobilityRpcService } from "./MobilityRpcService";

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
};

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
      await MobilityRpcService.logDispatchAttempt(input);
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
      if (updates.status === undefined && updates.respondedAt === undefined) return;
      await MobilityRpcService.updateLatestDispatchAttempt(rideId, driverProfileId, updates);
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
      await MobilityRpcService.cancelPendingOffers(rideId);
    } catch (error) {
      logger.error("MobilityAuditService.cancelPendingOffers", error as Error, { rideId });
      throw error;
    }
  }
}

export const mobilityAuditService = new MobilityAuditService();
