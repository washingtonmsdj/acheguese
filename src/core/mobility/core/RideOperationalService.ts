/**
 * RIDE OPERATIONAL SERVICE - Orquestrador do Motor Operacional
 *
 * Centraliza todas as operações críticas da corrida:
 * - Criação com state machine
 * - Transições de estado validadas
 * - Cancelamentos
 * - Completar corrida
 * - Integração com dispatch
 */

import { logger } from "@/shared/utils/logger";
import { RIDE_STATE, RideStateMachine, type RideState } from "./RideStateMachine";
import { RideDispatchService } from "./RideDispatchService";
import { getRideById } from "../services/mobility.queries";
import {
  createRide,
  updateRide as updateRideMutation,
  updateRideWithGuards,
} from "../services/mobility.mutations";
import type { FailedDeliveryMetadata, ResolutionStatus } from "../types/FailedDeliveryMetadata";
import { VALID_FAILURE_REASONS, VALID_ITEM_DESTINATIONS, VALID_ITEM_HOLDERS } from "../types/FailedDeliveryMetadata";
import { OperationalVerificationService } from "../services/OperationalVerificationService";
import { mobilityRolloutService } from "../services/MobilityRolloutService";
import { mobilityAuditService } from "../services/MobilityAuditService";
import { MotoboyAuthorizationService } from "../services/MotoboyAuthorizationService";

// ============================================
// TIPOS
// ============================================

export interface CreateRideInput {
  passengerProfileId: string;
  // Campos canônicos (schema real do banco)
  pickupAddressId: string;
  dropoffAddressId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  // Campos legados / complementares
  origin?: string;
  destination?: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  mode?: 'ride' | 'delivery';
  suggestedPrice?: number;
  observation?: string;
  availableSeats?: number;
  paymentMethod?: string;
  departureTime?: string;
}

// Campos específicos de entrega motoboy
export interface CreateDeliveryInput extends Omit<CreateRideInput, 'mode'> {
  // Origem da solicitação
  sourceType: 'passenger' | 'business' | 'gastronomy' | 'service';
  sourceId?: string;
  // Dados da entrega
  recipientName: string;
  recipientPhone?: string;
  deliveryNotes?: string;
  packageDescription?: string;
  packageSize?: 'small' | 'medium' | 'large';
  // Autorização (passados pelo hook, não pelo componente)
  requestingUserId?: string;
  planTier?: string;
}

interface TransitionResult {
  success: boolean;
  rideId?: string;
  newState?: RideState;
  fromState?: RideState;
  toState?: RideState;
  error?: string;
}

interface CancelInput {
  rideId: string;
  cancelledBy: 'passenger' | 'driver';
  profileId: string;
  reason?: string;
}

// ============================================
// RIDE OPERATIONAL SERVICE
// ============================================

export class RideOperationalService {
  private static isValidLatitude(value: number): boolean {
    return Number.isFinite(value) && value >= -90 && value <= 90;
  }

  private static isValidLongitude(value: number): boolean {
    return Number.isFinite(value) && value >= -180 && value <= 180;
  }

  private static hasValidRouteCoordinates(input: {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
  }): boolean {
    return (
      this.isValidLatitude(input.originLat) &&
      this.isValidLongitude(input.originLng) &&
      this.isValidLatitude(input.destinationLat) &&
      this.isValidLongitude(input.destinationLng)
    );
  }

