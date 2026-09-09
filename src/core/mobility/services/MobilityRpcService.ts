import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type {
  RideDispatchAttemptInput,
  RideDispatchAttemptUpdateInput,
  RideStateAuditInput,
} from "./MobilityAuditService";
import type { DispatchStrategy } from "../types/dispatch.types";

type MobilityRpcAction =
  | "acceptRide"
  | "logRideStateChange"
  | "logDispatchAttempt"
  | "updateLatestDispatchAttempt"
  | "cancelPendingOffers"
  | "releaseDriverAvailabilityForRide";

interface CancelPendingOffersBrokerData {
  cancelledCount: number;
}

interface ReleaseDriverAvailabilityBrokerData {
  released: boolean;
}

export interface AcceptRideAtomicBrokerData {
  success?: boolean;
  reason?: string;
  error?: string;
}

const FUNCTION_NAME = "mobility-rpc";
const SERVICE_NAME = "MobilityRpcService";

export class MobilityRpcService {
  private static async invoke<T>(
    action: MobilityRpcAction,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    return invokeSupabaseBroker<T, MobilityRpcAction>({
      action,
      functionName: FUNCTION_NAME,
      noDataMessage: "Mobility broker returned no data",
      params,
      serviceName: SERVICE_NAME,
    });
  }

  static async logRideStateChange(input: RideStateAuditInput): Promise<void> {
    await this.invoke<{ logged: boolean }>("logRideStateChange", {
      rideId: input.rideId,
      fromState: input.fromState,
      toState: input.toState,
      actorProfileId: input.changedBy,
      reason: input.reason ?? "",
    });
  }

  static async logDispatchAttempt(input: RideDispatchAttemptInput): Promise<void> {
    await this.invoke<{ logged: boolean }>("logDispatchAttempt", {
      rideId: input.rideId,
      driverProfileId: input.driverProfileId,
      attemptNumber: input.attemptNumber,
      offeredAt: input.offeredAt,
      timeoutAt: input.timeoutAt,
      status: input.status,
    });
  }

  static async acceptRideAtomic(
    rideId: string,
    driverProfileId: string,
    strategy: DispatchStrategy,
  ): Promise<AcceptRideAtomicBrokerData> {
    return this.invoke<AcceptRideAtomicBrokerData>("acceptRide", {
      rideId,
      driverProfileId,
      strategy,
    });
  }

  static async updateLatestDispatchAttempt(
    rideId: string,
    driverProfileId: string,
    updates: RideDispatchAttemptUpdateInput,
  ): Promise<void> {
    await this.invoke<{ updated: boolean }>("updateLatestDispatchAttempt", {
      rideId,
      driverProfileId,
      status: updates.status,
      respondedAt: updates.respondedAt,
    });
  }

  static async cancelPendingOffers(rideId: string): Promise<number> {
    const result = await this.invoke<CancelPendingOffersBrokerData>("cancelPendingOffers", {
      rideId,
    });
    return result.cancelledCount;
  }

  static async releaseDriverAvailabilityForRide(
    driverProfileId: string,
    rideId: string,
  ): Promise<boolean> {
    const result = await this.invoke<ReleaseDriverAvailabilityBrokerData>(
      "releaseDriverAvailabilityForRide",
      { driverProfileId, rideId },
    );
    return result.released === true;
  }
}
