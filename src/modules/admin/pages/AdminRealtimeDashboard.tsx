/**
 * Dashboard em Tempo Real para Administradores
 * Segue o padrão de layout e cores do sistema admin
 */

import {
  Activity,
  AlertTriangle,
  Car,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Shield,
  Star,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useRealtimeMetrics } from "@/core/admin/hooks/useRealtimeMetrics";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";

const StatusIndicator = ({
  status,
}: {
  status: "healthy" | "warning" | "critical";
}) => {
  const config = {
    healthy: {
      color: "bg-emerald-500",
      text: "Sistema Saudável",
      icon: CheckCircle,
    },
    warning: {
      color: "bg-amber-500",
      text: "Atenção Necessária",
      icon: AlertTriangle,
    },
    critical: {
      color: "bg-red-500",
      text: "Situação Crítica",
      icon: AlertTriangle,
    },
  };

  const currentConfig =
    status === "healthy"
      ? config.healthy
      : status === "warning"
        ? config.warning
        : config.critical;
  const { color, text, icon: Icon } = currentConfig;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-2 animate-pulse rounded-full", color)} />
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

const formatCurrency = formatBrl;

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string) => {
  const colors = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    driver_assigned: "bg-sky-500/10 text-sky-600 border-sky-500/20",
    driver_on_the_way: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    driver_arrived: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    passenger_on_board: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    in_progress: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };
  return colors[status as keyof typeof colors] || "bg-muted text-muted-foreground";
};

const getStatusText = (status: string) => {
  const texts = {
    pending: "Aguardando",
    driver_assigned: "Motorista Aceito",
    driver_on_the_way: "A Caminho",
    driver_arrived: "Chegou",
    passenger_on_board: "Embarcou",
    in_progress: "Em Andamento",
  };
  return texts[status as keyof typeof texts] || status;
};

export default function AdminRealtimeDashboard() {
  const { canModerate, isChecking } = useAdminGuard();
  const {
    metrics,
    activeRides,
    onlineDrivers,
    loading,
    error,
    refetch,
    isConnected,
  } = useRealtimeMetrics();

  if (!isChecking && !canModerate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F14] p-4">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Erro ao carregar métricas</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-0.5 flex items-center gap-2 font-display text-2xl font-bold">
            <Activity className="h-6 w-6 text-primary" />
            Dashboard Tempo Real
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento ao vivo do sistema de mobilidade
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            {isConnected ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                <Wifi className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Conectado</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <WifiOff className="h-3 w-3 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Reconectando...</span>
              </>
            )}
          </div>
          <StatusIndicator status={metrics.systemHealth} />
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="border">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.driversOnline}</p>
            <span className="text-xs text-muted-foreground">Motoristas Online</span>
            <p className="mt-1 text-xs text-muted-foreground">
              de {metrics.driversTotal} total
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                <Car className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.ridesActive}</p>
            <span className="text-xs text-muted-foreground">Corridas Ativas</span>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.ridesPending} aguardando motorista
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(metrics.completedValueToday)}
            </p>
            <span className="text-xs text-muted-foreground">Valor Concluído Hoje</span>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.ridesToday} corridas criadas hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.completionRate}%</p>
            <span className="text-xs text-muted-foreground">Taxa de Conclusão</span>
            <p className="mt-1 text-xs text-muted-foreground">
              Nota {metrics.avgRating} - {metrics.avgResponseTime}min
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-4 w-4 text-sky-500" />
                Corridas Ativas ({metrics.ridesActive})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-3 overflow-y-auto">
              {activeRides.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Car className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">Nenhuma corrida ativa no momento</p>
                </div>
              ) : (
                activeRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-start gap-3 rounded-lg border bg-card/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge className={cn("text-xs", getStatusColor(ride.status))}>
                          {getStatusText(ride.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(ride.created_at)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{ride.passenger_name}</span>
                          <span className="text-muted-foreground">para</span>
                          <span className="font-medium">{ride.driver_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{ride.origin}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            <span className="truncate">{ride.destination}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        {formatCurrency(ride.current_price)}
                      </p>
                      {ride.estimated_duration ? (
                        <p className="text-xs text-muted-foreground">
                          ~{ride.estimated_duration}min
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-emerald-500" />
                Motoristas Online ({metrics.driversOnline})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-3 overflow-y-auto">
              {onlineDrivers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">Nenhum motorista online</p>
                </div>
              ) : (
                onlineDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center gap-3 rounded-lg border bg-card/50 p-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={driver.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {driver.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{driver.name}</p>
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            driver.is_available ? "bg-emerald-500" : "bg-amber-500",
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3" aria-hidden="true" />
                          {driver.rating.toFixed(1)}
                        </span>
                        <span>{driver.total_rides} corridas</span>
                        {driver.vehicle_model ? (
                          <span className="truncate">{driver.vehicle_model}</span>
                        ) : null}
                      </div>

                      {driver.vehicle_plate ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {driver.vehicle_plate}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          driver.is_available
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600",
                        )}
                      >
                        {driver.is_available ? "Disponível" : "Ocupado"}
                      </Badge>
                      {driver.last_location_update ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTime(driver.last_location_update)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-violet-500" />
                Valores de Corridas Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Hoje</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(metrics.completedValueToday)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">Últimos 7 dias</span>
                </div>
                <span className="text-sm font-bold text-sky-600">
                  {formatCurrency(metrics.completedValueWeek)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium">Últimos 30 dias</span>
                </div>
                <span className="text-sm font-bold text-violet-600">
                  {formatCurrency(metrics.completedValueMonth)}
                </span>
              </div>

              <div className="border-t pt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Valores de `final_price`/`actual_fare`; não representam receita líquida da plataforma.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Última atualização: {formatTime(metrics.lastUpdate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
