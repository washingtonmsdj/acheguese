import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { logger } from "@/shared/utils/logger";

export class ProfessionalLinkEligibilityService {
  static async isCommunityLinkEligible(professionalId: string): Promise<boolean> {
    try {
      const professional = await ProfessionalService.getProfessionalById(professionalId);

      return Boolean(
        professional &&
          professional.is_accepting_clients &&
          professional.visibility === "public_listed",
      );
    } catch (error) {
      logger.warn("Professional community link eligibility check failed", {
        professionalId,
        error,
      });
      return false;
    }
  }
}
