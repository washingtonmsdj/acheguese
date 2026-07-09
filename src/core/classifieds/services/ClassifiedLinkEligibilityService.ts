import { CLASSIFIED_STATUS } from "@/core/classifieds/constants/statuses";
import { getClassifiedById } from "@/core/classifieds/services/classifieds.queries";
import { logger } from "@/shared/utils/logger";

export class ClassifiedLinkEligibilityService {
  static async isCommunityLinkEligible(classifiedId: string): Promise<boolean> {
    try {
      const classified = await getClassifiedById(classifiedId);

      return Boolean(
        classified &&
          classified.is_active &&
          classified.status === CLASSIFIED_STATUS.ACTIVE,
      );
    } catch (error) {
      logger.warn("Classified community link eligibility check failed", {
        classifiedId,
        error,
      });
      return false;
    }
  }
}
