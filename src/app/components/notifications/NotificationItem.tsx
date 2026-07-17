import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import {
  Check,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import type { Notification } from "@/core/notifications";
import { cn } from "@/shared/utils/cn";
import { SafeLink } from "@/shared/components/security";

interface NotificationItemProps {
  notification: Notification;
  isPending: boolean;
  onDelete: (notificationId: string) => Promise<void>;
  onMarkAsRead: (notificationId: string) => Promise<void>;
}

export function NotificationItem({
  notification,
  isPending,
  onDelete,
  onMarkAsRead,
}: NotificationItemProps) {
  const handleMarkAsRead = async () => {
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
  };

  const handleDelete = async () => {
    await onDelete(notification.id);
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    if (notification.read) return "";

    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card
      className={cn(
        "transition-colors",
        !notification.read && getBackgroundColor(),
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{getIcon()}</div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4
                  className={cn(
                    "text-sm font-semibold",
                    !notification.read && "font-bold",
                  )}
                >
                  {notification.title}
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleMarkAsRead}
                    disabled={isPending}
                    aria-label="Marcar notificacao como lida"
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDelete}
                  disabled={isPending}
                  aria-label="Remover notificacao"
                  title="Remover notificacao"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {notification.action_url && notification.action_label && (
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <SafeLink href={notification.action_url} allowInternal>
                  {notification.action_label}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </SafeLink>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
