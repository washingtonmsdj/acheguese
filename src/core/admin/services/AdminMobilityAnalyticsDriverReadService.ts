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

type AnalyticsDriverDbRow = Pick<
  Tables<"driver_data">,
  "profile_id" | "is_verified"
> & {
  profiles:
    | DriverIdentityRelation
    | readonly DriverIdentityRelation[]
    | null;
};

export interface AdminMobilityAnalyticsDriverRow {
  id: string;
  is_verified: boolean;
  name: string;
  profile: {
    name: string;
    avatar_url: string | null;
  };
}

function normalizeIdentity(
  value: AnalyticsDriverDbRow["profiles"],
): DriverIdentityRelation | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value as DriverIdentityRelation | null;
}

/**
 * Temporary analytics driver directory while G104 aggregate RPC is pending.
 *
 * The browser needs only verification plus minimal identity for the top-driver
 * presentation. Ratings, ride totals, vehicle fields and operational presence
 * are intentionally excluded from this global analytics payload.
 */
export class AdminMobilityAnalyticsDriverReadService {
  static async list(): Promise<AdminMobilityAnalyticsDriverRow[]> {
    try {
      const { data, error } = await analyticsDriverDb
        .from<AnalyticsDriverDbRow>("driver_data")
        .select(
          "profile_id, is_verified, profiles!inner(name, display_name, avatar_url)",
        );

      if (error) throw error;

      return (data ?? []).map((row) => {
        const profile = normalizeIdentity(row.profiles);
        const name = profile?.display_name ?? profile?.name ?? "Motorista";
        return {
          id: row.profile_id,
          is_verified: row.is_verified ?? false,
          name,
          profile: {
            name,
            avatar_url: profile?.avatar_url ?? null,
          },
        };
      });
    } catch (error) {
      logger.error("AdminMobilityAnalyticsDriverReadService.list", error as Error);
      throw error;
    }
  }
}
