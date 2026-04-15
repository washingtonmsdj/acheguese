import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { TrendIndicator, TrendData } from "./TrendIndicator";
import { Users, MessageSquare, Heart, Eye, TrendingUp } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface EngagementMetric {
  label: string;
  value: number;
  icon: any;
  color: string;
  trend?: TrendData;
  suffix?: string;
}

interface EngagementMetricsProps {
  metrics: EngagementMetric[];
  loading?: boolean;
}

export function EngagementMetrics({ metrics, loading }: EngagementMetricsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas de Engajamento
          </CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Métricas de Engajamento
        </CardTitle>
        <CardDescription>
          Indicadores de atividade e interação dos usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center",
                    metric.color,
                  )}
                >
                  <metric.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">
                    {metric.value.toLocaleString("pt-BR")}
                    {metric.suffix && (
                      <span className="text-sm text-muted-foreground ml-1">
                        {metric.suffix}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {metric.trend && (
                <TrendIndicator trend={metric.trend} size="md" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook para calcular métricas de engajamento
export function useEngagementMetrics() {
  // TODO: Implementar cálculo real de métricas
  const metrics: EngagementMetric[] = [
    {
      label: "Usuários Ativos (7d)",
      value: 0,
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
      trend: { value: 0, direction: "neutral", period: "vs semana passada" },
    },
    {
      label: "Comentários por Dia",
      value: 0,
      icon: MessageSquare,
      color: "bg-orange-500/10 text-orange-600",
      trend: { value: 0, direction: "neutral", period: "vs semana passada" },
      suffix: "/dia",
    },
    {
      label: "Curtidas por Dia",
      value: 0,
      icon: Heart,
      color: "bg-rose-500/10 text-rose-600",
      trend: { value: 0, direction: "neutral", period: "vs semana passada" },
      suffix: "/dia",
    },
    {
      label: "Visualizações Totais",
      value: 0,
      icon: Eye,
      color: "bg-purple-500/10 text-purple-600",
      trend: { value: 0, direction: "neutral", period: "vs semana passada" },
    },
  ];

  return { metrics, loading: false };
}
