/**
 * RIDE OPERATIONAL SERVICE - Orquestrador do Motor Operacional
 *
 * Centraliza todas as operacoes criticas da corrida:
 * - Criacao com state machine
 * - Transicoes de estado validadas
 * - Cancelamentos
 * - Completar corrida
 * - Integracao com dispatch
 */

import { logger } from "@/shared/utils/logger";
import { RIDE_STATE, RideStateMachine, type RideState } from "./RideStateMachine";
import { RideDispatchService } from "./RideDispatchService";
import { getRideById } from "../services/mobility.queries";
import { MobilityRpcService } from "../services/MobilityRpcService";
import type { FailedDeliveryMetadata, FailedDeliveryResolutionUpdate } from "../types/FailedDeliveryMetadata";
import { OperationalVerificationService } from "../services/OperationalVerificationService";
import { mobilityRolloutService } from "../services/MobilityRolloutService";
import { OrderDeliveryLinkService } from "@/core/mobility/delivery/services/OrderDeliveryLinkService";
import type {
  CancelInput,
  CreateDeliveryInput,
  CreateRideInput,
  ProviderErrorShape,
  TransitionResult,
} from "./RideOperationalTypes";
import {
  ensureProfileCanRequest,
  hasValidRouteCoordinates,
} from "./RideOperationalGuards";
import {
  confirmDeliveryOperation,
  confirmPickupOperation,
  createDeliveryOperation,
  failDeliveryOperation,
  startDeliveryOperation,
  updateFailedDeliveryResolutionOperation,
  type DeliveryTransitionCommand,
} from "./RideDeliveryOperationalActions";
export type { CreateDeliveryInput, CreateRideInput } from "./RideOperationalTypes";

