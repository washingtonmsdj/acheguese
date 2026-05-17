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
import { profileService } from "@/core/profiles/services/ProfileService";
import { OrderDeliveryLinkService } from "@/core/mobility/delivery/services/OrderDeliveryLinkService";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";

// ============================================
// TIPOS
// ============================================

export interface CreateRideInput {
  passengerProfileId: string;
  // Campos canonicos (schema real do banco)
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

// Campos especificos de entrega motoboy
export interface CreateDeliveryInput extends Omit<CreateRideInput, 'mode'> {
  // Origem da solicitacao
  sourceType: 'passenger' | 'business' | 'gastronomy' | 'service';
  sourceId?: string;
  // Fonte usada apenas para autorizacao. A sourceId persistida continua sendo a entidade operacional.
  authorizationSourceId?: string;
  // Dados da entrega
  recipientName: string;
  recipientPhone?: string;
  deliveryNotes?: string;
  packageDescription?: string;
  packageSize?: 'small' | 'medium' | 'large';
  // Autorizacao (passados pelo hook, nao pelo componente)
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

interface ProviderErrorShape {
  code?: string;
  details?: string;
  hint?: string;
}

interface RidePostTransitionSnapshot {
  passenger_profile_id?: string | null;
  driver_profile_id?: string | null;
  ride_mode?: string | null;
}

// ============================================
// RIDE OPERATIONAL SERVICE
// ============================================

export class RideOperationalService {
  private static isProfileSuspended(profile: Record<string, unknown> | null): boolean {
    const suspended = Boolean(profile?.is_suspended ?? profile?.suspended ?? false);
    if (!suspended) return false;

    const suspendedUntil = typeof profile?.suspended_until === "string" ? profile.suspended_until : null;
    if (!suspendedUntil) return true;

    const until = new Date(suspendedUntil);
    return Number.isNaN(until.getTime()) || until > new Date();
  }

  private static async ensureProfileCanRequest(profileId: string): Promise<TransitionResult | null> {
    const profile = await profileService.getProfileById(profileId).catch(() => null);
    if (!profile) {
      return { success: false, error: "Perfil solicitante nao encontrado." };
    }
    if (this.isProfileSuspended(profile as Record<string, unknown> | null)) {
      return { success: false, error: "Usuario suspenso nao pode solicitar chamadas." };
    }
    return null;
  }

  private static async ensureMotoboyCanOperate(driverProfileId: string): Promise<TransitionResult | null> {
    const authResult = await MotoboyAuthorizationService.canOperateDelivery(driverProfileId);
    if (authResult.allowed) return null;
    return {
      success: false,
      error: authResult.reason || "Motoboy nao autorizado a operar entrega.",
    };
  }

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

