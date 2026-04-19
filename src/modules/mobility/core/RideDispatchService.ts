/**
 * RIDE DISPATCH SERVICE - Atribuição e Aceite de Corridas
 * 
 * Gerencia:
 * - Busca de motorista elegível
 * - Aceite com lock/garantia de unicidade
 * - Timeout de aceite
 * - Expiração da solicitação
 */

import { logger } from "@/shared/utils/logger";
import { RIDE_STATE, RideStateMachine, type RideState } from "./RideStateMachine";
import {
  getActiveRideByDriverProfile,
  getRideById,
} from "../services/mobility.queries";
import { updateRideWithGuards } from "../services/mobility.mutations";
import { DriverAvailabilityService } from "../services/DriverAvailabilityService";
import { mobilityAuditService } from "../services/MobilityAuditService";

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
  ACCEPT_TIMEOUT_MINUTES: 5,
  REQUEST_EXPIRATION_MINUTES: 15,
  MAX_SEARCH_RADIUS_KM: 10,
};

// ============================================
// TIPOS
// ============================================

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
  reason?: 'already_accepted' | 'invalid_state' | 'driver_busy' | 'expired' | 'unknown';
}

// ============================================
// RIDE DISPATCH SERVICE
// ============================================

export class RideDispatchService {
  /**
   * Busca motoristas elegíveis para uma corrida
   * 
   * GATE 5: Usa DriverAvailabilityService como SSOT
   * @param rideMode 'ride' | 'motoboy' — filtra can_do_delivery quando motoboy
   */
  static async findEligibleDrivers(
    rideId: string,
    originLat: number,
    originLng: number,
    maxRadius: number = CONFIG.MAX_SEARCH_RADIUS_KM,
    rideMode: 'ride' | 'motoboy' = 'ride',
    pickupLocationId?: string | null
  ): Promise<DriverEligibility[]> {
    try {
      // GATE 5: Usar service oficial ao invés de acesso direto
      const { DriverAvailabilityService } = await import('@/modules/mobility/services/DriverAvailabilityService');
      
      const availableDrivers = await DriverAvailabilityService.findAvailableDrivers(
        originLat,
        originLng,
        maxRadius,
        rideMode,
        pickupLocationId
      );

      if (availableDrivers.length === 0) return [];

      // Converter para formato DriverEligibility
      const eligible: DriverEligibility[] = availableDrivers.map(d => ({
        profileId: d.profileId,
        distance: d.distance,
        isAvailable: true, // Sempre true pois vem do service
        hasActiveRide: false, // Sempre false pois service já filtra
        rating: d.rating,
      }));

      return eligible;
    } catch (error) {
      logger.error('RideDispatchService.findEligibleDrivers', error as Error, { rideId });
      return [];
    }
  }

