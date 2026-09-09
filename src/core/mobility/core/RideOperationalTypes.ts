/**
 * Ride operational public and internal contracts.
 */

import type { RideState } from "./RideStateMachine";

export interface CreateRideInput {
  passengerProfileId: string;
  pickupAddressId: string;
  dropoffAddressId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  origin?: string;
  destination?: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  mode?: "ride" | "delivery";
  suggestedPrice?: number;
  observation?: string;
  availableSeats?: number;
  paymentMethod?: string;
  departureTime?: string;
}

export interface CreateDeliveryInput extends Omit<CreateRideInput, "mode"> {
  sourceType: "passenger" | "business" | "gastronomy" | "service";
  sourceId?: string;
  authorizationSourceId?: string;
  recipientName: string;
  recipientPhone?: string;
  deliveryNotes?: string;
  packageDescription?: string;
  packageSize?: "small" | "medium" | "large";
  requestingUserId?: string;
  planTier?: string;
}

export interface TransitionResult {
  success: boolean;
  rideId?: string;
  newState?: RideState;
  fromState?: RideState;
  toState?: RideState;
  error?: string;
}

export interface CancelInput {
  rideId: string;
  cancelledBy: "passenger" | "driver";
  profileId: string;
  reason?: string;
}

export interface ProviderErrorShape {
  code?: string;
  details?: string;
  hint?: string;
}

