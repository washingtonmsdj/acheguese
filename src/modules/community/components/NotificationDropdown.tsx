import React from "react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu";
import { useAppUrls } from "@/core/routing/hooks";
import { useNotifications } from "../hooks/useNotifications";
import { Bell, Check, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const relativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-all hover:scale-105 hover:bg-white/10">
          <Bell className="h-4.5 w-4.5 text-gray-400" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] border-0 bg-[#1E2529] p-0">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h3 className="text-base font-bold text-white">Notificacoes</h3>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 px-2 text-xs text-teal-300">
              <Check className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">Nenhuma notificacao</div>
        ) : (
          <ScrollArea className="h-[380px]">
            <div className="py-2">
              {notifications.map((notification) => (
                <div key={notification.id} className="group relative px-4 py-3 hover:bg-white/5">
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="w-full text-left"
                    style={{ opacity: notification.read ? 0.8 : 1 }}
                  >
                    <p className="text-sm font-medium text-white">{notification.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{relativeTime(notification.created_at)}</p>
                  </button>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 0 ? (
          <div className="border-t border-white/10 p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => navigate(appUrls.notifications)} className="w-full text-xs text-teal-300">
              Ver todas as notificacoes
            </Button>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
