import { supabase } from "@/integrations/supabase";
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
  order(column: string, options?: { ascending: boolean }): TableClient<TRow>;
  limit(value: number): TableClient<TRow>;
};

type AdminFraudDbClient = {
  from<TRow = Record<string, unknown>>(table: string): TableClient<TRow>;
};

const db = supabase as unknown as AdminFraudDbClient;

export interface FraudStats {
  total: number;
  pending: number;
  critical: number;
}

export class AdminFraudService {
  static async getAlerts(limit = 50): Promise<FraudAlert[]> {
    try {
      const { data, error } = await db
        .from<FraudAlert>("fraud_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AdminFraudService.getAlerts", error as Error, { limit });
      return [];
    }
  }

  static async getStats(): Promise<FraudStats> {
    try {
      const [{ count: total }, { count: pending }, { count: critical }] = await Promise.all([
        db.from<FraudAlert>("fraud_alerts").select("*", { count: "exact", head: true }),
        db
          .from<FraudAlert>("fraud_alerts")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        db
          .from<FraudAlert>("fraud_alerts")
          .select("*", { count: "exact", head: true })
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
