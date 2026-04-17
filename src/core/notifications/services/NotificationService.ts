import { supabase } from "@/integrations/supabase";
import { trackError } from "@/shared/utils/errorTracking";
import { normalizeNotification } from "../utils/normalizeNotification";
import type {
  CreateNotificationParams,
  Notification,
  NotificationFilters,
  NotificationPriority,
  NotificationSettings,
  NotificationStats,
  NotificationTypeValue,
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
    if (error) {
      throw error;
    }

    return ((data as Record<string, any>[]) || []).map(normalizeNotification);
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "fetchNotifications",
      metadata: { userId, filters },
    });
    throw error;
  }
}

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
      component: "NotificationService",
      action: "getStats",
      metadata: { userId },
    });
    throw error;
  }
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
  try {
    const { data, error } = await (supabase as any)
      .from(SETTINGS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data || DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "getNotificationSettings",
      metadata: { userId },
    });
    throw error;
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { data, error } = await (supabase as any).rpc("get_unread_count");

    if (error) {
      throw error;
    }

    return data as number;
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "getUnreadCount",
      metadata: { userId },
    });
    return 0;
  }
}

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

    if (error) {
      throw error;
    }

    const { data: notification, error: fetchError } = await (supabase as any)
      .from(TABLE)
      .select("*")
      .eq("id", data)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return normalizeNotification(notification as Record<string, any>);
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "createNotification",
      metadata: { ...params },
    });
    throw error;
  }
}

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any).rpc("mark_notification_as_read", {
      p_notification_id: notificationId,
    });

    if (error) {
      throw error;
    }

    return data as boolean;
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "markAsRead",
      metadata: { notificationId },
    });
    throw error;
  }
}

export async function markAllAsRead(userId: string): Promise<number> {
  try {
    const { data, error } = await (supabase as any).rpc("mark_all_notifications_as_read");

    if (error) {
      throw error;
    }

    return data as number;
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "markAllAsRead",
      metadata: { userId },
    });
    throw error;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "deleteNotification",
      metadata: { notificationId },
    });
    throw error;
  }
}

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

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "updateNotificationSettings",
      metadata: { userId, ...settings },
    });
    throw error;
  }
}

export async function cleanupOldNotifications(daysOld = 90): Promise<number> {
  try {
    const { data, error } = await (supabase as any).rpc("cleanup_old_notifications", {
      days_old: daysOld,
    });

    if (error) {
      throw error;
    }

    return data as number;
  } catch (error) {
    trackError(error as Error, {
      component: "NotificationService",
      action: "cleanupOldNotifications",
      metadata: { daysOld },
    });
    throw error;
  }
}

export const NotificationsFacade = {
  queries: {
    fetchNotifications,
    getStats,
    getNotificationSettings,
    getUnreadCount,
  },
  mutations: {
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateNotificationSettings,
    cleanupOldNotifications,
  },
} as const;

export class NotificationService {
  fetchNotifications = fetchNotifications;
  getStats = getStats;
  getNotificationSettings = getNotificationSettings;
  getUnreadCount = getUnreadCount;

  createNotification = createNotification;
  markAsRead = markAsRead;
  markAllAsRead = markAllAsRead;
  deleteNotification = deleteNotification;
  updateNotificationSettings = updateNotificationSettings;
  cleanupOldNotifications = cleanupOldNotifications;

  createRealtimeChannel(
    userId: string,
    onNotification: (notification: Notification) => void,
  ) {
    try {
      import("@/core/realtime").then(({ realtimeService }) => {
        return realtimeService.subscribeToNotifications(userId, (notification) => {
          onNotification(notification);
        });
      });
    } catch (error) {
      console.error("[NotificationService] Error creating realtime channel:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

