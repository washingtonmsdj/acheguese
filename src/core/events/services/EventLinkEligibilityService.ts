import { eventsReadService } from "@/core/verticals/events/services/EventReadService";
import type { PublicEventStatus } from "@/core/verticals/events/types";
import { logger } from "@/shared/utils/logger";

const COMMUNITY_LINK_ELIGIBLE_EVENT_STATUSES = new Set<PublicEventStatus>([
  "upcoming",
  "ongoing",
]);

export class EventLinkEligibilityService {
  static async isCommunityLinkEligible(eventId: string): Promise<boolean> {
    try {
      const event = await eventsReadService.getEventById(eventId);

      return Boolean(
        event && COMMUNITY_LINK_ELIGIBLE_EVENT_STATUSES.has(event.status),
      );
    } catch (error) {
      logger.warn("Event community link eligibility check failed", {
        eventId,
        error,
      });
      return false;
    }
  }
}
