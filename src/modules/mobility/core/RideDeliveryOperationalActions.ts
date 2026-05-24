import { logger } from "@/shared/utils/logger";
import { RIDE_STATE, type RideState } from "./RideStateMachine";
import { getRideById } from "../services/mobility.queries";
import { createRide, updateRide as updateRideMutation } from "../services/mobility.mutations";
import type { FailedDeliveryMetadata, ResolutionStatus } from "../types/FailedDeliveryMetadata";
import { OperationalVerificationService } from "../services/OperationalVerificationService";
import { MotoboyAuthorizationService } from "../services/MotoboyAuthorizationService";
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
import { logRideStateChange } from "./RideOperationalPostTransition";

type TransitionFn = (
  rideId: string,
  toState: RideState,
  actorProfileId: string,
  reason?: string,
) => Promise<TransitionResult>;

type RideDriverAssignment = {
  status?: string;
  driver_profile_id?: string | null;
  ride_mode?: string | null;
} | null;

const MOTOBOY_ONLY_ERROR = "Operao exclusiva de motoboy.";
const DELIVERY_NOT_FOUND_ERROR = "Entrega no encontrada.";

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

    const authorizationSourceId = input.authorizationSourceId ?? input.sourceId;
    const authResult = await MotoboyAuthorizationService.canRequestDelivery({
      sourceType: input.sourceType,
      sourceId: authorizationSourceId,
      locationId: input.pickupLocationId,
      userId: input.requestingUserId,
    });

    if (!authResult.allowed) {
      logger.warn("RideOperationalService.createDelivery - authorization denied", {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        authorizationSourceId,
        code: authResult.code,
        reason: authResult.reason,
      });
      return {
        success: false,
        error: authResult.reason || "No autorizado a solicitar entrega.",
      };
    }

    const requesterBlock = await ensureProfileCanRequest(input.passengerProfileId);
    if (requesterBlock) return requesterBlock;

    if (!hasValidRouteCoordinates(input)) {
      return { success: false, error: "Coordenadas so obrigatrias para calculo de preco." };
    }

    if (!input.recipientName?.trim()) {
      return { success: false, error: "Nome do destinatario  obrigatorio." };
    }

    if (input.suggestedPrice && input.suggestedPrice < 5.0) {
      return { success: false, error: "Preo minimo  R$ 5,00." };
    }

    const ride = (await createRide({
      passenger_profile_id: input.passengerProfileId,
      pickup_address_id: input.pickupAddressId,
      dropoff_address_id: input.dropoffAddressId,
      pickup_location_id: input.pickupLocationId,
      dropoff_location_id: input.dropoffLocationId,
      status: RIDE_STATE.REQUESTED,
      ride_mode: "motoboy",
      source_type: input.sourceType,
      source_id: input.sourceId || null,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone || null,
      delivery_notes: input.deliveryNotes || null,
      package_description: input.packageDescription || null,
      package_size: input.packageSize || "small",
      suggested_price: input.suggestedPrice,
      observation: input.observation || null,
      payment_method: input.paymentMethod || null,
      updated_at: new Date().toISOString(),
    })) as { id: string };

    logger.info("RideOperationalService.createDelivery - success", { rideId: ride.id });
    await logRideStateChange(ride.id, null, RIDE_STATE.REQUESTED, input.passengerProfileId, "Delivery created");

    await OperationalVerificationService.resolveDeliveryPINRequirement({
      senderProfileId: input.passengerProfileId,
      operationId: input.sourceId,
    }).then(async (pinRequirement) => {
      if (!pinRequirement.isRequired || !pinRequirement.requiredBy) return;

      const verificationResult = await OperationalVerificationService.createVerification({
        rideId: ride.id,
        verificationType: "pin",
        isRequired: true,
        requiredBy: pinRequirement.requiredBy,
      });

      if (verificationResult.success) {
        logger.info("RideOperationalService.createDelivery - PIN verification created", {
          rideId: ride.id,
          requiredBy: pinRequirement.requiredBy,
          reason: pinRequirement.reason,
        });
        return;
      }

      logger.error(
        "RideOperationalService.createDelivery - Failed to create PIN verification",
        new Error(verificationResult.error || "Unknown error"),
        { rideId: ride.id },
      );
    });

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

    await updateRideMutation(rideId, { pickup_confirmed_at: new Date().toISOString() });
    return await transitionTo(rideId, RIDE_STATE.PICKUP_CONFIRMED, driverProfileId, "Pickup confirmed");
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
  transitionTo: TransitionFn,
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

    const verification = await OperationalVerificationService.getVerificationStatus(rideId);
    if (verification?.is_required && verification.status !== "verified") {
      if (!pin) return { success: false, error: "PIN required for delivery confirmation" };

      const verifyResult = await OperationalVerificationService.verifyPIN({
        rideId,
        pin,
        verifiedBy: driverProfileId,
      });

      if (!verifyResult.success || !verifyResult.data?.verified) {
        return {
          success: false,
          error: verifyResult.data?.message || verifyResult.error || "Invalid PIN",
        };
      }
    }

    const updates: Record<string, unknown> = {
      delivered_at: new Date().toISOString(),
      proof_of_delivery: { ...proof, signed_at: new Date().toISOString() },
    };
    if (finalPrice !== undefined) updates.final_price = finalPrice;

    await updateRideMutation(rideId, updates);
    const deliveredResult = await transitionTo(rideId, RIDE_STATE.DELIVERED, driverProfileId, "Delivered");
    if (!deliveredResult.success) return deliveredResult;

    return await transitionTo(rideId, RIDE_STATE.COMPLETED, driverProfileId, "Delivery completed");
  } catch (error) {
    logger.error("RideOperationalService.confirmDelivery", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}

export async function failDeliveryOperation(
  rideId: string,
  driverProfileId: string,
  metadata: FailedDeliveryMetadata,
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
    if (!metadata.resolution_status) metadata.resolution_status = "pending";

    await updateRideMutation(rideId, {
      failed_delivery_at: new Date().toISOString(),
      failed_delivery_reason: metadata.failure_reason,
      failed_delivery_metadata: metadata,
    });

    return await transitionTo(
      rideId,
      RIDE_STATE.FAILED_DELIVERY,
      driverProfileId,
      metadata.failure_reason,
    );
  } catch (error) {
    logger.error("RideOperationalService.failDelivery", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}

export async function updateFailedDeliveryResolutionOperation(
  rideId: string,
  resolutionUpdate: {
    next_ride_id?: string;
    handoff_driver_profile_id?: string;
    manual_resolution_owner_profile_id?: string;
    resolution_status?: ResolutionStatus;
    resolved_at?: string;
    resolution_action_notes?: string;
  },
): Promise<TransitionResult> {
  try {
    const ride = (await getRideById(rideId)) as {
      status?: string;
      failed_delivery_metadata?: Record<string, unknown> | null;
    } | null;
    if (!ride) return { success: false, error: "Corrida no encontrada" };
    if (ride.status !== RIDE_STATE.FAILED_DELIVERY) {
      return { success: false, error: "Corrida no est em failed_delivery" };
    }
    if (!ride.failed_delivery_metadata) {
      return { success: false, error: "Metadata de falha no encontrada" };
    }

    validateFailedDeliveryResolution(resolutionUpdate);

    const updatedMetadata = {
      ...ride.failed_delivery_metadata,
      ...resolutionUpdate,
    };

    await updateRideMutation(rideId, { failed_delivery_metadata: updatedMetadata });
    logger.info("RideOperationalService.updateFailedDeliveryResolution - success", {
      rideId,
      resolution_status: resolutionUpdate.resolution_status,
    });
    return { success: true, rideId };
  } catch (error) {
    logger.error("RideOperationalService.updateFailedDeliveryResolution", error as Error, { rideId });
    return { success: false, error: (error as Error).message };
  }
}
