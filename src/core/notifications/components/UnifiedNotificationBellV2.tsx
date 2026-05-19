/**
 * UnifiedNotificationBellV2
 *
 * Canonical ownership in core/notifications.
 */
import React, { useMemo, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import type { Notification } from "@/core/notifications/services/NotificationService";

const typeConfig: Record<string, { icon: string; color: string; bg: string }> =
  {
    ride_request: { icon: "🚗", color: "text-teal-400", bg: "bg-teal-500/10" },
    ride_accepted: {
      icon: "✅",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    ride_completed: {
      icon: "🏁",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    payment_received: {
      icon: "💰",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    new_rating: {
      icon: "⭐",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    post_like: { icon: "❤️", color: "text-pink-400", bg: "bg-pink-500/10" },
    post_comment: { icon: "💬", color: "text-blue-400", bg: "bg-blue-500/10" },
    mention: { icon: "📢", color: "text-purple-400", bg: "bg-purple-500/10" },
    follow: { icon: "👤", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    badge_earned: {
      icon: "🏆",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    level_up: { icon: "🎉", color: "text-purple-400", bg: "bg-purple-500/10" },
    system_alert: {
      icon: "⚠️",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    promotion: { icon: "🎁", color: "text-pink-400", bg: "bg-pink-500/10" },
    default: { icon: "🔔", color: "text-gray-400", bg: "bg-gray-500/10" },
  };

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const config = typeConfig[notification.type] || typeConfig.default;
  const timeAgo = useMemo(
    () =>
      formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: ptBR,
      }),
    [notification.created_at],
  );

  return (
    <div
      className={cn(
        "group relative border-l-2 p-3 transition-colors hover:bg-white/5",
        notification.read ? "border-transparent" : "border-teal-500",
        notification.priority === "urgent" && "bg-red-500/5",
        notification.priority === "high" && "bg-amber-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-lg",
            config.bg,
          )}
        >
          {config.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "text-sm font-medium",
                notification.read ? "text-gray-400" : "text-white",
              )}
            >
              {notification.title}
            </h4>
            <span className="whitespace-nowrap text-xs text-gray-500">
              {timeAgo}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">
            {notification.message}
          </p>

          {(notification.priority === "high" ||
            notification.priority === "urgent") && (
            <Badge variant="outline" className="mt-1 text-xs">
              {notification.priority === "urgent" ? "🔴 Urgente" : "⚠️ Alta"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!notification.read ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-6 w-6 p-0"
            >
              <Check className="h-3 w-3" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(notification.id)}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnifiedNotificationBellV2() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadNotifications,
  } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: true,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return getUnreadNotifications();
      case "mobility":
        return notifications.filter(
          (n) =>
            n.type.startsWith("ride_") ||
            n.type === "payment_received" ||
            n.type === "new_rating",
        );
      case "community":
        return notifications.filter(
          (n) =>
            n.type.startsWith("post_") ||
            n.type === "mention" ||
            n.type === "follow",
        );
      case "system":
        return notifications.filter(
          (n) =>
            n.type.startsWith("system_") ||
            n.type === "promotion" ||
            n.type === "badge_earned",
        );
      default:
        return notifications;
    }
  }, [activeTab, notifications, getUnreadNotifications]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[400px] border-white/10 bg-[#1E2529] p-0"
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h3 className="font-semibold text-white">Notificacoes</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 text-xs text-teal-400 hover:text-teal-300"
              >
                <CheckCheck className="mr-1 h-3 w-3" />
                Marcar todas
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-10 w-full grid-cols-4 rounded-none border-b border-white/10 bg-transparent">
            <TabsTrigger value="all" className="text-xs">
              Todas
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Nao lidas {unreadCount > 0 ? `(${unreadCount})` : ""}
            </TabsTrigger>
            <TabsTrigger value="mobility" className="text-xs">
              Mobilidade
            </TabsTrigger>
            <TabsTrigger value="community" className="text-xs">
              Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="m-0">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="mx-auto mb-2 h-8 w-8 animate-pulse" />
                  <p className="text-sm">Carregando...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">Nenhuma notificacao</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
