// @ts-nocheck
/**
 * AlertNotificationService — Distribuição de notificações por região
 *
 * Notificações são assíncronas: a criação do alerta enfileira,
 * este service processa a fila separadamente.
 *
 * No V1: distribuição por bairro + cidade.
 * Arquitetura pronta para expansão para raio geográfico / bairros adjacentes.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { notificationService } from "@/core/notifications/services/NotificationService";
import { ALERT_RULES } from "../config/alertConfig";
import type { AlertNotificationQueueItem } from "../domain/types";

class AlertNotificationServiceClass {
  private readonly QUEUE_TABLE = "alert_notification_queue";

  /**
   * Processa itens pendentes da fila de notificações.
   * Chamado por pg_cron, Edge Function periódica ou lazy no fetch do feed.
   */
  async processQueue(batchSize = 10): Promise<number> {
    let processed = 0;

    try {
      // Busca itens elegíveis: não processados, sem lock ativo, abaixo do limite de tentativas
      const lockTimeout = new Date(
        Date.now() - ALERT_RULES.NOTIFICATION_LOCK_TIMEOUT_MINUTES * 60 * 1000
      ).toISOString();

      const { data: items, error } = await (supabase as any)
        .from(this.QUEUE_TABLE)
        .select("*")
        .eq("processed", false)
        .lt("attempt_count", ALERT_RULES.NOTIFICATION_MAX_ATTEMPTS)
        .or(`processing_started_at.is.null,processing_started_at.lt.${lockTimeout}`)
        .order("created_at", { ascending: true })
        .limit(batchSize);

      if (error) throw error;
      if (!items?.length) return 0;

      for (const item of items as AlertNotificationQueueItem[]) {
        await this._processItem(item);
        processed++;
      }
    } catch (error) {
      logger.error("AlertNotificationService.processQueue", error);
    }

    return processed;
  }

  private async _processItem(item: AlertNotificationQueueItem): Promise<void> {
    // Adquire lock otimista
    await (supabase as any)
      .from(this.QUEUE_TABLE)
      .update({ processing_started_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("processed", false);

    try {
      // Busca usuários elegíveis da região usando ProfileService
      const { profileService } = await import("@/core/profiles");
      const users = await profileService.getProfilesByLocation({
        city: item.city,
        neighborhood: item.neighborhood
      });

      if (!users || users.length === 0) {
        throw new Error("No users found in the region");
      }

      // Busca dados do alerta para montar a notificação
      const { data: alert } = await (supabase as any)
        .from("community_alerts")
        .select("category, neighborhood_display, city, description")
        .eq("id", item.alert_id)
        .maybeSingle();

      if (!alert) throw new Error("alert_not_found");

      // Dispara notificações para cada usuário elegível
      const notifications = (users ?? []).map((u: { user_id: string }) =>
        notificationService.createNotification({
          user_id: u.user_id,
          type: "community",
          title: `Alerta em ${alert.neighborhood_display}`,
          message: alert.description.slice(0, 100),
          priority: "high",
          metadata: {
            alert_id: item.alert_id,
            category: alert.category,
            neighborhood: item.neighborhood,
            city: item.city,
          },
        }).catch((err) => {
          // Falha individual não cancela o batch
          logger.error("AlertNotificationService notification failed", err);
        })
      );

      await Promise.allSettled(notifications);

      // Marca como processado
      await (supabase as any)
        .from(this.QUEUE_TABLE)
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          attempt_count: item.attempt_count + 1,
          processing_started_at: null,
        })
        .eq("id", item.id);
    } catch (error: any) {
      // Registra falha e libera lock para retry
      await (supabase as any)
        .from(this.QUEUE_TABLE)
        .update({
          processing_started_at: null,
          attempt_count: item.attempt_count + 1,
          last_error: error.message ?? String(error),
        })
        .eq("id", item.id);

      logger.error("AlertNotificationService._processItem", error);
    }
  }
}

export const alertNotificationService = new AlertNotificationServiceClass();
