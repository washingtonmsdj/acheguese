import { supabase } from "@/integrations/supabase";
import type { Tables } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type {
  FraudAlert,
  FraudAlertUpdate,
} from "../types/adminDatabase.types";

type ErrorLike = { message?: string | null; code?: string | null } | null;

type QueryPayload<TRow> = {
  data: TRow[] | null;
  error: ErrorLike;
  count?: number | null;
};

type TableClient<TRow> = PromiseLike<QueryPayload<TRow>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): TableClient<TRow>;
  update(values: Record<string, unknown>): TableClient<TRow>;
  eq(column: string, value: unknown): TableClient<TRow>;
  in(column: string, values: readonly unknown[]): TableClient<TRow>;
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
};

type AdminFraudDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminFraudDbClient;

type FraudAlertReadRow = Pick<
  FraudAlert,
  | "id"
  | "ride_id"
  | "driver_profile_id"
  | "status"
  | "severity"
  | "fraud_type"
  | "description"
  | "evidence"
  | "created_at"
>;

type FraudRideSummaryDbRow = Pick<
  Tables<"ride_requests">,
  "id" | "origin" | "destination"
>;

export interface FraudRideSummary {
  id: string;
  origin: string | null;
  destination: string | null;
}

export type AdminFraudAlertRow = FraudAlertReadRow;

export interface FraudStats {
  total: number;
  pending: number;
  critical: number;
}

export class AdminFraudService {
  static async getAlerts(limit = 50): Promise<AdminFraudAlertRow[]> {
    try {
      const { data, error } = await db
        .from<FraudAlertReadRow>("fraud_alerts")
        .select(
          "id, ride_id, driver_profile_id, status, severity, fraud_type, description, evidence, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminFraudService.getAlerts", error as Error, { limit });
      return [];
    }
  }

  static async getRideSummaries(
    rideIds: readonly string[],
  ): Promise<FraudRideSummary[]> {
    const uniqueRideIds = [...new Set(rideIds.filter(Boolean))];
    if (uniqueRideIds.length === 0) return [];

    try {
      const { data, error } = await db
        .from<FraudRideSummaryDbRow>("ride_requests")
        .select("id, origin, destination")
        .in("id", uniqueRideIds);

      if (error) throw error;
      return (data ?? []).map((ride) => ({
        id: ride.id,
        origin: ride.origin ?? null,
        destination: ride.destination ?? null,
      }));
    } catch (error) {
      logger.error("AdminFraudService.getRideSummaries", error as Error, {
        rideCount: uniqueRideIds.length,
      });
      throw error;
    }
  }

  static async getStats(): Promise<FraudStats> {
    try {
      const [{ count: total }, { count: pending }, { count: critical }] = await Promise.all([
        db.from<FraudAlert>("fraud_alerts").select("id", { count: "exact", head: true }),
        db
          .from<FraudAlert>("fraud_alerts")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        db
          .from<FraudAlert>("fraud_alerts")
          .select("id", { count: "exact", head: true })
          .eq("severity", "critical"),
      ]);

      return {
        total: total ?? 0,
        pending: pending ?? 0,
        critical: critical ?? 0,
      };
    } catch (error) {
      logger.error("AdminFraudService.getStats", error as Error);
      return { total: 0, pending: 0, critical: 0 };
    }
  }

  static async updateAlertStatus(
    alertId: string,
    status: FraudAlert["status"],
    resolutionNotes?: string,
  ): Promise<void> {
    const patch: Partial<FraudAlertUpdate> = {
      status,
      resolution_notes: resolutionNotes ?? null,
      reviewed_at: new Date().toISOString(),
    };

    const { error } = await db
      .from<FraudAlert>("fraud_alerts")
      .update(patch)
      .eq("id", alertId);

    if (error) throw error;
  }
}
