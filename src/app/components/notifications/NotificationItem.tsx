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
import { resolveNotificationActionTarget } from "@/app/config/notificationActionScope";

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

  const actionTarget = resolveNotificationActionTarget(
    notification.action_url,
    notification.action_label,
  );

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-territory-success" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-territory-warning" />;
      case "error":
        return <XCircle className="h-5 w-5 text-territory-error" />;
      default:
        return <Info className="h-5 w-5 text-territory-info" />;
    }
  };

  const getBackgroundColor = () => {
    if (notification.read) return "";

    switch (notification.type) {
      case "success":
        return "bg-territory-success/10 border-territory-success/25";
      case "warning":
        return "bg-territory-warning/10 border-territory-warning/25";
      case "error":
        return "bg-territory-error/10 border-territory-error/25";
      default:
        return "bg-territory-info/10 border-territory-info/25";
    }
  };

  return (
    <Card
      className={cn(
        "border-territory-border bg-territory-surface text-territory-ink transition-colors",
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
                <p className="mt-1 text-sm text-territory-muted">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-territory-muted">
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
                    className="h-8 w-8 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
                    onClick={handleMarkAsRead}
                    disabled={isPending}
                    aria-label="Marcar notificação como lida"
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
                  onClick={handleDelete}
                  disabled={isPending}
                  aria-label="Remover notificação"
                  title="Remover notificação"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {actionTarget && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
                asChild
              >
                <SafeLink href={actionTarget.href} allowInternal>
                  {actionTarget.label}
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
