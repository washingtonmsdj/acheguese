import { eventsReadService } from "@/core/community-events/services/EventReadService";
import { isEventCurrentOrFuture } from "@/core/community-events/eventFreshness";
import { logger } from "@/shared/utils/logger";

export class EventLinkEligibilityService {
  static async isCommunityLinkEligible(eventId: string): Promise<boolean> {
    try {
      const event = await eventsReadService.getEventById(eventId);

      return Boolean(event && isEventCurrentOrFuture(event));
    } catch (error) {
      logger.warn("Event community link eligibility check failed", {
        eventId,
        error,
      });
      return false;
    }
  }
}
