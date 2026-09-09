/**
 * RIDE DISPATCH SERVICE - Aceite de Corridas
 *
 * O auto-dispatch/assignment pertence ao backend server-side
 * (Database Webhook -> auto-dispatch-ride -> RPCs atomicas).
 * Este service de browser mantem somente o aceite autenticado do motorista.
 */

import { logger } from "@/shared/utils/logger";
import { RIDE_STATE, RideStateMachine, type RideState } from "./RideStateMachine";
import {
  getActiveRideByDriverProfile,
  getDriverOfferCapabilities,
  getRideById,
} from "../services/mobility.queries";
import { MobilityRpcService } from "../services/MobilityRpcService";

interface AcceptResult {
  success: boolean;
  rideId?: string;
  error?: string;
  reason?:
    | "already_accepted"
    | "invalid_state"
    | "driver_busy"
    | "driver_not_eligible"
    | "expired"
    | "unknown";
}

function mapAtomicAcceptReason(reason?: string): AcceptResult["reason"] {
  switch (reason) {
    case "already_accepted":
    case "not_assigned":
    case "already_assigned":
      return "already_accepted";
    case "invalid_state":
      return "invalid_state";
    case "driver_busy":
      return "driver_busy";
    case "not_eligible":
    case "invalid_ride_mode":
      return "driver_not_eligible";
    case "expired":
      return "expired";
    default:
      return "unknown";
  }
}

export class RideDispatchService {
  /**
   * Motorista aceita corrida.
   *
   * Os prechecks abaixo existem somente para feedback rapido de UX.
   * A autoridade final pertence ao broker mobility-rpc, que chama
   * mobility_accept_ride_atomic. O backend revalida estado, elegibilidade,
   * disponibilidade, concorrencia e expiracao antes de efetivar o aceite.
   */
  static async acceptRide(
    rideId: string,
    driverProfileId: string,
  ): Promise<AcceptResult> {
    try {
      const ride = (await getRideById(rideId)) as {
        status?: string;
        driver_profile_id?: string | null;
        ride_mode?: string | null;
      } | null;

      if (!ride) {
        return { success: false, error: "Ride not found", reason: "unknown" };
      }

      const currentState = ride.status as RideState;

      if (!RideStateMachine.canDriverAccept(currentState)) {
        return {
          success: false,
          error: `Cannot accept ride in state: ${currentState}`,
          reason: "invalid_state",
        };
      }

      if (ride.driver_profile_id !== driverProfileId) {
        return {
          success: false,
          error: "Ride assigned to another driver",
          reason: "already_accepted",
        };
      }

      const rideMode = (ride.ride_mode || "ride") as "ride" | "motoboy";
      const capabilities = await getDriverOfferCapabilities(driverProfileId);
      if (!capabilities) {
        return {
          success: false,
          error: "Driver profile not found",
          reason: "driver_not_eligible",
        };
      }

      if (
        capabilities.is_suspended ||
        capabilities.is_verified !== true ||
        capabilities.subscription_active !== true ||
        (rideMode === "motoboy" && capabilities.can_do_delivery !== true) ||
        (rideMode === "ride" && capabilities.can_do_rides === false)
      ) {
        return {
          success: false,
          error: "Driver is not eligible for this ride",
          reason: "driver_not_eligible",
        };
      }

      const activeRide = await getActiveRideByDriverProfile(
        driverProfileId,
        [
          RIDE_STATE.DRIVER_ASSIGNED,
          RIDE_STATE.DRIVER_ACCEPTED,
          RIDE_STATE.DRIVER_ARRIVING,
          RIDE_STATE.PASSENGER_BOARDED,
          RIDE_STATE.IN_PROGRESS,
          RIDE_STATE.PICKUP_CONFIRMED,
          RIDE_STATE.IN_DELIVERY,
          RIDE_STATE.DELIVERED,
        ],
        rideId,
      );

      if (activeRide) {
        return {
          success: false,
          error: "Driver already has active ride",
          reason: "driver_busy",
        };
      }

      const result = await MobilityRpcService.acceptRideAtomic(
        rideId,
        driverProfileId,
        "exclusive_offer",
      );

      if (result.success !== true) {
        return {
          success: false,
          error: result.error || "Ride acceptance was not applied",
          reason: mapAtomicAcceptReason(result.reason),
        };
      }

      return { success: true, rideId };
    } catch (error) {
      logger.error("RideDispatchService.acceptRide", error as Error, {
        rideId,
        driverProfileId,
      });
      return {
        success: false,
        error: (error as Error).message,
        reason: "unknown",
      };
    }
  }
}
