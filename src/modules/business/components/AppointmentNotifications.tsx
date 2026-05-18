import React, { useMemo, useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Bell,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageCircle,
  Eye,
  BellRing,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import {
  NotificationType,
  type AppointmentNotificationMetadata,
  type Notification,
} from "@/core/notifications/types";

interface AppointmentNotification {
  id: string;
  type:
    | "new_appointment"
    | "appointment_cancelled"
    | "appointment_reminder"
    | "appointment_confirmed"
    | "appointment_completed";
  appointment_id: string;
  client_name: string;
  client_phone: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  message: string;
  is_read: boolean;
  created_at: string;
  priority: "low" | "medium" | "high";
}

interface AppointmentNotificationsProps {
  businessId: string;
  isOwner: boolean;
  onNotificationClick?: (appointmentId: string) => void;
}

const NOTIFICATION_CONFIG = {
  new_appointment: {
    icon: Calendar,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    title: "Novo Agendamento",
  },
  appointment_cancelled: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    title: "Agendamento Cancelado",
  },
  appointment_reminder: {
    icon: BellRing,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    title: "Lembrete",
  },
  appointment_confirmed: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    title: "Agendamento Confirmado",
  },
  appointment_completed: {
    icon: CheckCircle,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    title: "Agendamento Concluido",
  },
} as const;

const APPOINTMENT_TYPES = [
  NotificationType.APPOINTMENT_NEW,
  NotificationType.APPOINTMENT_CONFIRMED,
  NotificationType.APPOINTMENT_CANCELLED,
  NotificationType.APPOINTMENT_REMINDER,
  NotificationType.APPOINTMENT_COMPLETED,
] as const;

function mapCanonicalNotification(
  notification: Notification,
): AppointmentNotification {
  const metadata: Partial<AppointmentNotificationMetadata> =
    (notification.metadata as Partial<AppointmentNotificationMetadata>) ?? {};

  const typeMap: Record<string, AppointmentNotification["type"]> = {
    [NotificationType.APPOINTMENT_NEW]: "new_appointment",
    [NotificationType.APPOINTMENT_CONFIRMED]: "appointment_confirmed",
    [NotificationType.APPOINTMENT_CANCELLED]: "appointment_cancelled",
    [NotificationType.APPOINTMENT_REMINDER]: "appointment_reminder",
    [NotificationType.APPOINTMENT_COMPLETED]: "appointment_completed",
  };

  return {
    id: notification.id,
    type: typeMap[notification.type] ?? "new_appointment",
    appointment_id: metadata.appointment_id || notification.id,
    client_name: metadata.client_name || "Cliente",
    client_phone: metadata.client_phone || "",
    service_name: metadata.service_name || "Servico",
    appointment_date: metadata.appointment_date || new Date().toISOString(),
    appointment_time: metadata.appointment_time || "--:--",
    message: notification.message,
    is_read: notification.read,
    created_at: notification.created_at,
    priority: notification.priority === "urgent" ? "high" : notification.priority,
  };
}

export default function AppointmentNotifications({
  businessId,
  isOwner,
  onNotificationClick,
}: AppointmentNotificationsProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<AppointmentNotification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const {
    notifications: canonicalNotifications,
    loading,
    markAsRead,
    refresh,
  } = useUnifiedNotifications({
    filters: {
      type: APPOINTMENT_TYPES as unknown as string[],
      limit: 100,
    },
    enableRealtime: true,
    autoRefresh: true,
    refreshInterval: 30000,
  });

  const notifications = useMemo(() => {
    if (!isOwner) return [];

    return canonicalNotifications
      .filter((notification) => {
        const metadata =
          (notification.metadata as Partial<AppointmentNotificationMetadata>) ?? {};
        return !metadata.business_id || metadata.business_id === businessId;
      })
      .map((notification) =>
        mapCanonicalNotification(notification as unknown as Notification),
      );
  }, [businessId, canonicalNotifications, isOwner]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayNotifications = showAll
    ? notifications
    : notifications.slice(0, 3);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    await refresh();
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((notification) => !notification.is_read);
    await Promise.all(unread.map((notification) => markAsRead(notification.id)));
    await refresh();
    toast.success("Todas as notificacoes foram marcadas como lidas");
  };

  const handleNotificationClick = async (
    notification: AppointmentNotification,
  ) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    if (onNotificationClick) {
      onNotificationClick(notification.appointment_id);
      return;
    }

    setSelectedNotification(notification);
    setDetailsOpen(true);
  };

  const contactClient = (notification: AppointmentNotification) => {
    if (!notification.client_phone) {
      toast.info("Cliente sem telefone cadastrado");
      return;
    }

    const message = `Ola ${notification.client_name}! Sobre seu agendamento de ${notification.service_name} para ${format(new Date(notification.appointment_date), "dd/MM/yyyy", { locale: ptBR })} as ${notification.appointment_time}.`;
    window.open(
      `https://wa.me/${notification.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  if (!isOwner) return null;

  if (loading) {
    return (
      <Card className="border-2 p-4">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
          <span className="text-sm text-muted-foreground">
            Carregando notificacoes...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <div className="border-b bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold">Notificacoes de Agendamentos</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} nao lidas` : "Todas lidas"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Marcar todas como lidas
                </Button>
              )}
              <Button size="sm" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="text-sm">Nenhuma notificacao ainda</p>
            </div>
          ) : (
            <>
              {displayNotifications.map((notification) => {
                const config = NOTIFICATION_CONFIG[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "cursor-pointer p-4 transition-colors hover:bg-muted/50",
                      !notification.is_read &&
                        "border-l-4 border-l-blue-500 bg-blue-50/50",
                    )}
                    onClick={() => void handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "rounded-full border p-2",
                          config.bgColor,
                          config.borderColor,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h4
                            className={cn(
                              "text-sm font-medium",
                              !notification.is_read && "font-semibold",
                            )}
                          >
                            {config.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            {notification.priority === "high" && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.created_at), "HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>

                        <p className="mb-2 text-sm text-muted-foreground">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {notification.client_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(notification.appointment_date), "dd/MM", {
                              locale: ptBR,
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.appointment_time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            contactClient(notification);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {notifications.length > 3 && (
                <div className="border-t bg-muted/20 p-3 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs"
                  >
                    {showAll ? "Ver menos" : `Ver todas (${notifications.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Notificacao</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Gerenciar notificacoes de agendamentos
          </DialogDescription>

          {selectedNotification && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cliente</label>
                  <p className="text-sm font-medium">{selectedNotification.client_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Servico</label>
                  <p className="text-sm font-medium">{selectedNotification.service_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Data</label>
                    <p className="text-sm">
                      {format(new Date(selectedNotification.appointment_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Horario</label>
                    <p className="text-sm">{selectedNotification.appointment_time}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => contactClient(selectedNotification)}
                  className="flex-1 gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contatar Cliente
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (onNotificationClick) {
                      onNotificationClick(selectedNotification.appointment_id);
                    }
                    setDetailsOpen(false);
                  }}
                  className="flex-1 gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Agendamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
