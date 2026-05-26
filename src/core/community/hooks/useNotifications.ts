import { useCallback, useMemo } from "react";
import { useNotifications as useCoreNotifications } from "@/core/notifications/hooks/useNotifications";
import type { Notification } from "@/core/notifications/services/NotificationService";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
  data?: Record<string, unknown>;
}

function toAppNotification(notification: Notification): AppNotification {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    is_read: notification.read,
    created_at: notification.created_at,
    action_url: notification.action_url,
    action_label: notification.action_label,
    data: notification.metadata,
  };
}

export function useNotifications() {
  const notificationsApi = useCoreNotifications();
  const notifications = useMemo(
    () => (notificationsApi.notifications ?? []).map(toAppNotification),
    [notificationsApi.notifications],
  );
  const unreadCount =
    notificationsApi.unreadCount ??
    notifications.filter((notification) => !notification.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      void notificationsApi.markAsRead.mutateAsync(id);
    },
    [notificationsApi.markAsRead],
  );

  const markAllAsRead = useCallback(() => {
    void notificationsApi.markAllAsRead.mutateAsync();
  }, [notificationsApi.markAllAsRead]);

  const deleteNotification = useCallback(
    (id: string) => {
      void notificationsApi.deleteNotification.mutateAsync(id);
    },
    [notificationsApi.deleteNotification],
  );

  return {
    notifications,
    unreadCount,
    stats: {
      total: notifications.length,
      total_unread: unreadCount,
    },
    loading: notificationsApi.isLoading,
    isLoading: notificationsApi.isLoading,
    isRefreshing: false,
    error: notificationsApi.error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: notificationsApi.refetch,
  };
}
