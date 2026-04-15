import { useEffect } from "react";
import { analyticsService } from "@/core/analytics/services/AnalyticsService";

export function useAnalytics() {
  return {
    trackEvent: analyticsService.trackEvent.bind(analyticsService),
    trackPageView: analyticsService.trackPageView.bind(analyticsService),
    trackBusinessInteraction:
      analyticsService.trackBusinessInteraction.bind(analyticsService),
  };
}

// Hook for tracking automático de página de business
export function useBusinessPageTracking(businessId?: string, userId?: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    if (businessId) {
      trackPageView(businessId, userId);
    }
  }, [businessId, userId, trackPageView]);
}
