import { toCanonicalRideState } from "./RideLifecycleStatus";
import { RIDE_STATE, RideStateMachine, type RideState } from "./RideStateMachine";

export interface PassengerRideViewAvailability {
  showLiveMap: boolean;
  showDriverInfo: boolean;
  canCancel: boolean;
}

/**
 * Must stay aligned with the participant-scoped driver_locations SELECT policy.
 * Precise location is intentionally unavailable after terminal/custody states
 * not present in the RLS allowlist.
 */
export const PASSENGER_LIVE_TRACKING_STATES: readonly RideState[] = [
  RIDE_STATE.DRIVER_ASSIGNED,
  RIDE_STATE.DRIVER_ACCEPTED,
  RIDE_STATE.DRIVER_ARRIVING,
  RIDE_STATE.PASSENGER_BOARDED,
  RIDE_STATE.IN_PROGRESS,
  RIDE_STATE.PICKUP_CONFIRMED,
  RIDE_STATE.IN_DELIVERY,
];

const LIVE_TRACKING_STATE_SET = new Set<RideState>(
  PASSENGER_LIVE_TRACKING_STATES,
);

const DRIVER_INFO_STATES = new Set<RideState>([
  RIDE_STATE.DRIVER_ASSIGNED,
  RIDE_STATE.DRIVER_ACCEPTED,
  RIDE_STATE.DRIVER_ARRIVING,
  RIDE_STATE.PASSENGER_BOARDED,
  RIDE_STATE.IN_PROGRESS,
  RIDE_STATE.PICKUP_CONFIRMED,
  RIDE_STATE.IN_DELIVERY,
  RIDE_STATE.DELIVERED,
  RIDE_STATE.FAILED_DELIVERY,
]);

const NO_PRIVILEGED_VIEW: PassengerRideViewAvailability = {
  showLiveMap: false,
  showDriverInfo: false,
  canCancel: false,
};

/**
 * Passenger-side presentation and mutation policy.
 *
 * Deterministic aliases are canonicalized by RideLifecycleStatus. Ambiguous
 * historical rows fail closed for live location and mutation. We retain only
 * non-sensitive driver identity display for `driver_arrived`, since the row
 * itself already proves a driver was assigned but not which canonical lifecycle
 * state should replace that alias.
 */
export function getPassengerRideViewAvailability(
  rawStatus: string | null | undefined,
): PassengerRideViewAvailability {
  const state = toCanonicalRideState(rawStatus);

  if (!state) {
    if (rawStatus === "driver_arrived") {
      return {
        showLiveMap: false,
        showDriverInfo: true,
        canCancel: false,
      };
    }
    return NO_PRIVILEGED_VIEW;
  }

  return {
    showLiveMap: LIVE_TRACKING_STATE_SET.has(state),
    showDriverInfo: DRIVER_INFO_STATES.has(state),
    canCancel: RideStateMachine.canPassengerCancel(state),
  };
}
