/**
 * 🍽️ GASTRONOMY MUTATIONS - SSOT Write Model
 *
 * Todas as operações de escrita para gastronomia.
 * INSERT, UPDATE, DELETE com validações.
 *
 * @version 2.0.0 - Extraído de GastronomyService
 */

import { supabase } from '@/integrations/supabase';
import type { Json } from '@/integrations/supabase';
import { BusinessOwnershipService } from '@/core/business/services/BusinessOwnershipService';
import { logger } from '@/shared/utils/logger';
import { sanitizeString } from '@/shared/utils/sanitization';
import type {
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
} from '../types';

// ============================================================
// HELPERS INTERNOS
// ============================================================

/**
 * Sanitizar input de criação/atualização
 */
function sanitizeInput(
  input: CreateGastronomyProfileInput | UpdateGastronomyProfileInput,
): Record<string, unknown> {
  return {
    ...input,
    cuisine_type: input.cuisine_type ? sanitizeString(input.cuisine_type) : undefined,
    cuisine_subtypes: input.cuisine_subtypes?.map((s) => sanitizeString(s)),
  };
}

// ============================================================
// MUTATIONS PÚBLICAS - Perfil Gastronômico
// ============================================================

/**
 * Criar perfil gastronômico
 */
export async function createGastronomyProfile(
  input: CreateGastronomyProfileInput,
  userId: string,
): Promise<GastronomyProfile> {
  try {
    // 1. Verificar ownership via BusinessOwnershipService (SSOT)
    await BusinessOwnershipService.requireOwnership(input.business_id, userId);

    // 2. Verificar se já existe perfil gastronômico
    const { data: existing } = await supabase
      .from('gastronomy_profiles')
      .select('id')
      .eq('business_id', input.business_id)
      .maybeSingle();

    if (existing) {
      throw new Error('Este negócio já possui um perfil gastronômico');
    }

    // 3. Sanitizar input
    const sanitized = sanitizeInput({
      business_id: input.business_id,
      ...input,
    });

    // 4. Criar perfil
    const insertData = {
      business_id: sanitized.business_id as string,
      cuisine_type: sanitized.cuisine_type as string,
      cuisine_subtypes: (sanitized.cuisine_subtypes as string[]) || [],
      price_range: sanitized.price_range as string | undefined,
      delivery_enabled: (sanitized.delivery_enabled as boolean) ?? false,
      takeout_enabled: (sanitized.takeout_enabled as boolean) ?? false,
      dine_in_enabled: (sanitized.dine_in_enabled as boolean) ?? true,
      delivery_fee: sanitized.delivery_fee as number | undefined,
      delivery_time_min: sanitized.delivery_time_min as number | undefined,
      delivery_time_max: sanitized.delivery_time_max as number | undefined,
      minimum_order: sanitized.minimum_order as number | undefined,
      accepts_reservations: (sanitized.accepts_reservations as boolean) ?? false,
      has_parking: (sanitized.has_parking as boolean) ?? false,
      has_wifi: (sanitized.has_wifi as boolean) ?? false,
      has_accessibility: (sanitized.has_accessibility as boolean) ?? false,
      has_kids_area: (sanitized.has_kids_area as boolean) ?? false,
      has_live_music: (sanitized.has_live_music as boolean) ?? false,
      seating_capacity: sanitized.seating_capacity as number | undefined,
      status: 'active' as const,
      metadata: (sanitized.metadata as Json) || {},
    };

    const { data, error } = await supabase
      .from('gastronomy_profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return data as GastronomyProfile;
  } catch (error) {
    logger.error('[GastronomyMutations] Error creating profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao criar perfil gastronômico: ${message}`);
  }
}

/**
 * Atualizar perfil gastronômico
 */
export async function updateGastronomyProfile(
  businessId: string,
  input: UpdateGastronomyProfileInput,
  userId: string,
): Promise<GastronomyProfile> {
  try {
    // 1. Verificar ownership via BusinessOwnershipService (SSOT)
    await BusinessOwnershipService.requireOwnership(businessId, userId);

    // 2. Sanitizar input
    const sanitized = sanitizeInput(input);

    // 3. Atualizar perfil
    const { data, error } = await supabase
      .from('gastronomy_profiles')
      .update({
        ...sanitized,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    return data as GastronomyProfile;
  } catch (error) {
    logger.error('[GastronomyMutations] Error updating profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar perfil gastronômico: ${message}`);
  }
}

/**
 * Deletar perfil gastronômico (soft delete)
 */
export async function deleteGastronomyProfile(
  businessId: string,
  userId: string,
): Promise<void> {
  try {
    // 1. Verificar ownership via BusinessOwnershipService (SSOT)
    await BusinessOwnershipService.requireOwnership(businessId, userId);

    // 2. Soft delete
    const { error } = await supabase
      .from('gastronomy_profiles')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);

    if (error) throw error;
  } catch (error) {
    logger.error('[GastronomyMutations] Error deleting profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao deletar perfil gastronômico: ${message}`);
  }
}

/**
 * Atualizar status operacional
 */
export async function updateOperationalStatus(
  businessId: string,
  status: 'active' | 'inactive' | 'temporarily_closed',
  userId: string,
): Promise<void> {
  try {
    // 1. Verificar ownership via BusinessOwnershipService (SSOT)
    await BusinessOwnershipService.requireOwnership(businessId, userId);

    // 2. Atualizar status
    const { error } = await supabase
      .from('gastronomy_profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);

    if (error) throw error;
  } catch (error) {
    logger.error('[GastronomyMutations] Error updating status:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar status: ${message}`);
  }
}

// ============================================================
// MUTATIONS EM LOTE (BATCH)
// ============================================================

/**
 * Atualizar múltiplos campos do perfil em uma operação
 */
export async function patchGastronomyProfile(
  businessId: string,
  patches: Partial<UpdateGastronomyProfileInput>,
  userId: string,
): Promise<GastronomyProfile> {
  try {
    // 1. Verificar ownership
    await BusinessOwnershipService.requireOwnership(businessId, userId);

    // 2. Aplicar apenas campos válidos
    const validPatches: Record<string, unknown> = {};
    
    if (patches.cuisine_type !== undefined) {
      validPatches.cuisine_type = sanitizeString(patches.cuisine_type);
    }
    if (patches.cuisine_subtypes !== undefined) {
      validPatches.cuisine_subtypes = (patches.cuisine_subtypes ?? []).map((s) => sanitizeString(s));
    }
    if (patches.price_range !== undefined) validPatches.price_range = patches.price_range;
    if (patches.delivery_enabled !== undefined) validPatches.delivery_enabled = patches.delivery_enabled;
    if (patches.takeout_enabled !== undefined) validPatches.takeout_enabled = patches.takeout_enabled;
    if (patches.dine_in_enabled !== undefined) validPatches.dine_in_enabled = patches.dine_in_enabled;
    if (patches.delivery_fee !== undefined) validPatches.delivery_fee = patches.delivery_fee;
    if (patches.delivery_time_min !== undefined) validPatches.delivery_time_min = patches.delivery_time_min;
    if (patches.delivery_time_max !== undefined) validPatches.delivery_time_max = patches.delivery_time_max;
    if (patches.minimum_order !== undefined) validPatches.minimum_order = patches.minimum_order;
    if (patches.accepts_reservations !== undefined) validPatches.accepts_reservations = patches.accepts_reservations;
    if (patches.has_parking !== undefined) validPatches.has_parking = patches.has_parking;
    if (patches.has_wifi !== undefined) validPatches.has_wifi = patches.has_wifi;
    if (patches.has_accessibility !== undefined) validPatches.has_accessibility = patches.has_accessibility;
    if (patches.has_kids_area !== undefined) validPatches.has_kids_area = patches.has_kids_area;
    if (patches.has_live_music !== undefined) validPatches.has_live_music = patches.has_live_music;
    if (patches.seating_capacity !== undefined) validPatches.seating_capacity = patches.seating_capacity;
    if (patches.metadata !== undefined) validPatches.metadata = patches.metadata as Json;

    if (Object.keys(validPatches).length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    validPatches.updated_at = new Date().toISOString();

    // 3. Atualizar
    const { data, error } = await supabase
      .from('gastronomy_profiles')
      .update(validPatches)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    return data as GastronomyProfile;
  } catch (error) {
    logger.error('[GastronomyMutations] Error patching profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar perfil: ${message}`);
  }
}
