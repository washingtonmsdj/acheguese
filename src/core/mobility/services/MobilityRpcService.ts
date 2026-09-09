import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type {
  RideDispatchAttemptInput,
  RideDispatchAttemptUpdateInput,
  RideStateAuditInput,
} from "./MobilityAuditService";
import type { DispatchStrategy } from "../types/dispatch.types";
import type {
  FailedDeliveryMetadata,
  ResolutionStatus,
} from "../types/FailedDeliveryMetadata";

type MobilityRpcAction =
  | "acceptRide"
  | "adminRedispatch"
  | "transitionRideState"
  | "transitionDeliveryState"
  | "updateFailedDeliveryResolution"
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

export interface AdminRedispatchBrokerData {
  success?: boolean;
  reason?: string;
  ride_id?: string;
  from_state?: string;
  to_state?: string;
  driver_profile_id?: string;
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

  static async transitionRideState(input: {
    rideId: string;
    expectedFromState: string;
    toState: string;
    actorProfileId: string;
    reason?: string;
  }): Promise<{
    updated: boolean;
    ride_id: string;
    from_state: string;
    to_state: string;
  }> {
    return this.invoke("transitionRideState", {
      rideId: input.rideId,
      expectedFromState: input.expectedFromState,
      toState: input.toState,
      actorProfileId: input.actorProfileId,
      reason: input.reason ?? "",
    });
  }

  static async transitionDeliveryState(input: {
    rideId: string;
    expectedFromState: string;
    command: "confirm_pickup" | "confirm_delivery" | "fail_delivery";
    actorProfileId: string;
    reason?: string;
    proofOfDelivery?: {
      photo_url?: string;
      code?: string;
      observation?: string;
    };
    finalPrice?: number;
    failedDeliveryMetadata?: FailedDeliveryMetadata;
  }): Promise<{
    updated: boolean;
    ride_id: string;
    from_state: string;
    to_state: string;
  }> {
    return this.invoke("transitionDeliveryState", {
      rideId: input.rideId,
      expectedFromState: input.expectedFromState,
      command: input.command,
      actorProfileId: input.actorProfileId,
      reason: input.reason ?? "",
      proofOfDelivery: input.proofOfDelivery ?? null,
      finalPrice: input.finalPrice ?? null,
      failedDeliveryMetadata: input.failedDeliveryMetadata ?? null,
    });
  }

  static async updateFailedDeliveryResolution(input: {
    rideId: string;
    resolutionUpdate: {
      next_ride_id?: string;
      handoff_driver_profile_id?: string;
      manual_resolution_owner_profile_id?: string;
      resolution_status?: ResolutionStatus;
      resolved_at?: string;
      resolution_action_notes?: string;
    };
  }): Promise<{
    updated: boolean;
    ride_id: string;
    resolution_status?: string | null;
  }> {
    return this.invoke("updateFailedDeliveryResolution", {
      rideId: input.rideId,
      resolutionUpdate: input.resolutionUpdate,
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

  static async adminRedispatch(
    rideId: string,
    reason: string,
  ): Promise<AdminRedispatchBrokerData> {
    return this.invoke<AdminRedispatchBrokerData>("adminRedispatch", {
      rideId,
      reason,
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
