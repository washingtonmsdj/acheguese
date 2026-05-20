/**
 * GastronomyProfileService â€” SSOT canÃ´nico do vertical Gastronomia
 *
 * Centraliza toda a lÃ³gica de negÃ³cio do perfil gastronÃ´mico.
 * Hooks e componentes NÃƒO acessam Supabase diretamente â€” consomem este service.
 *
 * Responsabilidades:
 * - CRUD do gastronomy_profile
 * - ValidaÃ§Ã£o de elegibilidade
 * - VerificaÃ§Ã£o de existÃªncia
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import { isEligibleForVertical } from '@/core/verticals/config';
import type { BusinessCategory } from '@/core/business/types/Business';
import { GASTRONOMY_PROFILE_STATUSES } from '@/core/business/constants';
import type {
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
} from '../types';
import { sanitizeString } from '@/shared/utils/sanitization';

// â”€â”€ Tipos de resultado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// â”€â”€ Service â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const GastronomyProfileService = {

  /**
   * Verifica se uma categoria de empresa Ã© elegÃ­vel para o vertical gastronomia.
   */
  validateEligibility(category: BusinessCategory): boolean {
    return isEligibleForVertical(category, 'gastronomy');
  },

  /**
   * Verifica se uma empresa jÃ¡ possui perfil gastronÃ´mico ativo.
   */
  async canActivateForBusiness(businessId: string): Promise<ServiceResult<boolean>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_profiles')
        .select('id, status')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) {
        logger.error('[GastronomyProfileService] canActivate error', error);
        return { data: null, error: error.message };
      }

      // Pode ativar se nÃ£o existe perfil ainda
      return { data: data === null, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca o perfil gastronÃ´mico de uma empresa.
   */
  async getByBusinessId(businessId: string): Promise<ServiceResult<GastronomyProfile>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_profiles')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) {
        logger.error('[GastronomyProfileService] getByBusinessId error', error);
        return { data: null, error: error.message };
      }

      return { data: data as GastronomyProfile | null, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria o perfil gastronÃ´mico para uma empresa.
   * Valida ownership via RLS do Supabase.
   */
  async createProfileForBusiness(
    input: CreateGastronomyProfileInput,
  ): Promise<ServiceResult<GastronomyProfile>> {
    try {
      const { data: existing } = await supabase
        .from('gastronomy_profiles')
        .select('id')
        .eq('business_id', input.business_id)
        .maybeSingle();

      if (existing) {
        return { data: null, error: 'Este negocio ja possui um perfil gastronomico.' };
      }

      const { data, error } = await supabase
        .from('gastronomy_profiles')
        .insert({
          business_id: input.business_id,
          cuisine_type: sanitizeString(input.cuisine_type),
          cuisine_subtypes: input.cuisine_subtypes ?? [],
          price_range: input.price_range ?? '$$',
          delivery_enabled: input.delivery_enabled ?? false,
          takeout_enabled: input.takeout_enabled ?? false,
          dine_in_enabled: input.dine_in_enabled ?? true,
          delivery_fee: input.delivery_fee,
          delivery_time_min: input.delivery_time_min,
          delivery_time_max: input.delivery_time_max,
          minimum_order: input.minimum_order,
          accepts_reservations: input.accepts_reservations ?? false,
          has_parking: input.has_parking ?? false,
          has_wifi: input.has_wifi ?? false,
          has_accessibility: input.has_accessibility ?? false,
          has_kids_area: input.has_kids_area ?? false,
          has_live_music: input.has_live_music ?? false,
          seating_capacity: input.seating_capacity,
          status: GASTRONOMY_PROFILE_STATUSES.ACTIVE,
          metadata: input.metadata ?? {},
        })
        .select()
        .single();

      if (error) {
        logger.error('[GastronomyProfileService] create error', error);
        return { data: null, error: error.message };
      }

      return { data: data as GastronomyProfile, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza o perfil gastronÃ´mico de uma empresa.
   */
  async updateProfile(
    businessId: string,
    input: UpdateGastronomyProfileInput,
  ): Promise<ServiceResult<GastronomyProfile>> {
    try {
      const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (input.cuisine_type !== undefined) sanitized.cuisine_type = sanitizeString(input.cuisine_type);
      if (input.cuisine_subtypes !== undefined) sanitized.cuisine_subtypes = input.cuisine_subtypes;
      if (input.price_range !== undefined) sanitized.price_range = input.price_range;
      if (input.delivery_enabled !== undefined) sanitized.delivery_enabled = input.delivery_enabled;
      if (input.takeout_enabled !== undefined) sanitized.takeout_enabled = input.takeout_enabled;
      if (input.dine_in_enabled !== undefined) sanitized.dine_in_enabled = input.dine_in_enabled;
      if (input.delivery_fee !== undefined) sanitized.delivery_fee = input.delivery_fee;
      if (input.delivery_time_min !== undefined) sanitized.delivery_time_min = input.delivery_time_min;
      if (input.delivery_time_max !== undefined) sanitized.delivery_time_max = input.delivery_time_max;
      if (input.minimum_order !== undefined) sanitized.minimum_order = input.minimum_order;
      if (input.accepts_reservations !== undefined) sanitized.accepts_reservations = input.accepts_reservations;
      if (input.has_parking !== undefined) sanitized.has_parking = input.has_parking;
      if (input.has_wifi !== undefined) sanitized.has_wifi = input.has_wifi;
      if (input.has_accessibility !== undefined) sanitized.has_accessibility = input.has_accessibility;
      if (input.has_kids_area !== undefined) sanitized.has_kids_area = input.has_kids_area;
      if (input.has_live_music !== undefined) sanitized.has_live_music = input.has_live_music;
      if (input.seating_capacity !== undefined) sanitized.seating_capacity = input.seating_capacity;
      if (input.status !== undefined) sanitized.status = input.status;
      if (input.metadata !== undefined) sanitized.metadata = input.metadata;

      const { data, error } = await supabase
        .from('gastronomy_profiles')
        .update(sanitized)
        .eq('business_id', businessId)
        .select()
        .single();

      if (error) {
        logger.error('[GastronomyProfileService] update error', error);
        return { data: null, error: error.message };
      }

      return { data: data as GastronomyProfile, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};
