import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import type { Professional } from "@/core/professional/types";
import { logger } from "@/shared/utils/logger";

class AdminCommunityService {
  async getAllProfessionals(): Promise<Professional[]> {
    try {
      return await ProfessionalService.getProfessionals({
        sortBy: "created_at",
      });
    } catch (error) {
      logger.error("Error fetching professionals", error as Error);
      return [];
    }
  }
}

export const adminCommunityService = new AdminCommunityService();
