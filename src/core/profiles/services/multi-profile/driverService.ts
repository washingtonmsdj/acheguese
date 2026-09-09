/**
 * DRIVER SERVICE - FASE 3
 * Service layer para operações de perfis driver
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import type { DriverData, ServiceResponse } from './types';
import { sanitizeDriverSelfServiceUpdate } from '@/core/mobility/services/driverDataSelfService';

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface DriverDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
  rpc: <TRow = unknown>(
    fn: string,
    params?: Record<string, unknown>,
  ) => Promise<QuerySingleResult<TRow>>;
}

const driverDb = supabase as unknown as DriverDbClient;

export class DriverService {
  /**
   * Buscar driver data (via RLS)
   */
  static async getDriverData(profileId: string): Promise<DriverData | null> {
    try {
      const { data, error } = await driverDb
        .from<DriverData>('driver_data')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) throw error;

      return data as DriverData;
    } catch (error: unknown) {
      logger.error('Error fetching driver data:', error);
      return null;
    }
  }

  /**
   * Atualizar driver data (via RLS)
   */
  static async updateDriverData(
    profileId: string,
    updates: Partial<Omit<DriverData, 'profile_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResponse<DriverData>> {
    try {
      const safeUpdates = sanitizeDriverSelfServiceUpdate(
        updates as Record<string, unknown>,
      );

      if (Object.keys(safeUpdates).length === 0) {
        const current = await this.getDriverData(profileId);
        if (!current) {
          return { success: false, error: 'Driver data not found' };
        }
        return { success: true, data: current };
      }

      const { data, error } = await driverDb.rpc<DriverData>(
        'update_owned_driver_data',
        {
          p_profile_id: profileId,
          p_updates: safeUpdates,
        },
      );

      if (error) throw error;

      return {
        success: true,
        data: data as DriverData,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: errorMessage(error, 'Failed to update driver data'),
      };
    }
  }

  /**
   * Atualizar disponibilidade do motorista
   */
  static async updateAvailability(profileId: string, isAvailable: boolean): Promise<ServiceResponse<DriverData>> {
    return this.updateDriverData(profileId, {
      is_available: isAvailable,
      last_location_update: new Date().toISOString(),
    });
  }

  /**
   * Atualizar localização do motorista
   */
  static async updateLocation(profileId: string, location: { lat: number; lng: number }): Promise<ServiceResponse<DriverData>> {
    return this.updateDriverData(profileId, {
      current_location: { lat: location.lat, lng: location.lng },
      last_location_update: new Date().toISOString(),
    });
  }
}

