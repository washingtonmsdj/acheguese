/**
 * Stub - useNotifications hook
 */
import { useState, useCallback } from "react";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export function useNotifications() {
  const [notifications] = useState<AppNotification[]>([]);
  const [unreadCount] = useState(0);
  const [loading] = useState(false);

  const markAsRead = useCallback((_id: string) => {}, []);
  const markAllAsRead = useCallback(() => {}, []);
  const deleteNotification = useCallback((_id: string) => {}, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
