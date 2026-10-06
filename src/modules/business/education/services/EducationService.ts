/**
 * EducationService - Facade
 *
 * Orquestra operacoes de profile/programs/leads/events.
 * Valida regras de negocio centrais e delega para queries/mutations.
 *
 * @version 1.0.0
 */

import { logger } from '@/shared/utils/logger';
import { BusinessService } from '@/core/business/services/BusinessService';
import { BusinessOwnershipService } from '@/core/business/services/BusinessOwnershipService';
import {
  EducationObservabilityService,
  trackLeadConverted,
  trackProfilePublished,
  trackEducationError,
} from '@/core/education/services/EducationObservabilityService';
import type {
  EducationProfile,
  EducationProgram,
  EducationProgramAdminPatch,
  EducationLead,
  EducationLeadAdminPatch,
  EducationEvent,
  EducationEventAdminPatch,
  EducationLeadStatus,
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
  enrollmentOpen?: boolean | null;
  schoolBasicResources?: SchoolBasicResourceKey[];
  schoolAccessibilityFeatures?: SchoolAccessibilityFeatureKey[];
  schoolEquipmentFeatures?: SchoolEquipmentFeatureKey[];
  schoolFacilityFeatures?: SchoolFacilityFeatureKey[];
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
  active?: boolean;
}

// ============================================================
// VALIDACAO
// ============================================================

function nullIfEmpty<T>(values: T[] | undefined): T[] | null {
  return values && values.length > 0 ? values : null;
}

async function createDraftEducationProfile(
  businessId: string,
): Promise<{ data: EducationProfile | null; error: Error | null }> {
  return mutations.createEducationProfile({
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
    enrollment_open: null,
    school_basic_resources: null,
    school_accessibility_features: null,
    school_equipment_features: null,
    school_facility_features: null,
  });
}

// ============================================================
// SERVICE
// ============================================================

export const EducationService = {
  // ==========================================================
  // PROFILES
  // ==========================================================

  /**
   * Salva configuracao inicial de educacao (create/update profile)
   */
  async saveSetupProfile(payload: EducationSetupPayload): Promise<EducationProfile | null> {
    let profile = await queries.getEducationProfileByBusinessId(payload.businessId);
    let createdDuringSetup = false;

    if (!profile) {
      const created = await createDraftEducationProfile(payload.businessId);
      if (created.error || !created.data) {
        logger.error('[EducationService] Error creating setup profile:', created.error);
        return null;
      }

      profile = created.data;
      createdDuringSetup = true;
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
      education_levels: nullIfEmpty(payload.educationLevels),
      shifts: nullIfEmpty(payload.shifts),
      age_range_min: payload.ageRangeMin ?? null,
      age_range_max: payload.ageRangeMax ?? null,
      enrollment_open: payload.enrollmentOpen ?? null,
      school_basic_resources: nullIfEmpty(payload.schoolBasicResources),
      school_accessibility_features: nullIfEmpty(payload.schoolAccessibilityFeatures),
      school_equipment_features: nullIfEmpty(payload.schoolEquipmentFeatures),
      school_facility_features: nullIfEmpty(payload.schoolFacilityFeatures),
      support_level: 'basic_enabled',
    });

    if (error) {
      logger.error('[EducationService] Error saving setup profile:', error);

      if (createdDuringSetup) {
        const rollback = await mutations.deleteEducationProfile(profile.id);
        if (rollback.error) {
          logger.error(
            '[EducationService] Error rolling back failed setup profile:',
            rollback.error,
          );
        }
      }

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
    payload: EducationProgramAdminPatch,
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
      curriculumTopics?: string[];
    },
  ): Promise<EducationProgram | null> {
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
      curriculum_topics: payload.curriculumTopics ?? null,
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
   * Move lead no pipeline
   */
  async moveLeadInPipeline(move: LeadPipelineMove): Promise<EducationLead | null> {
    try {
      const { leadId, toStatus, lostReason, ownerUserId } = move;

      // Validacoes especificas por status
      if (toStatus === 'lost' && !lostReason) {
        logger.warn('[EducationService] Moving lead to lost without reason');
      }

      const { data, error, previousStatus } =
        await mutations.moveLeadToStatus(leadId, toStatus, {
          lostReason,
          ownerUserId,
        });

      if (error) {
        logger.error('[EducationService] Error moving lead:', error);
        return null;
      }

      // Track conversion when lead is enrolled
      if (
        data &&
        toStatus === 'enrolled' &&
        previousStatus !== 'enrolled'
      ) {
        const profile = await queries.getEducationProfileById(data.education_profile_id);
        if (profile) {
          await trackLeadConverted(
            data.education_profile_id,
            data.id,
            profile.niche_key,
            { previousStatus },
          );
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
    const counts = await queries.countLeadsByStatus(profileId);

    return {
      total: counts.total,
      byStatus: {
        new: counts.new,
        contacted: counts.contacted,
        visit_scheduled: counts.visit_scheduled,
        proposal_sent: counts.proposal_sent,
        enrolled: counts.enrolled,
        lost: counts.lost,
      },
    };
  },

  async listLeads(
    profileId: string,
    options: EducationLeadsListOptions = {},
  ): Promise<{ leads: EducationLead[]; totalCount: number }> {
    return queries.listEducationLeads(profileId, options);
  },

  async updateLead(
    leadId: string,
    payload: EducationLeadAdminPatch,
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
    return queries.listEducationEvents(profileId, {
      isPublic: true,
      upcoming: true,
    });
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
    payload: EducationEventAdminPatch,
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


};