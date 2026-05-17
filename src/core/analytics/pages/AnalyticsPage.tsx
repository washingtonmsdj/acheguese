import React from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { logger } from "@/shared/utils/logger";
import { PowerBIEmbed } from "@/shared/components/powerbi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { useAnalyticsAccess } from "@/core/analytics/hooks/useAnalyticsAccess";
import { workOpportunityCirculationAnalyticsService } from "@/core/work-opportunities";
import { workOpportunitiesService } from "@/core/work-opportunities/services/WorkOpportunitiesService";
import type { OpportunityOpenSource, WorkOpportunityType } from "@/core/work-opportunities";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function CirculationDashboardSection() {
  const [days, setDays] = React.useState<"7" | "30" | "60">("30");
  const [source, setSource] = React.useState<"all" | OpportunityOpenSource>("all");
  const [opportunityType, setOpportunityType] = React.useState<"all" | WorkOpportunityType>("all");
  const [professionalCategory, setProfessionalCategory] = React.useState("");
  const [territoryLocationId, setTerritoryLocationId] = React.useState("");
  const [expiringNow, setExpiringNow] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [
      "work-opportunity-circulation-dashboard",
      days,
      source,
      opportunityType,
      professionalCategory,
      territoryLocationId,
    ],
    queryFn: () =>
      workOpportunityCirculationAnalyticsService.getDashboardSnapshot({
        days: Number(days),
        source: source === "all" ? undefined : source,
        opportunityType: opportunityType === "all" ? undefined : opportunityType,
        professionalCategory: professionalCategory || undefined,
        territoryLocationId: territoryLocationId || undefined,
      }),
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Carregando dashboard de circulacao territorial...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de circulação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Select value={days} onValueChange={(value) => setDays(value as "7" | "30" | "60")}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={source} onValueChange={(value) => setSource(value as "all" | OpportunityOpenSource)}>
            <SelectTrigger>
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              <SelectItem value="feed">Feed</SelectItem>
              <SelectItem value="search">Busca</SelectItem>
              <SelectItem value="profile_professions">Perfil profissional</SelectItem>
              <SelectItem value="list">Listagem</SelectItem>
              <SelectItem value="direct">Direto</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={opportunityType}
            onValueChange={(value) => setOpportunityType(value as "all" | WorkOpportunityType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de oportunidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="looking_for_work">Procura trabalho</SelectItem>
              <SelectItem value="offering_work">Oferece trabalho</SelectItem>
              <SelectItem value="freelance">Freela</SelectItem>
              <SelectItem value="quick_job">Diária rápida</SelectItem>
              <SelectItem value="service_availability">Disponibilidade</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={professionalCategory}
            onChange={(event) => setProfessionalCategory(event.target.value)}
            placeholder="Profissão (ex: pedreiro)"
          />
          <Input
            value={territoryLocationId}
            onChange={(event) => setTerritoryLocationId(event.target.value)}
            placeholder="Território ID"
          />
          <Button
            variant="outline"
            disabled={expiringNow}
            onClick={async () => {
              setExpiringNow(true);
              try {
                const result = await workOpportunitiesService.expireStaleOpportunities();
                toast.success(`Varredura concluida: ${result.expiredCount} oportunidades expiradas.`);
              } finally {
                setExpiringNow(false);
              }
            }}
          >
            {expiringNow ? "Executando..." : "Executar expiracao agora"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Circulacao territorial ({data.period_days} dias)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Feed -> detalhe" value={`${data.funnel.rates.feed_to_detail_click_rate}%`} />
          <Metric label="Detalhe -> contato" value={`${data.funnel.rates.detail_to_contact_rate}%`} />
          <Metric label="Contato -> retorno positivo" value={`${data.funnel.rates.contact_to_positive_feedback_rate}%`} />
          <Metric label="Tempo medio ate contato" value={`${data.metrics.avg_minutes_until_contact} min`} />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cliques em oportunidades" value={data.funnel.detail_view} />
        <Metric label="Contatos iniciados" value={data.funnel.contact_started} />
        <Metric label="Retornos positivos" value={data.funnel.positive_feedback} />
        <Metric label="Sem resposta (ativas)" value={data.metrics.opportunities_without_response} />
        <Metric label="Usuarios ativos no fluxo" value={data.metrics.active_users} />
        <Metric label="Taxa de resposta" value={`${data.metrics.response_rate}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias com maior liquidez</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.segments.top_liquidity_categories.length === 0 ? (
              <p className="text-muted-foreground">Sem dados no periodo.</p>
            ) : (
              data.segments.top_liquidity_categories.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span>{item.key}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bairros mais ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.segments.most_active_neighborhoods.length === 0 ? (
              <p className="text-muted-foreground">Sem dados no periodo.</p>
            ) : (
              data.segments.most_active_neighborhoods.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span>{item.key}</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horarios de pico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.observability.peak_hours.length === 0 ? (
              <p className="text-muted-foreground">Sem dados no periodo.</p>
            ) : (
              data.observability.peak_hours.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span>{item.key}</span>
                  <span className="text-muted-foreground">{item.value} eventos</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias com baixa oferta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.observability.empty_or_low_supply_categories.length === 0 ? (
              <p className="text-muted-foreground">Sem dados no periodo.</p>
            ) : (
              data.observability.empty_or_low_supply_categories.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span>{item.key}</span>
                  <span className="text-muted-foreground">oferta: {item.value}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gap demanda x oferta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.observability.demand_offer_gap_categories.length === 0 ? (
              <p className="text-muted-foreground">Sem gap relevante no periodo.</p>
            ) : (
              data.observability.demand_offer_gap_categories.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <span>{item.category}</span>
                  <span className="text-muted-foreground">+{item.gap}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { hasAccess, getAvailableDashboards } = useAnalyticsAccess();
  const availableDashboards = getAvailableDashboards();

  React.useEffect(() => {
    logger.info("Analytics page accessed", {
      component: "AnalyticsPage",
      hasAccess,
      dashboardCount: availableDashboards.length,
    });
  }, [hasAccess, availableDashboards.length]);

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Voce nao tem permissao para acessar os dashboards de analytics.
            Entre em contato com um administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (availableDashboards.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertTitle>Nenhum Dashboard Disponivel</AlertTitle>
          <AlertDescription>
            Nao ha dashboards configurados para o seu perfil no momento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (availableDashboards.length === 1) {
    const dashboard = availableDashboards[0];
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="mt-2 text-muted-foreground">{dashboard.description}</p>
        </div>

        <PowerBIEmbed
          reportUrl={dashboard.url}
          title={dashboard.title}
          height="800px"
          onLoad={() => {
            logger.info("Dashboard loaded", {
              component: "AnalyticsPage",
              dashboardId: dashboard.id,
            });
          }}
          onError={(error) => {
            logger.error("Dashboard load error", error, {
              component: "AnalyticsPage",
              dashboardId: dashboard.id,
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <BarChart3 className="h-8 w-8" />
          Analytics
        </h1>
        <p className="mt-2 text-muted-foreground">
          Visualize dados e metricas em tempo real
        </p>
      </div>

      <CirculationDashboardSection />

      <Tabs defaultValue={availableDashboards[0].id} className="w-full">
        <TabsList>
          {availableDashboards.map((dashboard) => (
            <TabsTrigger key={dashboard.id} value={dashboard.id}>
              {dashboard.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableDashboards.map((dashboard) => (
          <TabsContent key={dashboard.id} value={dashboard.id} className="space-y-4">
            <div className="text-sm text-muted-foreground">{dashboard.description}</div>
            <PowerBIEmbed
              reportUrl={dashboard.url}
              title={dashboard.title}
              height="800px"
              onLoad={() => {
                logger.info("Dashboard loaded", {
                  component: "AnalyticsPage",
                  dashboardId: dashboard.id,
                });
              }}
              onError={(error) => {
                logger.error("Dashboard load error", error, {
                  component: "AnalyticsPage",
                  dashboardId: dashboard.id,
                });
              }}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default AnalyticsPage;
