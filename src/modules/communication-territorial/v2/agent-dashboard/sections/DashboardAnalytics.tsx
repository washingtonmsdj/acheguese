import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { TrendingUp, Eye, Users, MessageSquare, Share2, MapPin } from "lucide-react";
import type { DashboardChannelView, DashboardPublicationView } from "../../types/agentDashboardViewModels";

interface DashboardAnalyticsProps {
  channel: DashboardChannelView;
  publications: DashboardPublicationView[];
}

export function DashboardAnalytics({ channel, publications }: DashboardAnalyticsProps) {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Métricas e insights do canal
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Visualizações Totais</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>Últimos 30 dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Alcance Territorial</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Pessoas alcançadas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Engajamento</CardDescription>
            <CardTitle className="text-3xl">0%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Taxa de interação</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho ao Longo do Tempo</CardTitle>
          <CardDescription>Visualizações e engajamento nos últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center space-y-2">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Gráfico de analytics em desenvolvimento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Publications */}
      <Card>
        <CardHeader>
          <CardTitle>Publicações Mais Populares</CardTitle>
          <CardDescription>Top 5 publicações por visualizações</CardDescription>
        </CardHeader>
        <CardContent>
          {publications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma publicação ainda
            </div>
          ) : (
            <div className="space-y-4">
              {publications.slice(0, 5).map((pub, index) => (
                <div key={pub.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{pub.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pub.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground sm:ml-auto">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>0</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
