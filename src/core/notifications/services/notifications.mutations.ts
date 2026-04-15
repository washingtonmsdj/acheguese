/**
 * 🔔 NOTIFICATIONS MUTATIONS - Operações de escrita (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { normalizeNotification } from "../utils/normalizeNotification";
import type {
  Notification,
  CreateNotificationParams,
  NotificationSettings,
} from "../types";

const TABLE = "notifications";
const SETTINGS_TABLE = "user_notification_settings";

/**
 * Criar notificação
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<Notification> {
  try {
    const { data, error } = await (supabase as any).rpc("create_notification", {
      p_user_id: params.user_id,
      p_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_priority: params.priority || "medium",
      p_metadata: params.metadata || {},
    });

    if (error) throw error;

    const { data: notification, error: fetchError } = await (supabase as any)
      .from(TABLE)
      .select("*")
      .eq("id", data)
      .single();

    if (fetchError) throw fetchError;

    return normalizeNotification(notification as Record<string, any>);
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.mutations",
      action: "createNotification",
      metadata: { ...params },
    });
    throw error;
  }
}

/**
 * Marcar notificação como lida
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any).rpc("mark_notification_as_read", {
      p_notification_id: notificationId,
    });

    if (error) throw error;

    return data as boolean;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.mutations",
      action: "markAsRead",
      metadata: { notificationId },
    });
    throw error;
  }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllAsRead(userId: string): Promise<number> {
  try {
    const { data, error } = await (supabase as any).rpc("mark_all_notifications_as_read");

    if (error) throw error;

    return data as number;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.mutations",
      action: "markAllAsRead",
      metadata: { userId },
    });
    throw error;
  }
}

/**
 * Deletar notificação (soft delete)
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) throw error;

    return true;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.mutations",
      action: "deleteNotification",
      metadata: { notificationId },
    });
    throw error;
  }
}

/**
 * Atualizar configurações de notificação
 */
export async function updateNotificationSettings(
  userId: string,
  settings: NotificationSettings,
): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from(SETTINGS_TABLE)
      .upsert(
        {
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

    if (error) throw error;

    return true;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.mutations",
      action: "updateNotificationSettings",
      metadata: { userId, ...settings },
    });
    throw error;
  }
}

/**
 * Limpar notificações antigas
 */
export async function cleanupOldNotifications(daysOld: number = 90): Promise<number> {
  try {
    const { data, error } = await (supabase as any).rpc("cleanup_old_notifications", {
      days_old: daysOld,
    });

    if (error) throw error;

    return data as number;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.mutations",
      action: "cleanupOldNotifications",
      metadata: { daysOld },
    });
    throw error;
  }
}
