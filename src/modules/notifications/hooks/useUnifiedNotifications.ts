 
/**
 * ============================================
 * UNIFIED NOTIFICATIONS HOOK (SSOT)
 * ============================================
 * Hook único para gerenciar notificações em todo o app
 * Sistema consolidado - única fonte de verdade para notificações
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { notificationService } from "@/core/notifications";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";
import type {
  Notification,
  NotificationFilters,
  NotificationStats,
} from "@/core/notifications";

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

  // Atualizar ref quando filters mudar
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // ============================================
  // FETCH NOTIFICATIONS
  // ============================================

  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!user?.id) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Prevenir múltiplas chamadas simultâneas
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

        // Atualizar stats
        const statsData = await notificationService.getStats(user.id);
        setStats(statsData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar notificações";
        setError(message);
        logger.error("Erro ao buscar notificações:", err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [user?.id],
  );

  // ============================================
  // MARK AS READ
  // ============================================

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const success = await notificationService.markAsRead(notificationId);

      if (success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n,
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

  // ============================================
  // MARK ALL AS READ
  // ============================================

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return 0;

    try {
      const count = await notificationService.markAllAsRead(user.id);

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          read_at: new Date().toISOString(),
        })),
      );

      setStats((prev) => ({
        ...prev,
        unread: 0,
      }));

      if (enableToast && count > 0) {
        toast.success(`${count} notificações marcadas como lidas`);
      }

      return count;
    } catch (err) {
      logger.error("Erro ao marcar todas como lidas:", err);
      return 0;
    }
  }, [user?.id, enableToast]);

  // ============================================
  // DELETE NOTIFICATION
  // ============================================

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const success =
        await notificationService.deleteNotification(notificationId);

      if (success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      }

      return success;
    } catch (err) {
      logger.error("Erro ao deletar notificação:", err);
      return false;
    }
  }, []);

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================

  useEffect(() => {
    if (!user?.id || !enableRealtime) return;

    try {
      const channel = notificationService.createRealtimeChannel(
        user.id,
        (newNotification: Notification) => {
          logger.info("Nova notificação recebida:", {
            id: newNotification.id,
            type: newNotification.type,
          });

          // Adicionar à lista (evitar duplicatas)
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
          });

          // Atualizar stats
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

          // Toast notification
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

  // ============================================
  // AUTO REFRESH
  // ============================================

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

  // ============================================
  // INITIAL FETCH
  // ============================================

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    notifications,
    stats,
    unreadCount: stats.unread,

    // State
    loading,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () => fetchNotifications(false),

    // Helpers
    getUnreadNotifications: () => notifications.filter((n) => !n.read),
    getNotificationsByType: (type: string) =>
      notifications.filter((n) => n.type === type),
    getHighPriorityNotifications: () =>
      notifications.filter(
        (n) => n.priority === "high" || n.priority === "urgent",
      ),
  };
}
