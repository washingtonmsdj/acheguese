/**
 * Ride post-transition side effects.
 */

import { logger } from "@/shared/utils/logger";
import { RideStateMachine, type RideState } from "./RideStateMachine";
import type { RidePostTransitionSnapshot } from "./RideOperationalTypes";

export async function handleRidePostTransition(
  rideId: string,
  newState: RideState,
  ride: RidePostTransitionSnapshot,
): Promise<void> {
  try {
    if (RideStateMachine.isFinalState(newState) && ride.driver_profile_id) {
      const { DriverAvailabilityService } = await import("@/core/mobility/services/DriverAvailabilityService");
      await DriverAvailabilityService.releaseBusy(rideId);
    }
  } catch (error) {
    logger.error("RideOperationalService.handlePostTransition", error as Error, { rideId, newState });
  }
}

