/**
 * DRIVER SERVICE - FASE 3
 * Service layer para operações de perfis driver
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import type { DriverData, ServiceResponse } from './types';
export class DriverService {
  /**
   * Buscar driver data (via RLS)
   */
  static async getDriverData(profileId: string): Promise<DriverData | null> {
    try {
      const { data, error } = await supabase
        .from('driver_data')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) throw error;

      return data as DriverData;
    } catch (error: any) {
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
      const { data, error } = await supabase
        .from('driver_data')
        .update(updates)
        .eq('profile_id', profileId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as DriverData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update driver data',
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
      current_location: `POINT(${location.lng} ${location.lat})`,
      last_location_update: new Date().toISOString(),
    });
  }
}
