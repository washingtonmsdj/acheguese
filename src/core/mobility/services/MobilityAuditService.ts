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

export class MobilityAuditService {
  async logRideStateChange(input: RideStateAuditInput): Promise<void> {
    try {
      await MobilityRpcService.logRideStateChange(input);
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
