/**
 * Education Mutations - SSOT Write Model
 *
 * Todas as operacoes de escrita para o modulo Education.
 * Valida payload e trata erros padronizados.
 *
 * @version 1.0.0
 */

import { supabase } from '@/core/infrastructure/supabase';
import { logger } from '@/shared/utils/logger';
import {
  getSchoolStageOptions,
  isSchoolNiche,
  SCHOOL_STAGE_OTHER_VALUE,
} from '../constants/schoolStageOptions';
import type {
  EducationProfile,
  EducationProgram,
  EducationLead,
  EducationEvent,
  EducationLeadStatus,
  EducationProfileStatus,
} from '../types';

// ============================================================
// TIPOS INTERNOS
// ============================================================

interface MutationResult<T> {
  data: T | null;
  error: Error | null;
}

interface ValidationError {
  field: string;
  message: string;
}

function normalizeStageText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function validateCustomStageText(value: string): boolean {
  return value.length >= 3 && value.length <= 120 && value !== SCHOOL_STAGE_OTHER_VALUE;
}

function isOfficialStageLabel(value: string, nicheKey: string): boolean {
  const options = getSchoolStageOptions(nicheKey as any);
  return options.some((option) => option.label.toLowerCase() === value.toLowerCase());
}

async function getProfileNicheKey(profileId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('education_profiles')
    .select('niche_key')
    .eq('id', profileId)
    .single();
  if (error) {
    logger.error('[EducationMutations] Error loading profile niche:', error);
    return null;
  }
  return (data?.niche_key as string | undefined) ?? null;
}

// ============================================================
// VALIDACAO
// ============================================================

function validateProfilePayload(payload: Partial<EducationProfile>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (payload.whatsapp_number !== undefined && payload.whatsapp_number.length > 20) {
    errors.push({ field: 'whatsapp_number', message: 'Maximo 20 caracteres' });
  }

  if (payload.summary !== undefined && payload.summary.length > 500) {
    errors.push({ field: 'summary', message: 'Maximo 500 caracteres' });
  }

  const validNiches = [
    'regular_school', 'daycare', 'language_school', 'prep_course',
    'technical_school', 'tutoring_center', 'music_school', 'sports_school',
  ];
  if (payload.niche_key !== undefined && !validNiches.includes(payload.niche_key)) {
    errors.push({ field: 'niche_key', message: 'Nicho invalido' });
  }

  const validSchoolTypes = ['public', 'private', 'charter', 'community'];
  if (payload.school_type !== undefined && payload.school_type !== null && !validSchoolTypes.includes(payload.school_type)) {
    errors.push({ field: 'school_type', message: 'Tipo de escola invalido' });
  }

  const validSchoolNetworks = ['municipal', 'state', 'federal', 'private'];
  if (payload.school_network !== undefined && payload.school_network !== null && !validSchoolNetworks.includes(payload.school_network)) {
    errors.push({ field: 'school_network', message: 'Rede administrativa invalida' });
  }

  const validStatuses: EducationProfileStatus[] = ['draft', 'published', 'paused'];
  if (payload.status !== undefined && !validStatuses.includes(payload.status)) {
    errors.push({ field: 'status', message: 'Status invalido' });
  }

  return errors;
}

function handleValidationErrors(errors: ValidationError[]): Error {
  const message = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
  return new Error(`Validacao falhou: ${message}`);
}

// ============================================================
// PROFILES
// ============================================================

/**
 * Cria novo perfil de educacao
 */
export async function createEducationProfile(
  payload: Omit<EducationProfile, 'id' | 'created_at' | 'updated_at'>,
): Promise<MutationResult<EducationProfile>> {
  const errors = validateProfilePayload(payload);
  if (errors.length > 0) {
    return { data: null, error: handleValidationErrors(errors) };
  }

  const { data, error } = await supabase
    .from('education_profiles')
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error creating profile:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationProfile, error: null };
}

/**
 * Atualiza perfil de educacao
 */
