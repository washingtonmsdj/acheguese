/**
 * PROFESSIONAL SERVICE
 * Service layer SSOT para operações de professional_data.
 * Análogo a BusinessService e DriverService.
 *
 * Zero acesso direto ao Supabase fora deste service.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase/supabase';
import type { ProfessionalData, ServiceResponse } from './types';

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

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
      return data as unknown as ProfessionalData;
    } catch (err: unknown) {
      logger.error('[ProfessionalService] getProfessionalData:', errorMessage(err, 'unknown_error'));
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
      return { success: true, data: data as unknown as ProfessionalData };
    } catch (err: unknown) {
      return { success: false, error: errorMessage(err, 'Failed to update professional data') };
    }
  }
}

