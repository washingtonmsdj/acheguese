/**
 * Education Observability Service
 *
 * Centraliza eventos de observabilidade, metricas e logging para o modulo Education.
 * Integra com sistema de analytics e monitoring do projeto.
 *
 * @module EducationObservabilityService
 * @version 1.0.0
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import { secureRandomString } from '@/shared/utils/secureRandom';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ============================================================
// TYPES
// ============================================================

export type EducationEventType =
  // Conversion Events
  | 'education_profile_created'
  | 'education_profile_published'
  | 'education_lead_created'
  | 'education_lead_converted'
  | 'education_lead_lost'
  | 'education_program_created'
  | 'education_event_created'
  // Error Events
  | 'education_profile_save_failed'
  | 'education_profile_publish_failed'
  | 'education_lead_save_failed'
  | 'education_program_save_failed'
  | 'education_event_save_failed'
  // User Journey Events
  | 'education_landing_viewed'
  | 'education_detail_viewed'
  | 'education_lead_form_opened'
  | 'education_lead_form_submitted'
  | 'education_whatsapp_clicked'
  // Performance Events
  | 'education_page_load_slow'
  | 'education_api_timeout';

export interface EducationEventPayload {
  eventType: EducationEventType;
  profileId?: string;
  businessId?: string;
  leadId?: string;
  programId?: string;
  nicheKey?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  performance?: {
    duration: number;
    timestamp: number;
  };
}

export interface EducationMetrics {
  // Conversion Metrics
  leadsCreatedToday: number;
  leadsConvertedToday: number;
  conversionRate: number;
  // Performance Metrics
  avgPageLoadTime: number;
  apiErrorRate: number;
  // Business Metrics
  activeProfiles: number;
  publishedProfiles: number;
}

// ============================================================
// SERVICE
// ============================================================

class EducationObservabilityServiceClass {
  /**
   * Track conversion event
   */
  async trackConversion(payload: EducationEventPayload): Promise<void> {
    try {
      // Log to console in development
      if (import.meta.env.DEV) {
        logger.info('[Education Conversion]', payload);
      }

      // Save to analytics table
      await this.saveAnalyticsEvent(payload);

      // Send to external analytics (if configured)
      await this.sendToExternalAnalytics(payload);
    } catch (error) {
      logger.error('[Education Observability] Failed to track conversion', error);
    }
  }

  /**
   * Track error event
   */
  async trackError(payload: EducationEventPayload): Promise<void> {
    try {
      // Always log errors
      logger.error('[Education Error]', {
        eventType: payload.eventType,
        error: payload.error,
        metadata: payload.metadata,
      });

      // Save to analytics table
      await this.saveAnalyticsEvent(payload);

      // Send to error tracking service (Sentry, etc)
      await this.sendToErrorTracking(payload);
    } catch (error) {
      logger.error('[Education Observability] Failed to track error', error);
    }
  }

  /**
   * Track user journey event
   */
  async trackUserJourney(payload: EducationEventPayload): Promise<void> {
    try {
      if (import.meta.env.DEV) {
        logger.info('[Education Journey]', payload);
      }

      // Save to analytics table
      await this.saveAnalyticsEvent(payload);
    } catch (error) {
      logger.error('[Education Observability] Failed to track user journey', error);
    }
  }

  /**
   * Track performance event
   */
  async trackPerformance(payload: EducationEventPayload): Promise<void> {
    try {
      if (import.meta.env.DEV) {
        logger.warn('[Education Performance]', payload);
      }

      // Save to analytics table
      await this.saveAnalyticsEvent(payload);

      // Alert if critical performance issue
      if (payload.performance && payload.performance.duration > 5000) {
        logger.error('[Education Performance] Critical slow page load', payload);
      }
    } catch (error) {
      logger.error('[Education Observability] Failed to track performance', error);
    }
  }

  /**
   * Get current metrics
   */
  async getMetrics(profileId?: string): Promise<EducationMetrics> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Query leads created today
      let leadsQuery = supabase
        .from('education_leads')
        .select('id, status', { count: 'exact' })
        .gte('created_at', today.toISOString());

      if (profileId) {
        leadsQuery = leadsQuery.eq('education_profile_id', profileId);
      }

      const { data: leads, count: totalLeads } = await leadsQuery;

      const leadsConverted = leads?.filter(l => l.status === 'enrolled').length ?? 0;
      const conversionRate = totalLeads ? (leadsConverted / totalLeads) * 100 : 0;

      // Query profiles
      let profilesQuery = supabase
        .from('education_profiles')
        .select('id, status', { count: 'exact' });

      if (profileId) {
        profilesQuery = profilesQuery.eq('id', profileId);
      }

      const { data: profiles } = await profilesQuery;
      const publishedProfiles = profiles?.filter(p => p.status === 'published').length ?? 0;
      const { data: analyticsEvents } = await this.getAnalyticsEventsForToday(profileId, today);
      const eventRows = analyticsEvents ?? [];
      const performanceDurations = eventRows
        .map((event) => this.extractPerformanceDuration(event.metadata))
        .filter((duration): duration is number => typeof duration === 'number' && Number.isFinite(duration));
      const avgPageLoadTime = performanceDurations.length > 0
        ? Math.round(performanceDurations.reduce((sum, duration) => sum + duration, 0) / performanceDurations.length)
        : 0;
      const apiErrorEvents = eventRows.filter((event) =>
        event.event_type.endsWith('_failed') || event.event_type === 'education_api_timeout' || this.hasErrorMetadata(event.metadata),
      ).length;
      const apiErrorRate = eventRows.length > 0
        ? Math.round((apiErrorEvents / eventRows.length) * 10000) / 100
        : 0;

      return {
        leadsCreatedToday: totalLeads ?? 0,
        leadsConvertedToday: leadsConverted,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgPageLoadTime,
        apiErrorRate,
        activeProfiles: profiles?.length ?? 0,
        publishedProfiles,
      };
    } catch (error) {
      logger.error('[Education Observability] Failed to get metrics', error);
      return {
        leadsCreatedToday: 0,
        leadsConvertedToday: 0,
        conversionRate: 0,
        avgPageLoadTime: 0,
        apiErrorRate: 0,
        activeProfiles: 0,
        publishedProfiles: 0,
      };
    }
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private async getAnalyticsEventsForToday(profileId: string | undefined, since: Date) {
    let query = supabase
      .from('education_analytics_events')
      .select('event_type, metadata')
      .gte('created_at', since.toISOString());

    if (profileId) {
      query = query.eq('education_profile_id', profileId);
    }

    return query;
  }

  private extractPerformanceDuration(metadata: Json | unknown): number | null {
    if (!metadata || typeof metadata !== 'object') return null;
    const performance = (metadata as { performance?: unknown }).performance;
    if (!performance || typeof performance !== 'object') return null;
    const duration = (performance as { duration?: unknown }).duration;
    return typeof duration === 'number' ? duration : null;
  }

  private hasErrorMetadata(metadata: Json | unknown): boolean {
    return Boolean(metadata && typeof metadata === 'object' && (metadata as { error?: unknown }).error);
  }

  private async saveAnalyticsEvent(payload: EducationEventPayload): Promise<void> {
    try {
      const { error } = await supabase.from('education_analytics_events').insert({
        education_profile_id: payload.profileId ?? null,
        event_type: payload.eventType,
        metadata: ({
          businessId: payload.businessId,
          leadId: payload.leadId,
          programId: payload.programId,
          userId: payload.userId,
          metadata: payload.metadata,
          error: payload.error,
          performance: payload.performance,
        } as unknown as Json),
        niche_key: payload.nicheKey,
        session_id: this.getSessionId(),
      });

      if (error) {
        logger.error('[Education Observability] Failed to save analytics event', error);
      }
    } catch (error) {
      logger.error('[Education Observability] Exception saving analytics event', error);
    }
  }

  private async sendToExternalAnalytics(payload: EducationEventPayload): Promise<void> {
    const analyticsWindow = globalThis as typeof globalThis & {
      gtag?: (...args: unknown[]) => void;
    };

    analyticsWindow.gtag?.('event', payload.eventType, {
      profile_id: payload.profileId,
      business_id: payload.businessId,
      niche_key: payload.nicheKey,
      lead_id: payload.leadId,
      program_id: payload.programId,
      ...payload.metadata,
    });
  }

  private async sendToErrorTracking(payload: EducationEventPayload): Promise<void> {
    const errorWindow = globalThis as typeof globalThis & {
      Sentry?: {
        captureException: (error: Error, context?: Record<string, unknown>) => void;
      };
    };

    if (!errorWindow.Sentry || !payload.error?.message) return;

    errorWindow.Sentry.captureException(new Error(payload.error.message), {
      tags: {
        module: 'education',
        event_type: payload.eventType,
        niche_key: payload.nicheKey,
      },
      extra: {
        metadata: payload.metadata,
        profileId: payload.profileId,
        businessId: payload.businessId,
        leadId: payload.leadId,
        programId: payload.programId,
        error: payload.error,
      },
    });
  }

  private getSessionId(): string | null {
    // Get session ID from storage or generate new one
    try {
      let sessionId = sessionStorage.getItem('education_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${secureRandomString(12)}`;
        sessionStorage.setItem('education_session_id', sessionId);
      }
      return sessionId;
    } catch {
      return null;
    }
  }
}

