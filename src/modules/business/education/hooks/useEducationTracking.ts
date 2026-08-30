/**
 * useEducationTracking Hook
 *
 * Hook para facilitar o tracking de eventos em componentes React.
 * Fornece callbacks memoizados para evitar re-renderizacoes desnecessarias.
 *
 * @version 1.0.0
 */

import { useCallback } from 'react';
import { EducationTrackingService } from '@/core/education/services/EducationTrackingService';
import type { EducationNicheKey } from '@/core/education';

export interface UseEducationTrackingOptions {
  educationProfileId: string;
  nicheKey: EducationNicheKey;
  businessId?: string;
}

export function useEducationTracking(options: UseEducationTrackingOptions) {
  const { educationProfileId, nicheKey, businessId } = options;

  const trackProfileView = useCallback(() => {
    EducationTrackingService.trackProfileView(
      educationProfileId,
      nicheKey,
      businessId,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackProgramView = useCallback(
    (programId: string) => {
      EducationTrackingService.trackProgramView(
        educationProfileId,
        nicheKey,
        programId,
        businessId,
      );
    },
    [educationProfileId, nicheKey, businessId],
  );

  const trackEventView = useCallback(
    (eventId: string) => {
      EducationTrackingService.trackEventView(
        educationProfileId,
        nicheKey,
        eventId,
        businessId,
      );
    },
    [educationProfileId, nicheKey, businessId],
  );

  const trackWhatsAppClick = useCallback(() => {
    EducationTrackingService.trackWhatsAppClick(
      educationProfileId,
      nicheKey,
      businessId,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackEnrollmentCTAClick = useCallback(
    (ctaLabel?: string) => {
      EducationTrackingService.trackEnrollmentCTAClick(
        educationProfileId,
        nicheKey,
        businessId,
        ctaLabel ? { ctaLabel } : undefined,
      );
    },
    [educationProfileId, nicheKey, businessId],
  );

  const trackLeadSubmitted = useCallback(
    (
      leadId: string,
      metadata?: {
        hasGuardian?: boolean;
        hasStudent?: boolean;
        desiredGrade?: string;
        desiredShift?: string;
      },
    ) => {
      EducationTrackingService.trackLeadSubmitted(
        educationProfileId,
        nicheKey,
        leadId,
        businessId,
        metadata,
      );
    },
    [educationProfileId, nicheKey, businessId],
  );

  const trackEventInterest = useCallback(
    (eventId: string, eventType?: string) => {
      EducationTrackingService.trackEventInterest(
        educationProfileId,
        nicheKey,
        eventId,
        businessId,
        eventType ? { eventType } : undefined,
      );
    },
    [educationProfileId, nicheKey, businessId],
  );

  return {
    trackProfileView,
    trackProgramView,
    trackEventView,
    trackWhatsAppClick,
    trackEnrollmentCTAClick,
    trackLeadSubmitted,
    trackEventInterest,
  };
}
