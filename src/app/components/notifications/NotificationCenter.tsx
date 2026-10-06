import { useState } from "react";
import { AlertCircle, Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";
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
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
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
      <Card
        className="border-territory-border bg-territory-surface text-territory-ink shadow-sm"
        aria-busy="true"
      >
        <CardContent className="flex items-center justify-center py-12">
          <Loader2
            className="h-8 w-8 animate-spin text-territory-muted"
            aria-hidden="true"
          />
          <span className="sr-only">Carregando notificações</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-sm">
        <CardContent
          className="flex flex-col items-center gap-4 px-5 py-10 text-center sm:px-8"
          role="alert"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-territory-ink">
              Não foi possível carregar suas notificações
            </h2>
            <p className="mt-1 text-sm text-territory-muted">
              Verifique sua conexão e tente novamente. Sua caixa de entrada não foi tratada como vazia.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised sm:w-auto"
            onClick={() => void refresh()}
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasUnread = (unreadCount || 0) > 0;

  return (
    <Card className="border-territory-border bg-territory-surface text-territory-ink shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Bell className="h-5 w-5 text-territory-brand" />
              Notificações
              {hasUnread && (
                <span className="rounded-full bg-territory-sun px-2 py-0.5 text-xs text-territory-ink">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-territory-muted">
              Suas notificações e atualizações
            </CardDescription>
          </div>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised sm:w-auto"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Marcando...
                </>
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
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as "all" | "unread")}
        >
          <TabsList className="grid w-full grid-cols-2 bg-territory-raised text-territory-muted">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-territory-surface data-[state=active]:text-territory-ink"
            >
              Todas
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="data-[state=active]:bg-territory-surface data-[state=active]:text-territory-ink"
            >
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
