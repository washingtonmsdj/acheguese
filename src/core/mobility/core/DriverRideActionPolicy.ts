import { toCanonicalRideState } from "./RideLifecycleStatus";
import { RIDE_STATE, RideStateMachine } from "./RideStateMachine";

export interface DriverRideActionAvailability {
  canStartPickupRoute: boolean;
  canConfirmBoarding: boolean;
  canStart: boolean;
  canComplete: boolean;
  canCancel: boolean;
}

const NO_ACTIONS: DriverRideActionAvailability = {
  canStartPickupRoute: false,
  canConfirmBoarding: false,
  canStart: false,
  canComplete: false,
  canCancel: false,
};

/**
 * Canonical UI action policy for passenger rides owned by a driver.
 *
 * This policy is deliberately derived from RideStateMachine instead of local
 * status arrays. Ambiguous historical statuses (for example `driver_arrived`)
 * are fail-closed until provenance cleanup reconciles them.
 */
export function getDriverRideActionAvailability(
  rawStatus: string | null | undefined,
): DriverRideActionAvailability {
  const state = toCanonicalRideState(rawStatus);
  if (!state) return NO_ACTIONS;

  return {
    canStartPickupRoute: RideStateMachine.canTransition(
      state,
      RIDE_STATE.DRIVER_ARRIVING,
    ),
    canConfirmBoarding: RideStateMachine.canTransition(
      state,
      RIDE_STATE.PASSENGER_BOARDED,
    ),
    canStart: RideStateMachine.canTransition(state, RIDE_STATE.IN_PROGRESS),
    canComplete: RideStateMachine.canTransition(state, RIDE_STATE.COMPLETED),
    canCancel: RideStateMachine.canDriverCancel(state),
  };
}
