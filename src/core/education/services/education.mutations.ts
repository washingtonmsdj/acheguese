/**
 * Education Mutations - SSOT Write Model
 *
 * Todas as operacoes de escrita para o modulo Education.
 * Valida payload e trata erros padronizados.
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import { getEducationEventValidationError } from '../eventValidation';
import {
  canMoveEducationLeadToStatus,
  getEducationLeadLostReasonValidationError,
} from '../leadPipelineValidation';
import {
  getEducationProfileSetupValidationErrors,
  resolveEducationSourceProvenance,
} from '../profileValidation';
import {
  EDUCATION_PROGRAM_AGE_GROUP_MAX_LENGTH,
  getEducationProgramNameValidationError,
  getEducationProgramNumericValidationError,
} from '../programValidation';
import {
  getSchoolStageOptions,
  isSchoolNiche,
  SCHOOL_STAGE_OTHER_VALUE,
} from '../constants/schoolStageOptions';
import type {
  EducationProfile,
  EducationProgram,
  EducationProgramAdminPatch,
  EducationLead,
  EducationLeadAdminPatch,
  EducationEvent,
  EducationEventAdminPatch,
  EducationLeadStatus,
  EducationNicheKey,
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

function hasForbiddenMutationKey(
  payload: object,
  keys: readonly string[],
): boolean {
  return keys.some((key) =>
    Object.prototype.hasOwnProperty.call(payload, key),
  );
}

const IMMUTABLE_EDUCATION_ENTITY_FIELDS = [
  'id',
  'education_profile_id',
  'created_at',
  'updated_at',
] as const;

function normalizeStageText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function validateCustomStageText(value: string): boolean {
  return value.length >= 3 && value.length <= 120 && value !== SCHOOL_STAGE_OTHER_VALUE;
}

function normalizeCurriculumTopics(
  topics: string[] | null | undefined,
): string[] | null | undefined {
  if (topics === undefined) return undefined;
  if (topics === null) return null;

  const normalized = Array.from(
    new Set(
      topics
        .map((topic) => topic.trim().replace(/\s+/g, ' '))
        .filter(Boolean),
    ),
  );

  if (normalized.length > 50) {
    throw new Error('Curriculo excede o limite de 50 disciplinas/conteudos');
  }
  if (normalized.some((topic) => topic.length > 80)) {
    throw new Error('Cada disciplina/conteudo deve ter no maximo 80 caracteres');
  }

  return normalized.length > 0 ? normalized : null;
}

function isOfficialStageLabel(
  value: string,
  nicheKey: EducationNicheKey | null | undefined,
): boolean {
  const options = getSchoolStageOptions(nicheKey);
  return options.some((option) => option.label.toLowerCase() === value.toLowerCase());
}

async function getProfileNicheKey(profileId: string): Promise<EducationNicheKey | null> {
  const { data, error } = await supabase
    .from('education_profiles')
    .select('niche_key')
    .eq('id', profileId)
    .single();
  if (error) {
    logger.error('[EducationMutations] Error loading profile niche:', error);
    return null;
  }
  return (data?.niche_key as EducationNicheKey | undefined) ?? null;
}

// ============================================================
// VALIDACAO
// ============================================================

function validateProfilePayload(payload: Partial<EducationProfile>): ValidationError[] {
  const errors: ValidationError[] = [];

  const setupErrors = getEducationProfileSetupValidationErrors({
    ageRangeMin: payload.age_range_min,
    ageRangeMax: payload.age_range_max,
    schoolInepCode: payload.school_inep_code,
    schoolSourceUrl: payload.school_source_url,
  });
  errors.push(...setupErrors);


  if (payload.whatsapp_number != null && payload.whatsapp_number.length > 20) {
    errors.push({ field: 'whatsapp_number', message: 'Maximo 20 caracteres' });
  }

  if (payload.summary != null && payload.summary.length > 500) {
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
  payload.school_inep_code = payload.school_inep_code?.trim() || null;
  const sourceProvenance = resolveEducationSourceProvenance({
    nextUrl: payload.school_source_url,
  });
  payload.school_source_url = sourceProvenance.schoolSourceUrl;
  payload.school_source_updated_at =
    sourceProvenance.schoolSourceUpdatedAt;
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
 * Remove perfil de educacao.
 *
 * Usado como compensacao canonica quando o setup acabou de criar um draft e
 * a configuracao seguinte falhou. As dependencias de Education usam FK
 * ON DELETE CASCADE a partir de education_profiles.
 */
export async function deleteEducationProfile(
  id: string,
): Promise<MutationResult<null>> {
  const { error } = await supabase
    .from('education_profiles')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('[EducationMutations] Error deleting profile:', error);
    return { data: null, error: new Error(error.message) };
  }

  return { data: null, error: null };
}

/**
 * Atualiza perfil de educacao
 */
