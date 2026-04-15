/**
 * 🔔 NOTIFICATIONS QUERIES - Operações de leitura (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { normalizeNotification } from "../utils/normalizeNotification";
import type {
  Notification,
  NotificationFilters,
  NotificationPriority,
  NotificationStats,
  NotificationTypeValue,
  NotificationSettings,
} from "../types";

const TABLE = "notifications";
const SETTINGS_TABLE = "user_notification_settings";

const DEFAULT_NOTIFICATION_SETTINGS: Required<NotificationSettings> = {
  email_notifications: true,
  push_notifications: true,
  new_messages: true,
  new_comments: true,
  new_likes: true,
  new_followers: true,
  business_updates: true,
  community_updates: true,
  weekly_digest: true,
};

/**
 * Buscar notificações de um usuário
 */
export async function fetchNotifications(
  userId: string,
  filters: NotificationFilters = {},
): Promise<Notification[]> {
  try {
    let query = (supabase as any)
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      query = query.in("type", types as NotificationTypeValue[]);
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority)
        ? filters.priority
        : [filters.priority];
      query = query.in("priority", priorities as NotificationPriority[]);
    }

    if (filters.read !== undefined) {
      query = query.eq("read", filters.read);
    }

    query = query.order("priority", { ascending: false });
    query = query.order("created_at", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset !== undefined) {
      const pageLimit = filters.limit || 50;
      query = query.range(filters.offset, filters.offset + pageLimit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return ((data as Record<string, any>[]) || []).map(normalizeNotification);
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.queries",
      action: "fetchNotifications",
      metadata: { userId, filters },
    });
    throw error;
  }
}

/**
 * Buscar estatísticas de notificações
 */
export async function getStats(userId: string): Promise<NotificationStats> {
  try {
    const notifications = await fetchNotifications(userId);

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.read).length,
      by_type: {},
      by_priority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
    };

    notifications.forEach((notification) => {
      stats.by_type[notification.type] = (stats.by_type[notification.type] || 0) + 1;
      stats.by_priority[notification.priority] += 1;
    });

    return stats;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.queries",
      action: "getStats",
      metadata: { userId },
    });
    throw error;
  }
}

/**
 * Buscar configurações de notificação do usuário
 */
export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    const { data, error } = await (supabase as any)
      .from(SETTINGS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return data || DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.queries",
      action: "getNotificationSettings",
      metadata: { userId },
    });
    throw error;
  }
}

/**
 * Buscar contagem de notificações não lidas
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { data, error } = await (supabase as any).rpc("get_unread_count");

    if (error) throw error;

    return data as number;
  } catch (error) {
    trackError(error as Error, {
      component: "notifications.queries",
      action: "getUnreadCount",
      metadata: { userId },
    });
    return 0;
  }
}
