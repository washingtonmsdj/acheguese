import type { RideRealtimeEvent } from "@/core/mobility/hooks/useRideRealtime";

export type DriverOfferRealtimeAction =
  | { kind: "load"; rideId: string }
  | { kind: "clear" }
  | { kind: "ignore" };

export function resolveDriverOfferRealtimeAction(
  event: RideRealtimeEvent,
  driverProfileId: string | undefined,
  currentRideId: string | undefined,
): DriverOfferRealtimeAction {
  if (event.type === "driver_assigned" && event.driverProfileId === driverProfileId) {
    return { kind: "load", rideId: event.rideId };
  }
  if (
    (event.type === "expired" || event.type === "cancelled") &&
    currentRideId === event.rideId
  ) {
    return { kind: "clear" };
  }
  return { kind: "ignore" };
}
