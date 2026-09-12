import { AdminDriverLifecycleMetricsService } from "@/core/admin/services/AdminDriverLifecycleMetricsService";
import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type ErrorLike = { message?: string | null; code?: string | null } | null;
type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
};
type QueryBuilder<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns: string): QueryBuilder<TRow>;
  in(column: string, values: readonly string[]): QueryBuilder<TRow>;
};
type AdminSuspendedDriverDbClient = {
  from<TRow = Record<string, unknown>>(table: string): QueryBuilder<TRow>;
};

const db = supabase as unknown as AdminSuspendedDriverDbClient;

type DriverProfileIdRow = Pick<Tables<"driver_data">, "profile_id">;

/**
 * Intersects suspended profile ids with the driver domain before loading
 * lifecycle metrics. This keeps non-driver suspended profiles out of the
 * "Motoristas Suspensos" read model and avoids one ride query per profile.
 */
export class AdminSuspendedDriverMetricsService {
  static async load(suspendedProfileIds: readonly string[]) {
    const uniqueProfileIds = [...new Set(suspendedProfileIds.filter(Boolean))];
    if (uniqueProfileIds.length === 0) {
      return AdminDriverLifecycleMetricsService.load([]);
    }

    try {
      const { data, error } = await db
        .from<DriverProfileIdRow>("driver_data")
        .select("profile_id")
        .in("profile_id", uniqueProfileIds);

      if (error) throw error;

      const driverProfileIds = (data ?? []).map((row) => row.profile_id);
      return AdminDriverLifecycleMetricsService.load(driverProfileIds);
    } catch (error) {
      logger.error("AdminSuspendedDriverMetricsService.load", error as Error, {
        profileCount: uniqueProfileIds.length,
      });
      throw error;
    }
  }
}