      const requesterBlock = await this.ensureProfileCanRequest(input.passengerProfileId);
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
      if (!this.hasValidRouteCoordinates(input)) {
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
      await this.logStateChange(ride.id, null, initialState, input.passengerProfileId, 'Ride created');

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
    pin?: string // GATE 7: PIN opcional para validacao
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
              await this.logStateChange(
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
            await this.logStateChange(
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

      // Executar transicao
      const updates: Record<string, unknown> = {
        status: toState,
        updated_at: new Date().toISOString(),
      };

      // Adicionar timestamps especificos apenas se a coluna existir
      // Nota: Algumas colunas podem no existir dependendo da migrao
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

      await OrderDeliveryLinkService.syncRideStatusToOrder({
        rideId,
        rideStatus: toState,
        actorProfileId: actor,
        reason,
      });

      // Acoes ps-transicao
      await this.handlePostTransition(rideId, toState, ride);

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
        newState = RIDE_STATE.CANCELLED_BY_PASSENGER;
      } else {
        // Motorista cancelando
        // Se est em IN_DELIVERY, isso  FALHA operacional, no cancelamento simples
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

      // GATE 5: Liberar motorista com validacao de corrida correta
      if (result.success) {
        const { DriverAvailabilityService } = await import('@/modules/mobility/services/DriverAvailabilityService');
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

      // GATE AUTH: Verificar autorizao centralizada por source_type/source_id
      const authResult = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: input.sourceType,
        sourceId: authorizationSourceId,
        locationId: input.pickupLocationId,
        userId: input.requestingUserId,
      });

      if (!authResult.allowed) {
        logger.warn('RideOperationalService.createDelivery - authorization denied', {
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          authorizationSourceId,
          code: authResult.code,
          reason: authResult.reason,
        });
        return {
          success: false,
          error: authResult.reason || 'No autorizado a solicitar entrega.',
        };
      }

      const requesterBlock = await this.ensureProfileCanRequest(input.passengerProfileId);
      if (requesterBlock) return requesterBlock;

      if (!this.hasValidRouteCoordinates(input)) {
        return { success: false, error: 'Coordenadas so obrigatrias para calculo de preco.' };
      }

      if (!input.recipientName?.trim()) {
        return { success: false, error: 'Nome do destinatario  obrigatorio.' };
      }

      if (input.suggestedPrice && input.suggestedPrice < 5.00) {
        return { success: false, error: 'Preo minimo  R$ 5,00.' };
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

      // GATE 7 FASE 2.5: Resolver se PIN  exigido e criar verificacao automaticamente
      const pinRequirement = await OperationalVerificationService.resolveDeliveryPINRequirement({
        senderProfileId: input.passengerProfileId, // Remetente  o passenger_profile_id
        operationId: input.sourceId, // Se houver operacao associada
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

      if (!ride) return { success: false, error: 'Entrega no encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operao exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuido pode confirmar coleta.' };

      const operatorBlock = await this.ensureMotoboyCanOperate(driverProfileId);
      if (operatorBlock) return operatorBlock;

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

      if (!ride) return { success: false, error: 'Entrega no encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operao exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuido pode iniciar entrega.' };

      const operatorBlock = await this.ensureMotoboyCanOperate(driverProfileId);
      if (operatorBlock) return operatorBlock;

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
    pin?: string // GATE 7: PIN opcional para validacao
  ): Promise<TransitionResult> {
    try {
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
        ride_mode?: string | null;
      } | null;

      if (!ride) return { success: false, error: 'Entrega no encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operao exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuido pode confirmar entrega.' };

      const operatorBlock = await this.ensureMotoboyCanOperate(driverProfileId);
      if (operatorBlock) return operatorBlock;

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

      const updates: Record<string, unknown> = {
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
   * GATE 3: Snaposhot obrigatorio da falha
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

      if (!ride) return { success: false, error: 'Entrega no encontrada.' };
      if (ride.ride_mode !== 'motoboy') return { success: false, error: 'Operao exclusiva de motoboy.' };
      if (ride.driver_profile_id !== driverProfileId) return { success: false, error: 'Apenas o motoboy atribuido pode registrar falha.' };

      const operatorBlock = await this.ensureMotoboyCanOperate(driverProfileId);
      if (operatorBlock) return operatorBlock;

      // GATE 3: Validar snaposhot obrigatorio
      this.validateFailedDeliverySnaposhot(metadata);

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
   * Valida snaposhot obrigatorio da falha
   * GATE 3: Validao de campos obrigatorios e condicionais
   */
  private static validateFailedDeliverySnaposhot(
    metadata: FailedDeliveryMetadata
  ): void {
    // Campos obrigatorios
    if (!metadata.failure_reason || !metadata.item_destination ||
        !metadata.item_current_holder || !metadata.timestamp) {
      throw new Error('Campos obrigatorios do snaposhot ausentes: failure_reason, item_destination, item_current_holder, timestamp');
    }

    // Validar enums
    if (!VALID_FAILURE_REASONS.includes(metadata.failure_reason)) {
      throw new Error(`failure_reason invalido: ${metadata.failure_reason}`);
    }

    if (!VALID_ITEM_DESTINATIONS.includes(metadata.item_destination)) {
      throw new Error(`item_destination invalido: ${metadata.item_destination}`);
    }

    if (!VALID_ITEM_HOLDERS.includes(metadata.item_current_holder)) {
      throw new Error(`item_current_holder invalido: ${metadata.item_current_holder}`);
    }

    // resolution_notes obrigatorio se failure_reason = 'other'
    if (metadata.failure_reason === 'other' && !metadata.resolution_notes) {
      throw new Error('resolution_notes obrigatorio quando failure_reason = other');
    }

    // item_current_holder no pode ser 'recipient' em failed_delivery
    if (metadata.item_current_holder === 'recipient') {
      throw new Error('item_current_holder no pode ser recipient em failed_delivery');
    }
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
    try {
      // Buscar metadata atual
      const ride = await getRideById(rideId) as {
        status?: string;
        failed_delivery_metadata?: Record<string, unknown> | null;
      } | null;
      if (!ride) {
        return { success: false, error: 'Corrida no encontrada' };
      }

      if (ride.status !== RIDE_STATE.FAILED_DELIVERY) {
        return { success: false, error: 'Corrida no est em failed_delivery' };
      }

      if (!ride.failed_delivery_metadata) {
        return { success: false, error: 'Metadata de falha no encontrada' };
      }

      // Validar resolucao
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
   * Valida atualizacao de resolucao
   * GATE 3: Validao de campos de resolucao
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
      throw new Error('resolved_at obrigatorio quando resolution_status = resolved');
    }

    // escalated exige manual_resolution_owner_profile_id
    if (resolutionUpdate.resolution_status === 'escalated' && !resolutionUpdate.manual_resolution_owner_profile_id) {
      throw new Error('manual_resolution_owner_profile_id obrigatorio quando resolution_status = escalated');
    }
  }

  /**
   * Acoes ps-transicao
   */
  private static async handlePostTransition(
    rideId: string,
    newState: RideState,
    ride: RidePostTransitionSnapshot
  ): Promise<void> {
    try {
      // GATE 5: Liberar motorista quando corrida e cancelada ou completada
      if (RideStateMachine.isFinalState(newState) && ride.driver_profile_id) {
        const { DriverAvailabilityService } = await import('@/modules/mobility/services/DriverAvailabilityService');
        await DriverAvailabilityService.releaseBusy(ride.driver_profile_id, rideId);
      }

      const passengerProfileId = typeof ride?.passenger_profile_id === "string" ? ride.passenger_profile_id : null;
      const driverProfileId = typeof ride?.driver_profile_id === "string" ? ride.driver_profile_id : null;
      const isDeliveryMode = ride?.ride_mode === "motoboy";
      const { NotificationService } = await import("@/core/notifications/services/NotificationService");
      const [passengerUserId, driverUserId] = await Promise.all([
        this.resolveUserIdFromProfileId(passengerProfileId),
        this.resolveUserIdFromProfileId(driverProfileId),
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
        await notify(
          "passenger",
          passengerUserId,
          "success",
          "Motorista confirmou a corrida",
          "Seu motorista confirmou o aceite e vai iniciar em breve.",
          "ride_driver_accepted",
          passengerTrackingUrl,
        );
        return;
      }

      if (newState === RIDE_STATE.IN_PROGRESS) {
        await notify(
          "passenger",
          passengerUserId,
          "info",
          "Corrida iniciada",
          "Sua corrida foi iniciada.",
          "ride_in_progress",
          passengerTrackingUrl,
        );
        return;
      }

      if (newState === RIDE_STATE.IN_DELIVERY) {
        await notify(
          "passenger",
          passengerUserId,
          "info",
          "Entrega em rota",
          "Seu motoboy iniciou a rota.",
          "delivery_in_route",
          passengerTrackingUrl,
        );
        return;
      }

      if (newState === RIDE_STATE.DELIVERED || newState === RIDE_STATE.COMPLETED) {
        await notify(
          "passenger",
          passengerUserId,
          "success",
          newState === RIDE_STATE.DELIVERED ? "Entrega concluida" : "Corrida concluida",
          "Operacao finalizada com sucesso.",
          newState === RIDE_STATE.DELIVERED ? "delivery_completed" : "ride_completed",
          passengerTrackingUrl,
        );
        await notify(
          "driver",
          driverUserId,
          "success",
          "Operacao concluida",
          "A operacao foi finalizada e registrada no historico.",
          "operation_completed",
          isDeliveryMode ? mobilityRoutes.motoboy.entregas : mobilityRoutes.motorista.corridas,
        );
        return;
      }

      if (newState === RIDE_STATE.CANCELLED_BY_DRIVER || newState === RIDE_STATE.CANCELLED_BY_PASSENGER) {
        await notify(
          "passenger",
          passengerUserId,
          "warning",
          "Corrida cancelada",
          "A corrida foi cancelada.",
          newState === RIDE_STATE.CANCELLED_BY_DRIVER
            ? "ride_canceled_by_driver"
            : "ride_canceled_by_passenger",
          passengerTrackingUrl,
        );
        await notify(
          "driver",
          driverUserId,
          "warning",
          "Corrida cancelada",
          "A corrida foi cancelada.",
          newState === RIDE_STATE.CANCELLED_BY_DRIVER
            ? "ride_canceled_by_driver"
            : "ride_canceled_by_passenger",
          isDeliveryMode ? mobilityRoutes.motoboy.entregas : mobilityRoutes.motorista.corridas,
        );
      }
    } catch (error) {
      logger.error('RideOperationalService.handlePostTransition', error as Error, { rideId, newState });
    }
  }

  private static async resolveUserIdFromProfileId(profileId: string | null): Promise<string | null> {
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

  /**
   * Registra mudanca de estado
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
