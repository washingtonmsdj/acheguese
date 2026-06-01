/**
 * AlertNotificationService - Distribuicao de notificacoes por regiao
 */

import { supabase } from "@/integrations/supabase";
import {
  selectLooseRows,
  updateLooseRows,
} from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { NotificationService } from "@/core/notifications/services/NotificationService";
import { profileService } from "@/core/profiles/services/ProfileService";
import { ALERT_RULES } from "../config/alertConfig";
import type { AlertNotificationQueueItem } from "../domain/types";

interface AlertSnapshotRow {
  neighborhood_display: string | null;
  city: string | null;
  description: string | null;
}

class AlertNotificationServiceClass {
  private readonly QUEUE_TABLE = "alert_notification_queue";

  async processQueue(batchSize = 10): Promise<number> {
    let processed = 0;

    try {
      const lockTimeout = new Date(
        Date.now() - ALERT_RULES.NOTIFICATION_LOCK_TIMEOUT_MINUTES * 60 * 1000
      ).toISOString();

      const { data: items, error } = await selectLooseRows(
        this.QUEUE_TABLE,
        {
          columns: "*",
          filters: [
            { op: "eq", column: "processed", value: false },
            { op: "lt", column: "attempt_count", value: ALERT_RULES.NOTIFICATION_MAX_ATTEMPTS },
            { op: "or", expression: `processing_started_at.is.null,processing_started_at.lt.${lockTimeout}` },
          ],
          orderBy: { column: "created_at", ascending: true },
          limit: batchSize,
        }
      );

      if (error) throw error;
      if (!items?.length) return 0;

      for (const item of items as unknown as AlertNotificationQueueItem[]) {
        await this._processItem(item);
        processed++;
      }
    } catch (error) {
      logger.error("AlertNotificationService.processQueue", error);
    }

    return processed;
  }

  private async _processItem(item: AlertNotificationQueueItem): Promise<void> {
    await updateLooseRows(
      this.QUEUE_TABLE,
      { processing_started_at: new Date().toISOString() },
      [
        { column: "id", value: item.id },
        { column: "processed", value: false },
      ]
    );

    try {
      const userIds = await profileService.getUserIdsByCity(item.city, 500);

      if (!userIds || userIds.length === 0) {
        throw new Error("No users found in the region");
      }

      const { data: alert } = await supabase
        .from("community_alerts")
        .select("neighborhood_display, city, description")
        .eq("id", item.alert_id)
        .maybeSingle();

      if (!alert) throw new Error("alert_not_found");
      const alertSnapshot = alert as unknown as AlertSnapshotRow;

      const notifications = userIds.map((userId: string) =>
        NotificationService
          .createNotification({
            user_id: userId,
            type: "warning",
            title: `Alerta em ${alertSnapshot.neighborhood_display ?? "sua regiao"}`,
            message: (alertSnapshot.description ?? "").slice(0, 100),
            category: "social",
            metadata: {
              alert_id: item.alert_id,
              neighborhood: item.neighborhood,
              city: item.city,
            },
          })
          .catch((err) => {
            logger.error("AlertNotificationService notification failed", err);
          })
      );

      await Promise.allSettled(notifications);

      await updateLooseRows(
        this.QUEUE_TABLE,
        {
          processed: true,
          processed_at: new Date().toISOString(),
          attempt_count: item.attempt_count + 1,
          processing_started_at: null,
        },
        [{ column: "id", value: item.id }]
      );
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);

      await updateLooseRows(
        this.QUEUE_TABLE,
        {
          processing_started_at: null,
          attempt_count: item.attempt_count + 1,
          last_error: errMessage,
        },
        [{ column: "id", value: item.id }]
      );

      logger.error("AlertNotificationService._processItem", error);
    }
  }
}

export const alertNotificationService = new AlertNotificationServiceClass();
