import { useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationCenter() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useUnifiedNotifications({
      filters: {
        read: filter === "unread" ? false : undefined,
        limit: 50,
      },
      enableToast: false,
    });

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setPendingNotificationId(notificationId);
    try {
      await markAsRead(notificationId);
    } finally {
      setPendingNotificationId(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setPendingNotificationId(notificationId);
    try {
      await deleteNotification(notificationId);
    } finally {
      setPendingNotificationId(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-territory-muted" />
        </CardContent>
      </Card>
    );
  }

  const hasUnread = (unreadCount || 0) > 0;

  return (
    <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-territory-brand" />
              Notificações
              {hasUnread && (
                <span className="ml-2 rounded-full bg-territory-sun px-2 py-0.5 text-xs text-territory-ink">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-territory-muted">Suas notificações e atualizações</CardDescription>
          </div>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar todas como lidas
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList className="grid w-full grid-cols-2 bg-territory-raised text-territory-muted">
            <TabsTrigger value="all" className="data-[state=active]:bg-territory-surface data-[state=active]:text-territory-ink">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="data-[state=active]:bg-territory-surface data-[state=active]:text-territory-ink">
              Não lidas {hasUnread && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            {!notifications || notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-4 h-12 w-12 text-territory-muted" />
                <p className="text-territory-muted">
                  {filter === "unread"
                    ? "Nenhuma notificação não lida"
                    : "Nenhuma notificação"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    isPending={pendingNotificationId === notification.id}
                    onDelete={handleDelete}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
