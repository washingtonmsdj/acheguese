/**
 * AlertModerationService - Reports, strikes e moderação de alertas
 */

import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase";
import {
  insertLooseRow,
  selectLooseRows,
} from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { SessionService } from "@/core/session/services/SessionService";
import { profileService } from "@/core/profiles/services/ProfileService";
import type {
  CommunityAlertAudit,
  CommunityAlertReport,
  CreateAlertReportPayload,
} from "../domain/types";

type CommunityAlertsRow = Database["public"]["Tables"]["community_alerts"]["Row"];

class AlertModerationServiceClass {
  async reportAlert(payload: CreateAlertReportPayload): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("not_authenticated");

      const profile = await profileService.getRequiredActiveProfile(user.id);
      if (!profile?.id) throw new Error("profile_not_found");

      const { error } = await supabase.from("community_alert_reports").insert({
        alert_id: payload.alert_id,
        reporter_id: profile.id,
        reason: payload.reason,
      });

      if (error) {
        if (error.code === "23505") return false;
        throw error;
      }

      const { error: auditError } = await insertLooseRow("community_alert_audit", {
        alert_id: payload.alert_id,
        actor_id: user.id,
        action_type: "reported",
        metadata: { reason: payload.reason },
      });
      if (auditError) throw auditError;

      return true;
    } catch (error) {
      logger.error("AlertModerationService.reportAlert", error);
      return false;
    }
  }

  async getReports(alertId: string): Promise<CommunityAlertReport[]> {
    try {
      const { data, error } = await supabase
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

  async getAlertsUnderReview(): Promise<CommunityAlertsRow[]> {
    try {
      const { data, error } = await supabase
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

  async clearUnderReview(alertId: string): Promise<boolean> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("not_authenticated");

      const { error } = await supabase
        .from("community_alerts")
        .update({ under_review: false, updated_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;

      const { error: auditError } = await insertLooseRow("community_alert_audit", {
        alert_id: alertId,
        actor_id: user.id,
        action_type: "reviewed_cleared",
        metadata: { cleared_at: new Date().toISOString() },
      });
      if (auditError) throw auditError;

      return true;
    } catch (error) {
      logger.error("AlertModerationService.clearUnderReview", error);
      return false;
    }
  }

  async getAuditLog(alertId: string): Promise<CommunityAlertAudit[]> {
    try {
      const { data, error } = await selectLooseRows(
        "community_alert_audit",
        {
          columns: "*",
          filters: [{ op: "eq", column: "alert_id", value: alertId }],
          orderBy: { column: "created_at", ascending: true },
        }
      );

      if (error) throw error;
      return (data as unknown as CommunityAlertAudit[]) ?? [];
    } catch (error) {
      logger.error("AlertModerationService.getAuditLog", error);
      return [];
    }
  }
}

export const alertModerationService = new AlertModerationServiceClass();
