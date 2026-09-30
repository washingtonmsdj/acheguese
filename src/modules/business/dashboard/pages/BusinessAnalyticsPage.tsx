import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Share2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  getBusinessAnalyticsSummary,
  getMetricChange,
  type BusinessAnalyticsPeriod,
} from "@/core/business/services/business-analytics.service";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";

const PERIOD_OPTIONS: Array<{ value: BusinessAnalyticsPeriod; label: string }> = [
  { value: "week", label: "7 dias" },
  { value: "month", label: "30 dias" },
  { value: "year", label: "12 meses" },
];

export default function BusinessAnalyticsPage() {
  const { business } = useActiveBusinessDashboardContext();
  const [period, setPeriod] = useState<BusinessAnalyticsPeriod>("month");
  const businessDataId = business.business_data_id;
  const metricsQuery = useQuery({
    queryKey: ["business-analytics", businessDataId, period],
    queryFn: () => getBusinessAnalyticsSummary(businessDataId!, period),
    enabled: Boolean(businessDataId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const metrics = metricsQuery.data;
  const cards = metrics ? [
    { label: "Visualizações", value: metrics.views, previous: metrics.previous.views, icon: Eye },
    { label: "Cliques no WhatsApp", value: metrics.whatsappClicks, previous: metrics.previous.whatsappClicks, icon: MessageCircle },
    { label: "Cliques no telefone", value: metrics.phoneClicks, previous: metrics.previous.phoneClicks, icon: Phone },
    { label: "Como chegar", value: metrics.routeClicks, previous: metrics.previous.routeClicks, icon: MapPin },
    { label: "Favoritos", value: metrics.favorites, previous: metrics.previous.favorites, icon: Heart },
    { label: "Compartilhamentos", value: metrics.shares, previous: metrics.previous.shares, icon: Share2 },
  ] : [];

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">Desempenho da empresa</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Acompanhe como as pessoas encontram e interagem com a página pública.</p>
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1" role="group" aria-label="Período das métricas">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold transition-colors ${period === option.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!businessDataId ? (
        <AnalyticsNotice text="As métricas estarão disponíveis quando a página pública estiver vinculada à empresa." />
      ) : metricsQuery.isPending ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-3" aria-label="Carregando métricas">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-muted/50" />)}
        </div>
      ) : metricsQuery.isError ? (
        <AnalyticsNotice text="Não foi possível carregar as métricas agora. Tente novamente mais tarde." />
      ) : (
        <section aria-label="Métricas da empresa" className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-3">
          {cards.map((card) => <MetricCard key={card.label} {...card} />)}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-bold text-foreground">Como interpretar</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Os números mostram interações registradas na página pública. A comparação usa o período imediatamente anterior de mesma duração; nenhum valor é estimado.</p>
      </section>
    </div>
  );
}

function MetricCard({ label, value, previous, icon: Icon }: { label: string; value: number; previous: number; icon: typeof Eye }) {
  const change = getMetricChange(value, previous);
  const TrendIcon = change < 0 ? TrendingDown : change > 0 ? TrendingUp : Minus;
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" aria-hidden="true" /></span>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${change < 0 ? "text-rose-600" : change > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {change > 0 ? "+" : ""}{change.toLocaleString("pt-BR")}%
        </span>
      </div>
      <p className="mt-3 text-xs leading-4 text-muted-foreground sm:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value.toLocaleString("pt-BR")}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Período anterior: {previous.toLocaleString("pt-BR")}</p>
    </article>
  );
}

function AnalyticsNotice({ text }: { text: string }) {
  return <section className="rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">{text}</section>;
}