export async function updateEducationProfile(
  id: string,
  payload: Partial<EducationProfile>,
): Promise<MutationResult<EducationProfile>> {
  const errors = validateProfilePayload(payload);
  if (errors.length > 0) {
    return { data: null, error: handleValidationErrors(errors) };
  }

  // Atualiza published_at automaticamente se status muda para published
  if (payload.status === 'published' && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('education_profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error updating profile:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationProfile, error: null };
}

/**
 * Publica perfil de educacao
 */
export async function publishEducationProfile(
  id: string,
): Promise<MutationResult<EducationProfile>> {
  return updateEducationProfile(id, {
    status: 'published',
    published_at: new Date().toISOString(),
  });
}

/**
 * Pausa perfil de educacao
 */
export async function pauseEducationProfile(
  id: string,
): Promise<MutationResult<EducationProfile>> {
  return updateEducationProfile(id, { status: 'paused' });
}

// ============================================================
// PROGRAMS
// ============================================================

/**
 * Cria novo programa
 */
export async function createEducationProgram(
  payload: Omit<EducationProgram, 'id' | 'created_at' | 'updated_at'>,
): Promise<MutationResult<EducationProgram>> {
  const nicheKey = await getProfileNicheKey(payload.education_profile_id);
  if (!nicheKey) {
    return { data: null, error: new Error('Perfil de educacao nao encontrado') };
  }

  if (isSchoolNiche(nicheKey as any)) {
    const stageName = normalizeStageText(payload.name);
    const stageGrade = normalizeStageText(payload.grade ?? null);

    if (!stageName) {
      return { data: null, error: new Error('Etapa/serie obrigatoria para escolas') };
    }

    const official = isOfficialStageLabel(stageName, nicheKey);
    const custom = validateCustomStageText(stageName);
    if (!official && !custom) {
      return { data: null, error: new Error('Etapa/serie invalida para o padrao oficial') };
    }

    payload.name = stageName;
    payload.grade = stageGrade ?? stageName;
  }

  const { data, error } = await supabase
    .from('education_programs')
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error creating program:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationProgram, error: null };
}

/**
 * Atualiza programa
 */
export async function updateEducationProgram(
  id: string,
  payload: Partial<EducationProgram>,
): Promise<MutationResult<EducationProgram>> {
  const { data: existingProgram, error: existingProgramError } = await supabase
    .from('education_programs')
    .select('education_profile_id')
    .eq('id', id)
    .single();

  if (existingProgramError || !existingProgram?.education_profile_id) {
    return { data: null, error: new Error('Programa nao encontrado') };
  }

  const nicheKey = await getProfileNicheKey(existingProgram.education_profile_id);
  if (!nicheKey) {
    return { data: null, error: new Error('Perfil de educacao nao encontrado') };
  }

  if (isSchoolNiche(nicheKey as any)) {
    const updatedName = normalizeStageText((payload as any).name ?? null);
    const updatedGrade = normalizeStageText((payload as any).grade ?? null);
    const candidate = updatedName ?? updatedGrade;

    if (candidate) {
      const official = isOfficialStageLabel(candidate, nicheKey);
      const custom = validateCustomStageText(candidate);
      if (!official && !custom) {
        return { data: null, error: new Error('Etapa/serie invalida para o padrao oficial') };
      }
      (payload as any).name = updatedName ?? candidate;
      (payload as any).grade = updatedGrade ?? candidate;
    }
  }

  const { data, error } = await supabase
    .from('education_programs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error updating program:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationProgram, error: null };
}

/**
 * Remove programa
 */
export async function deleteEducationProgram(
  id: string,
): Promise<MutationResult<null>> {
  const { error } = await supabase
    .from('education_programs')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('[EducationMutations] Error deleting program:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: null, error: null };
}

// ============================================================
// LEADS
// ============================================================

/**
 * Cria novo lead
 */
export async function createEducationLead(
  payload: Omit<EducationLead, 'id' | 'created_at' | 'updated_at'>,
): Promise<MutationResult<EducationLead>> {
  const nicheKey = await getProfileNicheKey(payload.education_profile_id);
  if (!nicheKey) {
    return { data: null, error: new Error('Perfil de educacao nao encontrado') };
  }

  if (isSchoolNiche(nicheKey as any)) {
    const desired = normalizeStageText(payload.desired_grade ?? null);
    if (desired) {
      const official = isOfficialStageLabel(desired, nicheKey);
      const custom = validateCustomStageText(desired);
      if (!official && !custom) {
        return { data: null, error: new Error('Serie/etapa desejada invalida') };
      }
      payload.desired_grade = desired;
    }
  }

  const { data, error } = await supabase
    .from('education_leads')
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error creating lead:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationLead, error: null };
}

/**
 * Atualiza lead (incluindo mudanca de status)
 */
export async function updateEducationLead(
  id: string,
  payload: Partial<EducationLead>,
): Promise<MutationResult<EducationLead>> {
  // Se status mudou para 'contacted', registra first_contact_at
  if (payload.status === 'contacted' && !payload.first_contact_at) {
    payload.first_contact_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('education_leads')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error updating lead:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationLead, error: null };
}

/**
 * Move lead para outro status no pipeline
 * Registra evento de auditoria automaticamente via trigger
 */
export async function moveLeadToStatus(
  id: string,
  newStatus: EducationLeadStatus,
  options: {
    lostReason?: string;
    ownerUserId?: string | null;
  } = {},
): Promise<MutationResult<EducationLead>> {
  const updatePayload: Partial<EducationLead> = { status: newStatus };

  if (options.lostReason && newStatus === 'lost') {
    updatePayload.lost_reason = options.lostReason;
  }

  if (options.ownerUserId !== undefined) {
    updatePayload.owner_user_id = options.ownerUserId;
  }

  return updateEducationLead(id, updatePayload);
}

// ============================================================
// EVENTS
// ============================================================

/**
 * Cria novo evento
 */
export async function createEducationEvent(
  payload: Omit<EducationEvent, 'id' | 'created_at' | 'updated_at'>,
): Promise<MutationResult<EducationEvent>> {
  const { data, error } = await supabase
    .from('education_events')
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error creating event:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationEvent, error: null };
}

/**
 * Atualiza evento
 */
export async function updateEducationEvent(
  id: string,
  payload: Partial<EducationEvent>,
): Promise<MutationResult<EducationEvent>> {
  const { data, error } = await supabase
    .from('education_events')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('[EducationMutations] Error updating event:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as EducationEvent, error: null };
}

/**
 * Remove evento
 */
export async function deleteEducationEvent(
  id: string,
): Promise<MutationResult<null>> {
  const { error } = await supabase
    .from('education_events')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('[EducationMutations] Error deleting event:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: null, error: null };
}
