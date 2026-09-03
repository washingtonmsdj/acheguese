import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Star, TrendingUp } from "lucide-react";
import { AnalyticsService } from "@/core/analytics/AnalyticsService";
import { BusinessService } from "@/core/business/services/BusinessService";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface Props {
  businessId: string;
}

interface DashboardMetrics {
  totalViews: number;
  weekViews: number;
  monthViews: number;
  averageRating: number;
  totalReviews: number;
  recentViews: { date: string; count: number }[];
}

export default function EmpresaDashboardTab({ businessId }: Props) {
  const showAnalytics = isLaunchSurfaceEnabled("publicAnalytics");

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["business-dashboard-overview", businessId, showAnalytics],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
      const businessMetricsPromise = BusinessService.getBusinessMetrics(businessId);
      const dailyMetricsPromise = showAnalytics
        ? AnalyticsService.getDailyMetrics(
            "business",
            businessId,
            weekAgo.toISOString().slice(0, 10),
            now.toISOString().slice(0, 10),
          )
        : Promise.resolve({ data: [], error: null });

      const [businessMetrics, dailyMetrics] = await Promise.all([
        businessMetricsPromise,
        dailyMetricsPromise,
      ]);

      const dayMap = new Map<string, number>();
      for (let i = 6; i >= 0; i -= 1) {
        const day = new Date(now.getTime() - i * 86_400_000)
          .toISOString()
          .slice(0, 10);
        dayMap.set(day, 0);
      }

      for (const metric of dailyMetrics.data ?? []) {
        if (dayMap.has(metric.date)) {
          dayMap.set(metric.date, metric.total_views ?? 0);
        }
      }

      return {
        ...businessMetrics,
        recentViews: Array.from(dayMap.entries()).map(([date, count]) => ({
          date,
          count,
        })),
      };
    },
    enabled: Boolean(businessId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (isLoading || !metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: "Visualizações totais",
      value: metrics.totalViews,
      icon: Eye,
    },
    {
      label: "Últimos 7 dias",
      value: metrics.weekViews,
      icon: TrendingUp,
    },
    {
      label: "Últimos 30 dias",
      value: metrics.monthViews,
      icon: BarChart3,
    },
    {
      label: "Avaliação",
      value: `${metrics.averageRating.toFixed(1)} (${metrics.totalReviews})`,
      icon: Star,
    },
  ];

  const maxViewDay = Math.max(...metrics.recentViews.map((day) => day.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Visualizações · últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-24 items-end gap-2">
              {metrics.recentViews.map((day) => {
                const height = Math.max((day.count / maxViewDay) * 100, 4);
                const label = new Date(`${day.date}T12:00:00`)
                  .toLocaleDateString("pt-BR", { weekday: "short" })
                  .slice(0, 3);

                return (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="text-[10px] font-medium">{day.count}</span>
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
