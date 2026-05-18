/**
 * AdminFraudService
 *
 * SSOT para acesso à tabela fraud_alerts.
 * ✅ BLINDAGEM v3.0: único service autorizado para fraud_alerts.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { FraudAlert } from "../types/adminDatabase.types";

export interface FraudStats {
  total: number;
  pending: number;
  critical: number;
}

type FraudAlertUpdate = {
  status: FraudAlert["status"];
  resolution_notes: string | null;
  reviewed_at: string;
};

export class AdminFraudService {
  private static readonly db = supabase as any;

  static async getAlerts(limit = 50): Promise<FraudAlert[]> {
    try {
      const { data, error } = await this.db
        .from("fraud_alerts")
        .select("*, ride_id, driver_profile_id")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("AdminFraudService.getAlerts error:", error);
      return [];
    }
  }

  static async getStats(): Promise<FraudStats> {
    try {
      const [{ count: total }, { count: pending }, { count: critical }] = await Promise.all([
        this.db.from("fraud_alerts").select("*", { count: "exact", head: true }),
        this.db.from("fraud_alerts").select("*", { count: "exact", head: true }).eq("status", "pending"),
        this.db.from("fraud_alerts").select("*", { count: "exact", head: true }).eq("severity", "critical"),
      ]);

      return { total: total || 0, pending: pending || 0, critical: critical || 0 };
    } catch (error) {
      logger.error("AdminFraudService.getStats error:", error);
      return { total: 0, pending: 0, critical: 0 };
    }
  }

  static async updateAlertStatus(
    alertId: string,
    status: FraudAlert["status"],
    resolutionNotes?: string,
  ): Promise<void> {
    const { error } = await this.db
      .from("fraud_alerts")
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        reviewed_at: new Date().toISOString(),
      } as unknown as any)
      .eq("id", alertId);

    if (error) throw error;
  }
}