export class RideOperationalService {
  static async createRide(input: CreateRideInput): Promise<TransitionResult> {
    try {
      const initialState = RIDE_STATE.REQUESTED;
      void initialState;

      const requesterBlock = await ensureProfileCanRequest(input.passengerProfileId);
      if (requesterBlock) return requesterBlock;

      if (
        !input.pickupAddressId?.trim() ||
        !input.dropoffAddressId?.trim() ||
        !input.pickupLocationId?.trim() ||
        !input.dropoffLocationId?.trim()
      ) {
        return {
          success: false,
          error:
            "Endereco de origem e destino sao obrigatorios e precisam estar reconciliados com territorios validos.",
        };
      }

      if (!hasValidRouteCoordinates(input)) {
        return {
          success: false,
          error: 'Coordenadas sao obrigatorias para calculo de preco oficial. Selecione enderecos validos no mapa.',
        };
      }

      if (input.suggestedPrice && input.suggestedPrice < 5.00) {
        return {
          success: false,
          error: 'Preco minimo e R$ 5,00 conforme regras de pricing.',
        };
      }

      const creation = await MobilityRpcService.createRide(input);
      if (creation.success !== true || !creation.ride_id) {
        throw new Error(
          `Ride creation was not applied${creation.reason ? `: ${creation.reason}` : ""}`,
        );
      }

      const ride = { id: creation.ride_id };
      logger.info('RideOperationalService.createRide - success', { rideId: ride.id });

      await this.transitionTo(ride.id, RIDE_STATE.SEARCHING_DRIVER, 'system');

      logger.info('RideOperationalService.createRide - Auto-dispatch edge function will be triggered', {
        rideId: ride.id,
      });

      return { success: true, rideId: ride.id, newState: RIDE_STATE.SEARCHING_DRIVER };
    } catch (error) {
      logger.error('RideOperationalService.createRide', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  static async transitionTo(
    rideId: string,
    toState: RideState,
    actor: string,
    reason?: string,
    pin?: string,
    deliveryCommand?: DeliveryTransitionCommand,
  ): Promise<TransitionResult> {
    try {
      logger.info('RideOperationalService.transitionTo - BEFORE .single()', {
        method: 'transitionTo',
        step: 'fetch_current_state',
        rideId,
        toState,
        actor,
      });

      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
      } | null;

      logger.info('RideOperationalService.transitionTo - AFTER .single()', {
        method: 'transitionTo',
        step: 'fetch_current_state',
        rideId,
        toState,
        actor,
        rowsReturned: ride ? 1 : 0,
        hasData: !!ride,
        hasError: false,
      });

      if (!ride) {
        return {
          success: false,
          error: 'Ride not found',
        };
      }

      const fromState = ride.status as RideState;

      if (toState === RIDE_STATE.PASSENGER_BOARDED) {
        const verificationResult =
          await OperationalVerificationService.getVerificationStatusResult(rideId);
        if (!verificationResult.success) {
          return {
            success: false,
            error: "Boarding verification state is unavailable",
          };
        }

        const verification = verificationResult.data ?? null;
        if (verification?.is_required && verification.status !== 'verified') {
          if (pin) {
            const verifyResult = await OperationalVerificationService.verifyPIN({
              rideId,
              pin,
            });

            if (!verifyResult.success || !verifyResult.data?.verified) {
              return {
                success: false,
                error: verifyResult.data?.message || verifyResult.error || 'Invalid PIN',
              };
            }
          } else {
            return {
              success: false,
              error: 'PIN verification required before boarding',
            };
          }
        }
      }

      RideStateMachine.assertCanTransition(fromState, toState);

      if (deliveryCommand) {
        const expectedDeliveryState = {
          confirm_pickup: RIDE_STATE.PICKUP_CONFIRMED,
          fail_delivery: RIDE_STATE.FAILED_DELIVERY,
        }[deliveryCommand.type];

        if (expectedDeliveryState !== toState) {
          throw new Error(
            `Delivery command ${deliveryCommand.type} does not match target state ${toState}`,
          );
        }
      }

      const transition = deliveryCommand
        ? await MobilityRpcService.transitionDeliveryState({
            rideId,
            expectedFromState: fromState,
            command: deliveryCommand.type,
            actorProfileId: actor,
            reason,
            failedDeliveryMetadata:
              deliveryCommand.type === "fail_delivery"
                ? deliveryCommand.metadata
                : undefined,
          })
        : await MobilityRpcService.transitionRideState({
            rideId,
            expectedFromState: fromState,
            toState,
            actorProfileId: actor,
            reason,
          });

      if (!transition.updated) {
        throw new Error('Ride state transition was not applied');
      }
      if (transition.to_state !== toState) {
        throw new Error(
          `Ride transition returned unexpected state: ${transition.to_state}`,
        );
      }

      await OrderDeliveryLinkService.syncRideStatusToOrder({
        rideId,
        rideStatus: toState,
        actorProfileId: actor,
        reason,
      });

      return {
        success: true,
        rideId,
        fromState,
        toState,
        newState: toState,
      };
    } catch (error) {
      const providerError =
        error && typeof error === "object" ? (error as ProviderErrorShape) : undefined;
      const errorDetails = {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack,
        code: providerError?.code,
        details: providerError?.details,
        hint: providerError?.hint,
      };

      logger.error('RideOperationalService.transitionTo', error as Error, {
        rideId,
        toState,
        errorDetails,
      });

      return {
        success: false,
        error: (error as Error).message || 'Unknown error during transition',
      };
    }
  }

  static async cancelRide(input: CancelInput): Promise<TransitionResult> {
    try {
      logger.info('RideOperationalService.cancelRide - iniciando', input);

      const ride = await getRideById(input.rideId) as {
        status?: string;
        passenger_profile_id?: string | null;
        driver_profile_id?: string | null;
      } | null;

      if (!ride) {
        logger.warn('RideOperationalService.cancelRide - ride not found', { rideId: input.rideId });
        return {
          success: false,
          error: 'Ride not found',
        };
      }

      const currentState = ride.status as RideState;

      logger.info('RideOperationalService.cancelRide - estado atual', {
        rideId: input.rideId,
        currentState,
        cancelledBy: input.cancelledBy,
        profileId: input.profileId,
        passengerId: ride.passenger_profile_id,
        driverProfileId: ride.driver_profile_id
      });

      const requestedCancelledState =
        input.cancelledBy === 'passenger'
          ? RIDE_STATE.CANCELLED_BY_PASSENGER
          : RIDE_STATE.CANCELLED_BY_DRIVER;

      if (currentState === RIDE_STATE.CANCELLED_BY_PASSENGER ||
          currentState === RIDE_STATE.CANCELLED_BY_DRIVER) {
        if (currentState !== requestedCancelledState) {
          logger.warn('Ride already cancelled by another actor', {
            rideId: input.rideId,
            currentState,
            cancelledBy: input.cancelledBy
          });
          return {
            success: false,
            rideId: input.rideId,
            fromState: currentState,
            toState: currentState,
            error: `Ride already cancelled: ${currentState}`,
          };
        }

        logger.info('Ride already cancelled (idempotent)', {
          rideId: input.rideId,
          currentState,
          cancelledBy: input.cancelledBy
        });
        return {
          success: true,
          rideId: input.rideId,
          fromState: currentState,
          toState: currentState,
        };
      }

      const isCancellable = RideStateMachine.isCancellable(currentState);
      logger.info('RideOperationalService.cancelRide - verificando se e cancelavel', {
        rideId: input.rideId,
        currentState,
        isCancellable
      });

      if (!isCancellable) {
        logger.warn('RideOperationalService.cancelRide - estado nao cancelavel', {
          rideId: input.rideId,
          currentState
        });
        return {
          success: false,
          error: `Cannot cancel ride in state: ${currentState}`,
        };
      }

      if (input.cancelledBy === 'passenger') {
        if (ride.passenger_profile_id !== input.profileId) {
          logger.warn('RideOperationalService.cancelRide - perfil nao e o passageiro', {
            rideId: input.rideId,
            profileId: input.profileId,
            passengerId: ride.passenger_profile_id
          });
          return {
            success: false,
            error: 'Only passenger can cancel',
          };
        }

        const canPassengerCancel = RideStateMachine.canPassengerCancel(currentState);
        logger.info('RideOperationalService.cancelRide - verificando se passageiro pode cancelar', {
          rideId: input.rideId,
          currentState,
          canPassengerCancel
        });

        if (!canPassengerCancel) {
          logger.warn('RideOperationalService.cancelRide - passageiro nao pode cancelar neste estado', {
            rideId: input.rideId,
            currentState
          });
          return {
            success: false,
            error: 'Passenger cannot cancel at this stage',
          };
        }
      } else if (input.cancelledBy === 'driver') {
        if (ride.driver_profile_id !== input.profileId) {
          return {
            success: false,
            error: 'Only assigned driver can cancel',
          };
        }
        if (!RideStateMachine.canDriverCancel(currentState)) {
          return {
            success: false,
            error: 'Driver cannot cancel at this stage',
          };
        }
      }

      let newState: RideState;

      if (input.cancelledBy === 'passenger') {
        newState = requestedCancelledState;
      } else {
        if (currentState === RIDE_STATE.IN_DELIVERY) {
          return {
            success: false,
            error: 'Cannot cancel during delivery. Use failDelivery() instead to register operational failure.',
          };
        }
        newState = requestedCancelledState;
      }

      const result = await this.transitionTo(
        input.rideId,
        newState,
        input.profileId,
        input.reason || 'Cancelled'
      );

      return result;
    } catch (error) {
      logger.error('RideOperationalService.cancelRide', error as Error, input);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  static async completeRide(
    rideId: string,
    driverProfileId: string,
    finalPrice?: number
  ): Promise<TransitionResult> {
    try {
      void finalPrice;
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
      } | null;

      if (!ride) {
        return {
          success: false,
          error: 'Ride not found',
        };
      }

      const currentState = ride.status as RideState;

      if (currentState !== RIDE_STATE.IN_PROGRESS) {
        return {
          success: false,
          error: `Cannot complete ride in state: ${currentState}`,
        };
      }

      if (ride.driver_profile_id !== driverProfileId) {
        return {
          success: false,
          error: 'Only assigned driver can complete ride',
        };
      }

      return await this.transitionTo(
        rideId,
        RIDE_STATE.COMPLETED,
        driverProfileId,
        'Ride completed successfully'
      );
    } catch (error) {
      logger.error('RideOperationalService.completeRide', error as Error, { rideId });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  static async acceptRide(
    rideId: string,
    driverProfileId: string
  ): Promise<TransitionResult> {
    const result = await RideDispatchService.acceptRide(rideId, driverProfileId);

    if (result.success && result.rideId) {
      await OrderDeliveryLinkService.syncRideStatusToOrder({
        rideId: result.rideId,
        rideStatus: RIDE_STATE.DRIVER_ACCEPTED,
        actorProfileId: driverProfileId,
        reason: "Motoboy aceitou a entrega",
      });
    }

    return {
      success: result.success,
      rideId: result.rideId,
      newState: result.success ? RIDE_STATE.DRIVER_ACCEPTED : undefined,
      error: result.error,
    };
  }

  static async createDelivery(input: CreateDeliveryInput): Promise<TransitionResult> {
    return createDeliveryOperation(input, (rideId, toState, actorProfileId, reason) =>
      this.transitionTo(rideId, toState, actorProfileId, reason),
    );
  }

  static async confirmPickup(
    rideId: string,
    driverProfileId: string
  ): Promise<TransitionResult> {
    return confirmPickupOperation(
      rideId,
      driverProfileId,
      (nextRideId, toState, actorProfileId, reason, deliveryCommand) =>
        this.transitionTo(
          nextRideId,
          toState,
          actorProfileId,
          reason,
          undefined,
          deliveryCommand,
        ),
    );
  }

  static async startDelivery(
    rideId: string,
    driverProfileId: string
  ): Promise<TransitionResult> {
    return startDeliveryOperation(
      rideId,
      driverProfileId,
      (nextRideId, toState, actorProfileId, reason) =>
        this.transitionTo(nextRideId, toState, actorProfileId, reason),
    );
  }

  static async confirmDelivery(
    rideId: string,
    driverProfileId: string,
    proof: {
      photo_url?: string;
      code?: string;
      observation?: string;
    },
    finalPrice?: number,
    pin?: string
  ): Promise<TransitionResult> {
    const result = await confirmDeliveryOperation(
      rideId,
      driverProfileId,
      proof,
      finalPrice,
      pin,
    );

    if (result.success) {
      await OrderDeliveryLinkService.syncRideStatusToOrder({
        rideId,
        rideStatus: RIDE_STATE.COMPLETED,
        actorProfileId: driverProfileId,
        reason: "Delivery confirmed and completed",
      });
    }

    return result;
  }

  static async failDelivery(
    rideId: string,
    driverProfileId: string,
    metadata: FailedDeliveryMetadata
  ): Promise<TransitionResult> {
    return failDeliveryOperation(
      rideId,
      driverProfileId,
      metadata,
      (nextRideId, toState, actorProfileId, reason, deliveryCommand) =>
        this.transitionTo(
          nextRideId,
          toState,
          actorProfileId,
          reason,
          undefined,
          deliveryCommand,
        ),
    );
  }

  static async updateFailedDeliveryResolution(
    rideId: string,
    resolutionUpdate: FailedDeliveryResolutionUpdate
  ): Promise<TransitionResult> {
    return updateFailedDeliveryResolutionOperation(rideId, resolutionUpdate);
  }

  static async getRolloutStatus() {
    return mobilityRolloutService.getStatus();
  }
}
