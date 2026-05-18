/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { TrendIndicator, TrendData } from "./TrendIndicator";
import { Users, MessageSquare, Heart, Layers, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { adminStatsService } from "@/core/admin/services/AdminStatsService";
import { postService } from "@/core/posts/services/PostService";

interface EngagementMetric {
  label: string;
  value: number;
  icon: LucideIcon;
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
            Metricas de Engajamento
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
          Metricas de Engajamento
        </CardTitle>
        <CardDescription>Indicadores de atividade e interacao dos usuarios</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center", metric.color)}>
                  <metric.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold">
                    {metric.value.toLocaleString("pt-BR")}
                    {metric.suffix && <span className="text-sm text-muted-foreground ml-1">{metric.suffix}</span>}
                  </p>
                </div>
              </div>
              {metric.trend && <TrendIndicator trend={metric.trend} size="md" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function useEngagementMetrics() {
  const query = useQuery({
    queryKey: ["admin", "engagement-metrics"],
    queryFn: async (): Promise<EngagementMetric[]> => {
      const [statsWithTrends, activity, recentPosts] = await Promise.all([
        adminStatsService.getTableStatsWithTrends(7),
        adminStatsService.getActivity(7),
        postService.getRecentPosts(),
      ]);

      const activeUsers7d = activity.reduce((sum, day) => sum + (day.users || 0), 0);
      const commentsPerDay = Math.round((statsWithTrends.stats.comments || 0) / 30);
      const totalLikesRecentPosts = recentPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const likesPerDay = Math.round(totalLikesRecentPosts / 7);
      const totalInteractions = (statsWithTrends.stats.posts || 0) + (statsWithTrends.stats.comments || 0);

      const profilesTrend = statsWithTrends.trends.profiles;
      const commentsTrend = statsWithTrends.trends.posts;

      return [
        {
          label: "Usuarios Ativos (7d)",
          value: activeUsers7d,
          icon: Users,
          color: "bg-blue-500/10 text-blue-600",
          trend: profilesTrend
            ? { value: profilesTrend.value, direction: profilesTrend.direction, period: "vs semana passada" }
            : { value: 0, direction: "neutral", period: "vs semana passada" },
        },
        {
          label: "Comentarios por Dia",
          value: commentsPerDay,
          icon: MessageSquare,
          color: "bg-orange-500/10 text-orange-600",
          trend: commentsTrend
            ? { value: commentsTrend.value, direction: commentsTrend.direction, period: "vs semana passada" }
            : { value: 0, direction: "neutral", period: "vs semana passada" },
          suffix: "/dia",
        },
        {
          label: "Curtidas por Dia",
          value: likesPerDay,
          icon: Heart,
          color: "bg-rose-500/10 text-rose-600",
          trend: { value: 0, direction: "neutral", period: "historico" },
          suffix: "/dia",
        },
        {
          label: "Interacoes Totais",
          value: totalInteractions,
          icon: Layers,
          color: "bg-purple-500/10 text-purple-600",
          trend: { value: 0, direction: "neutral", period: "historico" },
        },
      ];
    },
  });

  return { metrics: query.data || [], loading: query.isLoading };
}


