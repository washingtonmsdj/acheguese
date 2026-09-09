/**
 * GATE 5: DRIVER AVAILABILITY SERVICE
 * 
 * SSOT para disponibilidade operacional do motorista
 * 
 * Responsabilidades:
 * - Gerenciar transições de estado (offline/online/available/busy)
 * - Validar disponibilidade para dispatch
 * - Detectar motoristas stale
 * - Integrar com corrida/tracking/reconexão
 * 
 * Regras:
 * - Transações atômicas no banco (sem read-then-write)
 * - Bootstrap automático (upsert se não existir)
 * - Stale busy NÃO libera automaticamente
 * - active_ride_id amarrado à corrida
 */
import { logger } from '@/shared/utils/logger';
import { supabase as supabaseClient } from '@/integrations/supabase';
import { getDriverOfferCapabilities } from './mobility.queries';
import { MobilityService } from './MobilityService.impl';
import { MobilityRpcService } from './MobilityRpcService';

// No browser, sempre usa o cliente público com RLS.
// Em testes Node, o arquivo de setup deve injetar um cliente com service role
// via variável de módulo — nunca via bundle de produção.
const supabase = supabaseClient;

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  insert(values: Record<string, unknown> | Record<string, unknown>[]): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type DriverAvailabilityRpcClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

const driverAvailabilityDb = supabase as unknown as DriverAvailabilityRpcClient;

// ============================================
// CONSTANTS
// ============================================

export const AVAILABILITY_CONFIG = {
  STALE_THRESHOLD_MINUTES: 5,
  HEARTBEAT_INTERVAL_MS: 30000, // 30s
  HEALTH_CHECK_INTERVAL_MS: 60000, // 1min
} as const;

export type AvailabilityStatus = 'offline' | 'online_warming_up' | 'online_available' | 'busy';

// ============================================
// TYPES
// ============================================

export interface DriverAvailabilityStatus {
  profileId: string;
  isOnline: boolean;
  isAvailable: boolean;
  status: AvailabilityStatus;
  currentLocation?: { lat: number; lng: number };
  lastLocationUpdate?: string;
  lastSeenAt?: string;
  activeRideId?: string;
  busySince?: string;
  activeRideMode?: 'ride' | 'motoboy';
  updatedAt: string;
}

export interface AvailableDriver {
  profileId: string;
  distance: number;
  rating: number;
  currentLocation: { lat: number; lng: number };
  lastSeenAt: string;
}

export interface StaleDriversResult {
  markedOffline: number;
  staleBusy: number;
}

// ============================================
// DRIVER AVAILABILITY SERVICE
// ============================================

export class DriverAvailabilityService {
  private static getErrorDetails(error: unknown): {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  } {
    if (!error || typeof error !== 'object') {
      return {};
    }
    const candidate = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    return {
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
      code: typeof candidate.code === 'string' ? candidate.code : undefined,
      details: typeof candidate.details === 'string' ? candidate.details : undefined,
      hint: typeof candidate.hint === 'string' ? candidate.hint : undefined,
    };
  }

  /**
   * Garante bootstrap mínimo de driver_data para que o motorista possa
   * participar de dispatch (ride/motoboy) sem depender de migração manual.
   */
  private static async ensureDriverDataRow(
    driverProfileId: string
  ): Promise<void> {
    await MobilityService.ensureDriverDataRow(driverProfileId);
  }

  private static async getOperationalBlockReason(
    driverProfileId: string,
    rideMode?: 'ride' | 'motoboy',
  ): Promise<string | null> {
    const capabilities = await getDriverOfferCapabilities(driverProfileId);

    if (!capabilities) return 'Perfil de motorista nao encontrado.';
    if (capabilities.is_suspended) return 'Motorista suspenso.';
    if (capabilities.is_verified !== true) return 'Motorista nao verificado.';
    if (capabilities.subscription_active !== true) return 'Assinatura inativa.';
    if (rideMode === 'motoboy' && capabilities.can_do_delivery !== true) {
      return 'Motorista nao habilitado para entregas.';
    }
    if (rideMode === 'ride' && capabilities.can_do_rides === false) {
      return 'Motorista nao habilitado para corridas.';
    }

    return null;
  }

