/**
 * PROFESSIONAL SERVICE
 * Service layer SSOT para operações de professional_data.
 * Análogo a BusinessService e DriverService.
 *
 * Zero acesso direto ao Supabase fora deste service.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import type { ProfessionalData, ServiceResponse } from './types';
export class ProfessionalService {
  /**
   * Buscar professional_data (via RLS)
   */
  static async getProfessionalData(profileId: string): Promise<ProfessionalData | null> {
    try {
      const { data, error } = await supabase
        .from('professional_data')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (error) throw error;
      return data as ProfessionalData;
    } catch (err: any) {
      logger.error('[ProfessionalService] getProfessionalData:', err.message);
      return null;
    }
  }

  /**
   * Atualizar professional_data (via RLS)
   */
  static async updateProfessionalData(
    profileId: string,
    updates: Partial<Omit<ProfessionalData, 'profile_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResponse<ProfessionalData>> {
    try {
      const { data, error } = await supabase
        .from('professional_data')
        .update(updates)
        .eq('profile_id', profileId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as ProfessionalData };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update professional data' };
    }
  }
}
