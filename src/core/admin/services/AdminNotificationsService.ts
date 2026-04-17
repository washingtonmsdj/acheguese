/**
 * AdminNotificationsService
 *
 * Cobertura administrativa oficial do dominio de notifications.
 * Mantem a leitura global no agregado admin sem reabrir acessos diretos
 * espalhados por pages e hooks.
 */

import { supabase } from "@/integrations/supabase";
import { supabaseAdmin } from "@/integrations/supabase/supabaseAdmin";
import { logger } from "@/shared/utils/logger";
import type { AdminSupabaseClient } from "../types/adminDatabase.types";
import { normalizeNotification } from "@/core/notifications/utils/normalizeNotification";
import { profileService } from "@/core/profiles/services/ProfileService";
import type {
  Notification,
  NotificationPriority,
  NotificationTypeValue,
} from "@/core/notifications/types";

type AdminProfileSummary = {
  user_id: string;
  name: string | null;
  display_name: string | null;
  username: string | null;
  profile_type: string | null;
};

export interface AdminNotificationRecord extends Notification {
  profile?: AdminProfileSummary;
}

export interface AdminNotificationFilters {
  search?: string;
  type?: NotificationTypeValue;
  priority?: NotificationPriority;
  read?: boolean;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminNotificationStats {
  total: number;
  unread: number;
  read: number;
  deleted: number;
  highPriority: number;
  urgentPriority: number;
  last24h: number;
  last7d: number;
  uniqueUsers: number;
  byType: Record<string, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface AdminNotificationSettingsStats {
  totalUsersWithSettings: number;
  emailEnabled: number;
  pushEnabled: number;
  weeklyDigestEnabled: number;
  newMessagesEnabled: number;
  communityUpdatesEnabled: number;
  businessUpdatesEnabled: number;
}

export interface AdminNotificationListResult {
  data: AdminNotificationRecord[];
  total: number;
  page: number;
  totalPages: number;
}

function getAdminClient(): AdminSupabaseClient {
  return (supabaseAdmin ?? supabase) as unknown as AdminSupabaseClient;
}

function escapeIlike(term: string): string {
  return term.replace(/[%(),]/g, " ").trim();
}

async function loadProfilesByUserId(userIds: string[]): Promise<Map<string, AdminProfileSummary>> {
  if (userIds.length === 0) {
    return new Map();
  }

  try {
    const profiles = await profileService.getProfilesByIds(userIds);
    return new Map(
      profiles.map((profile: any) => [
        profile.user_id,
        {
          user_id: profile.user_id,
          name: profile.name ?? null,
          display_name: profile.display_name ?? null,
          username: profile.username ?? null,
          profile_type: profile.profile_type ?? null,
        } as AdminProfileSummary,
      ]),
    );
  } catch (error) {
    logger.error("AdminNotificationsService.loadProfilesByUserId", error);
    return new Map();
  }
}

class AdminNotificationsService {
  private readonly TABLE = "notifications";
  private readonly SETTINGS_TABLE = "user_notification_settings";

  async getStats(): Promise<AdminNotificationStats> {
    try {
      const client = getAdminClient();
      const { data, error } = await client
        .from(this.TABLE)
        .select("user_id, type, priority, read, is_read, deleted_at, created_at");

      if (error) throw error;

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      const stats: AdminNotificationStats = {
        total: 0,
        unread: 0,
        read: 0,
        deleted: 0,
        highPriority: 0,
        urgentPriority: 0,
        last24h: 0,
        last7d: 0,
        uniqueUsers: 0,
        byType: {},
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
      };

      const userIds = new Set<string>();

      for (const rawItem of (data as Record<string, any>[]) || []) {
        const item = normalizeNotification(rawItem);
        stats.total += 1;
        stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
        stats.byPriority[item.priority] += 1;

        if (item.read) {
          stats.read += 1;
        } else {
          stats.unread += 1;
        }

        if (item.deleted_at) {
          stats.deleted += 1;
        }

        if (item.priority === "high") {
          stats.highPriority += 1;
        }
        if (item.priority === "urgent") {
          stats.urgentPriority += 1;
        }

        const createdAt = Date.parse(item.created_at);
        if (!Number.isNaN(createdAt)) {
          if (createdAt >= oneDayAgo) stats.last24h += 1;
          if (createdAt >= sevenDaysAgo) stats.last7d += 1;
        }

        if (item.user_id) {
          userIds.add(item.user_id);
        }
      }

      stats.uniqueUsers = userIds.size;

      return stats;
    } catch (error) {
      logger.error("AdminNotificationsService.getStats", error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        deleted: 0,
        highPriority: 0,
        urgentPriority: 0,
        last24h: 0,
        last7d: 0,
        uniqueUsers: 0,
        byType: {},
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0,
        },
      };
    }
  }

  async getSettingsStats(): Promise<AdminNotificationSettingsStats> {
    try {
      const client = getAdminClient();
      const { data, error } = await client
        .from(this.SETTINGS_TABLE)
        .select(
          "user_id, email_notifications, push_notifications, weekly_digest, new_messages, community_updates, business_updates",
        );

      if (error) throw error;

      const rows = (data as Record<string, any>[]) || [];

      return {
        totalUsersWithSettings: rows.length,
        emailEnabled: rows.filter((item) => item.email_notifications !== false).length,
        pushEnabled: rows.filter((item) => item.push_notifications !== false).length,
        weeklyDigestEnabled: rows.filter((item) => item.weekly_digest !== false).length,
        newMessagesEnabled: rows.filter((item) => item.new_messages !== false).length,
        communityUpdatesEnabled: rows.filter((item) => item.community_updates !== false).length,
        businessUpdatesEnabled: rows.filter((item) => item.business_updates !== false).length,
      };
    } catch (error) {
      logger.error("AdminNotificationsService.getSettingsStats", error);
      return {
        totalUsersWithSettings: 0,
        emailEnabled: 0,
        pushEnabled: 0,
        weeklyDigestEnabled: 0,
        newMessagesEnabled: 0,
        communityUpdatesEnabled: 0,
        businessUpdatesEnabled: 0,
      };
    }
  }

  async getSettingsUserIds(userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) {
      return new Set();
    }

    try {
      const client = getAdminClient();
      const { data, error } = await client
        .from(this.SETTINGS_TABLE)
        .select("user_id")
        .in("user_id", userIds);

      if (error) throw error;

      return new Set(((data as Record<string, any>[]) || []).map((row) => row.user_id));
    } catch (error) {
      logger.error("AdminNotificationsService.getSettingsUserIds", error);
      return new Set();
    }
  }

