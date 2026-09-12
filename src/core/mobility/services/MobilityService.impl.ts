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

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type SingleQueryPayload<TRow> = {
  data: TRow | null;
  error: ErrorLike;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(count: number): TableClient<TRow>;
  maybeSingle(): Promise<SingleQueryPayload<TRow>>;
};

type MobilityImplDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: ErrorLike;
  }>;
};

const db = supabase as unknown as MobilityImplDbClient;

export class MobilityService {
  static async listMotoboyDeliveries(filters: {
    status?: string;
    sourceType?: string;
    limit?: number;
  }): Promise<unknown[]> {
    let query = db
      .from("ride_requests")
      .select(
        "id, status, source_type, source_id, recipient_name, package_size, suggested_price, created_at, updated_at, driver_profile_id, pickup_location_id, delivery_notes, failed_delivery_reason",
      )
      .eq("ride_mode", "motoboy")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 200);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.sourceType && filters.sourceType !== "all") {
      query = query.eq("source_type", filters.sourceType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async listMotoboyStatsRows(): Promise<
    Array<{ status: string; created_at: string; driver_profile_id: string | null }>
  > {
    const { data, error } = await db
      .from<{ status: string; created_at: string; driver_profile_id: string | null }>(
        "ride_requests",
      )
      .select("id, status, created_at, driver_profile_id")
      .eq("ride_mode", "motoboy");

    if (error) throw error;
    return (
      data as Array<{
        status: string;
        created_at: string;
        driver_profile_id: string | null;
      }>
    ) || [];
  }

  static async countDeliveredBySource(
    sourceType: string,
    sourceId: string,
  ): Promise<number> {
    const { count, error } = await db
      .from("ride_requests")
      .select("id", { count: "exact", head: true })
      .eq("ride_mode", "motoboy")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .eq("status", "delivered");

    if (error) throw error;
    return count || 0;
  }

  static async countDeliveredMotoboyRides(): Promise<number> {
    const { count, error } = await db
      .from("ride_requests")
      .select("id", { count: "exact", head: true })
      .eq("ride_mode", "motoboy")
      .eq("status", "delivered");

    if (error) throw error;
    return count || 0;
  }

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
