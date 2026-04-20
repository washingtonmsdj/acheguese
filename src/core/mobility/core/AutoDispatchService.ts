/**
 * AUTO DISPATCH SERVICE - Dispatch Automático de Corridas
 * 
 * Responsabilidades:
 * - Buscar motoristas elegíveis automaticamente
 * - Oferecer corrida sequencialmente (não broadcast)
 * - Timeout por motorista
 * - Retry para próximo motorista
 * - Expiração se ninguém aceitar
 * - Auditoria completa do processo
 */

import { logger } from "@/shared/utils/logger";
import { realtimeService } from "@/core/realtime/services/RealtimeService";
import { RIDE_STATE, type RideState } from "./RideStateMachine";
import { RideDispatchService } from "./RideDispatchService";
import {
  getRideDispatchData,
  getRideById,
} from "../services/mobility.queries";
import { updateRideIfStatusIn } from "../services/mobility.mutations";
import { mobilityAuditService } from "../services/MobilityAuditService";
import { TIMEOUTS, BUSINESS_RULES, REALTIME_CHANNELS } from "../constants";

// ============================================
// CONFIGURAÇÕES (Migradas para constants)
// ============================================

const CONFIG = {
  OFFER_TIMEOUT_SECONDS: TIMEOUTS.OFFER_TIMEOUT_SECONDS,
  MAX_RETRY_ATTEMPTS: BUSINESS_RULES.MAX_RETRY_ATTEMPTS,
  TOTAL_TIMEOUT_MINUTES: TIMEOUTS.TOTAL_TIMEOUT_MINUTES,
  SEARCH_RADIUS_KM: BUSINESS_RULES.SEARCH_RADIUS_KM,
};

// ============================================
// TIPOS
// ============================================

interface DispatchAttempt {
  rideId: string;
  driverProfileId: string;
  attemptNumber: number;
  offeredAt: string;
  timeoutAt: string;
  status: 'pending' | 'accepted' | 'timeout' | 'rejected';
  respondedAt?: string;
}

interface DispatchResult {
  success: boolean;
  rideId: string;
  driverProfileId?: string;
  totalAttempts: number;
  reason?: 'accepted' | 'expired' | 'no_drivers' | 'error';
  error?: string;
}

interface DispatchRideData {
  id: string;
  status: string;
  passenger_profile_id?: string | null;
  pickup_address_id?: string | null;
  pickup_location_id?: string | null;
  ride_mode?: string | null;
  created_at: string;
  pickup_address?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

// ============================================
// AUTO DISPATCH SERVICE
// ============================================

export class AutoDispatchService {
  private static activeDispatches = new Map<string, NodeJS.Timeout>();

