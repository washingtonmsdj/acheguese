import { logger } from "@/shared/utils/logger";
import { MobilityRpcService } from "./MobilityRpcService";

export interface RideStateAuditInput {
  rideId: string;
  fromState: string | null;
  toState: string;
  changedBy: string;
  reason?: string;
}

export class MobilityAuditService {
  async logRideStateChange(input: RideStateAuditInput): Promise<void> {
    try {
      await MobilityRpcService.logRideStateChange(input);
    } catch (error) {
      logger.error("MobilityAuditService.logRideStateChange", error as Error, input);
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
