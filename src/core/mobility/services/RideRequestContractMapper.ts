import type { Tables } from "@/integrations/supabase";
import {
  LEGACY_CLOSED_RIDE_STATUSES,
  LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES,
  toCanonicalRideState,
} from "../core/RideLifecycleStatus";
import type { RideRequest } from "../types/types";

export type RideRequestContractSource = Pick<
  Tables<"ride_requests">,
  | "id"
  | "passenger_profile_id"
  | "driver_profile_id"
  | "source_id"
  | "ride_mode"
  | "origin"
  | "destination"
  | "origin_lat"
  | "origin_lng"
  | "destination_lat"
  | "destination_lng"
  | "status"
  | "suggested_price"
  | "final_price"
  | "driver_assigned_at"
  | "passenger_boarded_at"
  | "payment_method"
  | "departure_time"
  | "observation"
  | "driver_accepted_at"
  | "started_at"
  | "completed_at"
  | "passenger_confirmed_at"
  | "cancelled_at"
  | "created_at"
  | "updated_at"
>;


const UNRESOLVED_COMPATIBILITY_STATUSES: readonly string[] = [
  ...LEGACY_UNRESOLVED_OPEN_RIDE_STATUSES,
  ...LEGACY_CLOSED_RIDE_STATUSES,
];

function normalizeRideStatus(
  status: string | null | undefined,
): RideRequest["status"] {
  const canonical = toCanonicalRideState(status);
  if (canonical) return canonical;

  if (status && UNRESOLVED_COMPATIBILITY_STATUSES.includes(status)) {
    return status as RideRequest["status"];
  }

  return "requested";
}

function normalizeRideMode(
  rideMode: string | null | undefined,
): RideRequest["ride_mode"] {
  if (rideMode === "ride" || rideMode === "motoboy") return rideMode;
  return null;
}

export function toRideRequestContract(ride: RideRequestContractSource): RideRequest {
  const rideMode = normalizeRideMode(ride.ride_mode);
  const originAddress = ride.origin ?? "";
  const destinationAddress = ride.destination ?? "";

  return {
    id: ride.id,
    passenger_profile_id: ride.passenger_profile_id,
    driver_profile_id: ride.driver_profile_id ?? undefined,
    source_id: ride.source_id ?? null,
    ride_mode: rideMode,
    type:
      rideMode === "motoboy"
        ? "delivery"
        : rideMode === "ride"
          ? "ride"
          : null,
    origin: ride.origin ?? null,
    destination: ride.destination ?? null,
    pickup_address: originAddress || null,
    dropoff_address: destinationAddress || null,
    origin_address: originAddress,
    destination_address: destinationAddress,
    origin_lat: ride.origin_lat ?? 0,
    origin_lng: ride.origin_lng ?? 0,
    destination_lat: ride.destination_lat ?? 0,
    destination_lng: ride.destination_lng ?? 0,
    status: normalizeRideStatus(ride.status),
    estimated_price: ride.suggested_price ?? undefined,
    suggested_price: ride.suggested_price ?? undefined,
    final_price: ride.final_price ?? undefined,
    share_token: null,
    share_expires_at: null,
    share_is_active: null,
    driver_assigned_at: ride.driver_assigned_at ?? null,
    driver_on_the_way_at: null,
    driver_arrived_at: null,
    passenger_on_board_at: ride.passenger_boarded_at ?? null,
    payment_method: ride.payment_method ?? "",
    departure_time: ride.departure_time ?? null,
    observation: ride.observation ?? null,
    payment_status: "pending",
    accepted_at: ride.driver_accepted_at ?? null,
    started_at: ride.started_at ?? null,
    completed_at: ride.completed_at ?? null,
    passenger_confirmed: ride.passenger_confirmed_at != null,
    passenger_confirmed_at: ride.passenger_confirmed_at ?? null,
    cancelled_at: ride.cancelled_at ?? null,
    created_at: ride.created_at,
    updated_at: ride.updated_at,
  };
}
