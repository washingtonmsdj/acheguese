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
  /**
   * Server-owned, single-use commercial quote. Optional only for source-level
   * compatibility while older tests/callers are migrated; runtime creation
   * rejects a missing quote before any remote mutation.
   */
  priceQuoteId?: string;
  /**
   * Retained only so the old orchestration guard remains type-safe during the
   * cutover. Callers cannot provide a numeric fare anymore and the creation
   * broker has no fare parameter.
   */
  suggestedPrice?: never;
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
  retryReopened?: boolean;
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
