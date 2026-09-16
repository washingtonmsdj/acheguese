import { useEffect, useState } from "react";
import { Activity, Bell, Loader2, WifiOff } from "lucide-react";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";

export function DriverRealtimeStatus() {
  const { notifications, unreadCount, loading, error } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      setLastUpdate(new Date());
    }
  }, [notifications]);

  const statusLabel = error
    ? "Com falha"
    : loading
      ? "Sincronizando"
      : "Monitoramento habilitado";

  return (
    <Card className="border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              error ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            }`}
          >
            {error ? (
              <WifiOff className="h-4 w-4" aria-hidden="true" />
            ) : loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Activity className="h-4 w-4" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Notificações em tempo real
              </h3>
              <Badge
                variant={error ? "destructive" : "secondary"}
                className={error ? undefined : "bg-success/10 text-success"}
              >
                {statusLabel}
              </Badge>
            </div>
            <p
              className={`mt-0.5 text-xs ${
                error ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {error
                ? "Não foi possível sincronizar as notificações agora."
                : lastUpdate
                  ? `Última notificação recebida às ${lastUpdate.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Aguardando novas notificações."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 sm:justify-end">
          <div>
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="text-sm font-bold text-foreground">
                {notifications.length}
              </span>
            </div>
            <p className="text-[0.65rem] text-muted-foreground">Carregadas</p>
          </div>

          {unreadCount > 0 ? (
            <div>
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                <span className="text-sm font-bold text-warning">{unreadCount}</span>
              </div>
              <p className="text-[0.65rem] text-muted-foreground">Não lidas</p>
            </div>
          ) : null}
        </div>
      </div>

      {!error && !loading ? (
        <div className="mt-3 border-t pt-3">
          <p className="text-[0.7rem] text-muted-foreground">
            Novas notificações aparecem aqui assim que forem recebidas.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