  async getUserSettings(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const client = getAdminClient();
      const { data, error } = await client
        .from(this.SETTINGS_TABLE)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return (data as Record<string, unknown>) ?? null;
    } catch (error) {
      logger.error("AdminNotificationsService.getUserSettings", error);
      return null;
    }
  }

  async getNotifications(
    filters: AdminNotificationFilters = {},
  ): Promise<AdminNotificationListResult> {
    try {
      const {
        search,
        type,
        priority,
        read,
        includeDeleted = false,
        page = 1,
        limit = 20,
      } = filters;

      const client = getAdminClient();
      let query = client.from(this.TABLE).select("*", { count: "exact" });

      if (!includeDeleted) {
        query = query.is("deleted_at", null);
      }

      if (type) {
        query = query.eq("type", type);
      }

      if (priority) {
        query = query.eq("priority", priority);
      }

      if (read !== undefined) {
        query = query.eq("read", read);
      }

      if (search?.trim()) {
        const term = escapeIlike(search);
        query = query.or(
          `title.ilike.%${term}%,message.ilike.%${term}%,type.ilike.%${term}%,user_id.ilike.%${term}%`,
        );
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const items = ((data as Record<string, any>[]) || []).map(normalizeNotification);
      const profileMap = await loadProfilesByUserId(
        [...new Set(items.map((item) => item.user_id).filter(Boolean))],
      );

      return {
        data: items.map((item) => ({
          ...item,
          profile: profileMap.get(item.user_id),
        })),
        total: count || 0,
        page,
        totalPages: count ? Math.max(1, Math.ceil(count / limit)) : 1,
      };
    } catch (error) {
      logger.error("AdminNotificationsService.getNotifications", error);
      return {
        data: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }
}

export const adminNotificationsService = new AdminNotificationsService();
