import { TouristPointQueryService } from "@/core/guide/tourist-points/services/TouristPointQueryService";
import { TOURIST_POINT_STATUS } from "@/core/guide/tourist-points/types";
import { logger } from "@/shared/utils/logger";

export class TouristPointLinkEligibilityService {
  static async isCommunityLinkEligible(touristPointId: string): Promise<boolean> {
    try {
      const touristPoint = await TouristPointQueryService.getById(touristPointId);

      return touristPoint?.status === TOURIST_POINT_STATUS.PUBLISHED;
    } catch (error) {
      logger.warn("Tourist point community link eligibility check failed", {
        touristPointId,
        error,
      });
      return false;
    }
  }
}
