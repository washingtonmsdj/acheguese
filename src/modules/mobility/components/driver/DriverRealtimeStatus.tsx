import React, { useEffect, useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { Wifi, WifiOff, Bell, Activity } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useUnifiedNotifications } from '@/core/notifications/useUnifiedNotifications';

export function DriverRealtimeStatus() {
  const { notifications, unreadCount } = useUnifiedNotifications({
    enableRealtime: true,
    enableToast: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Simular conexão realtime
    setIsConnected(true);

    // Atualizar timestamp quando receber notificação
    if (notifications.length > 0) {
      setLastUpdate(new Date());
    }
  }, [notifications]);

  return (
    <Card className="p-4 bg-[#1E2529] border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-lg",
              isConnected ? "bg-emerald-500/10" : "bg-red-500/10",
            )}
          >
            {isConnected ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                Status Realtime
              </h3>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className={cn(
                  "text-[0.6rem] px-1.5",
                  isConnected && "bg-emerald-500/20 text-emerald-400",
                )}
              >
                {isConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {lastUpdate
                ? `Última atualização: ${lastUpdate.toLocaleTimeString()}`
                : "Aguardando notificações..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Bell className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-sm font-bold text-white">
                {notifications.length}
              </span>
            </div>
            <p className="text-[0.65rem] text-gray-500">Total</p>
          </div>

          {unreadCount > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">
                  {unreadCount}
                </span>
              </div>
              <p className="text-[0.65rem] text-gray-500">Não lidas</p>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de atividade */}
      {isConnected && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
              <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse delay-75" />
              <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse delay-150" />
            </div>
            <span className="text-[0.65rem] text-gray-400">
              Monitorando novos pedidos em tempo real
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
