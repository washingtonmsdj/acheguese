 
import React from "react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import { useNotifications } from "../hooks/useNotifications";
import { Notification, NotificationType } from "@/shared/types/notification";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
import {
  Bell,
  Heart,
  MessageCircle,
  AtSign,
  AlertTriangle,
  UserPlus,
  CheckCircle,
  Info,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Dropdown profissional de notificações
 *
 * Features:
 * - Lista de notificações com scroll
 * - Ícones por tipo
 * - Marcar como lida ao clicar
 * - Marcar todas como lidas
 * - Deletar notificação
 * - Badge com contagem
 * - Auto-refresh
 * - Loading states
 */

const notificationIcons: Record<NotificationType, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  mention: AtSign,
  alert_nearby: AlertTriangle,
  reply: MessageCircle,
  follow: UserPlus,
  confirmation: CheckCircle,
  system: Info,
};

const notificationColors: Record<NotificationType, string> = {
  like: "#EC4899",
  comment: "#06B6D4",
  mention: "#F59E0B",
  alert_nearby: "#EF4444",
  reply: "#06B6D4",
  follow: "#10B981",
  confirmation: "#10B981",
  system: "#6B7280",
};

export function NotificationDropdown() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const {
    notifications,
    stats,
    isLoading,
    isRefreshing,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navegar para o destino
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105">
          <Bell className="h-4.5 w-4.5 text-gray-400" />
          {stats.total_unread > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {stats.total_unread > 9 ? "9+" : stats.total_unread}
            </span>
          )}
          {isRefreshing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="w-3 h-3 animate-spin"
                style={{ color: "#4FD1C5" }}
              />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0 border-0"
        style={{ backgroundColor: "#1E2529" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <h3 className="font-bold text-base" style={INLINE_STYLES.textPrimary}>
            Notificações
          </h3>
          {stats.total_unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 px-2 text-xs"
              style={{ color: "#4FD1C5" }}
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Lista de notificações */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="w-6 h-6 animate-spin"
              style={{ color: "#4FD1C5" }}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="w-12 h-12 mb-3" style={{ color: "#4B5563" }} />
            <p
              className="text-sm font-medium"
              style={INLINE_STYLES.textSecondary}
            >
              Nenhuma notificação
            </p>
            <p className="text-xs mt-1" style={INLINE_STYLES.textMuted}>
              Você está em dia!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="py-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const iconColor = notificationColors[notification.type];

                return (
                  <div key={notification.id} className="group relative">
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors text-left"
                      style={{
                        backgroundColor: notification.is_read
                          ? "transparent"
                          : "rgba(79, 209, 197, 0.05)",
                      }}
                    >
                      {/* Ícone */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${iconColor}20` }}
                      >
                        {notification.actor_avatar ? (
                          <img
                            src={notification.actor_avatar}
                            alt={notification.actor_name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <Icon
                            className="w-5 h-5"
                            style={{ color: iconColor }}
                          />
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium leading-snug"
                          style={INLINE_STYLES.textPrimary}
                        >
                          {notification.message}
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={INLINE_STYLES.textMuted}
                        >
                          {getRelativeTime(notification.created_at)}
                        </p>
                      </div>

                      {/* Indicador de não lida */}
                      {!notification.is_read && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                          style={{ backgroundColor: "#4FD1C5" }}
                        />
                      )}
                    </button>

                    {/* Botão de delete (aparece no hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-white/10"
                      title="Remover notificação"
                    >
                      <Trash2
                        className="w-3.5 h-3.5"
                        style={{ color: "#9CA3AF" }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            className="p-3 border-t text-center"
            style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(appUrls.notifications)} // ✅ SSOT
              className="w-full text-xs"
              style={{ color: "#4FD1C5" }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
