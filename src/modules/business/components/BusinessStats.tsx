import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Eye,
  MessageCircle,
  Phone,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  BarChart3,
  Download,
  RefreshCw,
  Share2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
type StatItem = {
  label: string;
  value: number | string;
  change?: number; // percentual de mudança
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

interface BusinessStatsProps {
  businessId: string;
  businessName: string;
  isOwner: boolean;
  period?: "today" | "week" | "month" | "year";
}

export default function BusinessStats({
  businessId,
  businessName,
  isOwner,
  period = "week",
}: BusinessStatsProps) {
  // Dados mockados - em produção viriam do banco de dados
  const stats: StatItem[] = [
    {
      label: "Visualizações",
      value: "1.2k",
      change: 12,
      icon: Eye,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Cliques WhatsApp",
      value: 48,
      change: 8,
      icon: MessageCircle,
      color: "bg-green-500/10 text-green-600",
    },
    {
      label: "Ligações",
      value: 23,
      change: -3,
      icon: Phone,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Novos Clientes",
      value: 15,
      change: 25,
      icon: Users,
      color: "bg-orange-500/10 text-orange-600",
    },
  ];

  const topProducts = [
    { name: "Hambúrguer Especial", views: 156, clicks: 32 },
    { name: "Refrigerante 2L", views: 98, clicks: 18 },
    { name: "Batata Frita", views: 87, clicks: 15 },
    { name: "Sorvete Casquinha", views: 65, clicks: 12 },
  ];

  const peakHours = [
    { hour: "12:00", visits: 45 },
    { hour: "13:00", visits: 52 },
    { hour: "18:00", visits: 38 },
    { hour: "19:00", visits: 41 },
  ];

  const formatChange = (change?: number) => {
    if (!change) {
      return null;
    }
    const isPositive = change > 0;
    return (
      <span
        className={cn(
          "text-xs font-medium flex items-center gap-1",
          isPositive ? "text-green-600" : "text-red-600",
        )}
      >
        {isPositive ? "+" : ""}
        {change}%
        <TrendingUp className={cn("h-3 w-3", isPositive ? "" : "rotate-180")} />
      </span>
    );
  };

  if (!isOwner) {
    return (
      <Card className="p-6 border-2">
        <div className="text-center text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <h3 className="font-semibold text-lg mb-2">Estatísticas</h3>
          <p className="text-sm mb-4">
            Apenas o dono da business pode ver as estatísticas
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display">
            Estatísticas da Empresa
          </h2>
          <p className="text-sm text-muted-foreground">
            Dados de desempenho da sua página
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Período */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-2">
          <Calendar className="h-3 w-3" />
          Última semana
        </Badge>
        <div className="flex-1" />
        <Button variant="ghost" size="sm">
          Hoje
        </Button>
        <Button variant="ghost" size="sm">
          Semana
        </Button>
        <Button variant="default" size="sm">
          Mês
        </Button>
        <Button variant="ghost" size="sm">
          Ano
        </Button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="p-4 border-2 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={cn("p-2 rounded-lg", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {formatChange(stat.change)}
                <span className="text-xs text-muted-foreground">
                  vs. período anterior
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Gráficos e tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos mais visualizados */}
        <Card className="p-6 border-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Produtos Mais Visualizados</h3>
              <p className="text-sm text-muted-foreground">
                Top 4 products da semana
              </p>
            </div>
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </div>

          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {product.views} visualizações
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {product.clicks} cliques
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {Math.round((product.clicks / product.views) * 100)}%
                  conversão
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Horários de pico */}
        <Card className="p-6 border-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Horários de Pico</h3>
              <p className="text-sm text-muted-foreground">
                Visitas por horário do dia
              </p>
            </div>
            <Button variant="ghost" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Ver detalhes
            </Button>
          </div>

          <div className="space-y-3">
            {peakHours.map((hour, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{hour.hour}</span>
                  <span>{hour.visits} visitas</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(hour.visits / 60) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Horário recomendado para postar:
              </span>
              <span className="font-semibold">13:00 - 14:00</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado no maior engajamento dos seus clientes
            </p>
          </div>
        </Card>
      </div>

      {/* Insights e recomendações */}
      <Card className="p-6 border-2 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Insights e Recomendações</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <MessageCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">WhatsApp com alta conversão</p>
              <p className="text-sm text-muted-foreground">
                Seu botão de WhatsApp tem 32% de taxa de clique. Considere add
                uma oferta especial na mensagem automática.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
            <Clock className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">
                Horário de almoço é o mais movimentado
              </p>
              <p className="text-sm text-muted-foreground">
                45% das visualizações ocorrem entre 12h e 14h. Poste promoções
                nesse horário.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <Share2 className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Baixo compartilhamento</p>
              <p className="text-sm text-muted-foreground">
                Apenas 8% dos visitantes compartilham sua página. Considere add
                um incentivo para compartilhar.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Próxima atualização automática em:{" "}
              <span className="font-medium">15 minutos</span>
            </p>
            <Button size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar Agora
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
