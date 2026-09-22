/**
 * Dashboard em Tempo Real para Administradores
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
  Star,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useRealtimeMetrics } from "@/core/admin/hooks/useRealtimeMetrics";
import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { StatusBadge } from "@/core/mobility/components/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";

const SYSTEM_HEALTH = {
  healthy: {
    dot: "bg-success",
    text: "Sistema saudável",
    icon: CheckCircle,
    iconClass: "text-success",
  },
  warning: {
    dot: "bg-warning",
    text: "Atenção necessária",
    icon: AlertTriangle,
    iconClass: "text-warning",
  },
  critical: {
    dot: "bg-destructive",
    text: "Situação crítica",
    icon: AlertTriangle,
    iconClass: "text-destructive",
  },
} as const;

function StatusIndicator({
  status,
}: {
  status: "healthy" | "warning" | "critical";
}) {
  const config = SYSTEM_HEALTH[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2 w-2 animate-pulse rounded-full", config.dot)} />
      <Icon className={cn("h-4 w-4", config.iconClass)} aria-hidden="true" />
      <span className="text-sm font-medium text-foreground">{config.text}</span>
    </div>
  );
}

const formatCurrency = formatBrl;

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    return <AdminAccessDenied />;
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center py-20" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Carregando dashboard em tempo real</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Erro ao carregar métricas</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="mb-0.5 flex items-center gap-2 font-display text-2xl font-bold">
            <Activity className="h-6 w-6 text-primary" aria-hidden="true" />
            Dashboard em tempo real
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento ao vivo do sistema de mobilidade.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
            {isConnected ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <Wifi className="h-3 w-3 text-success" aria-hidden="true" />
                <span className="text-xs font-medium text-success">Conectado</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-warning" />
                <WifiOff className="h-3 w-3 text-warning" aria-hidden="true" />
                <span className="text-xs font-medium text-warning">Reconectando...</span>
              </>
            )}
          </div>
          <StatusIndicator status={metrics.systemHealth} />
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            aria-label="Atualizar métricas"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          iconClassName="bg-success/10 text-success"
          value={metrics.driversOnline}
          label="Motoristas online"
          detail={`de ${metrics.driversTotal} total`}
        />
        <MetricCard
          icon={Car}
          iconClassName="bg-info/10 text-info"
          value={metrics.ridesActive}
          label="Corridas ativas"
          detail={`${metrics.ridesPending} aguardando motorista`}
        />
        <MetricCard
          icon={DollarSign}
          iconClassName="bg-primary/10 text-primary"
          value={formatCurrency(metrics.completedValueToday)}
          label="Valor concluído hoje"
          detail={`${metrics.ridesToday} corridas criadas hoje`}
        />
        <MetricCard
          icon={TrendingUp}
          iconClassName="bg-warning/10 text-warning"
          value={`${metrics.completionRate}%`}
          label="Taxa de conclusão"
          detail={`Nota ${metrics.avgRating} · resposta ${
            metrics.avgResponseTime === null
              ? "sem amostra"
              : `${metrics.avgResponseTime}min`
          }`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-4 w-4 text-info" aria-hidden="true" />
                Corridas ativas ({metrics.ridesActive})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-3 overflow-y-auto">
              {activeRides.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Car className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                  <p className="text-sm">Nenhuma corrida ativa no momento</p>
                </div>
              ) : (
                activeRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <StatusBadge status={ride.status} size="sm" />
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
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            <span className="truncate">{ride.origin}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <Navigation className="h-3 w-3" aria-hidden="true" />
                            <span className="truncate">{ride.destination}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">
                        {formatCurrency(ride.current_price)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-success" aria-hidden="true" />
                Motoristas online ({metrics.driversOnline})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-3 overflow-y-auto">
              {onlineDrivers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-50" aria-hidden="true" />
                  <p className="text-sm">Nenhum motorista online</p>
                </div>
              ) : (
                onlineDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
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
                            driver.is_available ? "bg-success" : "bg-warning",
                          )}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                        variant="outline"
                        className={
                          driver.is_available
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-warning/30 bg-warning/10 text-warning"
                        }
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

          <Card className="border-border bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-primary" aria-hidden="true" />
                Valores de corridas concluídas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ValueRow
                icon={Clock}
                iconClassName="text-success"
                label="Hoje"
                value={formatCurrency(metrics.completedValueToday)}
                valueClassName="text-success"
              />
              <ValueRow
                icon={TrendingUp}
                iconClassName="text-info"
                label="Últimos 7 dias"
                value={formatCurrency(metrics.completedValueWeek)}
                valueClassName="text-info"
              />
              <ValueRow
                icon={Activity}
                iconClassName="text-primary"
                label="Últimos 30 dias"
                value={formatCurrency(metrics.completedValueMonth)}
                valueClassName="text-primary"
              />

              <div className="border-t border-border pt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Valores concluídos; não representam receita líquida da plataforma.
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

function MetricCard({
  icon: Icon,
  iconClassName,
  value,
  label,
  detail,
}: {
  icon: typeof Users;
  iconClassName: string;
  value: string | number;
  label: string;
  detail: string;
}) {
  return (
    <Card className="border-border bg-card text-card-foreground">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconClassName)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ValueRow({
  icon: Icon,
  iconClassName,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Clock;
  iconClassName: string;
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className={cn("text-sm font-bold", valueClassName)}>{value}</span>
    </div>
  );
}
