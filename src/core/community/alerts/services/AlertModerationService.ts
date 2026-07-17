import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { CreateAlertReportPayload } from "../domain/types";

class AlertModerationServiceClass {
  async reportAlert(payload: CreateAlertReportPayload): Promise<boolean> {
    try {
      // The database derives reporter identity, validates local eligibility,
      // applies anti-flood limits and writes the audit row atomically.
      const { error } = await supabase
        .from("community_alert_reports")
        .insert({
          alert_id: payload.alert_id,
          reason: payload.reason,
        } as never);

      if (error) {
        if (error.code === "23505") return false;
        throw error;
      }

      return true;
    } catch (error) {
      logger.error("AlertModerationService.reportAlert", error);
      return false;
    }
  }
}

export const alertModerationService = new AlertModerationServiceClass();
