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
import { createRide } from "../services/mobility.mutations";
import { MobilityRpcService } from "../services/MobilityRpcService";
import type { FailedDeliveryMetadata, ResolutionStatus } from "../types/FailedDeliveryMetadata";
import { OperationalVerificationService } from "../services/OperationalVerificationService";
import { mobilityRolloutService } from "../services/MobilityRolloutService";
import { mobilityAuditService } from "../services/MobilityAuditService";
import { OrderDeliveryLinkService } from "@/core/mobility/delivery/services/OrderDeliveryLinkService";
import type {
  CancelInput,
  CreateDeliveryInput,
  CreateRideInput,
  ProviderErrorShape,
  RidePostTransitionSnapshot,
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
import {
  handleRidePostTransition,
  logRideStateChange,
} from "./RideOperationalPostTransition";
export type { CreateDeliveryInput, CreateRideInput } from "./RideOperationalTypes";
// ============================================
// RIDE OPERATIONAL SERVICE
// ============================================

export class RideOperationalService {
  /**
   * Cria nova corrida no estado inicial
   */
  static async createRide(input: CreateRideInput): Promise<TransitionResult> {
    try {
      const initialState = RIDE_STATE.REQUESTED;

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

      // CONTRATO PRICING: Validar coordenadas obrigatorias para calculo oficial
      if (!hasValidRouteCoordinates(input)) {
        return {
          success: false,
          error: 'Coordenadas so obrigatrias para calculo de preco oficial. Selecione enderecos validos no mapa.',
        };
      }

      // CONTRATO PRICING: Validar preco minimo
      if (input.suggestedPrice && input.suggestedPrice < 5.00) {
        return {
          success: false,
          error: 'Preo minimo  R$ 5,00 conforme regras de pricing.',
        };
      }

      const ride = await createRide({
          passenger_profile_id: input.passengerProfileId,
          // Campos canonicos NAOT NULL
          pickup_address_id: input.pickupAddressId,
          dropoff_address_id: input.dropoffAddressId,
          pickup_location_id: input.pickupLocationId,
          dropoff_location_id: input.dropoffLocationId,
          // Status inicial
          status: initialState,
          // Campos opcionais
          suggested_price: input.suggestedPrice,
          available_seats: input.availableSeats ?? 1,
          updated_at: new Date().toISOString(),
        }) as { id: string };



      logger.info('RideOperationalService.createRide - success', { rideId: ride.id });

      // Registrar auditoria
      await logRideStateChange(ride.id, null, initialState, input.passengerProfileId, 'Ride created');

      // GATE 7 FASE 2.5: Resolver se PIN  exigido e criar verificacao automaticamente
      const pinRequirement = await OperationalVerificationService.resolveRidePINRequirement({
        passengerId: input.passengerProfileId,
        driverProfileId: undefined, // Motorista ainda no atribuido
      });

      if (pinRequirement.isRequired && pinRequirement.requiredBy) {
        const verificationResult = await OperationalVerificationService.createVerification({
          rideId: ride.id,
          verificationType: 'pin',
          isRequired: true,
          requiredBy: pinRequirement.requiredBy,
        });

        if (verificationResult.success) {
          logger.info('RideOperationalService.createRide - PIN verification created', {
            rideId: ride.id,
            requiredBy: pinRequirement.requiredBy,
            reason: pinRequirement.reason,
          });
        } else {
          logger.error('RideOperationalService.createRide - Failed to create PIN verification',
            new Error(verificationResult.error || 'Unknown error'),
            { rideId: ride.id }
          );
        }
      }

      // Transicionar para searching_driver
      // IMPORTANTE: Database Webhook dispara edge function auto-dispatch-ride automaticamente
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

  /**
   * Transiciona corrida para novo estado
   * GATE 7: Validar PIN antes de passenger_boarded se exigido
   */
  static async transitionTo(
    rideId: string,
    toState: RideState,
    actor: string,
    reason?: string,
    pin?: string, // GATE 7: PIN opcional para validacao
    deliveryCommand?: DeliveryTransitionCommand,
  ): Promise<TransitionResult> {
    try {
      // DIAGNAOSTICO GATE 7: Log antes do .single()
      logger.info('RideOperationalService.transitionTo - BEFORE .single()', {
        method: 'transitionTo',
        step: 'fetch_current_state',
        rideId,
        toState,
        actor,
      });

      // Buscar estado atual via SSOT
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
      } | null;

      // DIAGNAOSTICO GATE 7: Log apos o .single()
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

      // GATE 7: Validar PIN antes de passenger_boarded se exigido
      if (toState === RIDE_STATE.PASSENGER_BOARDED) {
        const verification = await OperationalVerificationService.getVerificationStatus(rideId);

        if (verification?.is_required && verification.status !== 'verified') {
          // Se PIN fornecido, validar
          if (pin) {
            const verifyResult = await OperationalVerificationService.verifyPIN({
              rideId,
              pin,
              verifiedBy: actor,
            });

            if (!verifyResult.success || !verifyResult.data?.verified) {
              // Registrar tentativa falha na auditoria
              await logRideStateChange(
                rideId,
                fromState,
                fromState, // No transiciona
                actor,
                `PIN verification failed: ${verifyResult.error || 'Invalid PIN'}`
              );

              return {
                success: false,
                error: verifyResult.data?.message || verifyResult.error || 'Invalid PIN',
              };
            }

            // PIN valido, registrar na auditoria
            await logRideStateChange(
              rideId,
              fromState,
              fromState, // Ainda no transicionou
              actor,
              'PIN verified successfully'
            );
          } else {
            // PIN exigido mas no fornecido
            return {
              success: false,
              error: 'PIN verification required before boarding',
            };
          }
        }
      }

      // Validar transicao
      RideStateMachine.assertCanTransition(fromState, toState);

      // Executar transicao e auditoria de forma atomica no backend.
      // Estados que carregam metadata de entrega usam um command dedicado,
      // impedindo que o browser grave estado e prova/falha em etapas separadas.
      const transition = deliveryCommand
        ? await MobilityRpcService.transitionDeliveryState({
            rideId,
            expectedFromState: fromState,
            command: deliveryCommand.type,
            actorProfileId: actor,
            reason,
            proofOfDelivery:
              deliveryCommand.type === "confirm_delivery"
                ? deliveryCommand.proof
                : undefined,
            finalPrice:
              deliveryCommand.type === "confirm_delivery"
                ? deliveryCommand.finalPrice
                : undefined,
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

      await OrderDeliveryLinkService.syncRideStatusToOrder({
        rideId,
        rideStatus: toState,
        actorProfileId: actor,
        reason,
      });

      // Acoes ps-transicao
      await handleRidePostTransition(rideId, toState, ride);

      return {
        success: true,
        rideId,
        fromState,
        toState,
        newState: toState,
      };
    } catch (error) {
      // Serializar erro completo para diagnostico
      const providerError =
        error && typeof error === "object" ? (error as ProviderErrorShape) : undefined;
      const errorDetails = {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack,
        // Provider errors podem expor campos adicionais
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

  /**
   * Cancela corrida
   */
  static async cancelRide(input: CancelInput): Promise<TransitionResult> {
    try {
      logger.info('RideOperationalService.cancelRide - iniciando', input);
      
      // Buscar estado atual via SSOT
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

      // GATE 3: IDEMPOTENCIA - apenas a mesma operacao repetida retorna sucesso.
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

      // Validar se pode cancelar
      const isCancellable = RideStateMachine.isCancellable(currentState);
      logger.info('RideOperationalService.cancelRide - verificando se  cancelavel', {
        rideId: input.rideId,
        currentState,
        isCancellable
      });
      
      if (!isCancellable) {
        logger.warn('RideOperationalService.cancelRide - estado no cancelavel', {
          rideId: input.rideId,
          currentState
        });
        return {
          success: false,
          error: `Cannot cancel ride in state: ${currentState}`,
        };
      }

      // Validar quem esta cancelando
      if (input.cancelledBy === 'passenger') {
        if (ride.passenger_profile_id !== input.profileId) {
          logger.warn('RideOperationalService.cancelRide - perfil no  o passageiro', {
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
          logger.warn('RideOperationalService.cancelRide - passageiro no pode cancelar neste estado', {
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

      // GATE 3: Determinar novo estado com semantica correta
      let newState: RideState;

      if (input.cancelledBy === 'passenger') {
        newState = requestedCancelledState;
      } else {
        // Motorista cancelando
        // Se est em IN_DELIVERY, isso  FALHA operacional, no cancelamento simples
        if (currentState === RIDE_STATE.IN_DELIVERY) {
          return {
            success: false,
            error: 'Cannot cancel during delivery. Use failDelivery() instead to register operational failure.',
          };
        }
        newState = requestedCancelledState;
      }

      // Executar cancelamento
      const result = await this.transitionTo(
        input.rideId,
        newState,
        input.profileId,
        input.reason || 'Cancelled'
      );

      // GATE 3: Notificar dispatch para parar busca/ofertas
      if (result.success) {
        await this.stopDispatchForRide(input.rideId);
      }

      return result;
    } catch (error) {
      logger.error('RideOperationalService.cancelRide', error as Error, input);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Para dispatch ativo para uma corrida cancelada
   * GATE 3: Previne que corrida cancelada continue no dispatch
   */
  private static async stopDispatchForRide(rideId: string): Promise<void> {
    try {
      // Invalidar ofertas pendentes
      await mobilityAuditService.cancelPendingOffers(rideId);

      logger.info('RideOperationalService.stopDispatchForRide - offers cancelled', { rideId });
    } catch (error) {
      logger.error('RideOperationalService.stopDispatchForRide', error as Error, { rideId });
    }
  }

  /**
   * Completa corrida
   */
  static async completeRide(
    rideId: string,
    driverProfileId: string,
    finalPrice?: number
  ): Promise<TransitionResult> {
    try {
      // Buscar estado atual via SSOT
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

      // Validar se pode completar
      if (currentState !== RIDE_STATE.IN_PROGRESS) {
        return {
          success: false,
          error: `Cannot complete ride in state: ${currentState}`,
        };
      }

      // Validar motorista
      if (ride.driver_profile_id !== driverProfileId) {
        return {
          success: false,
          error: 'Only assigned driver can complete ride',
        };
      }

      // Completar corrida
      const result = await this.transitionTo(
        rideId,
        RIDE_STATE.COMPLETED,
        driverProfileId,
        'Ride completed successfully'
      );

      // GATE 5: Liberar motorista com validacao de corrida correta
      if (result.success) {
        const { DriverAvailabilityService } = await import('@/core/mobility/services/DriverAvailabilityService');
        await DriverAvailabilityService.releaseBusy(driverProfileId, rideId);
      }

      return result;
    } catch (error) {
      logger.error('RideOperationalService.completeRide', error as Error, { rideId });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Motorista aceita corrida
   */
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

  // ============================================
  // MOTOBOY - Operacoes de entrega
  // ============================================

  /**
   * Cria solicitacao de entrega (motoboy)
   * Reutiliza o motor de corrida com ride_mode = 'motoboy'
   *
   * GATE AUTH: Autorizacao centralizada via MotoboyAuthorizationService antes de qualquer escrita.
   */
  static async createDelivery(input: CreateDeliveryInput): Promise<TransitionResult> {
    return createDeliveryOperation(input, (rideId, toState, actorProfileId, reason) =>
      this.transitionTo(rideId, toState, actorProfileId, reason),
    );
  }

  /**
   * Motoboy confirma coleta do pacote
   */
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

  /**
   * Motoboy inicia rota de entrega
   */
  static async startDelivery(
    rideId: string,
    driverProfileId: string
  ): Promise<TransitionResult> {
    return startDeliveryOperation(
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

  /**
   * Motoboy confirma entrega com prova
   * GATE 7: Validar PIN se exigido
   */
  static async confirmDelivery(
    rideId: string,
    driverProfileId: string,
    proof: {
      photo_url?: string;
      code?: string;
      observation?: string;
    },
    finalPrice?: number,
    pin?: string // GATE 7: PIN opcional para validacao
  ): Promise<TransitionResult> {
    return confirmDeliveryOperation(
      rideId,
      driverProfileId,
      proof,
      finalPrice,
      pin,
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

  /**
   * Motoboy registra falha na entrega
   * GATE 3: Snaposhot obrigatorio da falha
   */
  static async failDelivery(
    rideId: string,
    driverProfileId: string,
    metadata: FailedDeliveryMetadata
  ): Promise<TransitionResult> {
    return failDeliveryOperation(
      rideId,
      driverProfileId,
      metadata,
      (nextRideId, toState, actorProfileId, reason) =>
        this.transitionTo(nextRideId, toState, actorProfileId, reason),
    );
  }

  /**
   * Atualiza resolucao de falha de entrega
   * GATE 3: Resoluo posterior assincrona
   */
  static async updateFailedDeliveryResolution(
    rideId: string,
    resolutionUpdate: {
      next_ride_id?: string;
      handoff_driver_profile_id?: string;
      manual_resolution_owner_profile_id?: string;
      resolution_status?: ResolutionStatus;
      resolved_at?: string;
      resolution_action_notes?: string;
    }
  ): Promise<TransitionResult> {
    return updateFailedDeliveryResolutionOperation(rideId, resolutionUpdate);
  }
}

