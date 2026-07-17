/**
 * ============================================
 * UNIFIED NOTIFICATIONS HOOK (SSOT)
 * ============================================
 * Hook canônico para gerenciar notificações em todo o app.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";
import {
  notificationService,
  type Notification,
  type NotificationRealtimeChange,
} from "./services/NotificationService";
import type { NotificationFilters } from "./types";

interface UseUnifiedNotificationsOptions {
  filters?: NotificationFilters;
  enableRealtime?: boolean;
  enableToast?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

type RealtimeChannelLike = (() => void) | { unsubscribe?: () => void };
type NotificationPriorityKey = NonNullable<Notification["priority"]>;
type NotificationStatsState = {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<NotificationPriorityKey, number>;
};

function createEmptyNotificationStats(): NotificationStatsState {
  return {
    total: 0,
    unread: 0,
    by_type: {},
    by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
  };
}

function getNotificationPriority(notification: Notification): NotificationPriorityKey {
  return notification.priority ?? "medium";
}

function notificationMatchesFilters(
  notification: Notification,
  filters: NotificationFilters,
): boolean {
  if (notification.deleted_at) return false;
  if (filters.read !== undefined && notification.read !== filters.read) return false;
  if (filters.category && notification.category !== filters.category) return false;

  if (filters.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    if (!types.includes(notification.type)) return false;
  }

  if (filters.priority) {
    const priorities = Array.isArray(filters.priority)
      ? filters.priority
      : [filters.priority];
    if (!priorities.includes(notification.priority)) return false;
  }

  return true;
}

export function useUnifiedNotifications(
  options: UseUnifiedNotificationsOptions = {},
) {
  const {
    filters = {},
    enableRealtime = true,
    enableToast = true,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStatsState>(
    createEmptyNotificationStats,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannelLike | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRequestRef = useRef(0);
  const activeUserIdRef = useRef(user?.id);
  const notificationsRef = useRef<Notification[]>([]);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const filtersSignature = JSON.stringify(filters);
  const stableFilters = useMemo(
    () => JSON.parse(filtersSignature) as NotificationFilters,
    [filtersSignature],
  );
  const listLimit = Math.min(Math.max(stableFilters.limit ?? 30, 1), 100);
  activeUserIdRef.current = user?.id;

  const updateNotifications = useCallback(
    (updater: (current: Notification[]) => Notification[]) => {
      setNotifications((current) => {
        const next = updater(current);
        notificationsRef.current = next;
        return next;
      });
    },
    [],
  );

  const fetchNotifications = useCallback(
    async (silent = false) => {
      const requestId = ++fetchRequestRef.current;
      const requestUserId = user?.id;

      if (!requestUserId) {
        updateNotifications(() => []);
        seenNotificationIdsRef.current.clear();
        setStats(createEmptyNotificationStats());
        setLoading(false);
        return;
      }

      if (!silent) setLoading(true);
      setError(null);

      try {
        const [data, statsData] = await Promise.all([
          notificationService.fetchNotifications(stableFilters),
          notificationService.getStats(requestUserId),
        ]);
        if (
          fetchRequestRef.current !== requestId ||
          activeUserIdRef.current !== requestUserId
        ) {
          return;
        }
        seenNotificationIdsRef.current = new Set(data.map((notification) => notification.id));
        updateNotifications(() => data);
        setStats((prev) => ({ ...prev, ...statsData }));
      } catch (err) {
        if (fetchRequestRef.current !== requestId) return;
        const message =
          err instanceof Error ? err.message : "Erro ao carregar notificacoes";
        setError(message);
        logger.error("Erro ao buscar notificacoes:", err);
      } finally {
        if (fetchRequestRef.current === requestId) setLoading(false);
      }
    },
    [stableFilters, updateNotifications, user?.id],
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    const requestUserId = user?.id;
    if (!requestUserId) return false;

    try {
      await notificationService.markAsRead(notificationId);
      if (activeUserIdRef.current !== requestUserId) return true;
      const existing = notificationsRef.current.find(
        (notification) => notification.id === notificationId,
      );
      updateNotifications((current) =>
        current.flatMap((notification) => {
          if (notification.id !== notificationId) return [notification];
          const updatedNotification = {
            ...notification,
            read: true,
            read_at: new Date().toISOString(),
          };
          return notificationMatchesFilters(updatedNotification, stableFilters)
            ? [updatedNotification]
            : [];
        }),
      );
      if (existing && !existing.read) {
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
      }
      return true;
    } catch (err) {
      logger.error("Erro ao marcar como lida:", err);
      return false;
    }
  }, [stableFilters, updateNotifications, user?.id]);

  const markAllAsRead = useCallback(async () => {
    const requestUserId = user?.id;
    if (!requestUserId) return 0;

    try {
      const count = await notificationService.markAllAsRead();
      if (activeUserIdRef.current !== requestUserId) return count;

      updateNotifications((current) =>
        current.flatMap((notification) => {
          const updatedNotification = {
            ...notification,
            read: true,
            read_at: new Date().toISOString(),
          };
          return notificationMatchesFilters(updatedNotification, stableFilters)
            ? [updatedNotification]
            : [];
        }),
      );

      setStats((prev) => ({
        ...prev,
        unread: 0,
      }));

      if (enableToast && count > 0) {
        toast.success(`${count} notificacoes marcadas como lidas`);
      }

      return count;
    } catch (err) {
      logger.error("Erro ao marcar todas como lidas:", err);
      return 0;
    }
  }, [enableToast, stableFilters, updateNotifications, user?.id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const requestUserId = user?.id;
    if (!requestUserId) return false;

    try {
      await notificationService.deleteNotification(notificationId);
      if (activeUserIdRef.current !== requestUserId) return true;
      const existing = notificationsRef.current.find(
        (notification) => notification.id === notificationId,
      );
      updateNotifications((current) =>
        current.filter((notification) => notification.id !== notificationId),
      );
      setStats((prev) => {
        if (!existing) return prev;
        const priority = getNotificationPriority(existing);
        return {
          ...prev,
          total: Math.max(0, prev.total - 1),
          unread: Math.max(0, prev.unread - (!existing.read ? 1 : 0)),
          by_type: {
            ...prev.by_type,
            [existing.type]: Math.max(0, (prev.by_type[existing.type] ?? 0) - 1),
          },
          by_priority: {
            ...prev.by_priority,
            [priority]: Math.max(0, prev.by_priority[priority] - 1),
          },
        };
      });
      return true;
    } catch (err) {
      logger.error("Erro ao deletar notificacao:", err);
      return false;
    }
  }, [updateNotifications, user?.id]);

  useEffect(() => {
    if (!user?.id || !enableRealtime) return;

    try {
      const channel = notificationService.createRealtimeChannel(
        user.id,
        ({ eventType, notification }: NotificationRealtimeChange) => {
          if (eventType === "UPDATE") {
            const existing = notificationsRef.current.find(
              (current) => current.id === notification.id,
            );
            const matchesFilters = notificationMatchesFilters(
              notification,
              stableFilters,
            );
            updateNotifications((current) => {
              if (!existing) {
                return matchesFilters
                  ? [notification, ...current].slice(0, listLimit)
                  : current;
              }
              return matchesFilters
                ? current.map((item) =>
                    item.id === notification.id ? notification : item,
                  )
                : current.filter((item) => item.id !== notification.id);
            });

            void notificationService.getStats(user.id).then((statsData) => {
              if (activeUserIdRef.current === user.id) {
                setStats((current) => ({ ...current, ...statsData }));
              }
            });
            return;
          }

          const newNotification = notification;
          if (seenNotificationIdsRef.current.has(newNotification.id)) return;
          seenNotificationIdsRef.current.add(newNotification.id);

          logger.info("Nova notificacao recebida:", {
            id: newNotification.id,
            type: newNotification.type,
          });

          if (notificationMatchesFilters(newNotification, stableFilters)) {
            updateNotifications((current) =>
              [newNotification, ...current].slice(0, listLimit),
            );
          }

          setStats((prev) => ({
            ...prev,
            total: prev.total + 1,
            unread: prev.unread + 1,
            by_type: {
              ...prev.by_type,
              [newNotification.type]:
                (prev.by_type[newNotification.type] || 0) + 1,
            },
            by_priority: (() => {
              const priority = getNotificationPriority(newNotification);
              return {
                ...prev.by_priority,
                [priority]: prev.by_priority[priority] + 1,
              };
            })(),
          }));

          if (enableToast) {
            toast(newNotification.title, {
              description: newNotification.message,
              duration: 5000,
            });
          }
        },
      );

      channelRef.current = channel as RealtimeChannelLike;

      return () => {
        if (typeof channelRef.current === "function") {
          channelRef.current();
        } else if (
          channelRef.current &&
          typeof channelRef.current.unsubscribe === "function"
        ) {
          channelRef.current.unsubscribe();
        }
        channelRef.current = null;
      };
    } catch (err) {
      logger.error("Erro ao configurar realtime:", err);
    }
  }, [
    enableRealtime,
    enableToast,
    listLimit,
    stableFilters,
    updateNotifications,
    user?.id,
  ]);

  useEffect(() => {
    if (!autoRefresh || !user?.id) return;

    refreshTimerRef.current = setInterval(() => {
      fetchNotifications(true);
    }, refreshInterval);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, fetchNotifications, user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    stats,
    unreadCount: stats.unread,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () => fetchNotifications(false),
    getUnreadNotifications: () =>
      notifications.filter((notification) => !notification.read),
    getNotificationsByType: (type: string) =>
      notifications.filter((notification) => notification.type === type),
    getHighPriorityNotifications: () =>
      notifications.filter(
        (notification) =>
          getNotificationPriority(notification) === "high" ||
          getNotificationPriority(notification) === "urgent",
      ),
  };
}