  /**
   * Motorista fica online (sem disponibilidade ainda)
   * Transição: offline ? online_warming_up
   * 
   * Bootstrap: cria registro se não existir
   */
  static async goOnline(
    driverProfileId: string,
    rideMode?: 'ride' | 'motoboy'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureDriverDataRow(driverProfileId);

      const blockReason = await this.getOperationalBlockReason(driverProfileId, rideMode);
      if (blockReason) {
        return { success: false, error: blockReason };
      }

      const result = await MobilityRpcService.updateDriverAvailability({
        driverProfileId,
        availabilityAction: 'go_online',
        rideMode,
      });

      if (result.success !== true) {
        return {
          success: false,
          error: result.error || result.reason || 'Could not set driver online',
        };
      }

      logger.info('DriverAvailabilityService.goOnline', { driverProfileId, rideMode });
      return { success: true };
    } catch (error) {
      logger.error('DriverAvailabilityService.goOnline', error as Error, { driverProfileId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motorista fica offline
   * Transição: qualquer ? offline
   * 
   * Valida: não pode ter corrida ativa
   */
  static async goOffline(
    driverProfileId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await MobilityRpcService.updateDriverAvailability({
        driverProfileId,
        availabilityAction: 'go_offline',
      });

      if (result.success !== true) {
        return {
          success: false,
          error: result.error || result.reason || 'Could not set driver offline',
        };
      }

      logger.info('DriverAvailabilityService.goOffline', { driverProfileId });
      return { success: true };
    } catch (error) {
      logger.error('DriverAvailabilityService.goOffline', error as Error, { driverProfileId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motorista fica disponível para corridas
   * Transição: online_warming_up ? online_available
   * 
   * Exige: is_online = true, coordenadas válidas
   */
  static async setAvailable(
    driverProfileId: string,
    location: { lat: number; lng: number },
    rideMode?: 'ride' | 'motoboy'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (
        !location
        || !Number.isFinite(location.lat)
        || !Number.isFinite(location.lng)
        || location.lat < -90
        || location.lat > 90
        || location.lng < -180
        || location.lng > 180
      ) {
        return {
          success: false,
          error: 'Location is required to become available',
        };
      }

      const blockReason = await this.getOperationalBlockReason(driverProfileId, rideMode);
      if (blockReason) {
        return { success: false, error: blockReason };
      }

      const result = await MobilityRpcService.updateDriverAvailability({
        driverProfileId,
        availabilityAction: 'set_available',
        rideMode,
        lat: location.lat,
        lng: location.lng,
      });

      if (result.success !== true) {
        return {
          success: false,
          error: result.error || result.reason || 'Could not set driver available',
        };
      }

      logger.info('DriverAvailabilityService.setAvailable', { driverProfileId, rideMode });
      return { success: true };
    } catch (error) {
      logger.error('DriverAvailabilityService.setAvailable', error as Error, { driverProfileId });
      return { success: false, error: (error as Error).message };
    }
  }

  static async pauseAvailable(
    driverProfileId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await MobilityRpcService.updateDriverAvailability({
        driverProfileId,
        availabilityAction: 'pause_available',
      });

      if (result.success !== true) {
        return {
          success: false,
          error: result.error || result.reason || 'Could not pause driver availability',
        };
      }

      logger.info('DriverAvailabilityService.pauseAvailable', { driverProfileId });
      return { success: true };
    } catch (error) {
      logger.error('DriverAvailabilityService.pauseAvailable', error as Error, { driverProfileId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Busca status atual
   */
  static async getStatus(
    driverProfileId: string
  ): Promise<DriverAvailabilityStatus | null> {
    try {
      const { data, error } = await supabase
        .from('driver_availability')
        .select('*')
        .eq('profile_id', driverProfileId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Determinar status conceitual
      let status: AvailabilityStatus;
      if (!data.is_online) {
        status = 'offline';
      } else if (data.is_available) {
        status = 'online_available';
      } else if (data.active_ride_id) {
        status = 'busy';
      } else {
        status = 'online_warming_up';
      }

      return {
        profileId: data.profile_id,
        isOnline: data.is_online,
        isAvailable: data.is_available,
        status,
        currentLocation: data.current_lat && data.current_lng
          ? { lat: data.current_lat, lng: data.current_lng }
          : undefined,
        lastLocationUpdate: data.last_location_update || undefined,
        lastSeenAt: data.last_seen_at || undefined,
        activeRideId: data.active_ride_id || undefined,
        busySince: data.busy_since || undefined,
        activeRideMode: (data.active_ride_mode as 'ride' | 'motoboy' | null) || undefined,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      logger.error('DriverAvailabilityService.getStatus', error as Error, { driverProfileId });
      return null;
    }
  }

  /**
   * Atualiza last_seen_at (chamado por tracking/heartbeat)
   */
  static async markLastSeen(
    driverProfileId: string
  ): Promise<void> {
    try {
      const result = await MobilityRpcService.updateDriverAvailability({
        driverProfileId,
        availabilityAction: 'heartbeat',
      });

      if (result.success !== true) {
        logger.warn('DriverAvailabilityService.markLastSeen rejected', {
          driverProfileId,
          reason: result.error || result.reason,
        });
      }
    } catch (error) {
      logger.error('DriverAvailabilityService.markLastSeen', error as Error, { driverProfileId });
    }
  }

  /**
   * Marca motoristas DISPONÍVEIS stale como offline
   * Motoristas BUSY stale NÃO são liberados automaticamente
   * 
   * Retorna: { markedOffline: number, staleBusy: number }
   */
  static async markStaleDrivers(
    staleThresholdMinutes: number = AVAILABILITY_CONFIG.STALE_THRESHOLD_MINUTES
  ): Promise<StaleDriversResult> {
    try {
      const result = await MobilityRpcService.reconcileStaleDriverAvailability(
        staleThresholdMinutes,
      );
      const markedOffline =
        typeof result.markedOffline === 'number' ? result.markedOffline : 0;
      const staleBusy =
        typeof result.staleBusy === 'number' ? result.staleBusy : 0;

      logger.info('DriverAvailabilityService.markStaleDrivers', {
        markedOffline,
        staleBusy,
        staleThresholdMinutes,
      });
      return { markedOffline, staleBusy };
    } catch (error) {
      logger.error('DriverAvailabilityService.markStaleDrivers', error as Error);
      return { markedOffline: 0, staleBusy: 0 };
    }
  }

  /**
   * Busca motoristas disponíveis em raio
   * Usado por dispatch
   * 
   * Filtra:
   * - is_online = true
   * - is_available = true
   * - active_ride_id IS NULL
   * - coordenadas válidas
   * - se motoboy, can_do_delivery = true
   */
  static async findAvailableDriversForRide(
    rideId: string,
    radiusKm: number = 15,
    limit: number = 25,
  ): Promise<AvailableDriver[]> {
    try {
      const result = await MobilityRpcService.findAvailableDriversForRide({
        rideId,
        radiusKm,
        limit,
      });

      return (result.drivers ?? []).map((driver) => ({
        profileId: driver.profile_id,
        distance: Number(driver.distance_km),
        rating: Number(driver.rating ?? 0),
        currentLocation: {
          lat: Number(driver.current_lat),
          lng: Number(driver.current_lng),
        },
        lastSeenAt: driver.last_seen_at,
      }));
    } catch (error) {
      logger.error(
        'DriverAvailabilityService.findAvailableDriversForRide',
        error as Error,
        { rideId, radiusKm, limit },
      );
      return [];
    }
  }


}
