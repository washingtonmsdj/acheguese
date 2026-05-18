import {
  AnalyticsService as canonicalAnalyticsService,
  type AnalyticsEventSource,
  type AnalyticsEventType,
} from "@/core/analytics/AnalyticsService";

interface LegacyAnalyticsEvent {
  event_type: AnalyticsEventType;
  business_id?: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function resolveLegacyEntity(event: LegacyAnalyticsEvent): { entityType: string; entityId: string } | null {
  if (isNonEmptyString(event.business_id)) {
    return { entityType: "business", entityId: event.business_id };
  }

  const metadata = event.metadata ?? {};
  const vagaId = metadata["vaga_id"];
  if (isNonEmptyString(vagaId)) {
    return { entityType: "vaga", entityId: vagaId };
  }

  const explicitEntityType = metadata["entity_type"];
  const explicitEntityId = metadata["entity_id"];
  if (isNonEmptyString(explicitEntityType) && isNonEmptyString(explicitEntityId)) {
    return { entityType: explicitEntityType, entityId: explicitEntityId };
  }

  return null;
}

class AnalyticsServiceCompatibility {
  async trackEvent(event: LegacyAnalyticsEvent): Promise<void> {
    const resolvedEntity = resolveLegacyEntity(event);
    if (!resolvedEntity) return;

    await canonicalAnalyticsService.trackEvent({
      entity_type: resolvedEntity.entityType,
      entity_id: resolvedEntity.entityId,
      event_type: event.event_type,
      event_source: "web" satisfies AnalyticsEventSource,
      user_id: event.user_id,
      metadata: event.metadata,
    });
  }

  async trackPageView(businessId: string, userId?: string): Promise<void> {
    await canonicalAnalyticsService.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: "page_view",
      user_id: userId,
      metadata: {
        url: typeof window === "undefined" ? undefined : window.location.href,
        referrer: typeof document === "undefined" ? undefined : document.referrer,
        timestamp: Date.now(),
      },
    });
  }

  async trackBusinessInteraction(
    businessId: string,
    action: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await canonicalAnalyticsService.trackEvent({
      entity_type: "business",
      entity_id: businessId,
      event_type: "business_interaction",
      user_id: userId,
      metadata: {
        action,
        ...metadata,
      },
    });
  }
}

export const analyticsService = new AnalyticsServiceCompatibility();