  /**
   * Atribui corrida a um motorista
   */
  static async assignDriver(
    rideId: string,
    driverProfileId: string,
    currentState: RideState
  ): Promise<DispatchResult> {
    try {
      // Validar transição
      if (!RideStateMachine.canTransition(currentState, RIDE_STATE.DRIVER_ASSIGNED)) {
        return {
          success: false,
          error: `Cannot assign driver from state: ${currentState}`,
        };
      }

      // DIAGNÓSTICO GATE 7: Log antes do .single()
      logger.info('RideDispatchService.assignDriver - BEFORE .single()', {
        method: 'assignDriver',
        step: 'check_driver_availability',
        rideId,
        driverProfileId,
      });

      // Verificar se motorista está disponível via SSOT
      const availability = await DriverAvailabilityService.getStatus(driverProfileId);
      const availError = null;
      const availCount = availability ? 1 : 0;

      // DIAGNÓSTICO GATE 7: Log após o .single()
      logger.info('RideDispatchService.assignDriver - AFTER .single()', {
        method: 'assignDriver',
        step: 'check_driver_availability',
        rideId,
        driverProfileId,
        rowsReturned: availCount,
        hasData: !!availability,
        hasError: !!availError,
        errorCode: (availError as any)?.code,
        errorMessage: (availError as any)?.message,
        errorDetails: (availError as any)?.details,
        errorHint: (availError as any)?.hint,
      });

      if (availError) throw availError;
      if (!availability?.isOnline || !availability?.isAvailable) {
        return {
          success: false,
          error: 'Driver not available',
        };
      }

      // Verificar se motorista já tem corrida ativa
      const activeRide = await getActiveRideByDriverProfile(
        driverProfileId,
        [
          RIDE_STATE.DRIVER_ACCEPTED,
          RIDE_STATE.DRIVER_ARRIVING,
          RIDE_STATE.PASSENGER_BOARDED,
          RIDE_STATE.IN_PROGRESS,
        ],
      );

      if (activeRide) {
        return {
          success: false,
          error: 'Driver already has active ride',
        };
      }

      // Atribuir motorista com optimistic locking
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
        return {
          success: false,
          error: 'Ride state changed during assignment',
        };
      }

      // Registrar auditoria
      await this.logStateChange(
        rideId,
        currentState,
        RIDE_STATE.DRIVER_ASSIGNED,
        'system',
        'Driver assigned by dispatch'
      );

      return {
        success: true,
        rideId,
        driverProfileId,
      };
    } catch (error) {
      logger.error('RideDispatchService.assignDriver', error as Error, { rideId, driverProfileId });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Motorista aceita corrida (com lock de unicidade)
   */
  static async acceptRide(
    rideId: string,
    driverProfileId: string
  ): Promise<AcceptResult> {
    try {
      // DIAGNÓSTICO GATE 7: Log estruturado antes do .single()
      logger.info('RideDispatchService.acceptRide - BEFORE .single()', {
        method: 'acceptRide',
        step: 'fetch_ride_state',
        rideId,
        driverProfileId,
      });

      // Buscar estado atual da corrida via SSOT
      const ride = await getRideById(rideId) as {
        status?: string;
        driver_profile_id?: string | null;
        created_at?: string;
        ride_mode?: string | null;
      } | null;

      // DIAGNÓSTICO GATE 7: Log estruturado após o .single()
      logger.info('RideDispatchService.acceptRide - AFTER .single()', {
        method: 'acceptRide',
        step: 'fetch_ride_state',
        rideId,
        driverProfileId,
        rowsReturned: ride ? 1 : 0,
        hasData: !!ride,
        hasError: false,
      });

      if (!ride) {
        return {
          success: false,
          error: 'Ride not found',
          reason: 'unknown',
        };
      }

      const currentState = ride.status as RideState;

      // Verificar se corrida expirou
      const createdAt = new Date(ride.created_at || new Date().toISOString());
      const now = new Date();
      const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (minutesElapsed > CONFIG.REQUEST_EXPIRATION_MINUTES) {
        await this.expireRide(rideId, currentState);
        return {
          success: false,
          error: 'Ride expired',
          reason: 'expired',
        };
      }

      // Validar se motorista pode aceitar
      if (!RideStateMachine.canDriverAccept(currentState)) {
        return {
          success: false,
          error: `Cannot accept ride in state: ${currentState}`,
          reason: 'invalid_state',
        };
      }

      // Verificar se é o motorista atribuído
      if (ride.driver_profile_id !== driverProfileId) {
        return {
          success: false,
          error: 'Ride assigned to another driver',
          reason: 'already_accepted',
        };
      }

      // Verificar se motorista já tem corrida ativa
      const activeRide = await getActiveRideByDriverProfile(
        driverProfileId,
        [
          RIDE_STATE.DRIVER_ACCEPTED,
          RIDE_STATE.DRIVER_ARRIVING,
          RIDE_STATE.PASSENGER_BOARDED,
          RIDE_STATE.IN_PROGRESS,
        ],
        rideId,
      );

      if (activeRide) {
        return {
          success: false,
          error: 'Driver already has active ride',
          reason: 'driver_busy',
        };
      }

      // Aceitar corrida com optimistic locking
      const accepted = await updateRideWithGuards(
        rideId,
        {
          status: RIDE_STATE.DRIVER_ACCEPTED,
          updated_at: new Date().toISOString(),
        },
        {
          statusEq: RIDE_STATE.DRIVER_ASSIGNED,
          driverProfileIdEq: driverProfileId,
        },
      );

      if (!accepted) {
        // Pode ter sido aceita por outro motorista ou mudou de estado
        return {
          success: false,
          error: 'Failed to accept ride - state changed',
          reason: 'already_accepted',
        };
      }

      // GATE 5: Marcar motorista como busy com active_ride_id
      const { DriverAvailabilityService } = await import('@/modules/mobility/services/DriverAvailabilityService');
      const rideMode = ride.ride_mode || 'ride';
      await DriverAvailabilityService.setBusy(driverProfileId, rideId, rideMode as 'ride' | 'motoboy');

      // Registrar auditoria
      await this.logStateChange(
        rideId,
        RIDE_STATE.DRIVER_ASSIGNED,
        RIDE_STATE.DRIVER_ACCEPTED,
        driverProfileId,
        'Driver accepted ride'
      );

      return {
        success: true,
        rideId,
      };
    } catch (error) {
      logger.error('RideDispatchService.acceptRide', error as Error, { rideId, driverProfileId });
      return {
        success: false,
        error: (error as Error).message,
        reason: 'unknown',
      };
    }
  }

  /**
   * Expira corrida por timeout
   */
  static async expireRide(rideId: string, currentState: RideState): Promise<void> {
    try {
      if (!RideStateMachine.canTransition(currentState, RIDE_STATE.EXPIRED)) {
        return;
      }

      await updateRideWithGuards(
        rideId,
        {
          status: RIDE_STATE.EXPIRED,
          updated_at: new Date().toISOString(),
        },
        { statusEq: currentState },
      );

      await this.logStateChange(
        rideId,
        currentState,
        RIDE_STATE.EXPIRED,
        'system',
        'Ride expired - no driver accepted'
      );
    } catch (error) {
      logger.error('RideDispatchService.expireRide', error as Error, { rideId });
    }
  }

  /**
   * Registra mudança de estado na auditoria
   */
  private static async logStateChange(
    rideId: string,
    fromState: RideState,
    toState: RideState,
    actor: string,
    reason: string
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
      logger.error('RideDispatchService.logStateChange', error as Error, { rideId });
    }
  }

  /**
   * Calcula distância entre dois pontos (Haversine)
   * 
   * GATE 1: Mantido apenas como fallback de emergência para busca de motoristas
   * NÃO deve ser usado para ETA ou pricing
   */
  private static calculateDistanceFallback(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
