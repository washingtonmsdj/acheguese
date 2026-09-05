/**
 * Education Observability Service
 *
 * Observabilidade tecnica do dominio Education.
 *
 * IMPORTANTE:
 * - nao persiste em public.education_analytics_events;
 * - essa tabela pertence exclusivamente ao funil de produto gravado por
 *   EducationTrackingService;
 * - conversoes tecnicas sao encaminhadas ao analytics externo quando presente;
 * - erros ficam em logger/Sentry quando disponiveis.
 *
 * @module EducationObservabilityService
 */

import { logger } from '@/shared/utils/logger';

export type EducationEventType =
  | 'education_profile_published'
  | 'education_lead_created'
  | 'education_lead_converted'
  | 'education_profile_publish_failed'
  | 'education_lead_save_failed';

export interface EducationEventPayload {
  eventType: EducationEventType;
  profileId?: string;
  businessId?: string;
  leadId?: string;
  nicheKey?: string;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

class EducationObservabilityServiceClass {
  async trackConversion(payload: EducationEventPayload): Promise<void> {
    try {
      if (import.meta.env.DEV) {
        logger.info('[Education Conversion]', payload);
      }

      this.sendToExternalAnalytics(payload);
    } catch (error) {
      logger.error('[Education Observability] Failed to track conversion', error);
    }
  }

  async trackError(payload: EducationEventPayload): Promise<void> {
    try {
      logger.error('[Education Error]', {
        eventType: payload.eventType,
        error: payload.error,
        profileId: payload.profileId,
        businessId: payload.businessId,
        leadId: payload.leadId,
        nicheKey: payload.nicheKey,
        metadata: payload.metadata,
      });

      this.sendToErrorTracking(payload);
    } catch (error) {
      logger.error('[Education Observability] Failed to track error', error);
    }
  }

  private sendToExternalAnalytics(payload: EducationEventPayload): void {
    const analyticsWindow = globalThis as typeof globalThis & {
      gtag?: (...args: unknown[]) => void;
    };

    analyticsWindow.gtag?.('event', payload.eventType, {
      profile_id: payload.profileId,
      business_id: payload.businessId,
      niche_key: payload.nicheKey,
      lead_id: payload.leadId,
      ...payload.metadata,
    });
  }

  private sendToErrorTracking(payload: EducationEventPayload): void {
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
        error: payload.error,
      },
    });
  }
}

export const EducationObservabilityService =
  new EducationObservabilityServiceClass();

export async function trackLeadCreated(
  profileId: string,
  leadId: string,
  nicheKey: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await EducationObservabilityService.trackConversion({
    eventType: 'education_lead_created',
    profileId,
    leadId,
    nicheKey,
    metadata,
  });
}

export async function trackLeadConverted(
  profileId: string,
  leadId: string,
  nicheKey: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await EducationObservabilityService.trackConversion({
    eventType: 'education_lead_converted',
    profileId,
    leadId,
    nicheKey,
    metadata,
  });
}

export async function trackProfilePublished(
  profileId: string,
  businessId: string,
  nicheKey: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await EducationObservabilityService.trackConversion({
    eventType: 'education_profile_published',
    profileId,
    businessId,
    nicheKey,
    metadata,
  });
}

export async function trackEducationError(
  eventType: Extract<
    EducationEventType,
    'education_profile_publish_failed' | 'education_lead_save_failed'
  >,
  error: Error,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const profileId =
    typeof metadata?.profileId === 'string' ? metadata.profileId : undefined;
  const businessId =
    typeof metadata?.businessId === 'string' ? metadata.businessId : undefined;
  const nicheKey =
    typeof metadata?.nicheKey === 'string' ? metadata.nicheKey : undefined;

  await EducationObservabilityService.trackError({
    eventType,
    profileId,
    businessId,
    nicheKey,
    error: {
      message: error.message,
      stack: error.stack,
    },
    metadata,
  });
}
