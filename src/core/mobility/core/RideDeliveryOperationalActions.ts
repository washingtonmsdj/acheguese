import { logger } from "@/shared/utils/logger";
import { RIDE_STATE, type RideState } from "./RideStateMachine";
import { getRideById } from "../services/mobility.queries";
import { MobilityRpcService } from "../services/MobilityRpcService";
import type {
  FailedDeliveryMetadata,
  FailedDeliveryResolutionUpdate,
  FailedDeliverySnapshotInput,
} from "../types/FailedDeliveryMetadata";
import { OperationalVerificationService } from "../services/OperationalVerificationService";
import type {
  CreateDeliveryInput,
  TransitionResult,
} from "./RideOperationalTypes";
import {
  ensureMotoboyCanOperate,
  ensureProfileCanRequest,
  hasValidRouteCoordinates,
  validateFailedDeliveryResolution,
  validateFailedDeliverySnapshot,
} from "./RideOperationalGuards";

/**
 * Delivery commands that still belong to the generic state-transition path.
 * confirm_delivery is intentionally excluded: G70 closes delivered+completed
 * through one specialized server command so callers cannot split custody close.
 */
export type DeliveryTransitionCommand =
  | { type: "confirm_pickup" }
  | { type: "fail_delivery"; metadata: FailedDeliverySnapshotInput };

type TransitionFn = (
  rideId: string,
  toState: RideState,
  actorProfileId: string,
  reason?: string,
  deliveryCommand?: DeliveryTransitionCommand,
) => Promise<TransitionResult>;

type RideDriverAssignment = {
  status?: string;
  driver_profile_id?: string | null;
  ride_mode?: string | null;
} | null;

const MOTOBOY_ONLY_ERROR = "Operacao exclusiva de motoboy.";
const DELIVERY_NOT_FOUND_ERROR = "Entrega nao encontrada.";

function validateRideDriverOperation(
  ride: RideDriverAssignment,
  driverProfileId: string,
  unauthorizedError: string,
): TransitionResult | null {
  if (!ride) return { success: false, error: DELIVERY_NOT_FOUND_ERROR };
  if (ride.ride_mode !== "motoboy") return { success: false, error: MOTOBOY_ONLY_ERROR };
  if (ride.driver_profile_id !== driverProfileId) {
    return { success: false, error: unauthorizedError };
  }
  return null;
}

export async function createDeliveryOperation(
  input: CreateDeliveryInput,
  transitionTo: TransitionFn,
): Promise<TransitionResult> {
  try {
    if (
      !input.pickupAddressId?.trim() ||
      !input.dropoffAddressId?.trim() ||
      !input.pickupLocationId?.trim() ||
      !input.dropoffLocationId?.trim()
    ) {
      return {
        success: false,
        error:
          "Endereco de coleta e entrega sao obrigatorios e precisam estar reconciliados com territorios validos.",
      };
    }

    const requesterBlock = await ensureProfileCanRequest(input.passengerProfileId);
    if (requesterBlock) return requesterBlock;

    if (!hasValidRouteCoordinates(input)) {
      return { success: false, error: "Coordenadas sao obrigatorias para calculo de preco." };
    }

    if (!input.recipientName?.trim()) {
      return { success: false, error: "Nome do destinatario e obrigatorio." };
    }

    if (input.suggestedPrice && input.suggestedPrice < 5.0) {
      return { success: false, error: "Preco minimo e R$ 5,00." };
    }

    const creation = await MobilityRpcService.createDelivery(input);
    if (creation.success !== true || !creation.ride_id) {
      throw new Error(
        `Delivery creation was not applied${creation.reason ? `: ${creation.reason}` : ""}`,
      );
    }

    const ride = { id: creation.ride_id };
    logger.info("RideOperationalService.createDelivery - success", { rideId: ride.id });

    await transitionTo(ride.id, RIDE_STATE.SEARCHING_DRIVER, "system");
    return { success: true, rideId: ride.id, newState: RIDE_STATE.SEARCHING_DRIVER };
  } catch (error) {
    logger.error("RideOperationalService.createDelivery", error as Error);
    return { success: false, error: (error as Error).message };
  }
}

