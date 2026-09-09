/**
 * RIDE DISPATCH SERVICE - Atribuicao e Aceite de Corridas
 *
 * Gerencia:
 * - Busca de motorista elegivel
 * - Atribuicao de oferta
 * - Aceite com lock/garantia de unicidade
 * - Expiracao da solicitacao
 */

import { logger } from "@/shared/utils/logger";
import { RIDE_STATE, RideStateMachine, type RideState } from "./RideStateMachine";
import {
  getActiveRideByDriverProfile,
  getDriverOfferCapabilities,
  getRideById,
} from "../services/mobility.queries";
import { updateRideWithGuards } from "../services/mobility.mutations";
import { DriverAvailabilityService } from "../services/DriverAvailabilityService";
import { MobilityRpcService } from "../services/MobilityRpcService";
import { mobilityAuditService } from "../services/MobilityAuditService";

const CONFIG = {
  REQUEST_EXPIRATION_MINUTES: 15,
  MAX_SEARCH_RADIUS_KM: 10,
};

interface DriverEligibility {
  profileId: string;
  distance: number;
  isAvailable: boolean;
  hasActiveRide: boolean;
  rating: number;
}

interface DispatchResult {
  success: boolean;
  rideId?: string;
  driverProfileId?: string;
  error?: string;
}

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

interface ProviderErrorShape {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
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
    default:
      return "unknown";
  }
}

export class RideDispatchService {
  /**
   * Busca motoristas elegiveis para uma corrida.
   * DriverAvailabilityService continua sendo o SSOT de descoberta; a autoridade
   * final de atribuicao/aceite e revalidada no command server-side.
   */
  static async findEligibleDrivers(
    rideId: string,
    originLat: number,
    originLng: number,
    maxRadius: number = CONFIG.MAX_SEARCH_RADIUS_KM,
    rideMode: "ride" | "motoboy" = "ride",
    pickupLocationId?: string | null,
  ): Promise<DriverEligibility[]> {
    try {
      const availableDrivers = await DriverAvailabilityService.findAvailableDrivers(
        originLat,
        originLng,
        maxRadius,
        rideMode,
        pickupLocationId,
      );

      return availableDrivers.map((driver) => ({
        profileId: driver.profileId,
        distance: driver.distance,
        isAvailable: true,
        hasActiveRide: false,
        rating: driver.rating,
      }));
    } catch (error) {
      logger.error("RideDispatchService.findEligibleDrivers", error as Error, { rideId });
      return [];
    }
  }

  /**
   * Atribui corrida a um motorista.
   *
   * Este caminho ainda existe para o AutoDispatchService browser legado e sera
   * migrado para o command atomico de oferta antes da revogacao global de
   * UPDATE em ride_requests. Nao remover enquanto houver caller vivo.
   */
  static async assignDriver(
    rideId: string,
    driverProfileId: string,
    currentState: RideState,
  ): Promise<DispatchResult> {
    try {
      if (!RideStateMachine.canTransition(currentState, RIDE_STATE.DRIVER_ASSIGNED)) {
        return {
          success: false,
          error: `Cannot assign driver from state: ${currentState}`,
        };
      }

      logger.info("RideDispatchService.assignDriver - checking availability", {
        rideId,
        driverProfileId,
      });

      const availability = await DriverAvailabilityService.getStatus(driverProfileId);
      const availError = null;
      const providerError =
        availError && typeof availError === "object"
          ? (availError as ProviderErrorShape)
          : undefined;

      if (providerError) {
        logger.warn("RideDispatchService.assignDriver - provider error", {
          rideId,
          driverProfileId,
          errorCode: providerError.code,
          errorMessage: providerError.message,
        });
      }

      if (!availability?.isOnline || !availability?.isAvailable) {
        return { success: false, error: "Driver not available" };
      }

      const activeRide = await getActiveRideByDriverProfile(driverProfileId, [
        RIDE_STATE.DRIVER_ASSIGNED,
        RIDE_STATE.DRIVER_ACCEPTED,
        RIDE_STATE.DRIVER_ARRIVING,
        RIDE_STATE.PASSENGER_BOARDED,
        RIDE_STATE.IN_PROGRESS,
        RIDE_STATE.PICKUP_CONFIRMED,
        RIDE_STATE.IN_DELIVERY,
        RIDE_STATE.DELIVERED,
      ]);

      if (activeRide) {
        return { success: false, error: "Driver already has active ride" };
      }

      const assigned = await updateRideWithGuards(
        rideId,
        {
          driver_profile_id: driverProfileId,
          status: RIDE_STATE.DRIVER_ASSIGNED,
          updated_at: new Date().toISOString(),
        },
        { statusEq: currentState },
      );

      if (!assigned) {
        return { success: false, error: "Ride state changed during assignment" };
      }

      await this.logStateChange(
        rideId,
        currentState,
        RIDE_STATE.DRIVER_ASSIGNED,
        "system",
        "Driver assigned by dispatch",
      );

      return { success: true, rideId, driverProfileId };
    } catch (error) {
      logger.error("RideDispatchService.assignDriver", error as Error, {
        rideId,
        driverProfileId,
      });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motorista aceita corrida.
   *
   * Prechecks client-side melhoram UX, mas nao concedem autoridade. O commit da
   * operacao pertence a accept_ride_atomic, invocado exclusivamente pelo broker
   * autenticado mobility-rpc. Estado, disponibilidade e auditoria sao fechados
   * na mesma transacao server-side.
   */
  static async acceptRide(
    rideId: string,
    driverProfileId: string,
  ): Promise<AcceptResult> {
    try {
      const ride = (await getRideById(rideId)) as {
        status?: string;
        driver_profile_id?: string | null;
        created_at?: string;
        ride_mode?: string | null;
      } | null;

      if (!ride) {
        return { success: false, error: "Ride not found", reason: "unknown" };
      }

      const currentState = ride.status as RideState;
      const createdAt = new Date(ride.created_at || new Date().toISOString());
      const minutesElapsed = (Date.now() - createdAt.getTime()) / 60_000;

      if (minutesElapsed > CONFIG.REQUEST_EXPIRATION_MINUTES) {
        await this.expireRide(rideId, currentState);
        return { success: false, error: "Ride expired", reason: "expired" };
      }

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

  /** Expira corrida por timeout. Ainda migrara para command dedicado. */
  static async expireRide(rideId: string, currentState: RideState): Promise<void> {
    try {
      if (!RideStateMachine.canTransition(currentState, RIDE_STATE.EXPIRED)) return;

      const expired = await updateRideWithGuards(
        rideId,
        {
          status: RIDE_STATE.EXPIRED,
          updated_at: new Date().toISOString(),
        },
        { statusEq: currentState },
      );

      if (!expired) return;

      await this.logStateChange(
        rideId,
        currentState,
        RIDE_STATE.EXPIRED,
        "system",
        "Ride expired - no driver accepted",
      );
    } catch (error) {
      logger.error("RideDispatchService.expireRide", error as Error, { rideId });
    }
  }

  private static async logStateChange(
    rideId: string,
    fromState: RideState,
    toState: RideState,
    actor: string,
    reason: string,
  ): Promise<void> {
    try {
      await mobilityAuditService.logRideStateChange({
        rideId,
        fromState,
        toState,
        changedBy: actor,
        reason,
      });
      RideStateMachine.logTransition(rideId, fromState, toState, actor, reason);
    } catch (error) {
      logger.error("RideDispatchService.logStateChange", error as Error, { rideId });
    }
  }
}
