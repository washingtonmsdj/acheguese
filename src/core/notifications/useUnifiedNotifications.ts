/**
 * ============================================
 * UNIFIED NOTIFICATIONS HOOK (SSOT)
 * ============================================
 * Hook canônico para gerenciar notificações em todo o app.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";
import { notificationService } from "./services/NotificationService";
import type {
  Notification,
  NotificationFilters,
  NotificationStats,
} from "./types";

interface UseUnifiedNotificationsOptions {
  filters?: NotificationFilters;
  enableRealtime?: boolean;
  enableToast?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
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
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    by_type: {},
    by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<any | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const filtersRef = useRef(filters);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!user?.id) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!silent) setLoading(true);
      setError(null);

      try {
        const data = await notificationService.fetchNotifications(
          user.id,
          filtersRef.current,
        );
        setNotifications(data);

        const statsData = await notificationService.getStats(user.id);
        setStats(statsData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar notificacoes";
        setError(message);
        logger.error("Erro ao buscar notificacoes:", err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [user?.id],
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await notificationService.markAsRead(notificationId);

      if (success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  read: true,
                  read_at: new Date().toISOString(),
                }
              : notification,
          ),
        );

        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
      }

      return success;
    } catch (err) {
      logger.error("Erro ao marcar como lida:", err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return 0;

    try {
      const count = await notificationService.markAllAsRead(user.id);

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          read_at: new Date().toISOString(),
        })),
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
  }, [user?.id, enableToast]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const success =
        await notificationService.deleteNotification(notificationId);

      if (success) {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId),
        );
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      }

      return success;
    } catch (err) {
      logger.error("Erro ao deletar notificacao:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!user?.id || !enableRealtime) return;

    try {
      const channel = notificationService.createRealtimeChannel(
        user.id,
        (newNotification: Notification) => {
          logger.info("Nova notificacao recebida:", {
            id: newNotification.id,
            type: newNotification.type,
          });

          setNotifications((prev) => {
            const exists = prev.some(
              (notification) => notification.id === newNotification.id,
            );

            if (exists) return prev;
            return [newNotification, ...prev];
          });

          setStats((prev) => ({
            ...prev,
            total: prev.total + 1,
            unread: prev.unread + 1,
            by_type: {
              ...prev.by_type,
              [newNotification.type]:
                (prev.by_type[newNotification.type] || 0) + 1,
            },
            by_priority: {
              ...prev.by_priority,
              [newNotification.priority]:
                prev.by_priority[newNotification.priority] + 1,
            },
          }));

          if (enableToast) {
            toast(newNotification.title, {
              description: newNotification.message,
              duration: 5000,
            });
          }
        },
      );

      channelRef.current = channel;

      return () => {
        if (channel && typeof channel.unsubscribe === "function") {
          channel.unsubscribe();
        }
        channelRef.current = null;
      };
    } catch (err) {
      logger.error("Erro ao configurar realtime:", err);
    }
  }, [user?.id, enableRealtime, enableToast]);

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
          notification.priority === "high" ||
          notification.priority === "urgent",
      ),
  };
}
