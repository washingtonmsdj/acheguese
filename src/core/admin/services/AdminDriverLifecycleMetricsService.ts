import { RIDE_STATUS } from "@/core/mobility/constants";
import { supabase } from "@/integrations/supabase";

const PAGE_SIZE = 1000;

interface RideLifecycleRow {
  id: string;
  driver_profile_id: string | null;
  status: string;
}

interface DriverModerationSuspensionRow {
  id: string;
  driver_profile_id: string;
  action: string;
}

type QueryError = { message?: string | null; code?: string | null } | null;
type QueryResult<T> = PromiseLike<{ data: T[] | null; error: QueryError }>;
type QueryBuilder<T> = QueryResult<T> & {
  select(columns: string): QueryBuilder<T>;
  in(column: string, values: readonly string[]): QueryBuilder<T>;
  eq(column: string, value: string): QueryBuilder<T>;
  order(column: string, options: { ascending: boolean }): QueryBuilder<T>;
  range(from: number, to: number): QueryBuilder<T>;
};

type AdminLifecycleDbClient = {
  from(table: "ride_requests"): QueryBuilder<RideLifecycleRow>;
  from(table: "driver_moderation_events"): QueryBuilder<DriverModerationSuspensionRow>;
};

const db = supabase as unknown as AdminLifecycleDbClient;

export interface AdminDriverLifecycleMetrics {
  assignedRideCount: number;
  driverCancelledRideCount: number;
  driverCancellationRate: number;
  suspensionCount: number;
}

async function readRideRows(profileIds: readonly string[]): Promise<RideLifecycleRow[]> {
  const rows: RideLifecycleRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("ride_requests")
      .select("id, driver_profile_id, status")
      .in("driver_profile_id", profileIds)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message || "Failed to load driver ride lifecycle metrics");
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

async function readSuspensionRows(
  profileIds: readonly string[],
): Promise<DriverModerationSuspensionRow[]> {
  const rows: DriverModerationSuspensionRow[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("driver_moderation_events")
      .select("id, driver_profile_id, action")
      .in("driver_profile_id", profileIds)
      .eq("action", "suspended")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message || "Failed to load driver suspension history");
    }

    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

export class AdminDriverLifecycleMetricsService {
  static async load(
    profileIds: readonly string[],
  ): Promise<Map<string, AdminDriverLifecycleMetrics>> {
    const uniqueProfileIds = [...new Set(profileIds.filter(Boolean))];
    const metrics = new Map<string, AdminDriverLifecycleMetrics>();

    for (const profileId of uniqueProfileIds) {
      metrics.set(profileId, {
        assignedRideCount: 0,
        driverCancelledRideCount: 0,
        driverCancellationRate: 0,
        suspensionCount: 0,
      });
    }

    if (uniqueProfileIds.length === 0) return metrics;

    const [rideRows, suspensionRows] = await Promise.all([
      readRideRows(uniqueProfileIds),
      readSuspensionRows(uniqueProfileIds),
    ]);

    for (const ride of rideRows) {
      if (!ride.driver_profile_id) continue;
      const current = metrics.get(ride.driver_profile_id);
      if (!current) continue;

      current.assignedRideCount += 1;
      if (ride.status === RIDE_STATUS.CANCELLED_BY_DRIVER) {
        current.driverCancelledRideCount += 1;
      }
    }

    for (const suspension of suspensionRows) {
      const current = metrics.get(suspension.driver_profile_id);
      if (!current) continue;
      current.suspensionCount += 1;
    }

    for (const current of metrics.values()) {
      current.driverCancellationRate = current.assignedRideCount > 0
        ? (current.driverCancelledRideCount / current.assignedRideCount) * 100
        : 0;
    }

    return metrics;
  }
}
