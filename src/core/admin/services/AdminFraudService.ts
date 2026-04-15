// @ts-nocheck
/**
 * AdminFraudService
 *
 * SSOT para acesso à tabela fraud_alerts.
 * ✅ BLINDAGEM v3.0: único service autorizado para fraud_alerts.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface FraudAlert {
  id: string;
  ride_id: string | null;
  driver_profile_id: string | null;
  passenger_profile_id: string | null;
  fraud_type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: Record<string, string | number | boolean | undefined>;
  status: "pending" | "investigating" | "confirmed" | "false_positive" | "resolved";
  created_at: string;
}

export interface FraudStats {
  total: number;
  pending: number;
  critical: number;
}

export class AdminFraudService {
  static async getAlerts(limit = 50): Promise<FraudAlert[]> {
    try {
      const { data, error } = await (supabase as any)
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
        (supabase as any).from("fraud_alerts").select("*", { count: "exact", head: true }),
        (supabase as any).from("fraud_alerts").select("*", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("fraud_alerts").select("*", { count: "exact", head: true }).eq("severity", "critical"),
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
    const { error } = await (supabase as any)
      .from("fraud_alerts")
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) throw error;
  }
}
