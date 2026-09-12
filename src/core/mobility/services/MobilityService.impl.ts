/**
 * MobilityService - compatibility surface for mobility operations not yet moved
 * to dedicated bounded read/command services.
 *
 * Keep this class intentionally small. New reads belong to dedicated services
 * or the functional query modules; do not rebuild parallel read authorities here.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { RideOperationalContextReadService } from "./RideOperationalContextReadService";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type MobilityImplDbClient = {
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

const db = supabase as unknown as MobilityImplDbClient;

export class MobilityService {
  static async ensureDriverDataRow(profileId: string): Promise<void> {
    const { error } = await db.rpc<Record<string, unknown>>(
      "ensure_owned_driver_data",
      { p_profile_id: profileId },
    );
    if (error) throw error;
  }

  /**
   * Compatibility lookup still used by MotoboyAuthorizationService.
   * It delegates to the bounded lifecycle reader instead of reading a generic row.
   */
  static async getRideById(id: string): Promise<unknown | null> {
    try {
      return await RideOperationalContextReadService.getLifecycle(id);
    } catch (error) {
      logger.error("MobilityService.getRideById", error as Error);
      return null;
    }
  }
}

export { mobilityService } from "./MobilityRuntimeService";
