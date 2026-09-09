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
import { getDriverDataByProfileIds, getDriverOfferCapabilities } from './mobility.queries';
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
   * Motorista fica disponível (corrida encerrada)
   * Transição: busy ? online_available
   * 
   * Exige: active_ride_id = rideId (validação de corrida correta)
   * Limpa: active_ride_id, busy_since, active_ride_mode
   */
  static async releaseBusy(
    driverProfileId: string,
    rideId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const released = await MobilityRpcService.releaseDriverAvailabilityForRide(
        driverProfileId,
        rideId,
      );

      if (released !== true) {
        return {
          success: false,
          error: 'Driver was not busy with the specified ride or was already released',
        };
      }

      logger.info('DriverAvailabilityService.releaseBusy', { driverProfileId, rideId });

      return { success: true };
    } catch (error) {
      logger.error('DriverAvailabilityService.releaseBusy', error as Error, { driverProfileId, rideId });
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
  static async findAvailableDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
    rideMode?: 'ride' | 'motoboy',
    locationId?: string | null
  ): Promise<AvailableDriver[]> {
    try {
      // GATE 5: SSOT - busca centralizada de motoristas disponíveis
      // Buscar driver_availability primeiro (não há FK direto com driver_data)
      const { data: drivers, error } = await supabase
        .from('driver_availability')
        .select('profile_id, current_lat, current_lng, last_seen_at')
        .eq('is_online', true)
        .eq('is_available', true)
        .is('active_ride_id', null) // GATE 5: Garantir sem corrida ativa
        .not('current_lat', 'is', null)
        .not('current_lng', 'is', null);

      if (error) throw error;
      if (!drivers || drivers.length === 0) return [];

      // Buscar driver_data separadamente via SSOT
      const profileIds = drivers.map(d => d.profile_id);
      const profileLocationMap = new Map<string, string | null>();
      const locationMetaMap = new Map<string, { id: string; type: string; parent_id: string | null }>();
      let rideOperationalCityId: string | null = null;

      if (locationId) {
        const { data: profileRows, error: profileError } = await supabase
          .from('public_profiles')
          .select('id, location_id')
          .in('id', profileIds);

        if (profileError) throw profileError;

        for (const row of profileRows ?? []) {
          profileLocationMap.set(row.id, row.location_id);
        }

        const locationIdsToLoad = new Set<string>([locationId]);
        for (const value of profileLocationMap.values()) {
          if (value) {
            locationIdsToLoad.add(value);
          }
        }

        const { data: locationRows, error: locationError } = await supabase
          .from('locations')
          .select('id, type, parent_id')
          .in('id', Array.from(locationIdsToLoad));

        if (locationError) throw locationError;

        for (const row of locationRows ?? []) {
          locationMetaMap.set(row.id, {
            id: row.id,
            type: row.type,
            parent_id: row.parent_id,
          });
        }

        const resolveOperationalCityId = (id: string | null | undefined): string | null => {
          if (!id) return null;
          const meta = locationMetaMap.get(id);
          if (!meta) return id;

          if (meta.type === 'city') return meta.id;
          if (meta.type === 'district' && meta.parent_id) return meta.parent_id;
          return meta.id;
        };

        rideOperationalCityId = resolveOperationalCityId(locationId);
      }

      const driverData = await getDriverDataByProfileIds(profileIds) as Array<{
        profile_id: string;
        rating?: number | null;
        can_do_delivery?: boolean | null;
        can_do_rides?: boolean | null;
        is_verified?: boolean | null;
        is_suspended?: boolean | null;
        subscription_active?: boolean | null;
      }>;

      // Criar mapa de driver_data por profile_id
      const dataMap = new Map(driverData?.map(d => [d.profile_id, d]) || []);

      // Calcular distância e filtrar por raio e capacidade
      const available: AvailableDriver[] = [];

      for (const d of drivers) {
        const data = dataMap.get(d.profile_id);
        if (!data) continue; // Ignorar motoristas sem driver_data
        if (data.is_suspended) continue;
        if (data.is_verified !== true) continue;
        if (data.subscription_active !== true) continue;

        // Escopo territorial canônico: dispatch só pode atribuir motorista do mesmo location_id da solicitação
        if (locationId) {
          const driverLocationId = profileLocationMap.get(d.profile_id);
          if (!driverLocationId) continue;

          const driverMeta = locationMetaMap.get(driverLocationId);
          const driverOperationalCityId =
            driverMeta?.type === 'city'
              ? driverMeta.id
              : driverMeta?.type === 'district' && driverMeta.parent_id
                ? driverMeta.parent_id
                : driverLocationId;

          const sameOperationalTerritory =
            !!rideOperationalCityId &&
            !!driverOperationalCityId &&
            rideOperationalCityId === driverOperationalCityId;

          if (!sameOperationalTerritory) continue;
        }

        // Filtrar por capacidade de entrega quando for motoboy
        if (rideMode === 'motoboy' && !data.can_do_delivery) continue;
        // Filtrar por capacidade de corrida quando for ride
        if (rideMode === 'ride' && data.can_do_rides === false) continue;

        const distance = this.calculateDistance(
          lat,
          lng,
          d.current_lat,
          d.current_lng
        );

        if (distance <= radiusKm) {
          available.push({
            profileId: d.profile_id,
            distance,
            rating: data.rating || 0,
            currentLocation: { lat: d.current_lat, lng: d.current_lng },
            lastSeenAt: d.last_seen_at,
          });
        }
      }

      // Ordenar por distância
      available.sort((a, b) => a.distance - b.distance);

      return available;
    } catch (error) {
      const errorDetails = this.getErrorDetails(error);
      logger.error('DriverAvailabilityService.findAvailableDrivers detailed error', {
        error: error,
        ...errorDetails,
      });
      logger.error('DriverAvailabilityService.findAvailableDrivers', error as Error);
      return [];
    }
  }

  /**
   * Calcula distância Haversine (fallback)
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
