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
  businessDataId?: string;
}

export function useEducationTracking(options: UseEducationTrackingOptions) {
  const { educationProfileId, nicheKey, businessDataId } = options;

  const trackProfileView = useCallback(() => {
    EducationTrackingService.trackProfileView(
      educationProfileId,
      nicheKey,
      businessDataId,
    );
  }, [educationProfileId, nicheKey, businessDataId]);

  const trackProgramView = useCallback(
    (programId: string) => {
      EducationTrackingService.trackProgramView(
        educationProfileId,
        nicheKey,
        programId,
        businessDataId,
      );
    },
    [educationProfileId, nicheKey, businessDataId],
  );

  const trackEventView = useCallback(
    (eventId: string) => {
      EducationTrackingService.trackEventView(
        educationProfileId,
        nicheKey,
        eventId,
        businessDataId,
      );
    },
    [educationProfileId, nicheKey, businessDataId],
  );

  const trackWhatsAppClick = useCallback(() => {
    EducationTrackingService.trackWhatsAppClick(
      educationProfileId,
      nicheKey,
      businessDataId,
    );
  }, [educationProfileId, nicheKey, businessDataId]);

  const trackEnrollmentCTAClick = useCallback(
    (ctaLabel?: string) => {
      EducationTrackingService.trackEnrollmentCTAClick(
        educationProfileId,
        nicheKey,
        businessDataId,
        ctaLabel ? { ctaLabel } : undefined,
      );
    },
    [educationProfileId, nicheKey, businessDataId],
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
        businessDataId,
        metadata,
      );
    },
    [educationProfileId, nicheKey, businessDataId],
  );

  const trackEventInterest = useCallback(
    (eventId: string, eventType?: string) => {
      EducationTrackingService.trackEventInterest(
        educationProfileId,
        nicheKey,
        eventId,
        businessDataId,
        eventType ? { eventType } : undefined,
      );
    },
    [educationProfileId, nicheKey, businessDataId],
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
