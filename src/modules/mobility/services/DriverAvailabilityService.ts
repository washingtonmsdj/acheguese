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
import { getDriverDataByProfileIds } from './mobility.queries';

// No browser, sempre usa o cliente público com RLS.
// Em testes Node, o arquivo de setup deve injetar um cliente com service role
// via variável de módulo — nunca via bundle de produção.
const supabase = supabaseClient;

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
  private static isMissingColumnError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const typed = error as { code?: string; message?: string };
    return typed.code === '42703' || typed.message?.toLowerCase().includes('column') === true;
  }

  private static isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const typed = error as { code?: string; message?: string };
    return typed.code === '23505' || typed.message?.toLowerCase().includes('duplicate key') === true;
  }

  /**
   * Garante bootstrap mínimo de driver_data para que o motorista possa
   * participar de dispatch (ride/motoboy) sem depender de migração manual.
   */
  private static async ensureDriverDataRow(
    driverProfileId: string
  ): Promise<void> {
    const insertWithCapabilities = async () =>
      supabase
        .from('driver_data')
        .insert({
          profile_id: driverProfileId,
          can_do_delivery: true,
          can_do_rides: true,
        });

    const insertLegacy = async () =>
      supabase
        .from('driver_data')
        .insert({
          profile_id: driverProfileId,
        });

    const firstAttempt = await insertWithCapabilities();
    if (!firstAttempt.error) return;
    if (this.isDuplicateKeyError(firstAttempt.error)) return;

    if (this.isMissingColumnError(firstAttempt.error)) {
      const legacyAttempt = await insertLegacy();
      if (!legacyAttempt.error || this.isDuplicateKeyError(legacyAttempt.error)) {
        return;
      }
      throw legacyAttempt.error;
    }

    throw firstAttempt.error;
  }

  /**
   * Motorista fica online (sem disponibilidade ainda)
   * Transição: offline → online_warming_up
   * 
   * Bootstrap: cria registro se não existir
   */
  static async goOnline(
    driverProfileId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Bootstrap de capacidades operacionais (SSOT)
      await this.ensureDriverDataRow(driverProfileId);

      // GATE 5: Bootstrap - upsert para criar se não existir
      const { error } = await supabase
        .from('driver_availability')
        .upsert({
          profile_id: driverProfileId,
          is_online: true,
          is_available: false,
          active_ride_id: null,
          busy_since: null,
          active_ride_mode: null,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id',
        });

      if (error) throw error;

      logger.info('DriverAvailabilityService.goOnline', { driverProfileId });

      return { success: true };
    } catch (error) {
      // Log detalhado do erro
      logger.error('❌ [ERROR] DriverAvailabilityService.goOnline |', {
        driverProfileId,
        error: error,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      
      logger.error('DriverAvailabilityService.goOnline', error as Error, { driverProfileId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motorista fica offline
   * Transição: qualquer → offline
   * 
   * Valida: não pode ter corrida ativa
   */
  static async goOffline(
    driverProfileId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // GATE 5: Transação atômica - só succeed se active_ride_id IS NULL
      const { data, error } = await supabase
        .from('driver_availability')
        .update({
          is_online: false,
          is_available: false,
          active_ride_id: null,
          busy_since: null,
          active_ride_mode: null,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', driverProfileId)
        .is('active_ride_id', null) // Condição atômica
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Cannot go offline with active ride',
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
   * Transição: online_warming_up → online_available
   * 
   * Exige: is_online = true, coordenadas válidas
   */
  static async setAvailable(
    driverProfileId: string,
    location: { lat: number; lng: number }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!location || !location.lat || !location.lng) {
        return {
          success: false,
          error: 'Location is required to become available',
        };
      }

      // GATE 5: Transação atômica - só succeed se is_online = true AND is_available = false AND active_ride_id IS NULL
      const { data, error } = await supabase
        .from('driver_availability')
        .update({
          is_available: true,
          current_lat: location.lat,
          current_lng: location.lng,
          last_location_update: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', driverProfileId)
        .eq('is_online', true) // Condição atômica
        .eq('is_available', false) // Condição atômica
        .is('active_ride_id', null) // Condição atômica
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Driver must be online and not busy to become available',
        };
      }

      logger.info('DriverAvailabilityService.setAvailable', { driverProfileId });

      return { success: true };
    } catch (error) {
      logger.error('DriverAvailabilityService.setAvailable', error as Error, { driverProfileId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motorista fica ocupado (corrida aceita)
   * Transição: online_available → busy
   * 
   * Exige: is_available = true
   * Registra: active_ride_id, busy_since, active_ride_mode
   */
  static async setBusy(
    driverProfileId: string,
    rideId: string,
    rideMode: 'ride' | 'motoboy'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // GATE 5: Transação atômica - só succeed se is_online = true AND is_available = true AND active_ride_id IS NULL
      const { data, error } = await supabase
        .from('driver_availability')
        .update({
          is_available: false,
          active_ride_id: rideId,
          busy_since: new Date().toISOString(),
          active_ride_mode: rideMode,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', driverProfileId)
        .eq('is_online', true) // Condição atômica
        .eq('is_available', true) // Condição atômica
        .is('active_ride_id', null) // Condição atômica
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Driver must be online and available to become busy',
        };
      }

      logger.info('DriverAvailabilityService.setBusy', { driverProfileId, rideId, rideMode });

      return { success: true };
    } catch (error) {
      // Log detalhado do erro
      logger.error('❌ [ERROR] DriverAvailabilityService.setBusy |', {
        driverProfileId,
        rideId,
        rideMode,
        error: error,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
      });
      
      logger.error('DriverAvailabilityService.setBusy', error as Error, { driverProfileId, rideId });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Motorista fica disponível (corrida encerrada)
   * Transição: busy → online_available
   * 
   * Exige: active_ride_id = rideId (validação de corrida correta)
   * Limpa: active_ride_id, busy_since, active_ride_mode
   */
  static async releaseBusy(
    driverProfileId: string,
    rideId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // GATE 5: Transação atômica - só succeed se is_online = true AND is_available = false AND active_ride_id = rideId
      const { data, error } = await supabase
        .from('driver_availability')
        .update({
          is_available: true,
          active_ride_id: null,
          busy_since: null,
          active_ride_mode: null,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', driverProfileId)
        .eq('is_online', true) // Condição atômica
        .eq('is_available', false) // Condição atômica
        .eq('active_ride_id', rideId) // Condição atômica - validação de corrida correta
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Driver must be busy with the specified ride to be released',
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
        activeRideMode: data.active_ride_mode || undefined,
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
      await supabase
        .from('driver_availability')
        .update({
          last_seen_at: new Date().toISOString(),
        })
        .eq('profile_id', driverProfileId);
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
      const now = Date.now();
      const threshold = new Date(now - staleThresholdMinutes * 60 * 1000);

      logger.debug('🔍 [DEBUG] markStaleDrivers |', {
        now: new Date(now).toISOString(),
        threshold: threshold.toISOString(),
        staleThresholdMinutes,
      });

      // Buscar motoristas stale
      const { data: staleDrivers, error } = await supabase
        .from('driver_availability')
        .select('profile_id, is_available, active_ride_id, last_seen_at, is_online')
        .eq('is_online', true)
        .not('last_seen_at', 'is', null) // GATE 5: Garantir que last_seen_at não é NULL
        .lt('last_seen_at', threshold.toISOString());

      logger.debug('🔍 [DEBUG] markStaleDrivers query result |', {
        found: staleDrivers?.length || 0,
        error: error?.message,
        drivers: staleDrivers?.map(d => ({
          profile_id: d.profile_id,
          is_available: d.is_available,
          active_ride_id: d.active_ride_id,
          last_seen_at: d.last_seen_at,
        })),
      });

      if (error) throw error;
      if (!staleDrivers || staleDrivers.length === 0) {
        return { markedOffline: 0, staleBusy: 0 };
      }

      let markedOffline = 0;
      let staleBusy = 0;

      for (const driver of staleDrivers) {
        if (driver.is_available) {
          // DISPONÍVEL: marcar offline
          const { data } = await supabase
            .from('driver_availability')
            .update({
              is_online: false,
              is_available: false,
              updated_at: new Date().toISOString(),
            })
            .eq('profile_id', driver.profile_id)
            .eq('is_available', true) // Condição atômica
            .select();

          if (data && data.length > 0) {
            markedOffline++;
            logger.debug('✅ [DEBUG] Driver marked offline |', {
              profileId: driver.profile_id,
              lastSeen: driver.last_seen_at,
            });
            logger.warn('Driver marked offline due to stale', {
              profileId: driver.profile_id,
              lastSeen: driver.last_seen_at,
            });
          }
        } else if (driver.active_ride_id) {
          // BUSY: apenas registrar problema
          staleBusy++;
          logger.debug('⚠️ [DEBUG] Driver stale but busy |', {
            profileId: driver.profile_id,
            rideId: driver.active_ride_id,
            lastSeen: driver.last_seen_at,
          });
          logger.error('Driver is stale but has active ride', {
            profileId: driver.profile_id,
            rideId: driver.active_ride_id,
            lastSeen: driver.last_seen_at,
          });
          // TODO: Notificar suporte
          // TODO: Escalar para resolução manual
        }
      }

      logger.debug('📊 [DEBUG] markStaleDrivers result |', {
        markedOffline,
        staleBusy,
      });

      logger.info('DriverAvailabilityService.markStaleDrivers', {
        markedOffline,
        staleBusy,
        threshold: threshold.toISOString(),
      });

      return { markedOffline, staleBusy };
    } catch (error) {
      logger.error('❌ [ERROR] markStaleDrivers |', error);
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
      }>;

      // Criar mapa de driver_data por profile_id
      const dataMap = new Map(driverData?.map(d => [d.profile_id, d]) || []);

      // Calcular distância e filtrar por raio e capacidade
      const available: AvailableDriver[] = [];

      for (const d of drivers) {
        const data = dataMap.get(d.profile_id);
        if (!data) continue; // Ignorar motoristas sem driver_data

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
      logger.error('❌ [ERROR] DriverAvailabilityService.findAvailableDrivers |', {
        error: error,
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
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
