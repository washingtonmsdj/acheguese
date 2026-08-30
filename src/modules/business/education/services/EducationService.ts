/**
 * EducationService - Facade
 *
 * Orquestra operacoes de profile/programs/leads/events.
 * Valida regras de negocio centrais e delega para queries/mutations.
 *
 * @version 1.0.0
 */

import { logger } from '@/shared/utils/logger';
import { getRecordValue, setRecordValue } from '@/shared/utils/recordLookup';
import { BusinessService } from '@/core/business/services/BusinessService';
import { BusinessOwnershipService } from '@/core/business/services/BusinessOwnershipService';
import { EDUCATION_LEAD_STATUS, EDUCATION_PROFILE_STATUS } from '../constants';
import {
  EducationObservabilityService,
  trackLeadCreated,
  trackLeadConverted,
  trackProfilePublished,
  trackEducationError,
} from '@/core/education/services/EducationObservabilityService';
import type {
  EducationProfile,
  EducationProgram,
  EducationLead,
  EducationEvent,
  EducationLeadStatus,
  EducationProfileStatus,
  SchoolType,
  SchoolNetwork,
  EducationLevel,
  SchoolShift,
  SchoolEventType,
  SchoolBasicResourceKey,
  SchoolAccessibilityFeatureKey,
  SchoolEquipmentFeatureKey,
  SchoolFacilityFeatureKey,
} from '@/core/education';
import * as queries from '@/core/education/services/education.queries';
import * as mutations from '@/core/education/services/education.mutations';

// ============================================================
// TIPOS
// ============================================================

export interface EducationSetupPayload {
  businessId: string;
  institutionType: string;
  nicheKey: string;
  summary?: string;
  whatsappNumber?: string;
  // Campos específicos para escolas regulares
  schoolType?: SchoolType;
  schoolNetwork?: SchoolNetwork;
  schoolInepCode?: string;
  schoolSourceUrl?: string;
  educationLevels?: EducationLevel[];
  shifts?: SchoolShift[];
  ageRangeMin?: number;
  ageRangeMax?: number;
  enrollmentOpen?: boolean;
  schoolBasicResources?: SchoolBasicResourceKey[];
  schoolAccessibilityFeatures?: SchoolAccessibilityFeatureKey[];
  schoolEquipmentFeatures?: SchoolEquipmentFeatureKey[];
  schoolFacilityFeatures?: SchoolFacilityFeatureKey[];
}

export interface CreateLeadPayload {
  educationProfileId: string;
  fullName: string;
  email: string;
  phone: string;
  childName?: string;
  childAge?: number;
  interestNote?: string;
  sourceChannel?: string;
  // Campos específicos para matrícula escolar
  guardianName?: string;
  studentName?: string;
  studentAge?: number;
  desiredGrade?: string;
  desiredShift?: SchoolShift;
}

export interface LeadPipelineMove {
  leadId: string;
  toStatus: EducationLeadStatus;
  lostReason?: string;
  ownerUserId?: string;
}

export interface EducationLeadsListOptions {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface EducationEventsListOptions {
  isPublic?: boolean;
  upcoming?: boolean;
}

// ============================================================
// VALIDACAO
// ============================================================

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  // Aceita formatos: +5588999999999, (88) 99999-9999, etc
  return /^(\+?\d{10,15}|\(\d{2}\)\s?\d{4,5}-?\d{4})$/.test(phone);
}

// ============================================================
// SERVICE
// ============================================================