export async function updateEducationProfile(
  id: string,
  payload: Partial<EducationProfile>,
): Promise<MutationResult<EducationProfile>> {
  if (payload.school_inep_code !== undefined) {
    payload.school_inep_code = payload.school_inep_code?.trim() || null;
  }
  if (payload.school_source_url !== undefined) {
    const { data: currentSource, error: currentSourceError } = await supabase
      .from('education_profiles')
      .select('school_source_url,school_source_updated_at')
      .eq('id', id)
      .single();

    if (currentSourceError || !currentSource) {
      logger.error(
        '[EducationMutations] Error loading profile source provenance:',
        currentSourceError,
      );
      return {
        data: null,
        error: new Error(
          currentSourceError?.message ?? 'Perfil de educacao nao encontrado',
        ),
      };
    }

    const sourceProvenance = resolveEducationSourceProvenance({
      currentUrl: currentSource.school_source_url,
      currentUpdatedAt: currentSource.school_source_updated_at,
      nextUrl: payload.school_source_url,
    });
    payload.school_source_url = sourceProvenance.schoolSourceUrl;
    payload.school_source_updated_at =
      sourceProvenance.schoolSourceUpdatedAt;
  } else if (payload.school_source_updated_at !== undefined) {
    delete payload.school_source_updated_at;
  }
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

  const programNameError = getEducationProgramNameValidationError(payload.name);
  if (programNameError) {
    return { data: null, error: new Error(programNameError) };
  }

  const numericError = getEducationProgramNumericValidationError({
    availableSlots: payload.available_slots,
    priceFrom: payload.price_from,
    maxCapacity: payload.max_capacity,
    currentEnrollment: payload.current_enrollment,
  });
  if (numericError) {
    return { data: null, error: new Error(numericError) };
  }

  if (
    payload.age_group &&
    payload.age_group.trim().length > EDUCATION_PROGRAM_AGE_GROUP_MAX_LENGTH
  ) {
    return {
      data: null,
      error: new Error(
        `A faixa etária deve ter no máximo ${EDUCATION_PROGRAM_AGE_GROUP_MAX_LENGTH} caracteres.`,
      ),
    };
  }

  payload.name = payload.name.trim();
  payload.age_group = payload.age_group?.trim() || null;

  if (isSchoolNiche(nicheKey)) {
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

  payload.curriculum_topics = normalizeCurriculumTopics(payload.curriculum_topics) ?? null;

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
  payload: EducationProgramAdminPatch,
): Promise<MutationResult<EducationProgram>> {
  if (hasForbiddenMutationKey(payload, IMMUTABLE_EDUCATION_ENTITY_FIELDS)) {
    return {
      data: null,
      error: new Error('Campos imutaveis de programa nao podem ser alterados'),
    };
  }
  const { data: existingProgram, error: existingProgramError } = await supabase
    .from('education_programs')
    .select('education_profile_id,max_capacity,current_enrollment')
    .eq('id', id)
    .single();

  if (existingProgramError || !existingProgram?.education_profile_id) {
    return { data: null, error: new Error('Programa nao encontrado') };
  }

  const nicheKey = await getProfileNicheKey(existingProgram.education_profile_id);
  if (!nicheKey) {
    return { data: null, error: new Error('Perfil de educacao nao encontrado') };
  }

  if (payload.name !== undefined) {
    const programNameError = getEducationProgramNameValidationError(payload.name);
    if (programNameError) {
      return { data: null, error: new Error(programNameError) };
    }
    payload.name = payload.name.trim();
  }

  const capacityTouched =
    payload.max_capacity !== undefined ||
    payload.current_enrollment !== undefined;
  const numericError = getEducationProgramNumericValidationError({
    availableSlots: payload.available_slots,
    priceFrom: payload.price_from,
    maxCapacity: capacityTouched
      ? payload.max_capacity === undefined
        ? existingProgram.max_capacity
        : payload.max_capacity
      : undefined,
    currentEnrollment: capacityTouched
      ? payload.current_enrollment === undefined
        ? existingProgram.current_enrollment
        : payload.current_enrollment
      : undefined,
  });
  if (numericError) {
    return { data: null, error: new Error(numericError) };
  }

  if (
    payload.age_group &&
    payload.age_group.trim().length > EDUCATION_PROGRAM_AGE_GROUP_MAX_LENGTH
  ) {
    return {
      data: null,
      error: new Error(
        `A faixa etária deve ter no máximo ${EDUCATION_PROGRAM_AGE_GROUP_MAX_LENGTH} caracteres.`,
      ),
    };
  }
  if (payload.age_group !== undefined) {
    payload.age_group = payload.age_group?.trim() || null;
  }

  if (isSchoolNiche(nicheKey)) {
    const updatedName = normalizeStageText(payload.name ?? null);
    const updatedGrade = normalizeStageText(payload.grade ?? null);
    const candidate = updatedName ?? updatedGrade;

    if (candidate) {
      const programNameError = getEducationProgramNameValidationError(candidate);
      if (programNameError) {
        return { data: null, error: new Error(programNameError) };
      }

      const official = isOfficialStageLabel(candidate, nicheKey);
      const custom = validateCustomStageText(candidate);
      if (!official && !custom) {
        return { data: null, error: new Error('Etapa/serie invalida para o padrao oficial') };
      }
      payload.name = updatedName ?? candidate;
      payload.grade = updatedGrade ?? candidate;
    }
  }

  if (payload.curriculum_topics !== undefined) {
    payload.curriculum_topics = normalizeCurriculumTopics(payload.curriculum_topics) ?? null;
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

  if (isSchoolNiche(nicheKey)) {
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

async function persistEducationLeadUpdate(
  id: string,
  payload: Partial<EducationLead>,
): Promise<MutationResult<EducationLead>> {
  const updatePayload: Partial<EducationLead> = { ...payload };

  const { data, error } = await supabase
    .from('education_leads')
    .update(updatePayload)
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
 * Atualiza campos editaveis do lead.
 * Mudancas de status devem passar exclusivamente por moveLeadToStatus.
 */
export async function updateEducationLead(
  id: string,
  payload: EducationLeadAdminPatch,
): Promise<MutationResult<EducationLead>> {
  const forbiddenFields = [
    ...IMMUTABLE_EDUCATION_ENTITY_FIELDS,
    'status',
    'source_channel',
    'first_contact_at',
    'lost_reason',
  ] as const;

  if (hasForbiddenMutationKey(payload, forbiddenFields)) {
    return {
      data: null,
      error: new Error(
        'Campos controlados do lead nao podem ser alterados pelo patch administrativo',
      ),
    };
  }

  return persistEducationLeadUpdate(id, payload);
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
): Promise<
  MutationResult<EducationLead> & {
    previousStatus: EducationLeadStatus | null;
  }
> {
  const { data: currentLead, error: currentLeadError } = await supabase
    .from('education_leads')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (currentLeadError || !currentLead?.status) {
    return {
      data: null,
      error: new Error(currentLeadError?.message ?? 'Lead nao encontrado'),
      previousStatus: null,
    };
  }

  const currentStatus = currentLead.status as EducationLeadStatus;
  if (!canMoveEducationLeadToStatus(currentStatus, newStatus)) {
    return {
      data: null,
      error: new Error(
        `Transicao de lead invalida: ${currentStatus} -> ${newStatus}`,
      ),
      previousStatus: currentStatus,
    };
  }

  const updatePayload: Partial<EducationLead> = { status: newStatus };

  if (newStatus === 'contacted' && currentStatus !== 'contacted') {
    updatePayload.first_contact_at = new Date().toISOString();
  }

  if (newStatus === 'lost') {
    const lostReasonError = getEducationLeadLostReasonValidationError(
      options.lostReason,
    );
    if (lostReasonError) {
      return {
        data: null,
        error: new Error(lostReasonError),
        previousStatus: currentStatus,
      };
    }

    updatePayload.lost_reason = options.lostReason?.trim() ?? null;
  }

  if (options.ownerUserId !== undefined) {
    updatePayload.owner_user_id = options.ownerUserId;
  }

  const result = await persistEducationLeadUpdate(id, updatePayload);
  return { ...result, previousStatus: currentStatus };
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
  const validationError = getEducationEventValidationError({
    title: payload.title,
    startsAt: payload.starts_at,
    endsAt: payload.ends_at,
    location: payload.location,
  });
  if (validationError) {
    return { data: null, error: new Error(validationError) };
  }

  payload.title = payload.title.trim();
  payload.location = payload.location?.trim() || null;

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
  payload: EducationEventAdminPatch,
): Promise<MutationResult<EducationEvent>> {
  if (hasForbiddenMutationKey(payload, IMMUTABLE_EDUCATION_ENTITY_FIELDS)) {
    return {
      data: null,
      error: new Error('Campos imutaveis de evento nao podem ser alterados'),
    };
  }
  const shouldValidate =
    payload.title !== undefined ||
    payload.starts_at !== undefined ||
    payload.ends_at !== undefined ||
    payload.location !== undefined;

  if (shouldValidate) {
    const { data: currentEvent, error: currentEventError } = await supabase
      .from('education_events')
      .select('title, starts_at, ends_at, location')
      .eq('id', id)
      .maybeSingle();

    if (currentEventError || !currentEvent) {
      return {
        data: null,
        error: new Error(currentEventError?.message ?? 'Evento nao encontrado'),
      };
    }

    const validationError = getEducationEventValidationError({
      title: payload.title ?? currentEvent.title,
      startsAt: payload.starts_at ?? currentEvent.starts_at,
      endsAt:
        payload.ends_at === undefined ? currentEvent.ends_at : payload.ends_at,
      location:
        payload.location === undefined ? currentEvent.location : payload.location,
    });
    if (validationError) {
      return { data: null, error: new Error(validationError) };
    }

    if (payload.title !== undefined) {
      payload.title = payload.title.trim();
    }
    if (payload.location !== undefined) {
      payload.location = payload.location?.trim() || null;
    }
  }

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
