/**
 * Ride operational public and internal contracts.
 */

import type { RideState } from "./RideStateMachine";

/**
 * Browser creation payload intentionally excludes passenger/profile, canonical
 * address/location ids, coordinates and price. Those facts belong to the
 * server-owned, single-use mobility quote referenced by priceQuoteId.
 */
export interface CreateRideInput {
  priceQuoteId: string;
  origin?: string;
  destination?: string;
  observation?: string;
  availableSeats?: number;
  paymentMethod?: string;
  departureTime?: string;
}

export interface CreateDeliveryInput extends CreateRideInput {
  sourceType: "passenger" | "business" | "gastronomy" | "service";
  sourceId?: string;
  authorizationSourceId?: string;
  recipientName: string;
  recipientPhone?: string;
  deliveryNotes?: string;
  packageDescription?: string;
  packageSize?: "small" | "medium" | "large";
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
