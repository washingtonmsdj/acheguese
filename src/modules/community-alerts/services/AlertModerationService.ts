// @ts-nocheck
/**
 * AlertModerationService — Reports, strikes e moderação de alertas
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type {
  CommunityAlertReport,
  CreateAlertReportPayload,
  CommunityAlertAudit,
} from "../domain/types";

class AlertModerationServiceClass {
  // --------------------------------------------------------------------------
  // REPORTS
  // --------------------------------------------------------------------------

  /**
   * Registra um report de abuso.
   * RLS garante: 1 report por usuário por alerta, não pode reportar o próprio.
   */
  async reportAlert(payload: CreateAlertReportPayload): Promise<boolean> {
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const { error } = await (supabase as any)
        .from("community_alert_reports")
        .insert({
          alert_id: payload.alert_id,
          reporter_id: user.id,
          reason: payload.reason,
        });

      if (error) {
        // Violação de UNIQUE = já reportou
        if (error.code === "23505") {
          return false;
        }
        throw error;
      }

      // Audit log
      await (supabase as any).from("community_alert_audit").insert({
        alert_id: payload.alert_id,
        actor_id: user.id,
        action_type: "reported",
        metadata: { reason: payload.reason },
      });

      return true;
    } catch (error) {
      logger.error("AlertModerationService.reportAlert", error);
      return false;
    }
  }

  /**
   * Busca reports de um alerta (apenas moderadores — RLS).
   */
  async getReports(alertId: string): Promise<CommunityAlertReport[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("community_alert_reports")
        .select("*")
        .eq("alert_id", alertId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as CommunityAlertReport[]) ?? [];
    } catch (error) {
      logger.error("AlertModerationService.getReports", error);
      return [];
    }
  }

  /**
   * Busca alertas sob revisão (apenas moderadores).
   */
  async getAlertsUnderReview(): Promise<any[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("community_alerts")
        .select("*")
        .eq("under_review", true)
        .in("status", ["ativo"])
        .order("report_count", { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (error) {
      logger.error("AlertModerationService.getAlertsUnderReview", error);
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // AÇÕES DE MODERAÇÃO
  // --------------------------------------------------------------------------

  /**
   * Limpa o flag under_review após revisão do moderador.
   * Registra no audit log.
   */
  async clearUnderReview(alertId: string): Promise<boolean> {
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) throw new Error("not_authenticated");

      const { error } = await (supabase as any)
        .from("community_alerts")
        .update({ under_review: false, updated_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;

      await (supabase as any).from("community_alert_audit").insert({
        alert_id: alertId,
        actor_id: user.id,
        action_type: "reviewed_cleared",
        metadata: { cleared_at: new Date().toISOString() },
      });

      return true;
    } catch (error) {
      logger.error("AlertModerationService.clearUnderReview", error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // AUDIT LOG
  // --------------------------------------------------------------------------

  /**
   * Busca histórico de auditoria de um alerta (apenas moderadores — RLS).
   */
  async getAuditLog(alertId: string): Promise<CommunityAlertAudit[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("community_alert_audit")
        .select("*")
        .eq("alert_id", alertId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as CommunityAlertAudit[]) ?? [];
    } catch (error) {
      logger.error("AlertModerationService.getAuditLog", error);
      return [];
    }
  }
}

export const alertModerationService = new AlertModerationServiceClass();
