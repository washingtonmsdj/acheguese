import { logger } from "@/shared/utils/logger";
import { ProfileRpcService } from "../ProfileRpcService";

import type { Profile } from "./types";

export const MultiProfileRuntimeService = {
  async getMyProfiles(userId: string): Promise<Profile[]> {
    if (!userId) return [];

    try {
      return await ProfileRpcService.getAccessibleProfiles<Profile[]>({
        targetUserId: userId,
      });
    } catch (error) {
      logger.error("Error fetching runtime profiles:", error);
      return [];
    }
  },
};