  /**
   * Cria nova corrida no estado inicial
   */
  static async createRide(input: CreateRideInput): Promise<TransitionResult> {
    try {
      const initialState = RIDE_STATE.REQUESTED;

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
      if (!this.hasValidRouteCoordinates(input)) {
        return {
          success: false,
          error: 'Coordenadas são obrigatórias para cálculo de preço oficial. Selecione endereços válidos no mapa.',
        };
      }

      // CONTRATO PRICING: Validar preco minimo
      if (input.suggestedPrice && input.suggestedPrice < 5.00) {
        return {
          success: false,
          error: 'Preço mínimo é R$ 5,00 conforme regras de pricing.',
        };
      }

      const ride = await createRide({
          passenger_profile_id: input.passengerProfileId,
          // Campos canônicos NOT NULL
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
      await this.logStateChange(ride.id, null, initialState, input.passengerProfileId, 'Ride created');

      // GATE 7 FASE 2.5: Resolver se PIN é exigido e criar verificação automaticamente
      const pinRequirement = await OperationalVerificationService.resolveRidePINRequirement({
        passengerId: input.passengerProfileId,
        driverProfileId: undefined, // Motorista ainda não atribuído
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
    pin?: string // GATE 7: PIN opcional para validação
  ): Promise<TransitionResult> {
    try {
      // DIAGNOSTICO GATE 7: Log antes do .single()
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

      // DIAGNOSTICO GATE 7: Log apos o .single()
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
              await this.logStateChange(
                rideId,
                fromState,
                fromState, // Não transiciona
                actor,
                `PIN verification failed: ${verifyResult.error || 'Invalid PIN'}`
              );

              return {
                success: false,
                error: verifyResult.data?.message || verifyResult.error || 'Invalid PIN',
              };
            }

            // PIN válido, registrar na auditoria
            await this.logStateChange(
              rideId,
              fromState,
              fromState, // Ainda não transicionou
              actor,
              'PIN verified successfully'
            );
          } else {
            // PIN exigido mas não fornecido
            return {
              success: false,
              error: 'PIN verification required before boarding',
            };
          }
        }
      }

      // Validar transição
      RideStateMachine.assertCanTransition(fromState, toState);

      // Executar transição
      const updates: any = {
        status: toState,
        updated_at: new Date().toISOString(),
      };

      // Adicionar timestamps específicos apenas se a coluna existir
      // Nota: Algumas colunas podem não existir dependendo da migração
      if (toState === RIDE_STATE.PASSENGER_BOARDED) {
        updates.passenger_boarded_at = new Date().toISOString();
      } else if (toState === RIDE_STATE.IN_PROGRESS) {
        updates.started_at = new Date().toISOString();
      } else if (toState === RIDE_STATE.COMPLETED) {
        updates.completed_at = new Date().toISOString();
      } else if (toState === RIDE_STATE.CANCELLED_BY_PASSENGER ||
                 toState === RIDE_STATE.CANCELLED_BY_DRIVER) {
        updates.cancelled_at = new Date().toISOString();
      }

      const updated = await updateRideWithGuards(
        rideId,
        updates as Record<string, unknown>,
        { statusEq: fromState },
      );

      if (!updated) {
        throw new Error('Ride state changed during transition');
      }

      // Registrar auditoria
      await this.logStateChange(rideId, fromState, toState, actor, reason);

      // Ações pós-transição
      await this.handlePostTransition(rideId, toState, ride);

      return {
        success: true,
        rideId,
        fromState,
        toState,
        newState: toState,
      };
    } catch (error) {
      // Serializar erro completo para diagnóstico
      const errorDetails = {
        message: (error as Error).message,
        name: (error as Error).name,
        stack: (error as Error).stack,
        // Provider errors podem expor campos adicionais
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
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

      // GATE 3: IDEMPOTENCIA - Se ja esta cancelado, retornar sucesso
      if (currentState === RIDE_STATE.CANCELLED_BY_PASSENGER ||
          currentState === RIDE_STATE.CANCELLED_BY_DRIVER) {
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
      logger.info('RideOperationalService.cancelRide - verificando se é cancelável', {
        rideId: input.rideId,
        currentState,
        isCancellable
      });
      
      if (!isCancellable) {
        logger.warn('RideOperationalService.cancelRide - estado não cancelável', {
          rideId: input.rideId,
          currentState
        });
        return {
          success: false,
          error: `Cannot cancel ride in state: ${currentState}`,
        };
      }

      // Validar quem está cancelando
      if (input.cancelledBy === 'passenger') {
        if (ride.passenger_profile_id !== input.profileId) {
          logger.warn('RideOperationalService.cancelRide - perfil não é o passageiro', {
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
          logger.warn('RideOperationalService.cancelRide - passageiro não pode cancelar neste estado', {
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

      // GATE 3: Determinar novo estado com semântica correta
      let newState: RideState;

      if (input.cancelledBy === 'passenger') {
        newState = RIDE_STATE.CANCELLED_BY_PASSENGER;
      } else {
        // Motorista cancelando
        // Se está em IN_DELIVERY, isso é FALHA operacional, não cancelamento simples
        if (currentState === RIDE_STATE.IN_DELIVERY) {
          return {
            success: false,
            error: 'Cannot cancel during delivery. Use failDelivery() instead to register operational failure.',
          };
        }
        newState = RIDE_STATE.CANCELLED_BY_DRIVER;
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

      // GATE 5: Liberar motorista com validação de corrida correta
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
   * Cria solicitação de entrega (motoboy)
   * Reutiliza o motor de corrida com ride_mode = 'motoboy'
   *
   * GATE AUTH: Autorização centralizada via MotoboyAuthorizationService antes de qualquer escrita.
   */
  static async createDelivery(input: CreateDeliveryInput): Promise<TransitionResult> {
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

      // GATE AUTH: Verificar autorização centralizada por source_type/source_id
      const authResult = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        locationId: input.pickupLocationId,
        planTier: input.planTier,
        userId: input.requestingUserId,
      });

      if (!authResult.allowed) {
        logger.warn('RideOperationalService.createDelivery - authorization denied', {
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          code: authResult.code,
          reason: authResult.reason,
        });
        return {
          success: false,
          error: authResult.reason || 'Não autorizado a solicitar entrega.',
        };
      }

      if (!this.hasValidRouteCoordinates(input)) {
        return { success: false, error: 'Coordenadas são obrigatórias para cálculo de preço.' };
      }

      if (!input.recipientName?.trim()) {
        return { success: false, error: 'Nome do destinatário é obrigatório.' };
      }

      if (input.suggestedPrice && input.suggestedPrice < 5.00) {
        return { success: false, error: 'Preço mínimo é R$ 5,00.' };
      }

      const ride = await createRide({
          passenger_profile_id: input.passengerProfileId,
          pickup_address_id: input.pickupAddressId,
          dropoff_address_id: input.dropoffAddressId,
          pickup_location_id: input.pickupLocationId,
          dropoff_location_id: input.dropoffLocationId,
          status: RIDE_STATE.REQUESTED,
          // Campos de motoboy
          ride_mode: 'motoboy',
          source_type: input.sourceType,
          source_id: input.sourceId || null,
          recipient_name: input.recipientName,
          recipient_phone: input.recipientPhone || null,
          delivery_notes: input.deliveryNotes || null,
          package_description: input.packageDescription || null,
          package_size: input.packageSize || 'small',
          suggested_price: input.suggestedPrice,
          observation: input.observation || null,
          payment_method: input.paymentMethod || null,
          updated_at: new Date().toISOString(),
        }) as { id: string };



      logger.info('RideOperationalService.createDelivery - success', { rideId: ride.id });

      await this.logStateChange(ride.id, null, RIDE_STATE.REQUESTED, input.passengerProfileId, 'Delivery created');

      // GATE 7 FASE 2.5: Resolver se PIN é exigido e criar verificação automaticamente
      const pinRequirement = await OperationalVerificationService.resolveDeliveryPINRequirement({
        senderProfileId: input.passengerProfileId, // Remetente é o passenger_profile_id
        operationId: input.sourceId, // Se houver operação associada
      });

      if (pinRequirement.isRequired && pinRequirement.requiredBy) {
        const verificationResult = await OperationalVerificationService.createVerification({
          rideId: ride.id,
          verificationType: 'pin',
          isRequired: true,
          requiredBy: pinRequirement.requiredBy,
        });

        if (verificationResult.success) {
          logger.info('RideOperationalService.createDelivery - PIN verification created', {
            rideId: ride.id,
            requiredBy: pinRequirement.requiredBy,
            reason: pinRequirement.reason,
          });
        } else {
          logger.error('RideOperationalService.createDelivery - Failed to create PIN verification',
            new Error(verificationResult.error || 'Unknown error'),
            { rideId: ride.id }
          );
        }
      }

      await this.transitionTo(ride.id, RIDE_STATE.SEARCHING_DRIVER, 'system');

      return { success: true, rideId: ride.id, newState: RIDE_STATE.SEARCHING_DRIVER };
    } catch (error) {
      logger.error('RideOperationalService.createDelivery', error as Error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motoboy confirma coleta do pacote
   */
  static async confirmPickup(
    rideId: string,
    driverProfileId: string
  ): Promise<TransitionResult> {
    try {
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
        ride_mode?: string | null;
      } | null;

      if (!ride) return { success: false, error: 'Entrega não encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operação exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuído pode confirmar coleta.' };

      await updateRideMutation(rideId, { pickup_confirmed_at: new Date().toISOString() });

      return await this.transitionTo(rideId, RIDE_STATE.PICKUP_CONFIRMED, driverProfileId, 'Pickup confirmed');
    } catch (error) {
      logger.error('RideOperationalService.confirmPickup', error as Error, { rideId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motoboy inicia rota de entrega
   */
  static async startDelivery(
    rideId: string,
    driverProfileId: string
  ): Promise<TransitionResult> {
    try {
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
        ride_mode?: string | null;
      } | null;

      if (!ride) return { success: false, error: 'Entrega não encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operação exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuído pode iniciar entrega.' };

      return await this.transitionTo(rideId, RIDE_STATE.IN_DELIVERY, driverProfileId, 'Delivery started');
    } catch (error) {
      logger.error('RideOperationalService.startDelivery', error as Error, { rideId });
      return { success: false, error: (error as Error).message };
    }
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
    pin?: string // GATE 7: PIN opcional para validação
  ): Promise<TransitionResult> {
    try {
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
        ride_mode?: string | null;
      } | null;

      if (!ride) return { success: false, error: 'Entrega não encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operação exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuído pode confirmar entrega.' };

      // GATE 7: Validar PIN se exigido
      const verification = await OperationalVerificationService.getVerificationStatus(rideId);

      if (verification?.is_required && verification.status !== 'verified') {
        // Se PIN fornecido, validar
        if (pin) {
          const verifyResult = await OperationalVerificationService.verifyPIN({
            rideId,
            pin,
            verifiedBy: driverProfileId,
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
            error: 'PIN required for delivery confirmation',
          };
        }
      }

      const updates: any = {
        delivered_at: new Date().toISOString(),
        proof_of_delivery: { ...proof, signed_at: new Date().toISOString() },
      };
      if (finalPrice !== undefined) updates.final_price = finalPrice;

      await updateRideMutation(rideId, updates);

      // DELIVERED -> COMPLETED
      const deliveredResult = await this.transitionTo(rideId, RIDE_STATE.DELIVERED, driverProfileId, 'Delivered');
      if (!deliveredResult.success) return deliveredResult;

      return await this.transitionTo(rideId, RIDE_STATE.COMPLETED, driverProfileId, 'Delivery completed');
    } catch (error) {
      logger.error('RideOperationalService.confirmDelivery', error as Error, { rideId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motoboy registra falha na entrega
   * GATE 3: Snapshot obrigatório da falha
   */
  static async failDelivery(
    rideId: string,
    driverProfileId: string,
    metadata: FailedDeliveryMetadata
  ): Promise<TransitionResult> {
    try {
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
        ride_mode?: string | null;
      } | null;

      if (!ride) return { success: false, error: 'Entrega não encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operação exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuído pode registrar falha.' };

      // GATE 3: Validar snapshot obrigatório
      this.validateFailedDeliverySnapshot(metadata);

      // Garantir default de resolution_status
      if (!metadata.resolution_status) {
        metadata.resolution_status = 'pending';
      }

      await updateRideMutation(rideId, {
        failed_delivery_at: new Date().toISOString(),
        failed_delivery_reason: metadata.failure_reason,
        failed_delivery_metadata: metadata,
      });

      return await this.transitionTo(rideId, RIDE_STATE.FAILED_DELIVERY, driverProfileId, metadata.failure_reason);
    } catch (error) {
      logger.error('RideOperationalService.failDelivery', error as Error, { rideId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Valida snapshot obrigatório da falha
   * GATE 3: Validação de campos obrigatórios e condicionais
   */
  private static validateFailedDeliverySnapshot(
    metadata: FailedDeliveryMetadata
  ): void {
    // Campos obrigatórios
    if (!metadata.failure_reason || !metadata.item_destination ||
        !metadata.item_current_holder || !metadata.timestamp) {
      throw new Error('Campos obrigatórios do snapshot ausentes: failure_reason, item_destination, item_current_holder, timestamp');
    }

    // Validar enums
    if (!VALID_FAILURE_REASONS.includes(metadata.failure_reason)) {
      throw new Error(`failure_reason inválido: ${metadata.failure_reason}`);
    }

    if (!VALID_ITEM_DESTINATIONS.includes(metadata.item_destination)) {
      throw new Error(`item_destination inválido: ${metadata.item_destination}`);
    }

    if (!VALID_ITEM_HOLDERS.includes(metadata.item_current_holder)) {
      throw new Error(`item_current_holder inválido: ${metadata.item_current_holder}`);
    }

    // resolution_notes obrigatório se failure_reason = 'other'
    if (metadata.failure_reason === 'other' && !metadata.resolution_notes) {
      throw new Error('resolution_notes obrigatório quando failure_reason = other');
    }

    // item_current_holder não pode ser 'recipient' em failed_delivery
    if (metadata.item_current_holder === 'recipient' as any) {
      throw new Error('item_current_holder não pode ser recipient em failed_delivery');
    }
  }

  /**
   * Atualiza resolução de falha de entrega
   * GATE 3: Resolução posterior assíncrona
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
    try {
      // Buscar metadata atual
      const ride = await getRideById(rideId) as {
        status?: string;
        failed_delivery_metadata?: Record<string, unknown> | null;
      } | null;
      if (!ride) {
        return { success: false, error: 'Corrida não encontrada' };
      }

      if (ride.status !== RIDE_STATE.FAILED_DELIVERY) {
        return { success: false, error: 'Corrida não está em failed_delivery' };
      }

      if (!ride.failed_delivery_metadata) {
        return { success: false, error: 'Metadata de falha não encontrada' };
      }

      // Validar resolução
      this.validateFailedDeliveryResolution(resolutionUpdate);

      // Merge com metadata existente
      const updatedMetadata = {
        ...ride.failed_delivery_metadata,
        ...resolutionUpdate
      };

      // Atualizar banco
      await updateRideMutation(rideId, { failed_delivery_metadata: updatedMetadata });

      logger.info('RideOperationalService.updateFailedDeliveryResolution - success', {
        rideId,
        resolution_status: resolutionUpdate.resolution_status
      });

      return { success: true, rideId };
    } catch (error) {
      logger.error('RideOperationalService.updateFailedDeliveryResolution', error as Error, { rideId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Valida atualização de resolução
   * GATE 3: Validação de campos de resolução
   */
  private static validateFailedDeliveryResolution(
    resolutionUpdate: {
      resolution_status?: ResolutionStatus;
      resolved_at?: string;
      manual_resolution_owner_profile_id?: string;
    }
  ): void {
    // resolved exige resolved_at
    if (resolutionUpdate.resolution_status === 'resolved' && !resolutionUpdate.resolved_at) {
      throw new Error('resolved_at obrigatório quando resolution_status = resolved');
    }

    // escalated exige manual_resolution_owner_profile_id
    if (resolutionUpdate.resolution_status === 'escalated' && !resolutionUpdate.manual_resolution_owner_profile_id) {
      throw new Error('manual_resolution_owner_profile_id obrigatório quando resolution_status = escalated');
    }
  }

  /**
   * Ações pós-transição
   */
  private static async handlePostTransition(
    rideId: string,
    newState: RideState,
    ride: any
  ): Promise<void> {
    try {
      // GATE 5: Liberar motorista quando corrida é cancelada ou completada
      if (RideStateMachine.isFinalState(newState) && ride.driver_profile_id) {
        const { DriverAvailabilityService } = await import('@/core/mobility/services/DriverAvailabilityService');
        await DriverAvailabilityService.releaseBusy(ride.driver_profile_id, rideId);
      }

      // TODO: Enviar notificações realtime
      // TODO: Enviar notificações push
    } catch (error) {
      logger.error('RideOperationalService.handlePostTransition', error as Error, { rideId, newState });
    }
  }

  /**
   * Registra mudança de estado
   */
  private static async logStateChange(
    rideId: string,
    fromState: RideState | null,
    toState: RideState,
    actor: string,
    reason?: string
  ): Promise<void> {
    try {
      await mobilityAuditService.logRideStateChange({
        rideId,
        fromState,
        toState,
        changedBy: actor,
        reason: reason || '',
      });

      if (fromState) {
        RideStateMachine.logTransition(rideId, fromState, toState, actor, reason);
      }
    } catch (error) {
      logger.error('RideOperationalService.logStateChange', error as Error, { rideId });
    }
  }
}



