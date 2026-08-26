/**
 * Compatibility mutation API for Gastronomy profile writes.
 *
 * SSOT: all persistence is owned by GastronomyProfileService. These functions
 * preserve the historical userId-aware API and add explicit ownership checks,
 * but must not access Supabase directly.
 */
import { logger } from '@/shared/utils/logger';
import { BusinessOwnershipService } from './BusinessOwnershipService';
import { GastronomyProfileService } from './GastronomyProfileService';
import {
  GASTRONOMY_PROFILE_STATUSES,
  type GastronomyProfileStatus,
} from '@/core/business/constants';
import type {
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
} from '../types';

function requireMutationData<T>(
  result: { data: T | null; error: string | null },
  fallbackMessage: string,
): T {
  if (result.data) return result.data;
  throw new Error(result.error ?? fallbackMessage);
}

export async function createGastronomyProfile(
  input: CreateGastronomyProfileInput,
  userId: string,
): Promise<GastronomyProfile> {
  try {
    await BusinessOwnershipService.requireOwnership(input.business_id, userId);
    const result = await GastronomyProfileService.createProfileForBusiness(input);
    return requireMutationData(result, 'Falha ao criar perfil gastronomico');
  } catch (error) {
    logger.error('[GastronomyMutations] Error creating profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao criar perfil gastronomico: ${message}`);
  }
}

export async function updateGastronomyProfile(
  businessId: string,
  input: UpdateGastronomyProfileInput,
  userId: string,
): Promise<GastronomyProfile> {
  try {
    await BusinessOwnershipService.requireOwnership(businessId, userId);
    const result = await GastronomyProfileService.updateProfile(businessId, input);
    return requireMutationData(result, 'Falha ao atualizar perfil gastronomico');
  } catch (error) {
    logger.error('[GastronomyMutations] Error updating profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar perfil gastronomico: ${message}`);
  }
}

export async function deleteGastronomyProfile(
  businessId: string,
  userId: string,
): Promise<void> {
  try {
    await BusinessOwnershipService.requireOwnership(businessId, userId);
    const result = await GastronomyProfileService.updateProfile(businessId, {
      status: GASTRONOMY_PROFILE_STATUSES.INACTIVE,
    });
    requireMutationData(result, 'Falha ao desativar perfil gastronomico');
  } catch (error) {
    logger.error('[GastronomyMutations] Error deleting profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao deletar perfil gastronomico: ${message}`);
  }
}

export async function updateOperationalStatus(
  businessId: string,
  status: GastronomyProfileStatus,
  userId: string,
): Promise<void> {
  try {
    await BusinessOwnershipService.requireOwnership(businessId, userId);
    const result = await GastronomyProfileService.updateProfile(businessId, {
      status,
    });
    requireMutationData(result, 'Falha ao atualizar status gastronomico');
  } catch (error) {
    logger.error('[GastronomyMutations] Error updating status:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar status: ${message}`);
  }
}

export async function patchGastronomyProfile(
  businessId: string,
  patches: Partial<UpdateGastronomyProfileInput>,
  userId: string,
): Promise<GastronomyProfile> {
  try {
    if (!Object.values(patches).some((value) => value !== undefined)) {
      throw new Error('Nenhum campo valido para atualizar');
    }

    await BusinessOwnershipService.requireOwnership(businessId, userId);
    const result = await GastronomyProfileService.updateProfile(businessId, patches);
    return requireMutationData(result, 'Falha ao atualizar perfil gastronomico');
  } catch (error) {
    logger.error('[GastronomyMutations] Error patching profile:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar perfil: ${message}`);
  }
}