export const EducationService = {
  // ==========================================================
  // PROFILES
  // ==========================================================

  /**
   * Obtem ou cria perfil de educacao para um business
   */
  async getOrCreateProfile(businessId: string): Promise<EducationProfile | null> {
    // Tenta obter existente
    const profile = await queries.getEducationProfileByBusinessId(businessId);
    if (profile) {
      return profile;
    }

    // Cria novo perfil em draft
    const { data, error } = await mutations.createEducationProfile({
      business_id: businessId,
      institution_type: 'school',
      niche_key: 'regular_school',
      support_level: 'basic_enabled',
      summary: null,
      whatsapp_number: null,
      status: 'draft',
      published_at: null,
      school_type: null,
      school_network: null,
      school_inep_code: null,
      school_source_url: null,
      school_source_updated_at: null,
      education_levels: null,
      shifts: null,
      age_range_min: null,
      age_range_max: null,
      enrollment_open: false,
      school_basic_resources: null,
      school_accessibility_features: null,
      school_equipment_features: null,
      school_facility_features: null,
    });

    if (error) {
      logger.error('[EducationService] Error creating profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Salva configuracao inicial de educacao (create/update profile)
   */
  async saveSetupProfile(payload: EducationSetupPayload): Promise<EducationProfile | null> {
    const profile = await this.getOrCreateProfile(payload.businessId);
    if (!profile) {
      return null;
    }

    const { data, error } = await mutations.updateEducationProfile(profile.id, {
      institution_type: payload.institutionType,
      niche_key: payload.nicheKey as EducationProfile['niche_key'],
      summary: payload.summary ?? null,
      whatsapp_number: payload.whatsappNumber ?? null,
      school_type: payload.schoolType ?? null,
      school_network: payload.schoolNetwork ?? null,
      school_inep_code: payload.schoolInepCode ?? null,
      school_source_url: payload.schoolSourceUrl ?? null,
      school_source_updated_at: payload.schoolSourceUrl ? new Date().toISOString() : null,
      education_levels: payload.educationLevels ?? null,
      shifts: payload.shifts ?? null,
      age_range_min: payload.ageRangeMin ?? null,
      age_range_max: payload.ageRangeMax ?? null,
      enrollment_open: payload.enrollmentOpen ?? false,
      school_basic_resources: payload.schoolBasicResources ?? null,
      school_accessibility_features: payload.schoolAccessibilityFeatures ?? null,
      school_equipment_features: payload.schoolEquipmentFeatures ?? null,
      school_facility_features: payload.schoolFacilityFeatures ?? null,
      support_level: 'basic_enabled',
    });

    if (error) {
      logger.error('[EducationService] Error saving setup profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Verifica se usuario pode gerenciar perfil
   */
  async canManageProfile(
    profileId: string,
    userId: string,
  ): Promise<boolean> {
    const profile = await queries.getEducationProfileById(profileId);
    if (!profile) return false;

    return BusinessOwnershipService.isOwner(profile.business_id, userId);
  },

  /**
   * Publica perfil de educacao
   */
  async publishProfile(profileId: string): Promise<EducationProfile | null> {
    try {
      const { data, error } = await mutations.publishEducationProfile(profileId);
      if (error) {
        logger.error('[EducationService] Error publishing profile:', error);
        await trackEducationError('education_profile_publish_failed', new Error(error.message), {
          profileId,
        });
        return null;
      }

      // Track successful publish
      if (data) {
        await trackProfilePublished(data.id, data.business_id, data.niche_key, {
          institutionType: data.institution_type,
        });
      }

      return data;
    } catch (error) {
      logger.error('[EducationService] Exception publishing profile:', error);
      await trackEducationError('education_profile_publish_failed', error as Error, { profileId });
      return null;
    }
  },

  /**
   * Pausa perfil de educacao
   */
  async pauseProfile(profileId: string): Promise<EducationProfile | null> {
    const { data, error } = await mutations.pauseEducationProfile(profileId);
    if (error) {
      logger.error('[EducationService] Error pausing profile:', error);
      return null;
    }
    return data;
  },

  // ==========================================================
  // PROGRAMS
  // ==========================================================

  /**
   * Lista programas ativos de um perfil
   */
  async listActivePrograms(profileId: string): Promise<EducationProgram[]> {
    return queries.listEducationPrograms(profileId, { isActive: true });
  },

  async updateProgram(
    programId: string,
    payload: Partial<EducationProgram>,
  ): Promise<EducationProgram | null> {
    const { data, error } = await mutations.updateEducationProgram(programId, payload);
    if (error) {
      logger.error('[EducationService] Error updating program:', error);
      return null;
    }
    return data;
  },

  async deleteProgram(programId: string): Promise<boolean> {
    const { error } = await mutations.deleteEducationProgram(programId);
    if (error) {
      logger.error('[EducationService] Error deleting program:', error);
      return false;
    }
    return true;
  },

  /**
   * Cria novo programa com validacao
   */
  async createProgram(
    profileId: string,
    payload: {
      name: string;
      description?: string;
      ageGroup?: string;
      shift?: string;
      modality?: string;
      availableSlots?: number;
      priceFrom?: number;
      // Campos específicos para escola regular
      educationLevel?: EducationLevel;
      grade?: string;
      className?: string;
      maxCapacity?: number;
      currentEnrollment?: number;
      schedule?: string;
    },
  ): Promise<EducationProgram | null> {
    if (!payload.name || payload.name.length < 3) {
      logger.error('[EducationService] Program name too short');
      return null;
    }

    const { data, error } = await mutations.createEducationProgram({
      education_profile_id: profileId,
      name: payload.name,
      description: payload.description ?? null,
      age_group: payload.ageGroup ?? null,
      shift: payload.shift ?? null,
      modality: payload.modality ?? null,
      available_slots: payload.availableSlots ?? null,
      price_from: payload.priceFrom ?? null,
      is_active: true,
      display_order: 0,
      education_level: payload.educationLevel ?? null,
      grade: payload.grade ?? null,
      class_name: payload.className ?? null,
      max_capacity: payload.maxCapacity ?? null,
      current_enrollment: payload.currentEnrollment ?? null,
      schedule: payload.schedule ?? null,
    });

    if (error) {
      logger.error('[EducationService] Error creating program:', error);
      return null;
    }

    return data;
  },

  // ==========================================================
  // LEADS
  // ==========================================================

  /**
   * Cria lead com validacao completa
   */
  async createLead(payload: CreateLeadPayload): Promise<EducationLead | null> {
    try {
      // Validacao
      if (!validateEmail(payload.email)) {
        logger.error('[EducationService] Invalid email:', payload.email);
        throw new Error('Email invalido');
      }

      if (!validatePhone(payload.phone)) {
        logger.error('[EducationService] Invalid phone:', payload.phone);
        throw new Error('Telefone invalido');
      }

      const { data, error } = await mutations.createEducationLead({
        education_profile_id: payload.educationProfileId,
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        child_name: payload.childName ?? null,
        child_age: payload.childAge ?? null,
        interest_note: payload.interestNote ?? null,
        source_channel: payload.sourceChannel ?? 'website',
        status: 'new',
        owner_user_id: null,
        first_contact_at: null,
        lost_reason: null,
        guardian_name: payload.guardianName ?? null,
        student_name: payload.studentName ?? null,
        student_age: payload.studentAge ?? null,
        desired_grade: payload.desiredGrade ?? null,
        desired_shift: payload.desiredShift ?? null,
      });

      if (error) {
        logger.error('[EducationService] Error creating lead:', error);
        await trackEducationError('education_lead_save_failed', new Error(error.message), {
          profileId: payload.educationProfileId,
        });
        return null;
      }

      // Track successful lead creation
      if (data) {
        // Get profile to get niche_key
        const profile = await queries.getEducationProfileById(payload.educationProfileId);
        if (profile) {
          await trackLeadCreated(payload.educationProfileId, data.id, profile.niche_key, {
            sourceChannel: payload.sourceChannel,
          });
        }
      }

      return data;
    } catch (error) {
      logger.error('[EducationService] Exception creating lead:', error);
      await trackEducationError('education_lead_save_failed', error as Error, {
        profileId: payload.educationProfileId,
      });
      return null;
    }
  },

  /**
   * Move lead no pipeline
   */
  async moveLeadInPipeline(move: LeadPipelineMove): Promise<EducationLead | null> {
    try {
      const { leadId, toStatus, lostReason, ownerUserId } = move;

      // Validacoes especificas por status
      if (toStatus === 'lost' && !lostReason) {
        logger.warn('[EducationService] Moving lead to lost without reason');
      }

      const { data, error } = await mutations.moveLeadToStatus(leadId, toStatus, {
        lostReason,
        ownerUserId,
      });

      if (error) {
        logger.error('[EducationService] Error moving lead:', error);
        return null;
      }

      // Track conversion when lead is enrolled
      if (data && toStatus === 'enrolled') {
        const profile = await queries.getEducationProfileById(data.education_profile_id);
        if (profile) {
          await trackLeadConverted(data.education_profile_id, data.id, profile.niche_key, {
            previousStatus: data.status,
          });
        }
      }

      return data;
    } catch (error) {
      logger.error('[EducationService] Exception moving lead:', error);
      return null;
    }
  },

  /**
   * Obtem resumo do pipeline de leads
   */
  async getLeadsPipelineSummary(profileId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
  }> {
    const { leads, totalCount } = await queries.listEducationLeads(profileId);

    const byStatus: Record<string, number> = {
      new: 0,
      contacted: 0,
      visit_scheduled: 0,
      proposal_sent: 0,
      enrolled: 0,
      lost: 0,
    };

    leads.forEach((lead) => {
      byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    });

    return { total: totalCount, byStatus };
  },

  async listLeads(
    profileId: string,
    options: EducationLeadsListOptions = {},
  ): Promise<{ leads: EducationLead[]; totalCount: number }> {
    return queries.listEducationLeads(profileId, options);
  },

  async updateLead(
    leadId: string,
    payload: Partial<EducationLead>,
  ): Promise<EducationLead | null> {
    const { data, error } = await mutations.updateEducationLead(leadId, payload);
    if (error) {
      logger.error('[EducationService] Error updating lead:', error);
      return null;
    }
    return data;
  },

  // ==========================================================
  // EVENTS
  // ==========================================================

  /**
   * Lista proximos eventos publicos
   */
  async listUpcomingPublicEvents(profileId: string): Promise<EducationEvent[]> {
    return queries.listEducationEvents(profileId, { isPublic: true, upcoming: true });
  },

  async listEvents(
    profileId: string,
    options: EducationEventsListOptions = {},
  ): Promise<EducationEvent[]> {
    return queries.listEducationEvents(profileId, options);
  },

  /**
   * Cria evento
   */
  async createEvent(
    profileId: string,
    payload: {
      title: string;
      description?: string;
      startsAt: string;
      endsAt?: string;
      location?: string;
      isPublic?: boolean;
      schoolEventType?: SchoolEventType;
    },
  ): Promise<EducationEvent | null> {
    if (!payload.title || payload.title.length < 3) {
      logger.error('[EducationService] Event title too short');
      return null;
    }

    const { data, error } = await mutations.createEducationEvent({
      education_profile_id: profileId,
      title: payload.title,
      description: payload.description ?? null,
      starts_at: payload.startsAt,
      ends_at: payload.endsAt ?? null,
      location: payload.location ?? null,
      is_public: payload.isPublic ?? true,
      school_event_type: payload.schoolEventType ?? null,
    });

    if (error) {
      logger.error('[EducationService] Error creating event:', error);
      return null;
    }

    return data;
  },

  async updateEvent(
    eventId: string,
    payload: Partial<EducationEvent>,
  ): Promise<EducationEvent | null> {
    const { data, error } = await mutations.updateEducationEvent(eventId, payload);
    if (error) {
      logger.error('[EducationService] Error updating event:', error);
      return null;
    }
    return data;
  },

  async deleteEvent(eventId: string): Promise<boolean> {
    const { error } = await mutations.deleteEducationEvent(eventId);
    if (error) {
      logger.error('[EducationService] Error deleting event:', error);
      return false;
    }
    return true;
  },

  // ==========================================================
  // AUXILIARY / UTILITY METHODS (Business Logic)
  // ==========================================================

  /** Verifica se perfil pode ser gerenciado (status ativo) - versão síncrona */
  isProfileManageable(profile: EducationProfile): boolean {
    return profile.status === 'published' || profile.status === 'draft';
  },

  /** Verifica se perfil está publicado e visível publicamente */
  isProfilePublic(profile: EducationProfile): boolean {
    return profile.status === 'published';
  },

  /** Retorna label do status do perfil */
  getProfileStatusLabel(status: EducationProfileStatus): string {
    return getRecordValue(EDUCATION_PROFILE_STATUS, status)?.label ?? status;
  },

  /** Retorna cor do status do perfil */
  getProfileStatusColor(status: EducationProfileStatus): string {
    return getRecordValue(EDUCATION_PROFILE_STATUS, status)?.color ?? 'gray';
  },

  /** Verifica se programa está disponível (ativo e com vagas) */
  isProgramAvailable(program: EducationProgram): boolean {
    return program.is_active && (program.available_slots ?? 0) > 0;
  },

  /** Formata preço do programa */
  formatProgramPrice(price: number | null): string {
    if (price === null || price === undefined) return 'Consultar';
    if (price === 0) return 'Gratuito';
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  },

  /** Ordena programas por display_order */
  sortProgramsByDisplayOrder(programs: EducationProgram[]): EducationProgram[] {
    return [...programs].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  },

  /** Retorna label do status do lead */
  getLeadStatusLabel(status: EducationLeadStatus): string {
    return getRecordValue(EDUCATION_LEAD_STATUS, status)?.label ?? status;
  },

  /** Retorna cor do status do lead */
  getLeadStatusColor(status: EducationLeadStatus): string {
    return getRecordValue(EDUCATION_LEAD_STATUS, status)?.color ?? 'gray';
  },

  /** Verifica se lead está em status ativo (não terminal) */
  isLeadActive(lead: EducationLead): boolean {
    return lead.status !== 'enrolled' && lead.status !== 'lost';
  },

  /** Verifica se transição de status é válida */
  canMoveLeadToStatus(from: EducationLeadStatus, to: EducationLeadStatus): boolean {
    const pipeline: EducationLeadStatus[] = ['new', 'contacted', 'visit_scheduled', 'proposal_sent', 'enrolled'];
    const fromIndex = pipeline.indexOf(from);
    const toIndex = pipeline.indexOf(to);

    // Sempre pode mover para lost
    if (to === 'lost') return true;

    // Não pode voltar no pipeline
    if (toIndex <= fromIndex) return false;

    // Só pode avançar um passo por vez
    return toIndex === fromIndex + 1;
  },

  /** Retorna próximos passos possíveis no pipeline */
  getNextPipelineSteps(current: EducationLeadStatus): EducationLeadStatus[] {
    const pipeline: EducationLeadStatus[] = ['new', 'contacted', 'visit_scheduled', 'proposal_sent', 'enrolled'];
    const index = pipeline.indexOf(current);
    if (index === -1 || index === pipeline.length - 1) return ['lost'];
    return [pipeline[index + 1], 'lost'];
  },

  /** Formata info de contato do lead */
  formatLeadContactInfo(lead: EducationLead): string {
    const contact = lead.email ?? lead.phone ?? 'Sem contato';
    return `${lead.full_name} - ${contact}`;
  },

  /** Calcula probabilidade de conversão baseada no status */
  calculateLeadConversionProbability(status: EducationLeadStatus): number {
    const probabilities: Record<EducationLeadStatus, number> = {
      new: 20,
      contacted: 35,
      visit_scheduled: 50,
      proposal_sent: 75,
      enrolled: 100,
      lost: 0,
    };
    return getRecordValue(probabilities, status) ?? 0;
  },

  /** Calcula resumo do pipeline (versão síncrona para dados já carregados) */
  calculatePipelineSummary(leads: EducationLead[]): { total: number; byStatus: Record<string, number>; conversionRate: number; active: number; } {
    const byStatus: Record<string, number> = {
      new: 0,
      contacted: 0,
      visit_scheduled: 0,
      proposal_sent: 0,
      enrolled: 0,
      lost: 0,
    };

    leads.forEach((lead) => {
      const count = getRecordValue(byStatus, lead.status) ?? 0;
      Object.assign(byStatus, setRecordValue(byStatus, lead.status, count + 1));
    });

    const total = leads.length;
    const enrolled = byStatus.enrolled ?? 0;
    const conversionRate = total > 0 ? Math.round((enrolled / total) * 100) : 0;
    const active = total - enrolled - (byStatus.lost ?? 0);

    return { total, byStatus, conversionRate, active };
  },

  /** Valida payload de criação de perfil */
  validateProfilePayload(payload: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload.institution_type || String(payload.institution_type).trim() === '') {
      errors.push('institution_type is required');
    }
    if (!payload.niche_key || String(payload.niche_key).trim() === '') {
      errors.push('niche_key is required');
    }
    return { isValid: errors.length === 0, errors };
  },

  /** Valida payload de criação de programa */
  validateProgramPayload(payload: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload.name || String(payload.name).trim() === '') {
      errors.push('name is required');
    }
    return { isValid: errors.length === 0, errors };
  },

  /** Valida payload de criação de lead */
  validateLeadPayload(payload: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload.full_name || String(payload.full_name).trim() === '') {
      errors.push('full_name is required');
    }
    if (payload.email && !validateEmail(String(payload.email))) {
      errors.push('email is invalid');
    }
    if (payload.phone && !validatePhone(String(payload.phone))) {
      errors.push('phone is invalid');
    }
    return { isValid: errors.length === 0, errors };
  },

  /** Verifica se evento está no futuro */
  isEventUpcoming(startsAt: string): boolean {
    return new Date(startsAt) > new Date();
  },

  /** Formata data do evento */
  formatEventDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /** Valida payload de criação de evento */
  validateEventPayload(payload: Record<string, unknown>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload.title || String(payload.title).trim() === '') {
      errors.push('title is required');
    }
    if (!payload.starts_at || String(payload.starts_at).trim() === '') {
      errors.push('starts_at is required');
    }
    return { isValid: errors.length === 0, errors };
  },
};