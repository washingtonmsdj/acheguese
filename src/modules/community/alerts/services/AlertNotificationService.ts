/**
 * AlertNotificationService - Distribuicao de notificacoes por regiao
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { notificationService } from "@/core/notifications/services/NotificationService";
import { ALERT_RULES } from "../config/alertConfig";
import type { AlertNotificationQueueItem } from "../domain/types";

interface QueueRow {
  id: string;
  alert_id: string;
  neighborhood: string;
  city: string;
  processed: boolean;
  attempt_count: number;
  processing_started_at: string | null;
  processed_at: string | null;
  last_error: string | null;
  created_at: string;
}

interface AlertSnapshotRow {
  category: string | null;
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

      const { data: items, error } = await supabase
        .from(this.QUEUE_TABLE as never)
        .select("*")
        .eq("processed", false)
        .lt("attempt_count", ALERT_RULES.NOTIFICATION_MAX_ATTEMPTS)
        .or(`processing_started_at.is.null,processing_started_at.lt.${lockTimeout}`)
        .order("created_at", { ascending: true })
        .limit(batchSize);

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
    await supabase
      .from(this.QUEUE_TABLE as never)
      .update({ processing_started_at: new Date().toISOString() } as never)
      .eq("id", item.id)
      .eq("processed", false);

    try {
      const { profileService } = await import("@/core/profiles/services/ProfileService");
      const users = await profileService.getProfilesByLocation({
        city: item.city,
        neighborhood: item.neighborhood,
      });

      if (!users || users.length === 0) {
        throw new Error("No users found in the region");
      }

      const { data: alert } = await supabase
        .from("community_alerts")
        .select("category, neighborhood_display, city, description")
        .eq("id", item.alert_id)
        .maybeSingle();

      if (!alert) throw new Error("alert_not_found");
      const alertSnapshot = alert as AlertSnapshotRow;

      const notifications = users.map((u: { user_id: string }) =>
        notificationService
          .createNotification({
            user_id: u.user_id,
            type: "community",
            title: `Alerta em ${alertSnapshot.neighborhood_display ?? "sua regiao"}`,
            message: (alertSnapshot.description ?? "").slice(0, 100),
            priority: "high",
            metadata: {
              alert_id: item.alert_id,
              category: alertSnapshot.category,
              neighborhood: item.neighborhood,
              city: item.city,
            },
          })
          .catch((err) => {
            logger.error("AlertNotificationService notification failed", err);
          })
      );

      await Promise.allSettled(notifications);

      await supabase
        .from(this.QUEUE_TABLE as never)
        .update(
          {
            processed: true,
            processed_at: new Date().toISOString(),
            attempt_count: item.attempt_count + 1,
            processing_started_at: null,
          } as never
        )
        .eq("id", item.id);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);

      await supabase
        .from(this.QUEUE_TABLE as never)
        .update(
          {
            processing_started_at: null,
            attempt_count: item.attempt_count + 1,
            last_error: errMessage,
          } as never
        )
        .eq("id", item.id);

      logger.error("AlertNotificationService._processItem", error);
    }
  }
}

export const alertNotificationService = new AlertNotificationServiceClass();
