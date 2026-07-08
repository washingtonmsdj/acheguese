/**
 * GastronomyProfileService - canonical service for the Gastronomy vertical.
 *
 * Centraliza a logica de negocio do perfil gastronomico.
 * Hooks e componentes nao devem acessar Supabase diretamente.
 *
 * Responsabilidades:
 * - CRUD do gastronomy_profile
 * - Validacao de elegibilidade
 * - Verificacao de existencia
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { isEligibleForVertical } from '@/core/verticals/config';
import type { BusinessCategory } from '@/core/business/types/Business';
import { GASTRONOMY_PROFILE_STATUSES } from '@/core/business/constants';
import type {
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
} from '../types';
import { sanitizeString } from '@/shared/utils/sanitization';
import { resolveGastronomyBusinessId } from './resolveGastronomyBusinessId';

// Result types

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

const DEFAULT_MENU_NAME = 'Cardapio principal';

function getDefaultCategoryName(cuisineType: string): string {
  return /pizza|pizzaria/i.test(cuisineType) ? 'Pizzas' : 'Cardapio';
}

async function ensureOperationalMenuSetup(
  businessId: string,
  cuisineType: string,
): Promise<string | null> {
  const sanitizedCuisineType = sanitizeString(cuisineType);

  const { data: existingMenu, error: menuLookupError } = await supabase
    .from('menus')
    .select('id')
    .eq('business_id', businessId)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (menuLookupError) {
    logger.error('[GastronomyProfileService] ensure menu lookup error', menuLookupError);
    return menuLookupError.message;
  }

  let menuId = existingMenu?.id as string | undefined;

  if (!menuId) {
    const { data: createdMenu, error: createMenuError } = await supabase
      .from('menus')
      .insert({
        business_id: businessId,
        name: DEFAULT_MENU_NAME,
        description: sanitizedCuisineType
          ? `Cardapio inicial para ${sanitizedCuisineType}`
          : 'Cardapio inicial',
        is_active: true,
        display_order: 0,
      })
      .select('id')
      .single();

    if (createMenuError) {
      logger.error('[GastronomyProfileService] ensure menu create error', createMenuError);
      return createMenuError.message;
    }

    menuId = createdMenu.id as string;
  }

  const { data: existingCategory, error: categoryLookupError } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menuId)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (categoryLookupError) {
    logger.error('[GastronomyProfileService] ensure category lookup error', categoryLookupError);
    return categoryLookupError.message;
  }

  if (!existingCategory?.id) {
    const { error: createCategoryError } = await supabase
      .from('menu_categories')
      .insert({
        menu_id: menuId,
        name: getDefaultCategoryName(sanitizedCuisineType),
        description: null,
        display_order: 0,
        is_available: true,
      });

    if (createCategoryError) {
      logger.error('[GastronomyProfileService] ensure category create error', createCategoryError);
      return createCategoryError.message;
    }
  }

  return null;
}

// Service

export const GastronomyProfileService = {

  /**
   *  Verifica se uma categoria de empresa elegivel para o vertical gastronomia.
   */
  validateEligibility(category: BusinessCategory): boolean {
    return isEligibleForVertical(category, 'gastronomy');
  },

  /**
   *  Verifica se uma empresa ja possui perfil gastronomico ativo.
   */
  async canActivateForBusiness(businessId: string): Promise<ServiceResult<boolean>> {
    try {
      const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);
      const { data, error } = await supabase
        .from('gastronomy_profiles')
        .select('id, status')
        .eq('business_id', resolvedBusinessId)
        .maybeSingle();

      if (error) {
        logger.error('[GastronomyProfileService] canActivate error', error);
        return { data: null, error: error.message };
      }

      //  Pode ativar se nao existe perfil ainda
      return { data: data === null, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   *  Busca o perfil gastronomico de uma empresa.
   */
  async getByBusinessId(businessId: string): Promise<ServiceResult<GastronomyProfile>> {
    try {
      const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);
      const { data, error } = await supabase
        .from('gastronomy_profiles')
        .select('*')
        .eq('business_id', resolvedBusinessId)
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
   *  Cria o perfil gastronomico para uma empresa.
   *  Valida ownership via RLS do Supabase.
   */
  async createProfileForBusiness(
    input: CreateGastronomyProfileInput,
  ): Promise<ServiceResult<GastronomyProfile>> {
    try {
      const resolvedBusinessId = await resolveGastronomyBusinessId(input.business_id);
      const { data: existing } = await supabase
        .from('gastronomy_profiles')
        .select('id')
        .eq('business_id', resolvedBusinessId)
        .maybeSingle();

      if (existing) {
        return { data: null, error: 'Este negocio ja possui um perfil gastronomico.' };
      }

      const { data, error } = await supabase
        .from('gastronomy_profiles')
        .insert({
          business_id: resolvedBusinessId,
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

      const setupError = await ensureOperationalMenuSetup(
        resolvedBusinessId,
        sanitizeString(input.cuisine_type),
      );

      if (setupError) {
        return {
          data: data as GastronomyProfile,
          error: 'Perfil gastronomico criado, mas o cardapio inicial nao foi preparado. Salve novamente para concluir.',
        };
      }

      return { data: data as GastronomyProfile, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   *  Atualiza o perfil gastronomico de uma empresa.
   */
  async updateProfile(
    businessId: string,
    input: UpdateGastronomyProfileInput,
  ): Promise<ServiceResult<GastronomyProfile>> {
    try {
      const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);
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
        .eq('business_id', resolvedBusinessId)
        .select()
        .single();

      if (error) {
        logger.error('[GastronomyProfileService] update error', error);
        return { data: null, error: error.message };
      }

      const resolvedCuisineType =
        typeof sanitized.cuisine_type === 'string'
          ? sanitized.cuisine_type
          : typeof data?.cuisine_type === 'string'
            ? data.cuisine_type
            : '';

      const setupError = await ensureOperationalMenuSetup(
        resolvedBusinessId,
        resolvedCuisineType,
      );

      if (setupError) {
        return {
          data: data as GastronomyProfile,
          error: 'Perfil salvo, mas o cardapio inicial nao foi preparado. Salve novamente para concluir.',
        };
      }

      return { data: data as GastronomyProfile, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};
