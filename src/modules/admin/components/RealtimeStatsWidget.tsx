/**
 * Widget de estatísticas em tempo real para o dashboard principal do admin
 * Mostra métricas críticas de forma compacta
 */

import React from "react";
import {
  Activity,
  Users,
  Car,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { useRealtimeMetrics } from "@/core/admin/hooks/useRealtimeMetrics";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export function RealtimeStatsWidget() {
  const { metrics, loading, error } = useRealtimeMetrics();

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Sistema em Tempo Real
              </h3>
              <p className="text-sm text-muted-foreground">
                Carregando métricas...
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
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
    <Card
      className={cn(
        "border-0 shadow-lg bg-gradient-to-br",
        healthConfig.bgGradient,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sistema ao Vivo</h3>
              <p className="text-sm text-muted-foreground">
                Métricas em tempo real
              </p>
            </div>
          </div>
          <Badge className={cn("font-semibold border", healthConfig.color)}>
            <HealthIcon className="h-3 w-3 mr-1" />
            {healthConfig.text.split(" ")[0]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Motoristas Online */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Users className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Motoristas
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-600">
                {metrics.driversOnline}
              </span>
              <span className="text-sm text-muted-foreground">
                /{metrics.driversTotal}
              </span>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-1.5">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${(metrics.driversOnline / Math.max(metrics.driversTotal, 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Corridas Ativas */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                <Car className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Corridas
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-blue-600">
                {metrics.ridesActive}
              </span>
              <span className="text-sm text-muted-foreground">
                +{metrics.ridesPending}
              </span>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-1.5 bg-blue-500 rounded-full" />
              <div className="flex-1 h-1.5 bg-amber-400 rounded-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Receita Hoje */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Receita
              </span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(metrics.revenueToday)}
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Performance
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-amber-600">
                {metrics.completionRate}%
              </span>
              <span className="text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  {metrics.avgRating}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {(metrics.driversOnline === 0 || metrics.completionRate < 70) && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">
                {metrics.driversOnline === 0
                  ? "Nenhum motorista online"
                  : "Taxa de conclusão baixa"}
              </span>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Atualizado:{" "}
              {new Date(metrics.lastUpdate).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>Ao vivo</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
