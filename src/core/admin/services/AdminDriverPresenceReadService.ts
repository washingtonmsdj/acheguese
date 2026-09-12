import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
};

type PresenceDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const presenceDb = supabase as unknown as PresenceDbClient;

export interface AdminDriverPresenceRow {
  profile_id: string;
  is_online: boolean;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  last_seen_at: string | null;
  active_ride_id: string | null;
  active_ride_mode: string | null;
}

/**
 * Admin read model for physical/operational driver presence.
 *
 * The source is exclusively `driver_availability`. Access remains governed by
 * the existing owner-or-admin SELECT policy; this service does not add grants,
 * bypass RLS or synthesize state from `driver_data`.
 */
export class AdminDriverPresenceReadService {
  static async list(profileIds?: readonly string[]): Promise<AdminDriverPresenceRow[]> {
    if (profileIds && profileIds.length === 0) return [];

    try {
      let query = presenceDb
        .from<AdminDriverPresenceRow>("driver_availability")
        .select(
          "profile_id, is_online, is_available, current_lat, current_lng, last_location_update, last_seen_at, active_ride_id, active_ride_mode",
        );

      if (profileIds) {
        query = query.in("profile_id", profileIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminDriverPresenceReadService.list", error as Error, {
        profileCount: profileIds?.length ?? null,
      });
      throw error;
    }
  }

  static async listOnline(): Promise<AdminDriverPresenceRow[]> {
    try {
      const { data, error } = await presenceDb
        .from<AdminDriverPresenceRow>("driver_availability")
        .select(
          "profile_id, is_online, is_available, current_lat, current_lng, last_location_update, last_seen_at, active_ride_id, active_ride_mode",
        )
        .eq("is_online", true);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminDriverPresenceReadService.listOnline", error as Error);
      throw error;
    }
  }
}
