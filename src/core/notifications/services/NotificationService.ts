import { logger } from "@/shared/utils/logger";
import { supabase, type Tables } from "@/integrations/supabase";
import { SessionService } from "@/core/session/services/SessionService";
import { realtimeService } from "@/core/realtime";
import type {
  Notification,
  NotificationCategory,
  NotificationFilters,
  NotificationPriority,
} from "../types";
import { normalizeNotification } from "../utils/normalizeNotification";

export type { Notification, NotificationFilters } from "../types";

export interface NotificationRealtimeChange {
  eventType: "INSERT" | "UPDATE";
  notification: Notification;
}

type NotificationRow = Tables<"notifications">;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeNotificationRow(row: NotificationRow): Notification {
  return normalizeNotification(row as unknown as Record<string, unknown>);
}

export class NotificationService {
  static async getUserNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const limit = Math.min(Math.max(filters.limit ?? 30, 1), 100);
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (filters.read !== undefined) {
      query = query.eq("read", filters.read);
    }

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.type) {
      query = Array.isArray(filters.type)
        ? query.in("type", filters.type)
        : query.eq("type", filters.type);
    }

    if (filters.priority) {
      query = Array.isArray(filters.priority)
        ? query.in("priority", filters.priority)
        : query.eq("priority", filters.priority);
    }

    if (filters.cursor) {
      const before = new Date(filters.cursor.createdAt);
      if (Number.isNaN(before.getTime()) || !UUID_PATTERN.test(filters.cursor.id)) {
        throw new Error("Invalid notification cursor");
      }
      const createdAt = before.toISOString();
      query = query.or(
        `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${filters.cursor.id})`,
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching notifications:", error);
      throw error;
    }

    return (data ?? []).map(normalizeNotificationRow);
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        read: true,
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .eq("read", false);

    if (error) {
      logger.error("Error marking notification as read:", error);
      throw error;
    }
  }

  static async markAllAsRead(): Promise<number> {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.rpc(
      "mark_current_user_notifications_as_read",
    );

    if (error) {
      logger.error("Error marking all notifications as read:", error);
      throw error;
    }

    return data ?? 0;
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("notifications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .is("deleted_at", null);

    if (error) {
      logger.error("Error deleting notification:", error);
      throw error;
    }
  }

  static async getUnreadCount(): Promise<number> {
    const user = await SessionService.getCurrentUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .eq("read", false);

    if (error) {
      logger.error("Error getting unread count:", error);
      return 0;
    }

    return count ?? 0;
  }

  static async getStats(userId: string): Promise<{ total: number; unread: number }> {
    try {
      const user = await SessionService.getCurrentUser();
      if (!user || user.id !== userId) {
        return { total: 0, unread: 0 };
      }

      const [totalResult, unreadResult] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .is("deleted_at", null),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .is("deleted_at", null)
          .eq("read", false),
      ]);

      if (totalResult.error) throw totalResult.error;
      if (unreadResult.error) throw unreadResult.error;

      return {
        total: totalResult.count ?? 0,
        unread: unreadResult.count ?? 0,
      };
    } catch (error) {
      logger.error("Error getting notification stats:", error);
      return { total: 0, unread: 0 };
    }
  }

  static subscribeToNotifications(
    userId: string,
    callback: (change: NotificationRealtimeChange) => void,
  ) {
    const subscription = realtimeService.subscribe("notifications.user", {
      filterValues: { userId },
      onEvent: ({ eventType, row }) => {
        if (eventType !== "INSERT" && eventType !== "UPDATE") return;
        callback({
          eventType,
          notification: normalizeNotificationRow(row as NotificationRow),
        });
      },
    });

    return subscription.unsubscribe;
  }

  async fetchNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    return NotificationService.getUserNotifications(filters);
  }


  createRealtimeChannel(userId: string, callback: (change: NotificationRealtimeChange) => void) {
    return NotificationService.subscribeToNotifications(userId, callback);
  }

  async markAsRead(notificationId: string): Promise<void> {
    return NotificationService.markAsRead(notificationId);
  }

  async markAllAsRead(): Promise<number> {
    return NotificationService.markAllAsRead();
  }

  async getUnreadCount(): Promise<number> {
    return NotificationService.getUnreadCount();
  }

  async getStats(userId: string): Promise<{ total: number; unread: number }> {
    return NotificationService.getStats(userId);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    return NotificationService.deleteNotification(notificationId);
  }
}

export const notificationService = new NotificationService();
