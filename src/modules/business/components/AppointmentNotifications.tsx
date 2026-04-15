import React, { useState, useEffect } from "react";
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
  Phone,
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

interface AppointmentNotification {
  id: string;
  type: "new_appointment" | "appointment_cancelled" | "appointment_reminder";
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
};

export default function AppointmentNotifications({
  businessId,
  isOwner,
  onNotificationClick,
}: AppointmentNotificationsProps) {
  const [notifications, setNotifications] = useState<AppointmentNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<AppointmentNotification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!isOwner) {
      setLoading(false);
      return;
    }

    // TODO: Implementar query real do Supabase
    setTimeout(() => {
      const mockNotifications: AppointmentNotification[] = [];
      setNotifications(mockNotifications);
      setLoading(false);
    }, 800);
  }, [businessId, isOwner]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayNotifications = showAll
    ? notifications
    : notifications.slice(0, 3);

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Todas as notificações foram marcadas como lidas");
  };

  const handleNotificationClick = (notification: AppointmentNotification) => {
    if (!notification.is_read) markAsRead(notification.id);

    if (onNotificationClick) {
      onNotificationClick(notification.appointment_id);
    } else {
      setSelectedNotification(notification);
      setDetailsOpen(true);
    }
  };

  const contactClient = (notification: AppointmentNotification) => {
    const message = `Olá ${notification.client_name}! Sobre seu agendamento de ${notification.service_name} para ${format(new Date(notification.appointment_date), "dd/MM/yyyy", { locale: ptBR })} às ${notification.appointment_time}.`;
    window.open(
      `https://wa.me/${notification.client_phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  if (!isOwner) return null;

  if (loading) {
    return (
      <Card className="p-4 border-2">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">
            Carregando notificações...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-semibold">Notificações de Agendamentos</h3>
                <p className="text-xs text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} não lidas` : "Todas lidas"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                  <CheckCircle className="h-3 w-3 mr-1" />
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
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhuma notificação ainda</p>
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
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.is_read &&
                        "bg-blue-50/50 border-l-4 border-l-blue-500",
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-full border",
                          config.bgColor,
                          config.borderColor,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
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
                              {format(
                                new Date(notification.created_at),
                                "HH:mm",
                                { locale: ptBR },
                              )}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {notification.client_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(
                              new Date(notification.appointment_date),
                              "dd/MM",
                              { locale: ptBR },
                            )}
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
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {notifications.length > 3 && (
                <div className="p-3 text-center border-t bg-muted/20">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs"
                  >
                    {showAll
                      ? "Ver menos"
                      : `Ver todas (${notifications.length})`}
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
            <DialogTitle>Detalhes da Notificação</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Gerenciar notificações de agendamentos
          </DialogDescription>

          {selectedNotification &&
            (() => {
              const config = NOTIFICATION_CONFIG[selectedNotification.type];
              const Icon = config.icon;
              return (
                <div className="space-y-4">
                  <div className="text-center">
                    <div
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border",
                        config.bgColor,
                        config.borderColor,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} />
                      {config.title}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedNotification.message}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Cliente
                        </label>
                        <p className="text-sm font-medium">
                          {selectedNotification.client_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Telefone
                        </label>
                        <p className="text-sm">
                          {selectedNotification.client_phone}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Serviço
                      </label>
                      <p className="text-sm font-medium">
                        {selectedNotification.service_name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Data
                        </label>
                        <p className="text-sm">
                          {format(
                            new Date(selectedNotification.appointment_date),
                            "dd/MM/yyyy",
                            { locale: ptBR },
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Horário
                        </label>
                        <p className="text-sm">
                          {selectedNotification.appointment_time}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Recebida em
                      </label>
                      <p className="text-sm">
                        {format(
                          new Date(selectedNotification.created_at),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR },
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
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
                        if (onNotificationClick)
                          onNotificationClick(
                            selectedNotification.appointment_id,
                          );
                        setDetailsOpen(false);
                      }}
                      className="flex-1 gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Agendamento
                    </Button>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
