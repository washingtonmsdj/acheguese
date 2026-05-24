import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Minus,
  Navigation,
  Phone,
  Share2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  getBusinessAnalyticsSummary,
  getMetricChange,
  type BusinessAnalyticsPeriod,
} from "@/core/business/services/business-analytics.service";

interface AnalyticsMetric {
  label: string;
  value: number;
  previous: number;
  icon: LucideIcon;
  color: string;
}

interface AnalyticsDashboardProps {
  businessId: string;
}

const PERIOD_LABEL: Record<BusinessAnalyticsPeriod, string> = {
  today: "Hoje",
  week: "7 dias",
  month: "30 dias",
  year: "Ano",
};

function getTrendIcon(change: number) {
  if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function getTrendColor(change: number) {
  if (change > 0) return "text-green-600";
  if (change < 0) return "text-red-600";
  return "text-gray-400";
}

function safeRate(part: number, total: number) {
  if (total <= 0) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

export default function AnalyticsDashboard({
  businessId,
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<BusinessAnalyticsPeriod>("week");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["business-analytics", businessId, period],
    queryFn: () => getBusinessAnalyticsSummary(businessId, period),
    enabled: Boolean(businessId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Não foi possível carregar os dados de analytics.
      </Card>
    );
  }

  const metrics: AnalyticsMetric[] = [
    {
      label: "Visualizações",
      value: data.views,
      previous: data.previous.views,
      icon: Eye,
      color: "text-blue-600",
    },
    {
      label: "Cliques WhatsApp",
      value: data.whatsappClicks,
      previous: data.previous.whatsappClicks,
      icon: MessageCircle,
      color: "text-green-600",
    },
    {
      label: "Cliques telefone",
      value: data.phoneClicks,
      previous: data.previous.phoneClicks,
      icon: Phone,
      color: "text-purple-600",
    },
    {
      label: "Como chegar",
      value: data.routeClicks,
      previous: data.previous.routeClicks,
      icon: Navigation,
      color: "text-orange-600",
    },
    {
      label: "Agendamentos",
      value: data.appointments,
      previous: data.previous.appointments,
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Favoritos",
      value: data.favorites,
      previous: data.previous.favorites,
      icon: Heart,
      color: "text-red-600",
    },
    {
      label: "Compartilhamentos",
      value: data.shares,
      previous: data.previous.shares,
      icon: Share2,
      color: "text-sky-600",
    },
  ];

  const whatsappConversion = safeRate(data.whatsappClicks, data.views);
  const leadConversion = safeRate(data.appointments, data.views);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Desempenho da página com dados reais do período.
          </p>
        </div>

        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as BusinessAnalyticsPeriod)}
        >
          <TabsList>
            {(Object.keys(PERIOD_LABEL) as BusinessAnalyticsPeriod[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {PERIOD_LABEL[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-100 p-3">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">
                  CLIQUES WHATSAPP
                </p>
                <p className="text-xs text-green-600">
                  Intenção direta de contato
                </p>
              </div>
            </div>
            <Badge className="border-green-300 bg-green-100 text-green-800">
              PRIORIDADE
            </Badge>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-green-900">
              {data.whatsappClicks}
            </span>
            <span className="mb-1 text-sm font-medium text-green-700">
              {whatsappConversion}% das visualizações
            </span>
          </div>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">
                CONVERSÃO TOTAL
              </p>
              <p className="text-xs text-blue-600">
                Agendamentos sobre visualizações
              </p>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-blue-900">
              {leadConversion}%
            </span>
            <span className="mb-1 text-sm font-medium text-blue-700">
              {data.appointments} agendamentos
            </span>
          </div>
        </Card>
      </div>

      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-bold text-blue-900">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Funil de contato
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Visualizações", value: data.views, width: 100 },
            {
              label: "Cliques WhatsApp",
              value: data.whatsappClicks,
              width: safeRate(data.whatsappClicks, data.views),
            },
            {
              label: "Agendamentos",
              value: data.appointments,
              width: safeRate(data.appointments, data.views),
            },
          ].map((step) => (
            <div key={step.label} className="text-center">
              <div className="mb-2 h-2 w-full rounded-full bg-blue-200">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${Math.min(step.width, 100)}%` }}
                />
              </div>
              <p className="text-2xl font-bold text-blue-900">{step.value}</p>
              <p className="text-xs text-blue-700">{step.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const change = getMetricChange(metric.value, metric.previous);

          return (
            <Card key={metric.label} className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className={`rounded-lg bg-gray-100 p-2 ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(change)}
                  <span
                    className={`text-xs font-medium ${getTrendColor(change)}`}
                  >
                    {change > 0 && "+"}
                    {change}%
                  </span>
                </div>
              </div>
              <p className="mb-1 text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 font-bold">
          <MessageCircle className="h-5 w-5 text-green-600" />
          Leitura operacional
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            WhatsApp converteu {whatsappConversion}% das visualizações no
            período selecionado.
          </p>
          <p>
            Foram registrados {data.routeClicks} cliques de rota e{" "}
            {data.phoneClicks} cliques de telefone.
          </p>
          {data.views === 0 && (
            <p>
              Ainda não há visualizações registradas para este período. Os
              cards permanecem zerados até o tracking receber eventos reais.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
