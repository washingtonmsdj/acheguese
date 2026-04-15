import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
export type AppointmentNotificationType =
  | "new_appointment"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "appointment_reminder"
  | "appointment_completed";

export interface AppointmentNotification {
  id: string;
  type: AppointmentNotificationType;
  appointment_id: string;
  business_id: string;
  business_name: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  message: string;
  is_read: boolean;
  created_at: string;
  priority: "low" | "medium" | "high";
  metadate?: Record<string, any>;
}

interface UseAppointmentNotificationsOptions {
  businessId?: string;
  userId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const MOCK_NOTIFICATIONS: AppointmentNotification[] = [];

export function useAppointmentNotifications(
  options: UseAppointmentNotificationsOptions = {},
) {
  const { user } = useAuth();
  const {
    businessId,
    userId,
    autoRefresh = true,
    refreshInterval = 30000,
  } = options;

  const [notifications, setNotifications] = useState<AppointmentNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar notifica├º├Áes
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Em produ├º├úo, aqui seria uma chamada real para a API
      // const response = await fetch(`/api/appointment-notifications?businessId=${businessId}&userId=${userId}`);
      // const date = await response.json();

      setNotifications(MOCK_NOTIFICATIONS);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error load notifica├º├Áes",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Em produ├º├úo, fazer chamada para API
      // await fetch(`/api/appointment-notifications/${notificationId}/read`, { method: 'PATCH' });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n,
        ),
      );
    } catch (err) {
      logger.error("Error marcar notifica├º├úo como lida:", err);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      // Em produ├º├úo, fazer chamada para API
      // await fetch(`/api/appointment-notifications/read-all`, { method: 'PATCH' });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      toast.success("Todas as notifica├º├Áes foram marcadas como lidas");
    } catch (err) {
      logger.error("Error marcar todas as notifica├º├Áes como lidas:", err);
      toast.error("Error marcar notifica├º├Áes como lidas");
    }
  }, []);

  // Criar nova notifica├º├úo
  const createNotification = useCallback(
    async (
      date: Omit<AppointmentNotification, "id" | "created_at" | "is_read">,
    ) => {
      try {
        const newNotification: AppointmentNotification = {
          ...date,
          id: `notif_${Date.now()}`,
          created_at: new Date().toISOString(),
          is_read: false,
        };

        // Em produ├º├úo, fazer chamada para API
        // await fetch('/api/appointment-notifications', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(newNotification)
        // });

        setNotifications((prev) => [newNotification, ...prev]);

        // Mostrar toast para notifica├º├Áes importantes
        if (date.priority === "high") {
          toast.info(date.message, {
            action: {
              label: "Ver",
              onClick: () => {
                // Navegar para o agendamento
                window.location.href = `/agendamentos/${date.appointment_id}`;
              },
            },
          });
        }

        return newNotification;
      } catch (err) {
        logger.error("Error create notifica├º├úo:", err);
        throw err;
      }
    },
    [],
  );

  // Deletar notifica├º├úo
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Em produ├º├úo, fazer chamada para API
      // await fetch(`/api/appointment-notifications/${notificationId}`, { method: 'DELETE' });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      logger.error("Error delete notifica├º├úo:", err);
    }
  }, []);

  // Efeito para load notifica├º├Áes iniciais
  useEffect(() => {
    if (user && (businessId || userId)) {
      fetchNotifications();
    }
  }, [user, businessId, userId, fetchNotifications]);

  // Efeito para auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user || (!businessId && !userId)) return;

    const interval = setInterval(fetchNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [
    autoRefresh,
    refreshInterval,
    user,
    businessId,
    userId,
    fetchNotifications,
  ]);

  // Estat├¡sticas
  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.is_read).length,
    byType: notifications.reduce(
      (acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      },
      {} as Record<AppointmentNotificationType, number>,
    ),
    byPriority: notifications.reduce(
      (acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      },
      {} as Record<"low" | "medium" | "high", number>,
    ),
  };

  // Filtros ├║teis
  const getNotificationsByType = useCallback(
    (type: AppointmentNotificationType) => {
      return notifications.filter((n) => n.type === type);
    },
    [notifications],
  );

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.is_read);
  }, [notifications]);

  const getTodayNotifications = useCallback(() => {
    const today = new Date().toDateString();
    return notifications.filter(
      (n) => new Date(n.created_at).toDateString() === today,
    );
  }, [notifications]);

  return {
    notifications,
    loading,
    error,
    stats,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,

    // Filters
    getNotificationsByType,
    getUnreadNotifications,
    getTodayNotifications,

    // Helpers
    refresh: fetchNotifications,
  };
}

// Hook for create notifica├º├Áes espec├¡ficas de agendamento
export function useAppointmentNotificationActions() {
  const { createNotification } = useAppointmentNotifications();

  const notifyNewAppointment = useCallback(
    async (date: {
      appointment_id: string;
      business_id: string;
      business_name: string;
      client_name: string;
      client_phone: string;
      service_name: string;
      appointment_date: string;
      appointment_time: string;
    }) => {
      return createNotification({
        type: "new_appointment",
        message: `${date.client_name} agendou ${date.service_name} para ${date.appointment_date} ├ás ${date.appointment_time}`,
        priority: "high",
        ...date,
      });
    },
    [createNotification],
  );

  const notifyAppointmentConfirmed = useCallback(
    async (date: {
      appointment_id: string;
      business_id: string;
      business_name: string;
      client_name: string;
      client_phone: string;
      service_name: string;
      appointment_date: string;
      appointment_time: string;
    }) => {
      return createNotification({
        type: "appointment_confirmed",
        message: `Agendamento de ${date.client_name} foi confirmado`,
        priority: "medium",
        ...date,
      });
    },
    [createNotification],
  );

  const notifyAppointmentCancelled = useCallback(
    async (date: {
      appointment_id: string;
      business_id: string;
      business_name: string;
      client_name: string;
      client_phone: string;
      service_name: string;
      appointment_date: string;
      appointment_time: string;
    }) => {
      return createNotification({
        type: "appointment_cancelled",
        message: `${date.client_name} cancelou o agendamento de ${date.service_name}`,
        priority: "medium",
        ...date,
      });
    },
    [createNotification],
  );

  const notifyAppointmentReminder = useCallback(
    async (date: {
      appointment_id: string;
      business_id: string;
      business_name: string;
      client_name: string;
      client_phone: string;
      service_name: string;
      appointment_date: string;
      appointment_time: string;
      minutes_until: number;
    }) => {
      const timeText =
        date.minutes_until < 60
          ? `${date.minutes_until} minutos`
          : `${Math.floor(date.minutes_until / 60)} time${Math.floor(date.minutes_until / 60) > 1 ? "s" : ""}`;

      return createNotification({
        type: "appointment_reminder",
        message: `Lembrete: ${date.client_name} tem agendamento em ${timeText}`,
        priority: "medium",
        ...date,
        metadate: { minutes_until: date.minutes_until },
      });
    },
    [createNotification],
  );

  const notifyAppointmentCompleted = useCallback(
    async (date: {
      appointment_id: string;
      business_id: string;
      business_name: string;
      client_name: string;
      client_phone: string;
      service_name: string;
      appointment_date: string;
      appointment_time: string;
    }) => {
      return createNotification({
        type: "appointment_completed",
        message: `Agendamento de ${date.client_name} foi conclu├¡do`,
        priority: "low",
        ...date,
      });
    },
    [createNotification],
  );

  return {
    notifyNewAppointment,
    notifyAppointmentConfirmed,
    notifyAppointmentCancelled,
    notifyAppointmentReminder,
    notifyAppointmentCompleted,
  };
}
