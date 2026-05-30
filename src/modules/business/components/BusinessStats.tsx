import { useQuery } from "@tanstack/react-query";
import type { ComponentType } from "react";
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  Eye,
  MessageCircle,
  Phone,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import { getRecordValue } from "@/shared/utils/recordLookup";
import {
  getBusinessAnalyticsSummary,
  getMetricChange,
  type BusinessAnalyticsPeriod,
} from "@/core/business/services/business-analytics.service";

type StatItem = {
  label: string;
  value: number | string;
  previous: number;
  icon: ComponentType<{ className?: string }>;
  color: string;
};

interface BusinessStatsProps {
  businessId: string;
  businessName: string;
  isOwner: boolean;
  period?: BusinessAnalyticsPeriod;
}

const PERIOD_LABEL: Record<BusinessAnalyticsPeriod, string> = {
  today: "Hoje",
  week: "Última semana",
  month: "Últimos 30 dias",
  year: "Último ano",
};

function formatChange(current: number, previous: number) {
  const change = getMetricChange(current, previous);
  if (change === 0) return null;

  const isPositive = change > 0;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive ? "text-green-600" : "text-red-600",
      )}
    >
      {isPositive ? "+" : ""}
      {change}%
      <TrendingUp className={cn("h-3 w-3", isPositive ? "" : "rotate-180")} />
    </span>
  );
}

export default function BusinessStats({
  businessId,
  businessName,
  isOwner,
  period = "week",
}: BusinessStatsProps) {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["business-stats", businessId, period],
    queryFn: () => getBusinessAnalyticsSummary(businessId, period),
    enabled: isOwner && Boolean(businessId),
  });

  if (!isOwner) {
    return (
      <Card className="border-2 p-6">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 text-lg font-semibold">Estatísticas</h3>
          <p className="mb-4 text-sm">
            Apenas o dono da empresa pode ver estes dados.
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-2 p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar as estatísticas da empresa.
      </Card>
    );
  }

  const stats: StatItem[] = [
    {
      label: "Visualizações",
      value: data.views,
      previous: data.previous.views,
      icon: Eye,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Cliques WhatsApp",
      value: data.whatsappClicks,
      previous: data.previous.whatsappClicks,
      icon: MessageCircle,
      color: "bg-green-500/10 text-green-600",
    },
    {
      label: "Ligações",
      value: data.phoneClicks,
      previous: data.previous.phoneClicks,
      icon: Phone,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Agendamentos",
      value: data.appointments,
      previous: data.previous.appointments,
      icon: Users,
      color: "bg-orange-500/10 text-orange-600",
    },
  ];

  const maxHourVisits = Math.max(
    ...data.hourlyViews.map((item) => item.visits),
    1,
  );
  const bestHour = data.hourlyViews[0]?.hour ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">
            Estatísticas da Empresa
          </h2>
          <p className="text-sm text-muted-foreground">
            Dados reais de desempenho para {businessName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" disabled>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-2">
          <Calendar className="h-3 w-3" />
          {getRecordValue(PERIOD_LABEL, period) ?? period}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const numericValue =
            typeof stat.value === "number" ? stat.value : Number(stat.value) || 0;

          return (
            <Card
              key={stat.label}
              className="border-2 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={cn("rounded-lg p-2", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {formatChange(numericValue, stat.previous)}
                <span className="text-xs text-muted-foreground">
                  vs. período anterior
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Horários de Pico</h3>
              <p className="text-sm text-muted-foreground">
                Visitas por horário no período selecionado
              </p>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>

          {data.hourlyViews.length > 0 ? (
            <div className="space-y-3">
              {data.hourlyViews.map((hour) => (
                <div key={hour.hour} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{hour.hour}</span>
                    <span>{hour.visits} visitas</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(hour.visits / maxHourVisits) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ainda não há visitas registradas para montar horários de pico.
            </p>
          )}

          {bestHour && (
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Melhor horário observado:
                </span>
                <span className="font-semibold">{bestHour}</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="border-2 border-primary/20 p-6">
          <div className="mb-4 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Leitura do Período</h3>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              A página recebeu {data.views} visualizações e gerou{" "}
              {data.whatsappClicks} cliques no WhatsApp.
            </p>
            <p>
              Foram registrados {data.phoneClicks} cliques de telefone,{" "}
              {data.shares} compartilhamentos e {data.favorites} favoritos.
            </p>
            {data.views === 0 && (
              <p>
                Sem eventos no período. A tela permanece zerada até o tracking
                receber dados reais.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
