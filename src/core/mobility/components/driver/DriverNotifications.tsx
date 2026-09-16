import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Car,
  CheckCircle2,
  DollarSign,
  Loader2,
  Star,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import type { Notification } from "@/core/notifications/services/NotificationService";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import { ptBR } from "@/shared/utils/dateLocale";
import { formatDistanceToNow } from "date-fns";

const typeConfig: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; border: string }
> = {
  ride_request: {
    icon: Car,
    color: "text-category-mobility",
    bg: "bg-category-mobility/12",
    border: "border-category-mobility/30",
  },
  ride_accepted: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/25",
  },
  ride_started: {
    icon: Car,
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/25",
  },
  ride_completed: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/25",
  },
  ride_cancelled: {
    icon: X,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/25",
  },
  payment_received: {
    icon: DollarSign,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/25",
  },
  new_rating: {
    icon: Star,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/25",
  },
  system_alert: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/25",
  },
  default: {
    icon: Bell,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
};

const ITEMS_PER_PAGE = 5;

export function DriverNotifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
  });
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(notifications.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNotifications = notifications.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      void markAsRead(notification.id);
    }
    setSelectedNotif(notification);
  };

  return (
    <>
      <section className="overflow-hidden rounded-xl border bg-card text-card-foreground">
        {unreadCount > 0 ? (
          <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
            <Badge variant="secondary">{unreadCount} não lida{unreadCount === 1 ? "" : "s"}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void markAllAsRead()}
              className="h-7 text-xs"
            >
              Marcar todas como lidas
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Carregando notificações...
          </div>
        ) : error ? (
          <div className="space-y-3 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground">Falha ao carregar notificações</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tente sincronizar novamente.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              Tentar novamente
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto mb-2 h-9 w-9 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Nenhuma notificação</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Novos avisos operacionais aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {currentNotifications.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.default;
              const Icon = config.icon;
              const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ptBR,
              });

              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 transition-colors hover:bg-muted/40",
                    !notification.read && "bg-primary/5",
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    onClick={() => handleNotificationClick(notification)}
                    aria-label={`Abrir notificação: ${notification.title}`}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        config.bg,
                        config.border,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-xs",
                          notification.read
                            ? "font-medium text-muted-foreground"
                            : "font-semibold text-foreground",
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="block text-[0.65rem] text-muted-foreground">{timeAgo}</span>
                    </span>
                    {!notification.read ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Não lida" />
                    ) : null}
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => void deleteNotification(notification.id)}
                    aria-label={`Excluir notificação: ${notification.title}`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              );
            })}

            {totalPages > 1 ? (
              <div className="flex items-center justify-between px-3 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-xs"
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentPage} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs"
                >
                  Próxima
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(selectedNotif)}
        onOpenChange={(open) => {
          if (!open) setSelectedNotif(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotif
                ? (() => {
                    const config =
                      typeConfig[selectedNotif.type] || typeConfig.default;
                    const Icon = config.icon;
                    return (
                      <>
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border",
                            config.bg,
                            config.border,
                          )}
                        >
                          <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
                        </span>
                        <span className="text-sm">{selectedNotif.title}</span>
                      </>
                    );
                  })()
                : null}
            </DialogTitle>
          </DialogHeader>
          {selectedNotif ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{selectedNotif.message}</p>
              <div className="flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(selectedNotif.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void deleteNotification(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="h-7 text-xs text-destructive hover:text-destructive"
                >
                  Excluir
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
