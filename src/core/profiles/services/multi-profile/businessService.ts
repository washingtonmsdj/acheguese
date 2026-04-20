/**
 * BUSINESS SERVICE - FASE 3
 * Service layer para operações de perfis business
 * Fonte: ARQUITETURA_MULTI_PERFIL_DEFINITIVA.md v3.0
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
import type { BusinessData, ServiceResponse } from './types';
export class BusinessService {
  /**
   * Buscar business data (via RLS)
   */
  static async getBusinessData(profileId: string): Promise<BusinessData | null> {
    try {
      const { data, error } = await supabase
        .from('business_data')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) throw error;

      return data as BusinessData;
    } catch (error: any) {
      logger.error('Error fetching business data:', error);
      return null;
    }
  }

  /**
   * Atualizar business data (via RLS)
   */
  static async updateBusinessData(
    profileId: string,
    updates: Partial<Omit<BusinessData, 'profile_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResponse<BusinessData>> {
    try {
      const { data, error } = await supabase
        .from('business_data')
        .update(updates)
        .eq('profile_id', profileId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data as BusinessData,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update business data',
      };
    }
  }
}