// ============================================================
// EXPORT SINGLETON
// ============================================================

export const EducationObservabilityService = new EducationObservabilityServiceClass();

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

/**
 * Track lead created event
 */
export async function trackLeadCreated(
  profileId: string,
  leadId: string,
  nicheKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await EducationObservabilityService.trackConversion({
    eventType: 'education_lead_created',
    profileId,
    leadId,
    nicheKey,
    metadata,
  });
}

/**
 * Track lead converted event
 */
export async function trackLeadConverted(
  profileId: string,
  leadId: string,
  nicheKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await EducationObservabilityService.trackConversion({
    eventType: 'education_lead_converted',
    profileId,
    leadId,
    nicheKey,
    metadata,
  });
}

/**
 * Track profile published event
 */
export async function trackProfilePublished(
  profileId: string,
  businessId: string,
  nicheKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await EducationObservabilityService.trackConversion({
    eventType: 'education_profile_published',
    profileId,
    businessId,
    nicheKey,
    metadata,
  });
}

/**
 * Track error event
 */
export async function trackEducationError(
  eventType: EducationEventType,
  error: Error,
  metadata?: Record<string, unknown>
): Promise<void> {
  await EducationObservabilityService.trackError({
    eventType,
    error: {
      message: error.message,
      stack: error.stack,
    },
    metadata,
  });
}
