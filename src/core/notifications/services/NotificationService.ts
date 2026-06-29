import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";
import { SessionService } from "@/core/session/services/SessionService";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  category: "transactional" | "social" | "system" | "marketing";
  priority?: "low" | "medium" | "high" | "urgent";
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CreateNotificationInput {
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  category?: "transactional" | "social" | "system" | "marketing";
  priority?: "low" | "medium" | "high";
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  read?: boolean;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface UserNotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  new_messages: boolean;
  new_comments: boolean;
  new_likes: boolean;
  new_followers: boolean;
  business_updates: boolean;
  community_updates: boolean;
  weekly_digest: boolean;
}

type NotificationPriorityLevel = NonNullable<Notification["priority"]>;
type NotificationCategory = Notification["category"];

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  category: string | null;
  priority: string | null;
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  metadata: Record<string, unknown> | null;
  read: boolean | null;
  read_at: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
};

type UserNotificationSettingsRow = Partial<UserNotificationSettings> & {
  user_id: string;
  updated_at?: string | null;
};

type UserNotificationSettingsUpsertRow = Partial<UserNotificationSettings> & {
  user_id: string;
  updated_at: string;
};

type NotificationRpcClient = {
  rpc<T>(fn: string, params?: Record<string, unknown>): Promise<{
    data: T | null;
    error: { message?: string | null } | null;
  }>;
};

type QueryResult<T> = Promise<{
  data: T | null;
  error: { message?: string | null } | null;
}>;

type MutationResult = Promise<{
  error: { message?: string | null } | null;
}>;

type UserNotificationSettingsDbClient = {
  from(table: "user_notification_settings"): {
    select(columns: string): {
      eq(column: "user_id", value: string): {
        maybeSingle(): QueryResult<UserNotificationSettingsRow>;
      };
    };
    upsert(
      values: UserNotificationSettingsUpsertRow,
      options: { onConflict: string },
    ): MutationResult;
  };
};

const notificationRpc = supabase as unknown as NotificationRpcClient;
const userNotificationSettingsDb = supabase as unknown as UserNotificationSettingsDbClient;
const NOTIFICATION_CATEGORIES = new Set<NotificationCategory>([
  "transactional",
  "social",
  "system",
  "marketing",
]);
const NOTIFICATION_PRIORITIES = new Set<NotificationPriorityLevel>([
  "low",
  "medium",
  "high",
  "urgent",
]);

function normalizeNotificationCategory(value: string | null): NotificationCategory {
  return value && NOTIFICATION_CATEGORIES.has(value as NotificationCategory)
    ? (value as NotificationCategory)
    : "social";
}

function normalizeNotificationPriority(value: string | null | undefined): NotificationPriorityLevel {
  return value && NOTIFICATION_PRIORITIES.has(value as NotificationPriorityLevel)
    ? (value as NotificationPriorityLevel)
    : "medium";
}

function normalizeNotificationRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    category: normalizeNotificationCategory(row.category),
    priority: normalizeNotificationPriority(row.priority),
    title: row.title,
    message: row.message,
    action_url: row.action_url ?? undefined,
    action_label: row.action_label ?? undefined,
    metadata: row.metadata ?? {},
    read: row.read ?? false,
    read_at: row.read_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at ?? undefined,
    deleted_at: row.deleted_at ?? null,
  };
}

export class NotificationService {
  static async createNotification(input: CreateNotificationInput): Promise<string | null> {
    const { data, error } = await notificationRpc.rpc<string>("create_notification", {
      p_user_id: input.user_id,
      p_type: input.type,
      p_category: input.category ?? "social",
      p_title: input.title,
      p_message: input.message,
      p_action_url: input.action_url ?? null,
      p_action_label: input.action_label ?? null,
      p_metadata: input.metadata ?? {},
    });

    if (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }

    return data;
  }

  static async getUserNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filters?.read !== undefined) {
      query = query.eq("read", filters.read);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      const limit = filters.limit ?? 10;
      query = query.range(filters.offset, filters.offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Error fetching notifications:", error);
      throw error;
    }

    return (data ?? []).map((row) => normalizeNotificationRow(row as NotificationRow));
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const { error } = await notificationRpc.rpc("mark_notification_as_read", {
      p_notification_id: notificationId,
    });

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

    const { data, error } = await notificationRpc.rpc<number>("mark_all_notifications_as_read", {
      p_user_id: user.id,
    });

    if (error) {
      logger.error("Error marking all notifications as read:", error);
      throw error;
    }

    return data ?? 0;
  }

  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      logger.error("Error deleting notification:", error);
      throw error;
    }
  }

  static async getUnreadCount(): Promise<number> {
    const user = await SessionService.getCurrentUser();
    if (!user) return 0;

    const { data, error } = await notificationRpc.rpc<number>("get_unread_notifications_count", {
      p_user_id: user.id,
    });

    if (error) {
      logger.error("Error getting unread count:", error);
      return 0;
    }

    return data ?? 0;
  }

  static async getStats(userId: string): Promise<{ total: number; unread: number }> {
    try {
      const [totalResult, unreadResult] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("read", false),
      ]);

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
    callback: (notification: Notification) => void,
  ) {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(normalizeNotificationRow(payload.new as NotificationRow));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }

  async fetchNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    return NotificationService.getUserNotifications(filters);
  }

  async createNotification(input: CreateNotificationInput): Promise<string | null> {
    return NotificationService.createNotification(input);
  }

  createRealtimeChannel(userId: string, callback: (notification: Notification) => void) {
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

  async getNotificationSettings(userId: string): Promise<Partial<UserNotificationSettings> | null> {
    const { data, error } = await userNotificationSettingsDb
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching user notification settings:", error);
      return null;
    }

    return (data as UserNotificationSettingsRow | null) ?? null;
  }

  async updateNotificationSettings(
    userId: string,
    input: Partial<UserNotificationSettings>,
  ): Promise<void> {
    const payload: UserNotificationSettingsUpsertRow = {
      user_id: userId,
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { error } = await userNotificationSettingsDb
      .from("user_notification_settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      logger.error("Error updating user notification settings:", error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