  /**
   * Inicia dispatch automático para uma corrida
   */
  static async startDispatch(rideId: string): Promise<DispatchResult> {
    try {
      logger.info('AutoDispatch: Starting', { rideId });

      // Buscar dados da corrida via SSOT
      const ride = await getRideDispatchData(rideId) as DispatchRideData | null;
      if (!ride) {
        throw new Error('Ride not found');
      }

      // Validar estado
      if (ride.status !== RIDE_STATE.SEARCHING_DRIVER) {
        return {
          success: false,
          rideId,
          totalAttempts: 0,
          reason: 'error',
          error: `Invalid state for dispatch: ${ride.status}`,
        };
      }

      // Verificar timeout total
      const createdAt = new Date(ride.created_at);
      const now = new Date();
      const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (minutesElapsed > CONFIG.TOTAL_TIMEOUT_MINUTES) {
        await this.expireRide(rideId, 'Total timeout exceeded');
        return {
          success: false,
          rideId,
          totalAttempts: 0,
          reason: 'expired',
        };
      }

      // Buscar coordenadas de origem
      const pickupLat = ride.pickup_address?.latitude;
      const pickupLng = ride.pickup_address?.longitude;

      if (!pickupLat || !pickupLng) {
        throw new Error('Pickup coordinates not found');
      }

      const rideMode = ride.ride_mode === 'motoboy' ? 'motoboy' : 'ride';

      // Buscar motoristas elegíveis
      const eligibleDrivers = await RideDispatchService.findEligibleDrivers(
        rideId,
        pickupLat,
        pickupLng,
        CONFIG.SEARCH_RADIUS_KM,
        rideMode,
        ride.pickup_location_id ?? null
      );

      if (eligibleDrivers.length === 0) {
        await this.expireRide(rideId, 'No eligible drivers found');
        return {
          success: false,
          rideId,
          totalAttempts: 0,
          reason: 'no_drivers',
        };
      }

      logger.info('AutoDispatch: Found eligible drivers', {
        rideId,
        count: eligibleDrivers.length,
      });

      // Tentar oferecer para motoristas sequencialmente
      const maxAttempts = Math.min(eligibleDrivers.length, CONFIG.MAX_RETRY_ATTEMPTS);
      
      for (let i = 0; i < maxAttempts; i++) {
        const driver = eligibleDrivers[i];
        const attemptNumber = i + 1;

        logger.info('AutoDispatch: Offering to driver', {
          rideId,
          driverProfileId: driver.profileId,
          attemptNumber,
          distance: driver.distance,
        });

        // Registrar tentativa
        await this.logDispatchAttempt({
          rideId,
          driverProfileId: driver.profileId,
          attemptNumber,
          offeredAt: new Date().toISOString(),
          timeoutAt: new Date(Date.now() + CONFIG.OFFER_TIMEOUT_SECONDS * 1000).toISOString(),
          status: 'pending',
        });

        // Atribuir motorista
        const assignResult = await RideDispatchService.assignDriver(
          rideId,
          driver.profileId,
          RIDE_STATE.SEARCHING_DRIVER
        );

        if (!assignResult.success) {
          logger.warn('AutoDispatch: Failed to assign driver', {
            rideId,
            driverProfileId: driver.profileId,
            error: assignResult.error,
          });
          continue;
        }

        // Enviar notificação realtime para motorista
        await this.notifyDriver(rideId, driver.profileId);

        // Aguardar aceite ou timeout
        const accepted = await this.waitForAcceptance(
          rideId,
          driver.profileId,
          CONFIG.OFFER_TIMEOUT_SECONDS
        );

        if (accepted) {
          // Sucesso!
          await this.updateDispatchAttempt(rideId, driver.profileId, {
            status: 'accepted',
            respondedAt: new Date().toISOString(),
          });

          logger.info('AutoDispatch: Driver accepted', {
            rideId,
            driverProfileId: driver.profileId,
            attemptNumber,
          });

          return {
            success: true,
            rideId,
            driverProfileId: driver.profileId,
            totalAttempts: attemptNumber,
            reason: 'accepted',
          };
        }

        // Timeout - tentar próximo motorista
        await this.updateDispatchAttempt(rideId, driver.profileId, {
          status: 'timeout',
          respondedAt: new Date().toISOString(),
        });

        logger.info('AutoDispatch: Driver timeout, trying next', {
          rideId,
          driverProfileId: driver.profileId,
          attemptNumber,
        });

        // Voltar para searching_driver para tentar próximo
        await updateRideIfStatusIn(
          rideId,
          {
            status: RIDE_STATE.SEARCHING_DRIVER,
            driver_profile_id: null,
            updated_at: new Date().toISOString(),
          },
          [RIDE_STATE.DRIVER_ASSIGNED],
        );
      }

      // Nenhum motorista aceitou
      await this.expireRide(rideId, 'No driver accepted after all attempts');
      
      return {
        success: false,
        rideId,
        totalAttempts: maxAttempts,
        reason: 'expired',
      };
    } catch (error) {
      logger.error('AutoDispatch: Error', error as Error, { rideId });
      return {
        success: false,
        rideId,
        totalAttempts: 0,
        reason: 'error',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Aguarda aceite do motorista ou timeout
   */
  private static async waitForAcceptance(
    rideId: string,
    driverProfileId: string,
    timeoutSeconds: number
  ): Promise<boolean> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      // Verificar se motorista aceitou
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
      } | null;

      if (ride?.status === RIDE_STATE.DRIVER_ACCEPTED && 
          ride?.driver_profile_id === driverProfileId) {
        return true;
      }

      // Verificar se corrida foi cancelada ou mudou de estado
      if (ride?.status !== RIDE_STATE.DRIVER_ASSIGNED) {
        return false;
      }

      // Aguardar antes de verificar novamente
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return false;
  }

  /**
   * Expira corrida por falta de motorista
   */
  private static async expireRide(rideId: string, reason: string): Promise<void> {
    try {
      await updateRideIfStatusIn(
        rideId,
        {
          status: RIDE_STATE.EXPIRED,
          updated_at: new Date().toISOString(),
        },
        [RIDE_STATE.SEARCHING_DRIVER, RIDE_STATE.DRIVER_ASSIGNED],
      );

      await mobilityAuditService.logRideStateChange({
        rideId,
        fromState: RIDE_STATE.SEARCHING_DRIVER,
        toState: RIDE_STATE.EXPIRED,
        changedBy: 'system',
        reason,
      });

      // Notificar passageiro
      await this.notifyPassenger(rideId, 'expired');

      logger.info('AutoDispatch: Ride expired', { rideId, reason });
    } catch (error) {
      logger.error('AutoDispatch: Error expiring ride', error as Error, { rideId });
    }
  }

  /**
   * Registra tentativa de dispatch
   */
  private static async logDispatchAttempt(attempt: DispatchAttempt): Promise<void> {
    try {
      await mobilityAuditService.logDispatchAttempt({
        rideId: attempt.rideId,
        driverProfileId: attempt.driverProfileId,
        attemptNumber: attempt.attemptNumber,
        offeredAt: attempt.offeredAt,
        timeoutAt: attempt.timeoutAt,
        status: attempt.status,
      });
    } catch (error) {
      logger.error('AutoDispatch: Error logging attempt', error as Error, attempt);
    }
  }

  /**
   * Atualiza tentativa de dispatch
   */
  private static async updateDispatchAttempt(
    rideId: string,
    driverProfileId: string,
    updates: Partial<DispatchAttempt>
  ): Promise<void> {
    try {
      await mobilityAuditService.updateLatestDispatchAttempt(rideId, driverProfileId, {
        status: updates.status,
        respondedAt: updates.respondedAt,
      });
    } catch (error) {
      logger.error('AutoDispatch: Error updating attempt', error as Error, {
        rideId,
        driverProfileId,
      });
    }
  }

  /**
   * Notifica motorista sobre nova corrida
   */
  private static async notifyDriver(rideId: string, driverProfileId: string): Promise<void> {
    try {
      await realtimeService.sendBroadcast(
        REALTIME_CHANNELS.driver(driverProfileId),
        "ride_offered",
        { rideId, offeredAt: new Date().toISOString() },
      );
    } catch (error) {
      logger.error('AutoDispatch: Error notifying driver', error as Error, {
        rideId,
        driverProfileId,
      });
    }
  }

  /**
   * Notifica passageiro sobre mudança de estado
   */
  private static async notifyPassenger(rideId: string, event: string): Promise<void> {
    try {
      const ride = await getRideDispatchData(rideId) as DispatchRideData | null;

      if (ride?.passenger_profile_id) {
        await realtimeService.sendBroadcast(
          REALTIME_CHANNELS.passenger(ride.passenger_profile_id),
          `ride_${event}`,
          { rideId, timestamp: new Date().toISOString() },
        );
      }
    } catch (error) {
      logger.error('AutoDispatch: Error notifying passenger', error as Error, { rideId });
    }
  }

  /**
   * Cancela dispatch ativo
   */
  static cancelDispatch(rideId: string): void {
    const timer = this.activeDispatches.get(rideId);
    if (timer) {
      clearTimeout(timer);
      this.activeDispatches.delete(rideId);
      logger.info('AutoDispatch: Cancelled', { rideId });
    }
  }
}
