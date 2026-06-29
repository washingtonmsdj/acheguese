import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AtSign,
  Bell,
  Check,
  CheckCircle,
  Heart,
  Info,
  Loader2,
  MessageCircle,
  Trash2,
  UserPlus,
} from "lucide-react";

import { useAppUrls } from "@/core/routing/hooks";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";

import {
  useNotifications,
  type AppNotification,
} from "../hooks/useNotifications";
import { INLINE_STYLES } from "./styles/communityDesignSystem";

type NotificationIcon = typeof Heart;

const notificationIcons: Record<string, NotificationIcon> = {
  like: Heart,
  comment: MessageCircle,
  mention: AtSign,
  alert_nearby: AlertTriangle,
  reply: MessageCircle,
  follow: UserPlus,
  confirmation: CheckCircle,
  system: Info,
};

const notificationColors: Record<string, string> = {
  like: "#EC4899",
  comment: "#06B6D4",
  mention: "#F59E0B",
  alert_nearby: "#EF4444",
  reply: "#06B6D4",
  follow: "#10B981",
  confirmation: "#10B981",
  system: "#6B7280",
};

function getRelativeTime(dateString: string): string {
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
}

function handleNotificationAvatarLabel(notification: AppNotification): string {
  const actorName =
    typeof notification.data?.actor_name === "string"
      ? notification.data.actor_name
      : null;
  return actorName ?? notification.title ?? "Notificação";
}

function handleNotificationAvatarUrl(notification: AppNotification): string | null {
  const avatar =
    typeof notification.data?.actor_avatar === "string"
      ? notification.data.actor_avatar
      : null;
  return avatar;
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const {
    notifications,
    stats,
    isLoading,
    isRefreshing,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-all hover:scale-105 hover:bg-white/10">
          <Bell className="h-4.5 w-4.5 text-gray-400" />
          {stats.total_unread > 0 ? (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {stats.total_unread > 9 ? "9+" : stats.total_unread}
            </span>
          ) : null}
          {isRefreshing ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="h-3 w-3 animate-spin"
                style={{ color: "#4FD1C5" }}
              />
            </div>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] border-0 p-0"
        style={{ backgroundColor: "#1E2529" }}
      >
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <h3 className="text-base font-bold" style={INLINE_STYLES.textPrimary}>
            Notificações
          </h3>
          {stats.total_unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 px-2 text-xs"
              style={{ color: "#4FD1C5" }}
              type="button"
            >
              <Check className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: "#4FD1C5" }}
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Bell className="mb-3 h-12 w-12" style={{ color: "#4B5563" }} />
            <p
              className="text-sm font-medium"
              style={INLINE_STYLES.textSecondary}
            >
              Nenhuma notificação
            </p>
            <p className="mt-1 text-xs" style={INLINE_STYLES.textMuted}>
              Você está em dia.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="py-2">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] ?? Info;
                const iconColor =
                  notificationColors[notification.type] ?? "#6B7280";
                const actorAvatar = handleNotificationAvatarUrl(notification);
                const actorLabel = handleNotificationAvatarLabel(notification);

                return (
                  <div key={notification.id} className="group relative">
                    <button
                      onClick={() => handleNotificationClick(notification)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                      style={{
                        backgroundColor: notification.is_read
                          ? "transparent"
                          : "rgba(79, 209, 197, 0.05)",
                      }}
                      type="button"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${iconColor}20` }}
                      >
                        {actorAvatar ? (
                          <img
                            src={actorAvatar}
                            alt={actorLabel}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <Icon
                            className="h-5 w-5"
                            style={{ color: iconColor }}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm font-medium leading-snug"
                          style={INLINE_STYLES.textPrimary}
                        >
                          {notification.message}
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={INLINE_STYLES.textMuted}
                        >
                          {getRelativeTime(notification.created_at)}
                        </p>
                      </div>

                      {!notification.is_read ? (
                        <div
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: "#4FD1C5" }}
                        />
                      ) : null}
                    </button>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                      title="Remover notificação"
                      type="button"
                    >
                      <Trash2
                        className="h-3.5 w-3.5"
                        style={{ color: "#9CA3AF" }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 0 ? (
          <div
            className="border-t p-3 text-center"
            style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(appUrls.notifications)}
              className="w-full text-xs"
              style={{ color: "#4FD1C5" }}
              type="button"
            >
              Ver todas as notificações
            </Button>
          </div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
