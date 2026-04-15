/**
 * Dashboard de Métricas do Sistema
 *
 * Exibe métricas de performance, analytics e saúde do sistema
 *
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { usePerformanceMonitor } from "@/shared/utils/monitoring/performance";
import { useAnalytics } from "@/shared/utils/monitoring/analytics";
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
} from "lucide-react";

export function MetricsDashboard() {
  const {
    getReport,
    exportMetrics,
    clear: clearPerformance,
  } = usePerformanceMonitor();
  const { getSessionStats, exportEvents } = useAnalytics();

  const [performanceReport, setPerformanceReport] = useState(getReport());
  const [sessionStats, setSessionStats] = useState(getSessionStats());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setPerformanceReport(getReport());
      setSessionStats(getSessionStats());
    }, 5000); // Atualiza a cada 5 segundos

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setPerformanceReport(getReport());
    setSessionStats(getSessionStats());
  };

  const handleExportPerformance = () => {
    const data = exportMetrics();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
  };

  const handleExportAnalytics = () => {
    const data = exportEvents();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-events-${Date.now()}.json`;
    a.click();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime < 100) return { label: "Excelente", color: "bg-green-500" };
    if (avgTime < 300) return { label: "Bom", color: "bg-blue-500" };
    if (avgTime < 1000) return { label: "Aceitável", color: "bg-yellow-500" };
    return { label: "Lento", color: "bg-red-500" };
  };

  const renderStatus = getPerformanceStatus(
    performanceReport.summary.avgRenderTime,
  );
  const networkStatus = getPerformanceStatus(
    performanceReport.summary.avgNetworkTime,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Dashboard de Métricas
          </h2>
          <p className="text-muted-foreground">
            Monitoramento de performance e analytics em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo de Render
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(performanceReport.summary.avgRenderTime)}
            </div>
            <Badge className={`mt-2 ${renderStatus.color}`}>
              {renderStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Rede</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(performanceReport.summary.avgNetworkTime)}
            </div>
            <Badge className={`mt-2 ${networkStatus.color}`}>
              {networkStatus.label}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceReport.summary.totalInteractions}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Nesta sessão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Duração da Sessão
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(sessionStats.duration)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {sessionStats.session.pageViews} páginas visitadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Detalhes */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="slowest">Operações Lentas</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>
                Análise detalhada de performance do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total de Métricas</span>
                  <span className="text-sm text-muted-foreground">
                    {performanceReport.metrics.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Tempo Médio de Render
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(performanceReport.summary.avgRenderTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Tempo Médio de Rede
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(performanceReport.summary.avgNetworkTime)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportPerformance}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Métricas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics da Sessão</CardTitle>
              <CardDescription>
                Eventos e comportamento do usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ID da Sessão</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {sessionStats.session.id.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total de Eventos</span>
                  <span className="text-sm text-muted-foreground">
                    {sessionStats.totalEvents}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Páginas Visitadas</span>
                  <span className="text-sm text-muted-foreground">
                    {sessionStats.session.pageViews}
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">
                    Eventos por Categoria
                  </span>
                  {Object.entries(sessionStats.eventsByCategory).map(
                    ([category, count]) => (
                      <div
                        key={category}
                        className="flex items-center justify-between pl-4"
                      >
                        <span className="text-xs text-muted-foreground">
                          {category}
                        </span>
                        <Badge variant="secondary">
                          {count as React.ReactNode}
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportAnalytics}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Eventos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slowest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operações Mais Lentas</CardTitle>
              <CardDescription>
                Top 10 operações que precisam de otimização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {performanceReport.summary.slowestOperations.map(
                  (metric, index) => (
                    <div
                      key={`${metric.name}-${metric.timestamp}`}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium">
                          {metric.name}
                        </span>
                      </div>
                      <Badge
                        variant={
                          metric.value > 1000 ? "destructive" : "secondary"
                        }
                      >
                        {formatDuration(metric.value)}
                      </Badge>
                    </div>
                  ),
                )}
                {performanceReport.summary.slowestOperations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Nenhuma operação lenta detectada!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
