/**
 * AdminNotificationsService
 *
 * Cobertura administrativa oficial do dominio de notifications.
 * Mantem a leitura global no agregado admin sem reabrir acessos diretos
 * espalhados por pages e hooks.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
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

export interface AdminNotificationChannelStats {
  totalPushSubscriptions: number;
  activePushSubscriptions: number;
  inactivePushSubscriptions: number;
  usersWithPushSubscriptions: number;
  emailSent24h: number;
  emailDelivered24h: number;
  emailFailed24h: number;
}

export interface AdminNotificationTemplateStat {
  template: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  lastSentAt: string | null;
}

export interface AdminEmailDeliveryAuditFilters {
  page?: number;
  limit?: number;
  template?: string;
  status?: string;
  search?: string;
}

export interface AdminEmailDeliveryAuditRecord {
  id: string;
  userId: string | null;
  email: string;
  template: string;
  subject: string;
  status: string;
  providerId: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AdminEmailDeliveryAuditResult {
  data: AdminEmailDeliveryAuditRecord[];
  total: number;
  page: number;
  totalPages: number;
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

  async getStats(): Promise<AdminNotificationStats> {
    try {
      const { data, error } = await supabase
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
      const { data, error } = await supabase.rpc(
        "admin_notifications_get_settings_stats",
      );
      if (error) throw error;
      const row = Array.isArray(data)
        ? (data[0] as Record<string, unknown> | undefined)
        : (data as Record<string, unknown> | null);

      return {
        totalUsersWithSettings: Number(row?.total_users_with_settings || 0),
        emailEnabled: Number(row?.email_enabled || 0),
        pushEnabled: Number(row?.push_enabled || 0),
        weeklyDigestEnabled: Number(row?.weekly_digest_enabled || 0),
        newMessagesEnabled: Number(row?.new_messages_enabled || 0),
        communityUpdatesEnabled: Number(row?.community_updates_enabled || 0),
        businessUpdatesEnabled: Number(row?.business_updates_enabled || 0),
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
      const { data, error } = await supabase.rpc(
        "admin_notifications_get_settings_user_ids",
        { p_user_ids: userIds },
      );

      if (error) throw error;

      return new Set(
        ((data as Array<{ user_id: string }> | null) || []).map(
          (row) => row.user_id,
        ),
      );
    } catch (error) {
      logger.error("AdminNotificationsService.getSettingsUserIds", error);
      return new Set();
    }
  }

  async getUserSettings(userId: string): Promise<Record<string, unknown> | null> {
    try {
      const { data, error } = await supabase.rpc(
        "admin_notifications_get_user_settings",
        { p_user_id: userId },
      );

      if (error) throw error;
      const row = Array.isArray(data)
        ? (data[0] as { settings?: Record<string, unknown> | null } | undefined)
        : (data as { settings?: Record<string, unknown> | null } | null);
      return row?.settings ?? null;
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

      let query = supabase.from(this.TABLE).select("*", { count: "exact" });

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

  async getChannelStats(): Promise<AdminNotificationChannelStats> {
    try {
      const { data, error } = await supabase.rpc(
        "admin_notifications_get_channel_stats",
      );
      if (error) throw error;

      const row = Array.isArray(data)
        ? (data[0] as Record<string, unknown> | undefined)
        : (data as Record<string, unknown> | null);

      return {
        totalPushSubscriptions: Number(row?.total_push_subscriptions || 0),
        activePushSubscriptions: Number(row?.active_push_subscriptions || 0),
        inactivePushSubscriptions: Number(row?.inactive_push_subscriptions || 0),
        usersWithPushSubscriptions: Number(row?.users_with_push_subscriptions || 0),
        emailSent24h: Number(row?.email_sent_24h || 0),
        emailDelivered24h: Number(row?.email_delivered_24h || 0),
        emailFailed24h: Number(row?.email_failed_24h || 0),
      };
    } catch (error) {
      logger.error("AdminNotificationsService.getChannelStats", error);
      return {
        totalPushSubscriptions: 0,
        activePushSubscriptions: 0,
        inactivePushSubscriptions: 0,
        usersWithPushSubscriptions: 0,
        emailSent24h: 0,
        emailDelivered24h: 0,
        emailFailed24h: 0,
      };
    }
  }

  async getTemplateStats(limit = 10): Promise<AdminNotificationTemplateStat[]> {
    try {
      const { data, error } = await supabase.rpc(
        "admin_notifications_get_template_stats",
        { p_limit: limit },
      );
      if (error) throw error;

      return ((data as Record<string, unknown>[]) || []).map((row) => ({
        template: String(row.template || "sem_template"),
        total: Number(row.total || 0),
        sent: Number(row.sent || 0),
        delivered: Number(row.delivered || 0),
        failed: Number(row.failed || 0),
        opened: Number(row.opened || 0),
        clicked: Number(row.clicked || 0),
        lastSentAt: (row.last_sent_at as string | null) ?? null,
      }));
    } catch (error) {
      logger.error("AdminNotificationsService.getTemplateStats", error);
      return [];
    }
  }

  async getEmailDeliveryAudit(
    filters: AdminEmailDeliveryAuditFilters = {},
  ): Promise<AdminEmailDeliveryAuditResult> {
    try {
      const page = filters.page ?? 1;
      const limit = filters.limit ?? 20;
      const { data, error } = await supabase.rpc(
        "admin_notifications_get_delivery_audit",
        {
          p_page: page,
          p_limit: limit,
          p_template: filters.template || null,
          p_status: filters.status || null,
          p_search: filters.search?.trim() || null,
        },
      );

      if (error) throw error;

      const rows = ((data as Record<string, unknown>[]) || []).map((row) => ({
        id: String(row.id),
        userId: (row.user_id as string | null) ?? null,
        email: String(row.email || ""),
        template: String(row.template || "sem_template"),
        subject: String(row.subject || ""),
        status: String(row.status || "unknown"),
        providerId: (row.provider_id as string | null) ?? null,
        errorMessage: (row.error_message as string | null) ?? null,
        metadata: (row.metadata as Record<string, unknown>) || {},
        createdAt: String(row.created_at || ""),
      }));
      const total = Number((data as Record<string, unknown>[] | null)?.[0]?.total_count || 0);

      return {
        data: rows,
        total,
        page,
        totalPages: total > 0 ? Math.max(1, Math.ceil(total / limit)) : 1,
      };
    } catch (error) {
      logger.error("AdminNotificationsService.getEmailDeliveryAudit", error);
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
