/**
 * Dashboard em Tempo Real para Administradores
 * Segue o padrão de layout e cores do sistema admin
 */

import {
  Activity,
  Users,
  Car,
  DollarSign,
  Clock,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  Shield,
  Star,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/cn";
import { useRealtimeMetrics } from "@/core/admin/hooks/useRealtimeMetrics";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";

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
      <div className={cn("h-2 w-2 rounded-full animate-pulse", color)} />
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

const formatCurrency = (value: number) =>
  `R$ ${value.toFixed(2).replace(".", ",")}`;

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
  return (
    colors[status as keyof typeof colors] || "bg-muted text-muted-foreground"
  );
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

  // Validação de admin
  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
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
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            Erro ao carregar métricas
          </h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display mb-0.5 flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Dashboard Tempo Real
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoramento ao vivo do sistema de mobilidade
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <Wifi className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">
                  Conectado
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <WifiOff className="h-3 w-3 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">
                  Reconectando...
                </span>
              </>
            )}
          </div>
          <StatusIndicator status={metrics.systemHealth} />
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.driversOnline}</p>
            <span className="text-xs text-muted-foreground">
              Motoristas Online
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              de {metrics.driversTotal} total
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-sky-500/10 text-sky-600">
                <Car className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.ridesActive}</p>
            <span className="text-xs text-muted-foreground">
              Corridas Ativas
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.ridesPending} aguardando
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(metrics.revenueToday)}
            </p>
            <span className="text-xs text-muted-foreground">Receita Hoje</span>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.ridesToday} corridas
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{metrics.completionRate}%</p>
            <span className="text-xs text-muted-foreground">
              Taxa de Conclusão
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Nota {metrics.avgRating} - {metrics.avgResponseTime}min
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Corridas Ativas - 2 colunas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-4 w-4 text-sky-500" />
                Corridas Ativas ({metrics.ridesActive})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {activeRides.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma corrida ativa no momento</p>
                </div>
              ) : (
                activeRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={cn("text-xs", getStatusColor(ride.status))}
                        >
                          {getStatusText(ride.status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(ride.created_at)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">
                            {ride.passenger_name}
                          </span>
                          <span className="text-muted-foreground">para</span>
                          <span className="font-medium">
                            {ride.driver_name}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{ride.origin}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
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
                      {ride.estimated_duration && (
                        <p className="text-xs text-muted-foreground">
                          ~{ride.estimated_duration}min
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 coluna */}
        <div className="space-y-6">
          {/* Motoristas Online */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                Motoristas Online ({metrics.driversOnline})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {onlineDrivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum motorista online</p>
                </div>
              ) : (
                onlineDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={driver.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {driver.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {driver.name}
                        </p>
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            driver.is_available
                              ? "bg-emerald-500"
                              : "bg-amber-500",
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3" aria-hidden="true" />
                          {driver.rating.toFixed(1)}
                        </span>
                        <span>{driver.total_rides} corridas</span>
                        {driver.vehicle_model && (
                          <span className="truncate">
                            {driver.vehicle_model}
                          </span>
                        )}
                      </div>

                      {driver.vehicle_plate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {driver.vehicle_plate}
                        </p>
                      )}
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
                      {driver.last_location_update && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(driver.last_location_update)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Resumo de Receitas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-violet-500" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Hoje</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(metrics.revenueToday)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-sky-500" />
                  <span className="text-sm font-medium">Semana</span>
                </div>
                <span className="text-sm font-bold text-sky-600">
                  {formatCurrency(metrics.revenueWeek)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-medium">Mês</span>
                </div>
                <span className="text-sm font-bold text-violet-600">
                  {formatCurrency(metrics.revenueMonth)}
                </span>
              </div>

              <div className="pt-3 border-t text-center">
                <p className="text-xs text-muted-foreground">
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
