import { invokeSupabaseBroker } from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type {
  RideDispatchAttemptInput,
  RideDispatchAttemptUpdateInput,
  RideStateAuditInput,
} from "./MobilityAuditService";
import type { DispatchStrategy } from "../types/dispatch.types";
import type {
  CreateDeliveryInput,
  CreateRideInput,
} from "../core/RideOperationalTypes";
import type {
  FailedDeliveryMetadata,
  ResolutionStatus,
} from "../types/FailedDeliveryMetadata";

type MobilityRpcAction =
  | "createRide"
  | "createDelivery"
  | "acceptRide"
  | "adminRedispatch"
  | "confirmPassengerCompletion"
  | "transitionRideState"
  | "transitionDeliveryState"
  | "updateFailedDeliveryResolution"
  | "logRideStateChange"
  | "logDispatchAttempt"
  | "updateLatestDispatchAttempt"
  | "cancelPendingOffers"
  | "updateDriverAvailability"
  | "reconcileStaleDriverAvailability"
  | "releaseDriverAvailabilityForRide";

interface CancelPendingOffersBrokerData {
  cancelledCount: number;
}

interface ReleaseDriverAvailabilityBrokerData {
  released: boolean;
}

export interface DriverAvailabilityBrokerData {
  success?: boolean;
  reason?: string;
  error?: string;
  availability?: Record<string, unknown>;
}

export interface StaleDriverAvailabilityBrokerData {
  markedOffline?: number;
  staleBusy?: number;
  cutoff?: string;
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
  static async createRide(input: CreateRideInput): Promise<{
    success: boolean;
    ride_id?: string;
    status?: string;
    reason?: string;
  }> {
    return this.invoke("createRide", {
      passengerProfileId: input.passengerProfileId,
      pickupAddressId: input.pickupAddressId,
      dropoffAddressId: input.dropoffAddressId,
      pickupLocationId: input.pickupLocationId,
      dropoffLocationId: input.dropoffLocationId,
      origin: input.origin ?? null,
      destination: input.destination ?? null,
      originLat: input.originLat,
      originLng: input.originLng,
      destinationLat: input.destinationLat,
      destinationLng: input.destinationLng,
      suggestedPrice: input.suggestedPrice ?? null,
      availableSeats: input.availableSeats ?? 1,
      observation: input.observation ?? null,
      paymentMethod: input.paymentMethod ?? null,
      departureTime: input.departureTime ?? null,
    });
  }

  static async createDelivery(input: CreateDeliveryInput): Promise<{
    success: boolean;
    ride_id?: string;
    status?: string;
    reason?: string;
  }> {
    return this.invoke("createDelivery", {
      passengerProfileId: input.passengerProfileId,
      pickupAddressId: input.pickupAddressId,
      dropoffAddressId: input.dropoffAddressId,
      pickupLocationId: input.pickupLocationId,
      dropoffLocationId: input.dropoffLocationId,
      origin: input.origin ?? null,
      destination: input.destination ?? null,
      originLat: input.originLat,
      originLng: input.originLng,
      destinationLat: input.destinationLat,
      destinationLng: input.destinationLng,
      suggestedPrice: input.suggestedPrice ?? null,
      observation: input.observation ?? null,
      paymentMethod: input.paymentMethod ?? null,
      departureTime: input.departureTime ?? null,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      authorizationSourceId: input.authorizationSourceId ?? input.sourceId ?? null,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone ?? null,
      deliveryNotes: input.deliveryNotes ?? null,
      packageDescription: input.packageDescription ?? null,
      packageSize: input.packageSize ?? "small",
    });
  }

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

  static async confirmPassengerCompletion(rideId: string): Promise<{
    success: boolean;
    reason?: string;
    ride_id?: string;
    passenger_confirmed_at?: string;
  }> {
    return this.invoke("confirmPassengerCompletion", { rideId });
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

  static async updateDriverAvailability(input: {
    driverProfileId: string;
    availabilityAction:
      | "go_online"
      | "go_offline"
      | "set_available"
      | "pause_available"
      | "heartbeat";
    rideMode?: "ride" | "motoboy";
    lat?: number;
    lng?: number;
  }): Promise<DriverAvailabilityBrokerData> {
    return this.invoke<DriverAvailabilityBrokerData>("updateDriverAvailability", {
      driverProfileId: input.driverProfileId,
      availabilityAction: input.availabilityAction,
      rideMode: input.rideMode,
      lat: input.lat,
      lng: input.lng,
    });
  }

  static async reconcileStaleDriverAvailability(
    thresholdMinutes: number,
  ): Promise<StaleDriverAvailabilityBrokerData> {
    return this.invoke<StaleDriverAvailabilityBrokerData>(
      "reconcileStaleDriverAvailability",
      { thresholdMinutes },
    );
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
