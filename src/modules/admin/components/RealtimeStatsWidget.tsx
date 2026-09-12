/**
 * Widget de estatísticas em tempo real para o dashboard principal do admin.
 */

import {
  Activity,
  AlertTriangle,
  Car,
  CheckCircle,
  DollarSign,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

import { useRealtimeMetrics } from "@/core/admin/hooks/useRealtimeMetrics";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatBrl } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/cn";

const formatCurrency = formatBrl;

export function RealtimeStatsWidget() {
  const { metrics, loading, error } = useRealtimeMetrics();

  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Activity className="h-5 w-5 animate-pulse text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sistema em Tempo Real</h3>
              <p className="text-sm text-muted-foreground">Carregando métricas...</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100/50 shadow-lg dark:from-red-950/50 dark:to-red-900/30">
        <CardContent className="p-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-red-700">Erro nas Métricas</h3>
              <p className="text-sm text-red-600/80">Sistema indisponível</p>
            </div>
          </div>
          <p className="text-xs text-red-600/70">
            Não foi possível carregar as métricas em tempo real
          </p>
        </CardContent>
      </Card>
    );
  }

  const getHealthConfig = (health: string) => {
    switch (health) {
      case "healthy":
        return {
          color: "text-emerald-700 bg-emerald-500/20 border-emerald-500/30",
          text: "Sistema Saudável",
          icon: CheckCircle,
          bgGradient:
            "from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30",
        };
      case "warning":
        return {
          color: "text-amber-700 bg-amber-500/20 border-amber-500/30",
          text: "Atenção Necessária",
          icon: AlertTriangle,
          bgGradient:
            "from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30",
        };
      case "critical":
        return {
          color: "text-red-700 bg-red-500/20 border-red-500/30",
          text: "Situação Crítica",
          icon: AlertTriangle,
          bgGradient:
            "from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30",
        };
      default:
        return {
          color: "text-gray-700 bg-gray-500/20 border-gray-500/30",
          text: "Status Desconhecido",
          icon: AlertTriangle,
          bgGradient:
            "from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/30",
        };
    }
  };

  const healthConfig = getHealthConfig(metrics.systemHealth);
  const HealthIcon = healthConfig.icon;

  return (
    <Card className={cn("border-0 bg-gradient-to-br shadow-lg", healthConfig.bgGradient)}>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sistema ao Vivo</h3>
              <p className="text-sm text-muted-foreground">Métricas em tempo real</p>
            </div>
          </div>
          <Badge className={cn("border font-semibold", healthConfig.color)}>
            <HealthIcon className="mr-1 h-3 w-3" />
            {healthConfig.text.split(" ")[0]}
          </Badge>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500">
                <Users className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Motoristas</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-600">{metrics.driversOnline}</span>
              <span className="text-sm text-muted-foreground">/{metrics.driversTotal}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-emerald-200/50">
              <div
                className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${(metrics.driversOnline / Math.max(metrics.driversTotal, 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500">
                <Car className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Corridas</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-600">{metrics.ridesActive}</span>
              <span className="text-sm text-muted-foreground">+{metrics.ridesPending}</span>
            </div>
            <div className="flex gap-1">
              <div className="h-1.5 flex-1 rounded-full bg-blue-500" />
              <div className="h-1.5 flex-1 rounded-full bg-amber-400" />
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500">
                <DollarSign className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Valor concluído hoje
              </span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(metrics.completedValueToday)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Performance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-amber-600">{metrics.completionRate}%</span>
              <span className="text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  {metrics.avgRating}
                </span>
              </span>
            </div>
          </div>
        </div>

        {(metrics.driversOnline === 0 || metrics.completionRate < 70) && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {metrics.driversOnline === 0
                  ? "Nenhum motorista online"
                  : "Taxa de conclusão baixa"}
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-border/50 pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Atualizado:{" "}
              {new Date(metrics.lastUpdate).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span>Ao vivo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
