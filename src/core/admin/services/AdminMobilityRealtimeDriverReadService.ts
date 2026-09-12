import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns: string): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
};

type RealtimeDriverDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const realtimeDriverDb = supabase as unknown as RealtimeDriverDbClient;

export type AdminMobilityRealtimeDriverMetricRow = Pick<
  Tables<"driver_data">,
  "rating" | "is_verified"
>;

type DriverIdentityRelation = {
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type DriverOnlineDirectoryDbRow = Pick<
  Tables<"driver_data">,
  "profile_id" | "rating" | "total_rides" | "vehicle_model" | "vehicle_plate"
> & {
  profiles:
    | DriverIdentityRelation
    | readonly DriverIdentityRelation[]
    | null;
};

export interface AdminMobilityRealtimeOnlineDriverRow {
  profile_id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  total_rides: number;
  vehicle_model: string | null;
  vehicle_plate: string | null;
}

function normalizeIdentity(
  value: DriverOnlineDirectoryDbRow["profiles"],
): DriverIdentityRelation | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value as DriverIdentityRelation | null;
}

/**
 * Realtime driver read boundary.
 *
 * Global/all-time metrics need only rating + verification. Identity, avatar and
 * vehicle data are loaded only for profile IDs that are currently online.
 * Presence itself remains exclusively owned by driver_availability.
 */
export class AdminMobilityRealtimeDriverReadService {
  static async listMetricRows(): Promise<AdminMobilityRealtimeDriverMetricRow[]> {
    try {
      const { data, error } = await realtimeDriverDb
        .from<AdminMobilityRealtimeDriverMetricRow>("driver_data")
        .select("rating, is_verified");

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminMobilityRealtimeDriverReadService.listMetricRows", error as Error);
      throw error;
    }
  }

  static async listOnlineDirectory(
    profileIds: readonly string[],
  ): Promise<AdminMobilityRealtimeOnlineDriverRow[]> {
    if (profileIds.length === 0) return [];

    try {
      const { data, error } = await realtimeDriverDb
        .from<DriverOnlineDirectoryDbRow>("driver_data")
        .select(
          "profile_id, rating, total_rides, vehicle_model, vehicle_plate, profiles!inner(name, display_name, avatar_url)",
        )
        .in("profile_id", profileIds);

      if (error) throw error;

      return (data ?? []).map((row) => {
        const profile = normalizeIdentity(row.profiles);
        return {
          profile_id: row.profile_id,
          name: profile?.display_name ?? profile?.name ?? "Motorista",
          avatar_url: profile?.avatar_url ?? null,
          rating: row.rating ?? 0,
          total_rides: row.total_rides ?? 0,
          vehicle_model: row.vehicle_model ?? null,
          vehicle_plate: row.vehicle_plate ?? null,
        };
      });
    } catch (error) {
      logger.error("AdminMobilityRealtimeDriverReadService.listOnlineDirectory", error as Error, {
        profileCount: profileIds.length,
      });
      throw error;
    }
  }
}
