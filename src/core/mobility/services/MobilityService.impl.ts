/**
 * MobilityService - compatibility surface for the last mobility operation not
 * yet moved to its bounded owner.
 *
 * New reads/commands must not be added here.
 */

import { supabase } from "@/integrations/supabase";

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
}

export { mobilityService } from "./MobilityRuntimeService";