export async function confirmPickupOperation(
  rideId: string,
  driverProfileId: string,
  transitionTo: TransitionFn,
): Promise<TransitionResult> {
  try {
    const ride = (await getRideById(rideId)) as RideDriverAssignment;
    const rideValidation = validateRideDriverOperation(
      ride,
      driverProfileId,
      "Apenas o motoboy atribuido pode confirmar coleta.",
    );
    if (rideValidation) return rideValidation;

    const operatorBlock = await ensureMotoboyCanOperate(driverProfileId, rideId);
    if (operatorBlock) return operatorBlock;

    return await transitionTo(
      rideId,
      RIDE_STATE.PICKUP_CONFIRMED,
      driverProfileId,
      "Pickup confirmed",
      { type: "confirm_pickup" },
    );
  } catch (error) {
    logger.error("RideOperationalService.confirmPickup", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}

export async function startDeliveryOperation(
  rideId: string,
  driverProfileId: string,
  transitionTo: TransitionFn,
): Promise<TransitionResult> {
  try {
    const ride = (await getRideById(rideId)) as RideDriverAssignment;
    const rideValidation = validateRideDriverOperation(
      ride,
      driverProfileId,
      "Apenas o motoboy atribuido pode iniciar entrega.",
    );
    if (rideValidation) return rideValidation;

    const operatorBlock = await ensureMotoboyCanOperate(driverProfileId, rideId);
    if (operatorBlock) return operatorBlock;

    return await transitionTo(rideId, RIDE_STATE.IN_DELIVERY, driverProfileId, "Delivery started");
  } catch (error) {
    logger.error("RideOperationalService.startDelivery", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}

export async function confirmDeliveryOperation(
  rideId: string,
  driverProfileId: string,
  proof: {
    photo_url?: string;
    code?: string;
    observation?: string;
  },
  finalPrice: number | undefined,
  pin: string | undefined,
): Promise<TransitionResult> {
  try {
    const ride = (await getRideById(rideId)) as RideDriverAssignment;
    const rideValidation = validateRideDriverOperation(
      ride,
      driverProfileId,
      "Apenas o motoboy atribuido pode confirmar entrega.",
    );
    if (rideValidation) return rideValidation;

    const operatorBlock = await ensureMotoboyCanOperate(driverProfileId, rideId);
    if (operatorBlock) return operatorBlock;

    const verificationResult =
      await OperationalVerificationService.getVerificationStatusResult(rideId);
    if (!verificationResult.success) {
      return {
        success: false,
        error: "Delivery verification state is unavailable",
      };
    }

    const verification = verificationResult.data ?? null;
    if (verification?.is_required && verification.status !== "verified") {
      if (!pin) return { success: false, error: "PIN required for delivery confirmation" };

      const verifyResult = await OperationalVerificationService.verifyPIN({
        rideId,
        pin,
      });

      if (!verifyResult.success || !verifyResult.data?.verified) {
        return {
          success: false,
          error: verifyResult.data?.message || verifyResult.error || "Invalid PIN",
        };
      }
    }

    const transition = await MobilityRpcService.transitionDeliveryState({
      rideId,
      expectedFromState: RIDE_STATE.IN_DELIVERY,
      command: "confirm_delivery",
      actorProfileId: driverProfileId,
      reason: "Delivery confirmed and completed",
      proofOfDelivery: proof,
      finalPrice,
    });

    if (!transition.updated) {
      return {
        success: false,
        error: "Delivery completion was not applied by the backend.",
      };
    }

    if (
      transition.from_state !== RIDE_STATE.IN_DELIVERY ||
      transition.to_state !== RIDE_STATE.COMPLETED
    ) {
      return {
        success: false,
        error: `Delivery completion returned unexpected state: ${transition.to_state}`,
      };
    }

    return {
      success: true,
      rideId,
      fromState: RIDE_STATE.IN_DELIVERY,
      toState: RIDE_STATE.COMPLETED,
      newState: RIDE_STATE.COMPLETED,
    };
  } catch (error) {
    logger.error("RideOperationalService.confirmDelivery", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}

export async function failDeliveryOperation(
  rideId: string,
  driverProfileId: string,
  metadata: FailedDeliveryMetadata | FailedDeliverySnapshotInput,
  transitionTo: TransitionFn,
): Promise<TransitionResult> {
  try {
    const ride = (await getRideById(rideId)) as RideDriverAssignment;
    const rideValidation = validateRideDriverOperation(
      ride,
      driverProfileId,
      "Apenas o motoboy atribuido pode registrar falha.",
    );
    if (rideValidation) return rideValidation;

    const operatorBlock = await ensureMotoboyCanOperate(driverProfileId, rideId);
    if (operatorBlock) return operatorBlock;

    validateFailedDeliverySnapshot(metadata);

    const snapshot: FailedDeliverySnapshotInput = {
      failure_reason: metadata.failure_reason,
      item_destination: metadata.item_destination,
      item_current_holder: "driver",
      timestamp: metadata.timestamp,
      resolution_status: "pending",
      resolution_notes: metadata.resolution_notes,
      failed_at_location: metadata.failed_at_location,
      photos: metadata.photos,
      attempt_number: metadata.attempt_number,
      attempted_delivery_count: metadata.attempted_delivery_count,
    };

    return await transitionTo(
      rideId,
      RIDE_STATE.FAILED_DELIVERY,
      driverProfileId,
      snapshot.failure_reason,
      {
        type: "fail_delivery",
        metadata: snapshot,
      },
    );
  } catch (error) {
    logger.error("RideOperationalService.failDelivery", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}

export async function updateFailedDeliveryResolutionOperation(
  rideId: string,
  resolutionUpdate: FailedDeliveryResolutionUpdate,
): Promise<TransitionResult> {
  try {
    const ride = (await getRideById(rideId)) as {
      status?: string;
      failed_delivery_metadata?: Record<string, unknown> | null;
    } | null;
    if (!ride) return { success: false, error: "Corrida nao encontrada" };
    if (ride.status !== RIDE_STATE.FAILED_DELIVERY) {
      return { success: false, error: "Corrida nao esta em failed_delivery" };
    }
    if (!ride.failed_delivery_metadata) {
      return { success: false, error: "Metadata de falha nao encontrada" };
    }

    validateFailedDeliveryResolution(resolutionUpdate);

    const result = await MobilityRpcService.updateFailedDeliveryResolution({
      rideId,
      resolutionUpdate,
    });

    if (result.updated !== true) {
      return {
        success: false,
        error: "Resolucao da falha nao foi aplicada pelo backend.",
      };
    }

    logger.info("RideOperationalService.updateFailedDeliveryResolution - success", {
      rideId,
      resolution_status: result.resolution_status ?? resolutionUpdate.resolution_status,
      retry_reopened: result.retry_reopened === true,
      status: result.status ?? null,
    });

    return {
      success: true,
      rideId,
      retryReopened: result.retry_reopened === true,
      newState: result.retry_reopened === true ? RIDE_STATE.IN_DELIVERY : undefined,
      fromState: result.retry_reopened === true ? RIDE_STATE.FAILED_DELIVERY : undefined,
      toState: result.retry_reopened === true ? RIDE_STATE.IN_DELIVERY : undefined,
    };
  } catch (error) {
    logger.error("RideOperationalService.updateFailedDeliveryResolution", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}