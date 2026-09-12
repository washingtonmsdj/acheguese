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
  in(column: string, values: readonly string[]): TableClient<TRow>;
};

type AnalyticsDriverDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const analyticsDriverDb = supabase as unknown as AnalyticsDriverDbClient;

type DriverIdentityRelation = {
  name: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type AnalyticsDriverMetricDbRow = Pick<
  Tables<"driver_data">,
  "profile_id" | "is_verified"
>;

type AnalyticsDriverDirectoryDbRow = Pick<
  Tables<"driver_data">,
  "profile_id"
> & {
  profiles:
    | DriverIdentityRelation
    | readonly DriverIdentityRelation[]
    | null;
};

export interface AdminMobilityAnalyticsDriverMetricRow {
  id: string;
  is_verified: boolean;
}

export interface AdminMobilityAnalyticsDriverDirectoryRow {
  id: string;
  name: string;
  profile: {
    name: string;
    avatar_url: string | null;
  };
}

function normalizeIdentity(
  value: AnalyticsDriverDirectoryDbRow["profiles"],
): DriverIdentityRelation | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value as DriverIdentityRelation | null;
}

/**
 * Temporary analytics driver read boundary while G104 aggregate RPC is pending.
 *
 * Global analytics only needs driver cardinality + verification. Identity is
 * fetched separately and only for driver ids that can actually appear in the
 * selected-window ranking. Operational presence remains owned exclusively by
 * driver_availability and never enters this service.
 */
export class AdminMobilityAnalyticsDriverReadService {
  static async listMetricRows(): Promise<AdminMobilityAnalyticsDriverMetricRow[]> {
    try {
      const { data, error } = await analyticsDriverDb
        .from<AnalyticsDriverMetricDbRow>("driver_data")
        .select("profile_id, is_verified");

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.profile_id,
        is_verified: row.is_verified ?? false,
      }));
    } catch (error) {
      logger.error(
        "AdminMobilityAnalyticsDriverReadService.listMetricRows",
        error as Error,
      );
      throw error;
    }
  }

  static async listDirectory(
    profileIds: readonly string[],
  ): Promise<AdminMobilityAnalyticsDriverDirectoryRow[]> {
    const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];
    if (uniqueProfileIds.length === 0) return [];

    try {
      const { data, error } = await analyticsDriverDb
        .from<AnalyticsDriverDirectoryDbRow>("driver_data")
        .select("profile_id, profiles!inner(name, display_name, avatar_url)")
        .in("profile_id", uniqueProfileIds);

      if (error) throw error;

      return (data ?? []).map((row) => {
        const profile = normalizeIdentity(row.profiles);
        const name = profile?.display_name ?? profile?.name ?? "Motorista";
        return {
          id: row.profile_id,
          name,
          profile: {
            name,
            avatar_url: profile?.avatar_url ?? null,
          },
        };
      });
    } catch (error) {
      logger.error(
        "AdminMobilityAnalyticsDriverReadService.listDirectory",
        error as Error,
        { profileCount: uniqueProfileIds.length },
      );
      throw error;
    }
  }
}
