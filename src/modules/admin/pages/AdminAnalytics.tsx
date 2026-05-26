import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { getOperationalOverview } from "@/core/admin/services/admin.queries";
import { cn } from "@/shared/utils/cn";

type TrendDirection = "up" | "down" | "neutral";

const TREND_LABELS: Record<string, string> = {
  profiles: "Perfis",
  businesses: "Empresas",
  professionals: "Serviços",
  classifieds: "Classificados",
  events: "Eventos",
  posts: "Posts",
};

function getTrendIcon(direction: TrendDirection) {
  if (direction === "up") return TrendingUp;
  if (direction === "down") return TrendingDown;
  return Activity;
}

function formatRelative(dateIso: string): string {
  const diff = Date.now() - new Date(dateIso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} d`;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [windowDays, setWindowDays] = useState(30);

  const {
    data: overview,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "operational-overview", windowDays],
    queryFn: () => getOperationalOverview(windowDays),
    staleTime: 30_000,
  });

  const coverage = useMemo(() => {
    if (!overview) {
      return {
        healthy: 0,
        attention: 0,
        inactive: 0,
        pendingTotal: 0,
      };
    }

    return overview.modules.reduce(
      (acc, module) => {
        acc.pendingTotal += module.pendingCount;
        if (module.status === "healthy") acc.healthy += 1;
        if (module.status === "attention") acc.attention += 1;
        if (module.status === "inactive") acc.inactive += 1;
        return acc;
      },
      { healthy: 0, attention: 0, inactive: 0, pendingTotal: 0 },
    );
  }, [overview]);

  const trendEntries = useMemo(
    () =>
      Object.entries(overview?.trends ?? {}) as Array<[
        string,
        { value: number; direction: TrendDirection },
      ]>,
    [overview?.trends],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="py-20 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
        <p className="font-semibold">Falha ao carregar analytics operacional</p>
        <Button variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const chartData = overview.activity.slice(-14);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics Operacional</h1>
          <p className="text-sm text-muted-foreground">
            Snapshot real dos módulos administrativos e cobertura ativa
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              size="sm"
              variant={windowDays === days ? "default" : "outline"}
              onClick={() => setWindowDays(days)}
            >
              {days}d
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Registros</p>
            <p className="text-2xl font-bold">{overview.totalRecords.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">Consolidado em {windowDays} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cobertura saudável</p>
            <p className="text-2xl font-bold text-emerald-600">{coverage.healthy}</p>
            <p className="text-xs text-muted-foreground">módulos sem fila crítica</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Em atenção</p>
            <p className="text-2xl font-bold text-amber-600">{coverage.attention}</p>
            <p className="text-xs text-muted-foreground">módulos com pendências</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fila pendente</p>
            <p className="text-2xl font-bold text-foreground">{coverage.pendingTotal}</p>
            <p className="text-xs text-muted-foreground">itens aguardando ação</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cobertura por módulo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {overview.modules.map((module) => (
            <button
              key={module.key}
              type="button"
              onClick={() => navigate(module.route)}
              className="w-full rounded-lg border p-3 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm">{module.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{module.source}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{module.count}</Badge>
                  {module.pendingCount > 0 && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700">
                      {module.pendingCount} pend.
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      module.status === "healthy" && "border-emerald-500/30 text-emerald-700",
                      module.status === "attention" && "border-amber-500/30 text-amber-700",
                      module.status === "inactive" && "border-border text-muted-foreground",
                    )}
                  >
                    {module.status === "healthy" && "Saudável"}
                    {module.status === "attention" && "Atenção"}
                    {module.status === "inactive" && "Inativo"}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendências do período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendEntries.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem tendências calculadas para o período.</p>
            )}
            {trendEntries.map(([key, trend]) => {
              const Icon = getTrendIcon(trend.direction);
              return (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        trend.direction === "up" && "text-emerald-600",
                        trend.direction === "down" && "text-red-600",
                        trend.direction === "neutral" && "text-muted-foreground",
                      )}
                    />
                    <span className="text-sm font-medium">
                      {Object.entries(TREND_LABELS).find(([trendKey]) => trendKey === key)?.[1] ?? key}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {trend.value}% ({trend.direction})
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma atividade recente registrada.</p>
            )}
            {overview.recentActivity.slice(0, 10).map((item, index) => (
              <div key={`${item.type}-${index}`} className="flex items-start justify-between gap-2 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="text-sm line-clamp-2">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatRelative(item.date)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Atividade diária ({Math.min(chartData.length, 14)} dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados de atividade no período.</p>
          ) : (
            <div className="space-y-2">
              {chartData.map((day) => {
                const total = day.posts + day.users + day.businesses + day.eventos + day.classificados;
                const intensity = Math.min(100, total * 5);

                return (
                  <div key={day.date} className="grid grid-cols-[80px_1fr_90px] items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </span>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${intensity}%` }} />
                    </div>
                    <span className="text-xs text-right text-muted-foreground">{total} ações</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex items-center justify-end gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Snapshot gerado {formatRelative(overview.generatedAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              Janela {overview.windowDays}d
            </span>
            {coverage.attention > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" />
                {coverage.attention} módulo(s) em atenção
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
