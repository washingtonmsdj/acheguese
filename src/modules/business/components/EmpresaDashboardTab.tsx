import React from "react";
import { useEffect, useState } from "react";
import { adminBusinessService } from "@/core/admin/services";
import { AnalyticsService } from "@/core/analytics/AnalyticsService";
import type { SecoesAtivas } from "@/modules/business/types/components";
import {
  Eye,
  Star,
  Heart,
  TrendingUp,
  Calendar,
  Settings,
  BarChart3,
  Gift,
  CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import SecoesAtivasManager from "./SecoesAtivasManager";
import SubscriptionPlans from "./SubscriptionPlans";
import { Separator } from "@/shared/components/ui/separator";
import { getFavoritersOfProfile } from "@/core/favorites/services/favorites.queries";
import { SubscriptionService, useBusinessSubscription } from "@/core/billing";
import { PlanTier } from "@/core/billing/types";
import { toast } from "sonner";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";

const AnalyticsDashboard = React.lazy(() => import("./AnalyticsDashboard"));
const CouponManager = React.lazy(() => import("./CouponManager"));

interface Props {
  businessId: string;
  secoesAtivas?: SecoesAtivas;
  onSecoesUpdated?: (config: SecoesAtivas) => void;
}

interface Metrics {
  totalViews: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  totalReviews: number;
  avgRating: number;
  totalFavorites: number;
  recentViews: { date: string; count: number }[];
}

export default function EmpresaDashboardTab({
  businessId,
  secoesAtivas,
  onSecoesUpdated,
}: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const showAnalytics = isLaunchSurfaceEnabled("publicAnalytics");
  const showCoupons = isLaunchSurfaceEnabled("coupons");
  const tabsGridClass = showAnalytics && showCoupons
    ? "grid-cols-4"
    : showAnalytics || showCoupons
      ? "grid-cols-3"
      : "grid-cols-2";

  const { planTier, refetch: refetchSubscription } =
    useBusinessSubscription(businessId);

  useEffect(() => {
    if ((activeTab === "analytics" && !showAnalytics) || (activeTab === "cupons" && !showCoupons)) {
      setActiveTab("visao-geral");
    }
  }, [activeTab, showAnalytics, showCoupons]);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [viewsRes, weekRes, monthRes, reviewsRes, favsRes, dailyViewsRes] =
        await Promise.all([
          adminBusinessService.countBusinessViews(businessId),
          adminBusinessService.countBusinessViews(businessId, weekAgo),
          adminBusinessService.countBusinessViews(businessId, monthAgo),
          adminBusinessService.getBusinessReviews(businessId),
          getFavoritersOfProfile(businessId).then(
            (favoriters) => ({ count: favoriters.length }),
          ),
          AnalyticsService.getDailyMetrics(
            "business",
            businessId,
            weekAgo.slice(0, 10),
            now.toISOString().slice(0, 10),
          ),
        ]);

      const dayMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        dayMap.set(d.toISOString().slice(0, 10), 0);
      }
      for (const metric of dailyViewsRes.data ?? []) {
        if (dayMap.has(metric.date)) {
          dayMap.set(metric.date, metric.total_views ?? 0);
        }
      }

      const reviews = reviewsRes || [];
      const avg =
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 0;

      setMetrics({
        totalViews: viewsRes || 0,
        viewsThisWeek: weekRes || 0,
        viewsThisMonth: monthRes || 0,
        totalReviews: reviews.length,
        avgRating: Math.round(avg * 10) / 10,
        totalFavorites: typeof favsRes === 'object' && favsRes && 'count' in favsRes ? (favsRes as { count: number }).count : 0,
        recentViews: Array.from(dayMap.entries()).map(([date, count]) => ({
          date,
          count,
        })),
      });
      setLoading(false);
    }
    load();
  }, [businessId]);

  if (loading) {
    return (
      <div className="space-y-3 pt-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const stats = [
    {
      icon: Eye,
      label: "Visualizações totais",
      value: metrics.totalViews,
      color: "bg-primary/10 text-primary",
    },
    {
      icon: TrendingUp,
      label: "Essa semana",
      value: metrics.viewsThisWeek,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      icon: Calendar,
      label: "Esse mês",
      value: metrics.viewsThisMonth,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      icon: Star,
      label: "Avaliações",
      value: `${metrics.avgRating} (${metrics.totalReviews})`,
      color: "bg-warning/10 text-warning",
    },
    {
      icon: Heart,
      label: "Favoritos",
      value: metrics.totalFavorites,
      color: "bg-destructive/10 text-destructive",
    },
  ];

  const maxViewDay = Math.max(...metrics.recentViews.map((d) => d.count), 1);

  const handlePlanSelect = async (planId: PlanTier) => {
    const result = await SubscriptionService.updatePlan(businessId, planId);
    if (result.error) {
      toast.error("Erro ao atualizar plano");
      return;
    }

    await refetchSubscription();
    toast.success("Plano atualizado");
  };

  return (
    <div className="space-y-6 pt-3">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={cn("grid w-full", tabsGridClass)}>
          <TabsTrigger value="visao-geral">
            <Eye className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          {showAnalytics && (
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          )}
          {showCoupons && (
            <TabsTrigger value="cupons">
              <Gift className="h-4 w-4 mr-2" />
              Cupons
            </TabsTrigger>
          )}
          <TabsTrigger value="plano">
            <CreditCard className="h-4 w-4 mr-2" />
            Plano
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((s, i) => (
              <Card key={i} className={cn("border", i === 0 && "col-span-2")}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      s.color,
                    )}
                  >
                    <s.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-tight">{s.value}</p>
                    <span className="text-xs text-muted-foreground">
                      {s.label}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mini bar chart - last 7 days */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                Visualizações · últimos 7 dias
              </p>
              <div className="flex items-end gap-1.5 h-20">
                {metrics.recentViews.map((d) => {
                  const pct = Math.max((d.count / maxViewDay) * 100, 4);
                  const dayLabel = new Date(`${d.date}T12:00:00`)
                    .toLocaleDateString("pt-BR", { weekday: "short" })
                    .slice(0, 3);
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] font-medium">{d.count}</span>
                      <div
                        className="w-full rounded-t bg-primary/80 transition-all"
                        style={{ height: `${pct}%` }}
                      />
                      <span className="text-[9px] text-muted-foreground">
                        {dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Gerenciador de Seções */}
          {secoesAtivas && onSecoesUpdated && (
            <>
              <Separator className="my-6" />
              <Card className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-base">
                      Configurações de Seções
                    </h3>
                  </div>
                  <SecoesAtivasManager
                    businessId={businessId}
                    currentConfig={secoesAtivas}
                    onSaved={onSecoesUpdated}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {showAnalytics && (
          <TabsContent value="analytics" className="mt-6">
            <React.Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Carregando analytics...</div>}>
              <AnalyticsDashboard businessId={businessId} />
            </React.Suspense>
          </TabsContent>
        )}

        {showCoupons && (
          <TabsContent value="cupons" className="mt-6">
            <React.Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Carregando cupons...</div>}>
              <CouponManager businessId={businessId} planType={planTier} />
            </React.Suspense>
          </TabsContent>
        )}

        <TabsContent value="plano" className="mt-6">
          <SubscriptionPlans
            currentPlan={planTier}
            onSelectPlan={handlePlanSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
