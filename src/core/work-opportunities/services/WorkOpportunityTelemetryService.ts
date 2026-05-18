import { AnalyticsService } from "@/core/analytics";
import { logger } from "@/shared/utils/logger";

export type OpportunityOpenSource = "feed" | "search" | "profile_professions" | "list" | "direct";

export interface OpportunityTelemetryContext {
  opportunityId: string;
  professionalId?: string | null;
  territoryLocationId?: string | null;
  source?: OpportunityOpenSource;
  actorUserId?: string | null;
  actorProfileId?: string | null;
  metadata?: Record<string, unknown>;
}

class WorkOpportunityTelemetryServiceClass {
  private async track(
    eventName: string,
    eventType: "page_view" | "click_directions" | "click_whatsapp" | "share" | "favorite_added",
    context: OpportunityTelemetryContext,
  ): Promise<void> {
    try {
      await AnalyticsService.trackEvent({
        entity_type: "work_opportunity",
        entity_id: context.opportunityId,
        event_type: eventType,
        event_source: context.source === "search" ? "search" : "web",
        user_id: context.actorUserId ?? undefined,
        metadata: {
          event_name: eventName,
          source: context.source ?? "direct",
          professional_id: context.professionalId ?? null,
          territory_location_id: context.territoryLocationId ?? null,
          actor_profile_id: context.actorProfileId ?? null,
          ...(context.metadata ?? {}),
        },
      });
    } catch (error) {
      logger.warn("WorkOpportunityTelemetryService.track", error as Error);
    }
  }

  async trackOpportunityView(context: OpportunityTelemetryContext): Promise<void> {
    await this.track("work_opportunity_view", "page_view", context);
  }

  async trackOpportunityOpen(context: OpportunityTelemetryContext): Promise<void> {
    await this.track("work_opportunity_open", "page_view", context);
  }

  async trackOpportunityClick(context: OpportunityTelemetryContext): Promise<void> {
    await this.track("work_opportunity_click", "click_directions", context);
  }

  async trackProfessionalProfileClick(context: OpportunityTelemetryContext): Promise<void> {
    await this.track("professional_profile_click", "click_directions", context);
  }

  async trackContactStarted(context: OpportunityTelemetryContext): Promise<void> {
    await this.track("work_opportunity_contact_started", "click_whatsapp", context);
  }

  async trackInterestConversion(context: OpportunityTelemetryContext): Promise<void> {
    await this.track("work_opportunity_interest_conversion", "favorite_added", context);
  }

  async trackFeedbackLoopAnswer(
    context: OpportunityTelemetryContext,
    answer: "helped" | "found_someone" | "service_done" | "no_help",
  ): Promise<void> {
    await this.track("work_opportunity_feedback_loop", "share", {
      ...context,
      metadata: {
        ...(context.metadata ?? {}),
        feedback_answer: answer,
      },
    });
  }
}

export const workOpportunityTelemetryService = new WorkOpportunityTelemetryServiceClass();
export { workOpportunityTelemetryService as WorkOpportunityTelemetryService };



