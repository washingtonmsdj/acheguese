import {
  invokeSupabaseBroker,
  type SupabaseBrokerClient,
} from "@/core/infrastructure/edge-functions/edgeFunctionBroker";
import type { RideStateAuditInput } from "./MobilityAuditService";
import type { DispatchStrategy } from "../types/dispatch.types";
import type {
  CreateDeliveryInput,
  CreateRideInput,
} from "../core/RideOperationalTypes";
import type {
  FailedDeliveryMetadata,
  FailedDeliveryResolutionUpdate,
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
  | "cancelPendingOffers"
  | "updateDriverAvailability"
  | "updateDriverLocation"
  | "listDriverOffers"
  | "findAvailableDriversForRide"
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

export interface DriverLocationBrokerData {
  success?: boolean;
  reason?: string;
  error?: string;
  location?: Record<string, unknown>;
}

export interface DriverOfferBrokerRow {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  suggested_price: number;
  payment_method: string;
  created_at: string;
  driver_assigned_at: string | null;
  scheduled_for: string | null;
  ride_mode: string | null;
  passenger_profile_id: string | null;
  driver_profile_id: string | null;
  package_size: string | null;
  package_description: string | null;
  source_type: string | null;
  source_id: string | null;
  status: string;
  risk_level: string | null;
  dispatch_policy: string | null;
}

export interface DriverOffersBrokerData {
  offers: DriverOfferBrokerRow[];
}

export interface AvailableDriverBrokerRow {
  profile_id: string;
  distance_km: number;
  rating: number | null;
  current_lat: number;
  current_lng: number;
  last_seen_at: string;
  risk_level: string | null;
  dispatch_policy: string | null;
}

export interface AvailableDriversBrokerData {
  drivers: AvailableDriverBrokerRow[];
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
    client?: SupabaseBrokerClient,
  ): Promise<T> {
    return invokeSupabaseBroker<T, MobilityRpcAction>({
      action,
      client,
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
    resolutionUpdate: FailedDeliveryResolutionUpdate;
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

  static async cancelPendingOffers(rideId: string): Promise<number> {
    const result = await this.invoke<CancelPendingOffersBrokerData>("cancelPendingOffers", {
      rideId,
    });
    return result.cancelledCount;
  }

  static async updateDriverAvailability(
    input: {
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
    },
    client?: SupabaseBrokerClient,
  ): Promise<DriverAvailabilityBrokerData> {
    return this.invoke<DriverAvailabilityBrokerData>(
      "updateDriverAvailability",
      {
        driverProfileId: input.driverProfileId,
        availabilityAction: input.availabilityAction,
        rideMode: input.rideMode,
        lat: input.lat,
        lng: input.lng,
      },
      client,
    );
  }

  static async updateDriverLocation(
    input: {
      driverProfileId: string;
      lat: number;
      lng: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
      altitude?: number;
    },
    client?: SupabaseBrokerClient,
  ): Promise<DriverLocationBrokerData> {
    return this.invoke<DriverLocationBrokerData>(
      "updateDriverLocation",
      {
        driverProfileId: input.driverProfileId,
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
        heading: input.heading,
        speed: input.speed,
        altitude: input.altitude,
      },
      client,
    );
  }

  static async listDriverOffers(input: {
    driverProfileId: string;
    strategy: DispatchStrategy;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    packageSizes?: string[];
    sortBy?: "created_at" | "suggested_price" | "departure_time";
    ascending?: boolean;
  }): Promise<DriverOffersBrokerData> {
    return this.invoke<DriverOffersBrokerData>("listDriverOffers", {
      driverProfileId: input.driverProfileId,
      strategy: input.strategy,
      limit: input.limit,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      packageSizes: input.packageSizes,
      sortBy: input.sortBy,
      ascending: input.ascending,
    });
  }

  static async findAvailableDriversForRide(input: {
    rideId: string;
    radiusKm?: number;
    limit?: number;
  }): Promise<AvailableDriversBrokerData> {
    return this.invoke<AvailableDriversBrokerData>(
      "findAvailableDriversForRide",
      {
        rideId: input.rideId,
        radiusKm: input.radiusKm,
        limit: input.limit,
      },
    );
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
