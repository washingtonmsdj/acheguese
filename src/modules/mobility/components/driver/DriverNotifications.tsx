import React, { useState } from "react";
import {
  Bell,
  Car,
  DollarSign,
  Star,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Package,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";
import { useUnifiedNotifications } from '@/core/notifications/useUnifiedNotifications';
import type { Notification } from '@/core/notifications/types';
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig: Record<
  string,
  { icon: any; color: string; bg: string; border: string }
> = {
  ride_request: {
    icon: Car,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
  },
  ride_accepted: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  ride_started: {
    icon: Car,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  ride_completed: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  ride_cancelled: {
    icon: X,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  payment_received: {
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  new_rating: {
    icon: Star,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  system_alert: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  default: {
    icon: Bell,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
  },
};

export function DriverNotifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
  });
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    setSelectedNotif(notif);
  };

  return (
    <>
      <div className="rounded-xl border border-white/10 bg-[#1E2529] overflow-hidden">
        {unreadCount > 0 && (
          <div className="flex items-center justify-end p-1.5 border-b border-white/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-gray-400 hover:text-white h-6"
            >
              Marcar lidas
            </Button>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-10 w-10 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nenhuma notificação</p>
            </div>
          ) : (
            <>
              {currentNotifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.default;
                const Icon = config.icon;
                const timeAgo = formatDistanceToNow(
                  new Date(notif.created_at),
                  {
                    addSuffix: true,
                    locale: ptBR,
                  },
                );

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "p-1.5 hover:bg-white/5 transition-colors cursor-pointer",
                      !notif.read && "bg-teal-500/5",
                    )}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "rounded-md p-1 flex-shrink-0",
                          config.bg,
                        )}
                      >
                        <Icon className={cn("h-3 w-3", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-xs font-semibold truncate",
                            notif.read ? "text-gray-300" : "text-white",
                          )}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[0.6rem] text-gray-500 flex-shrink-0">
                          {timeAgo}
                        </span>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-1.5 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-6 text-xs"
                  >
                    Anterior
                  </Button>
                  <span className="text-xs text-gray-400">
                    {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-6 text-xs"
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Dialog
        open={!!selectedNotif}
        onOpenChange={() => setSelectedNotif(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotif &&
                (() => {
                  const config =
                    typeConfig[selectedNotif.type] || typeConfig.default;
                  const Icon = config.icon;
                  return (
                    <>
                      <div className={cn("rounded-md p-1.5", config.bg)}>
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                      </div>
                      <span className="text-sm">{selectedNotif.title}</span>
                    </>
                  );
                })()}
            </DialogTitle>
          </DialogHeader>
          {selectedNotif && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {selectedNotif.message}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
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
                    deleteNotification(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="h-6 text-xs"
                >
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
