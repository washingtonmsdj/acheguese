/**
 * ══════════════════════════════════════════════════════════════════════════
 * NOTIFICATION ITEM COMPONENT
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Item individual de notificação.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Trash2, ExternalLink, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { useNotifications } from '@/core/notifications/hooks/useNotifications';
import { Notification } from '@/core/notifications/services/NotificationService';
import { cn } from '@/shared/utils/cn';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleMarkAsRead = async () => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
  };

  const handleDelete = async () => {
    await deleteNotification.mutateAsync(notification.id);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    if (notification.read) return '';
    
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <Card
      className={cn(
        'transition-colors',
        !notification.read && getBackgroundColor()
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className={cn(
                  'text-sm font-semibold',
                  !notification.read && 'font-bold'
                )}>
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleMarkAsRead}
                    disabled={markAsRead.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDelete}
                  disabled={deleteNotification.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Button */}
            {notification.action_url && notification.action_label && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                asChild
              >
                <a href={notification.action_url}>
                  {notification.action_label}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
