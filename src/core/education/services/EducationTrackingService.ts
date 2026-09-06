/**
 * EducationTrackingService
 *
 * Servico centralizado para tracking de eventos do dominio Education.
 * Persistencia de analytics pertence a core/education.
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import { secureRandomString } from '@/shared/utils/secureRandom';
import type {
  EducationAnalyticsEventType,
  EducationNicheKey,
} from '@/core/education/contracts';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface TrackEventOptions {
  educationProfileId: string;
  businessDataId?: string;
  nicheKey: EducationNicheKey;
  eventType: EducationAnalyticsEventType;
  programId?: string;
  educationEventId?: string;
  leadId?: string;
  sourcePage?: string;
  metadata?: Record<string, unknown>;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-side';

  const key = 'education_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `${Date.now()}-${secureRandomString(12)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

export const EducationTrackingService = {
  async trackEvent(options: TrackEventOptions): Promise<void> {
    try {
      if (!UUID_REGEX.test(options.educationProfileId)) return;
      if (options.programId && !UUID_REGEX.test(options.programId)) return;
      if (options.educationEventId && !UUID_REGEX.test(options.educationEventId)) return;
      if (options.leadId && !UUID_REGEX.test(options.leadId)) return;

      supabase
        .from('education_analytics_events')
        .insert({
          education_profile_id: options.educationProfileId,
          business_data_id: options.businessDataId ?? null,
          niche_key: options.nicheKey,
          event_type: options.eventType,
          program_id: options.programId ?? null,
          education_event_id: options.educationEventId ?? null,
          lead_id: options.leadId ?? null,
          source_page:
            options.sourcePage ??
            (typeof window !== 'undefined' ? window.location.pathname : null),
          session_id: getSessionId(),
          metadata: (options.metadata ?? {}) as Json,
        })
        .then(({ error }) => {
          if (error) logger.warn('[EducationTrackingService] Failed to track event:', error);
        });
    } catch (err) {
      logger.warn('[EducationTrackingService] Error tracking event:', err);
    }
  },

  async trackProfileView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessDataId?: string,
  ): Promise<void> {
    await this.trackEvent({ educationProfileId, businessDataId, nicheKey, eventType: 'profile_view' });
  },

  async trackProgramView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    programId: string,
    businessDataId?: string,
  ): Promise<void> {
    await this.trackEvent({ educationProfileId, businessDataId, nicheKey, eventType: 'program_view', programId });
  },

  async trackEventView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    educationEventId: string,
    businessDataId?: string,
  ): Promise<void> {
    await this.trackEvent({ educationProfileId, businessDataId, nicheKey, eventType: 'event_view', educationEventId });
  },

  async trackWhatsAppClick(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessDataId?: string,
  ): Promise<void> {
    await this.trackEvent({ educationProfileId, businessDataId, nicheKey, eventType: 'whatsapp_click' });
  },

  async trackEnrollmentCTAClick(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessDataId?: string,
    metadata?: { ctaLabel?: string },
  ): Promise<void> {
    await this.trackEvent({ educationProfileId, businessDataId, nicheKey, eventType: 'enrollment_cta_click', metadata });
  },

  async trackLeadSubmitted(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    leadId: string,
    businessDataId?: string,
    metadata?: {
      hasGuardian?: boolean;
      hasStudent?: boolean;
      desiredGrade?: string;
      desiredShift?: string;
    },
  ): Promise<void> {
    await this.trackEvent({ educationProfileId, businessDataId, nicheKey, eventType: 'lead_submitted', leadId, metadata });
  },

  async trackEventInterest(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    educationEventId: string,
    businessDataId?: string,
    metadata?: { eventType?: string },
  ): Promise<void> {
    await this.trackEvent({ educationProfileId, businessDataId, nicheKey, eventType: 'event_interest', educationEventId, metadata });
  },
};
