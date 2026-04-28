/**
 * EducationTrackingService
 *
 * Serviço centralizado para tracking de eventos do módulo Education.
 * Todas as operações de analytics devem passar por aqui.
 *
 * Principios:
 * - Fire-and-forget: tracking nunca bloqueia a UI
 * - Fallback silencioso: erros de tracking nao quebram a aplicacao
 * - Session-based: identifica usuarios unicos por sessao
 *
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/utils/logger';
import type {
  EducationAnalyticsEventType,
  EducationNicheKey,
} from '../types';

export interface TrackEventOptions {
  educationProfileId: string;
  businessId?: string;
  nicheKey: EducationNicheKey;
  eventType: EducationAnalyticsEventType;
  programId?: string;
  educationEventId?: string;
  leadId?: string;
  sourcePage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Gera ou recupera ID de sessao para tracking
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-side';

  const key = 'education_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

export const EducationTrackingService = {
  /**
   * Registra um evento de analytics
   *
   * NOTA: Esta funcao eh fire-and-forget. Nao espere por resposta.
   * O tracking nunca deve bloquear a experiencia do usuario.
   */
  async trackEvent(options: TrackEventOptions): Promise<void> {
    try {
      // Fire-and-forget: nao esperamos resposta
      supabase
        .from('education_analytics_events')
        .insert({
          education_profile_id: options.educationProfileId,
          business_id: options.businessId ?? null,
          niche_key: options.nicheKey,
          event_type: options.eventType,
          program_id: options.programId ?? null,
          education_event_id: options.educationEventId ?? null,
          lead_id: options.leadId ?? null,
          source_page: options.sourcePage ?? (typeof window !== 'undefined' ? window.location.pathname : null),
          session_id: getSessionId(),
          metadata: options.metadata ?? {},
        })
        .then(({ error }) => {
          if (error) {
            logger.warn('[EducationTrackingService] Failed to track event:', error);
          }
        });
    } catch (err) {
      // Tracking nunca deve quebrar a aplicacao
      logger.warn('[EducationTrackingService] Error tracking event:', err);
    }
  },

  // ============================================================
  // HELPERS ESPECIFICOS (mantem regras de negocio)
  // ============================================================

  /**
   * Track: Visualizacao de perfil
   */
  async trackProfileView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'profile_view',
    });
  },

  /**
   * Track: Visualizacao de programa
   */
  async trackProgramView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    programId: string,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'program_view',
      programId,
    });
  },

  /**
   * Track: Visualizacao de evento
   */
  async trackEventView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    educationEventId: string,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'event_view',
      educationEventId,
    });
  },

  /**
   * Track: Clique no WhatsApp
   */
  async trackWhatsAppClick(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'whatsapp_click',
    });
  },

  /**
   * Track: Clique no CTA de matricula
   */
  async trackEnrollmentCTAClick(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessId?: string,
    metadata?: { ctaLabel?: string },
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'enrollment_cta_click',
      metadata,
    });
  },

  /**
   * Track: Lead enviado
   */
  async trackLeadSubmitted(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    leadId: string,
    businessId?: string,
    metadata?: {
      hasGuardian?: boolean;
      hasStudent?: boolean;
      desiredGrade?: string;
      desiredShift?: string;
    },
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'lead_submitted',
      leadId,
      metadata,
    });
  },

  /**
   * Track: Interesse em evento
   */
  async trackEventInterest(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    educationEventId: string,
    businessId?: string,
    metadata?: { eventType?: string },
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'event_interest',
      educationEventId,
      metadata,
    });
  },
};
