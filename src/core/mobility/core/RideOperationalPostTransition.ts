/**
 * Ride post-transition side effects.
 */

import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";
import { mobilityAuditService } from "../services/MobilityAuditService";
import { RIDE_STATE, RideStateMachine, type RideState } from "./RideStateMachine";
import type { RidePostTransitionSnapshot } from "./RideOperationalTypes";

export async function handleRidePostTransition(
  rideId: string,
  newState: RideState,
  ride: RidePostTransitionSnapshot,
): Promise<void> {
  try {
    if (RideStateMachine.isFinalState(newState) && ride.driver_profile_id) {
      const { DriverAvailabilityService } = await import("@/core/mobility/services/DriverAvailabilityService");
      await DriverAvailabilityService.releaseBusy(ride.driver_profile_id, rideId);
    }

    const passengerProfileId = typeof ride?.passenger_profile_id === "string" ? ride.passenger_profile_id : null;
    const driverProfileId = typeof ride?.driver_profile_id === "string" ? ride.driver_profile_id : null;
    const isDeliveryMode = ride?.ride_mode === "motoboy";
    const { NotificationService } = await import("@/core/notifications/services/NotificationService");
    const [passengerUserId, driverUserId] = await Promise.all([
      resolveUserIdFromProfileId(passengerProfileId),
      resolveUserIdFromProfileId(driverProfileId),
    ]);
    const passengerTrackingUrl = mobilityRoutes.passageiro.buscando(rideId);

    const notify = async (
      audience: "passenger" | "driver",
      userId: string | null,
      type: "info" | "success" | "warning" | "error",
      title: string,
      message: string,
      event: string,
      actionUrl: string,
    ) => {
      if (!userId) return;
      try {
        await NotificationService.createNotification({
          user_id: userId,
          type,
          category: "transactional",
          title,
          message,
          metadata: {
            ride_id: rideId,
            state: newState,
            event,
            audience,
            ride_mode: isDeliveryMode ? "motoboy" : "ride",
          },
          action_url: actionUrl,
          action_label: "Ver detalhes",
        });
      } catch (error) {
        logger.warn("RideOperationalService.handlePostTransition.notification", {
          userId,
          rideId,
          state: newState,
          error: (error as Error).message,
        });
      }
    };

    if (newState === RIDE_STATE.DRIVER_ACCEPTED) {
      await notify("passenger", passengerUserId, "success", "Motorista confirmou a corrida", "Seu motorista confirmou o aceite e vai iniciar em breve.", "ride_driver_accepted", passengerTrackingUrl);
      return;
    }

    if (newState === RIDE_STATE.IN_PROGRESS) {
      await notify("passenger", passengerUserId, "info", "Corrida iniciada", "Sua corrida foi iniciada.", "ride_in_progress", passengerTrackingUrl);
      return;
    }

    if (newState === RIDE_STATE.IN_DELIVERY) {
      await notify("passenger", passengerUserId, "info", "Entrega em rota", "Seu motoboy iniciou a rota.", "delivery_in_route", passengerTrackingUrl);
      return;
    }

    if (newState === RIDE_STATE.DELIVERED || newState === RIDE_STATE.COMPLETED) {
      await notify("passenger", passengerUserId, "success", newState === RIDE_STATE.DELIVERED ? "Entrega concluida" : "Corrida concluida", "Operacao finalizada com sucesso.", newState === RIDE_STATE.DELIVERED ? "delivery_completed" : "ride_completed", passengerTrackingUrl);
      await notify("driver", driverUserId, "success", "Operacao concluida", "A operacao foi finalizada e registrada no historico.", "operation_completed", isDeliveryMode ? mobilityRoutes.motoboy.entregas : mobilityRoutes.motorista.corridas);
      return;
    }

    if (newState === RIDE_STATE.CANCELLED_BY_DRIVER || newState === RIDE_STATE.CANCELLED_BY_PASSENGER) {
      await notify("passenger", passengerUserId, "warning", "Corrida cancelada", "A corrida foi cancelada.", newState === RIDE_STATE.CANCELLED_BY_DRIVER ? "ride_canceled_by_driver" : "ride_canceled_by_passenger", passengerTrackingUrl);
      await notify("driver", driverUserId, "warning", "Corrida cancelada", "A corrida foi cancelada.", newState === RIDE_STATE.CANCELLED_BY_DRIVER ? "ride_canceled_by_driver" : "ride_canceled_by_passenger", isDeliveryMode ? mobilityRoutes.motoboy.entregas : mobilityRoutes.motorista.corridas);
    }
  } catch (error) {
    logger.error("RideOperationalService.handlePostTransition", error as Error, { rideId, newState });
  }
}

async function resolveUserIdFromProfileId(profileId: string | null): Promise<string | null> {
  if (!profileId) return null;

  try {
    const profile = await profileService.getProfileById(profileId);
    return typeof profile?.user_id === "string" ? profile.user_id : null;
  } catch (error) {
    logger.warn("RideOperationalService.resolveUserIdFromProfileId", {
      profileId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function logRideStateChange(
  rideId: string,
  fromState: RideState | null,
  toState: RideState,
  actor: string,
  reason?: string,
): Promise<void> {
  try {
    await mobilityAuditService.logRideStateChange({
      rideId,
      fromState,
      toState,
      changedBy: actor,
      reason: reason || "",
    });

    if (fromState) {
      RideStateMachine.logTransition(rideId, fromState, toState, actor, reason);
    }
  } catch (error) {
    logger.error("RideOperationalService.logStateChange", error as Error, { rideId });
  }
}
