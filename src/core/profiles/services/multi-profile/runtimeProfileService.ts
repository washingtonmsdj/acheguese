import { logger } from "@/shared/utils/logger";
import { selectLooseRows } from "@/integrations/supabase";

import type { Profile } from "./types";

export const MultiProfileRuntimeService = {
  async getMyProfiles(userId: string): Promise<Profile[]> {
    if (!userId) return [];

    try {
      const { data, error } = await selectLooseRows<Profile>("profiles", {
        filters: [{ op: "eq", column: "user_id", value: userId }],
        orderBy: { column: "created_at", ascending: true },
      });

      if (error) throw error;

      return (data ?? []) as Profile[];
    } catch (error) {
      logger.error("Error fetching runtime profiles:", error);
      return [];
    }
  },
};
