import React from "react";
import { Card } from "@/shared/components/ui/card";
import {
  Eye,
  MessageCircle,
  Phone,
  Navigation,
  Calendar,
  Heart,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import { useState } from "react";

interface AnalyticsMetric {
  label: string;
  value: number;
  change: number; // percentual de mudança
  icon: LucideIcon;
  color: string;
}

interface AnalyticsDashboardProps {
  businessId: string;
}

export default function AnalyticsDashboard({
  businessId,
}: AnalyticsDashboardProps) {
  const [periodo, setPeriodo] = useState<"hoje" | "semana" | "mes">("semana");

  // Métricas PRIORITÁRIAS - as que mais importam para conversão
  const metricas_prioritarias = {
    mensagens_recebidas:
      periodo === "hoje" ? 12 : periodo === "semana" ? 89 : 367,
    cliques_whatsapp: periodo === "hoje" ? 8 : periodo === "semana" ? 67 : 289,
    taxa_resposta:
      periodo === "hoje" ? 85.7 : periodo === "semana" ? 78.4 : 82.1,
    conversao_whatsapp:
      periodo === "hoje" ? 66.7 : periodo === "semana" ? 75.4 : 71.8,
  };

  // Dados mockados - em produção viriam do backend
  const metrics: AnalyticsMetric[] = [
    {
      label: "Visualizações",
      value: periodo === "hoje" ? 45 : periodo === "semana" ? 312 : 1247,
      change: 12.5,
      icon: Eye,
      color: "text-blue-600",
    },
    {
      label: "Cliques Telefone",
      value: periodo === "hoje" ? 3 : periodo === "semana" ? 23 : 98,
      change: -2.1,
      icon: Phone,
      color: "text-purple-600",
    },
    {
      label: "Como Chegar",
      value: periodo === "hoje" ? 12 : periodo === "semana" ? 89 : 356,
      change: 15.7,
      icon: Navigation,
      color: "text-orange-600",
    },
    {
      label: "Agendamentos",
      value: periodo === "hoje" ? 5 : periodo === "semana" ? 34 : 142,
      change: 22.4,
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Favoritos",
      value: periodo === "hoje" ? 2 : periodo === "semana" ? 18 : 76,
      change: 5.2,
      icon: Heart,
      color: "text-red-600",
    },
    {
      label: "Compartilhamentos",
      value: periodo === "hoje" ? 1 : periodo === "semana" ? 9 : 43,
      change: 0,
      icon: Share2,
      color: "text-sky-600",
    },
  ];

  const taxaConversao =
    periodo === "hoje" ? 17.8 : periodo === "semana" ? 21.5 : 23.2;

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) {
      return "text-green-600";
    }
    if (change < 0) {
      return "text-red-600";
    }
    return "text-gray-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da sua página
          </p>
        </div>

        <Tabs
          value={periodo}
          onValueChange={(v) => setPeriodo(v as "hoje" | "semana" | "mes")}
        >
          <TabsList>
            <TabsTrigger value="hoje">Hoje</TabsTrigger>
            <TabsTrigger value="semana">7 dias</TabsTrigger>
            <TabsTrigger value="mes">30 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* MÉTRICAS PRIORITÁRIAS - WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mensagens Recebidas - MÉTRICA #1 */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">
                  MENSAGENS RECEBIDAS
                </p>
                <p className="text-xs text-green-600">
                  Métrica mais importante
                </p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              PRIORIDADE #1
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-green-900">
                {metricas_prioritarias.mensagens_recebidas}
              </span>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  +18.5%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
              <div>
                <p className="text-xs text-green-700">Taxa de Resposta</p>
                <p className="text-lg font-bold text-green-900">
                  {metricas_prioritarias.taxa_resposta}%
                </p>
              </div>
              <div>
                <p className="text-xs text-green-700">Tempo Médio</p>
                <p className="text-lg font-bold text-green-900">12min</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Cliques WhatsApp - MÉTRICA #2 */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-100">
                <MessageCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-emerald-700 font-medium">
                  CLIQUES WHATSAPP
                </p>
                <p className="text-xs text-emerald-600">Intenção de contato</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
              PRIORIDADE #2
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-emerald-900">
                {metricas_prioritarias.cliques_whatsapp}
              </span>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">
                  +8.3%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-emerald-200">
              <div>
                <p className="text-xs text-emerald-700">Conversão</p>
                <p className="text-lg font-bold text-emerald-900">
                  {metricas_prioritarias.conversao_whatsapp}%
                </p>
              </div>
              <div>
                <p className="text-xs text-emerald-700">Qualidade</p>
                <p className="text-lg font-bold text-emerald-900">Alta</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Funil de Conversão WhatsApp */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-900">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Funil de Conversão WhatsApp
        </h3>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "100%" }}
              ></div>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {periodo === "hoje" ? 45 : periodo === "semana" ? 312 : 1247}
            </p>
            <p className="text-xs text-blue-700">Visualizações</p>
          </div>

          <div className="text-center">
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {metricas_prioritarias.cliques_whatsapp}
            </p>
            <p className="text-xs text-blue-700">Cliques WhatsApp</p>
          </div>

          <div className="text-center">
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "60%" }}
              ></div>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {metricas_prioritarias.mensagens_recebidas}
            </p>
            <p className="text-xs text-blue-700">Mensagens Enviadas</p>
          </div>

          <div className="text-center">
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "45%" }}
              ></div>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {periodo === "hoje" ? 5 : periodo === "semana" ? 34 : 142}
            </p>
            <p className="text-xs text-blue-700">Agendamentos</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Taxa de Conversão Total:</strong> {taxaConversao}% dos
            visitantes se tornam clientes via WhatsApp
          </p>
        </div>
      </Card>

      {/* Outras Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gray-100 ${metric.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.change)}
                  <span
                    className={`text-xs font-medium ${getTrendColor(metric.change)}`}
                  >
                    {metric.change > 0 && "+"}
                    {metric.change}%
                  </span>
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Insights Focados em WhatsApp */}
      <Card className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          Insights WhatsApp & Conversão
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-600 mt-2" />
            <div className="flex-1">
              <p className="font-medium text-sm">Excelente engajamento!</p>
              <p className="text-sm text-muted-foreground">
                {metricas_prioritarias.conversao_whatsapp}% dos cliques no
                WhatsApp se tornam mensagens reais
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
            <div className="flex-1">
              <p className="font-medium text-sm">Tempo de resposta otimizado</p>
              <p className="text-sm text-muted-foreground">
                Você responde em média em 12 minutos - isso aumenta a conversão
                em 40%
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="h-2 w-2 rounded-full bg-yellow-600 mt-2" />
            <div className="flex-1">
              <p className="font-medium text-sm">Oportunidade de crescimento</p>
              <p className="text-sm text-muted-foreground">
                Adicione mensagens automáticas de boas-vindas para aumentar o
                engajamento inicial
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="h-2 w-2 rounded-full bg-purple-600 mt-2" />
            <div className="flex-1">
              <p className="font-medium text-sm">Horário de maior conversão</p>
              <p className="text-sm text-muted-foreground">
                Entre 18h-21h você recebe 65% das mensagens - mantenha-se online
                neste período
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ROI Focado em WhatsApp */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <h3 className="font-bold mb-2 text-green-900">ROI via WhatsApp</h3>
        <p className="text-sm text-green-700 mb-4">
          Retorno específico gerado através do canal WhatsApp
        </p>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-green-700 mb-1">Investimento</p>
            <p className="text-2xl font-bold text-green-900">R$ 79</p>
            <p className="text-xs text-green-600">Plano Profissional</p>
          </div>
          <div>
            <p className="text-xs text-green-700 mb-1">Mensagens</p>
            <p className="text-2xl font-bold text-green-900">
              {metricas_prioritarias.mensagens_recebidas}
            </p>
            <p className="text-xs text-green-600">Leads qualificados</p>
          </div>
          <div>
            <p className="text-xs text-green-700 mb-1">Receita WhatsApp</p>
            <p className="text-2xl font-bold text-green-900">R$ 2.240</p>
            <p className="text-xs text-green-600">Via agendamentos</p>
          </div>
          <div>
            <p className="text-xs text-green-700 mb-1">ROI WhatsApp</p>
            <p className="text-2xl font-bold text-green-900">2.737%</p>
            <p className="text-xs text-green-600">Só pelo WhatsApp</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Custo por Lead:</strong> R${" "}
            {(79 / metricas_prioritarias.mensagens_recebidas).toFixed(2)} por
            mensagem recebida
          </p>
        </div>
      </Card>
    </div>
  );
}
