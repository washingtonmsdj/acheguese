import { lazy, Suspense, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";

import { AdminAccessDenied } from "@/modules/admin/components/AdminAccessDenied";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { cn } from "@/shared/utils/cn";
import { AdminMobilityRates } from "./mobility-analytics/AdminMobilityRates";
import { AdminMobilityStatsCards } from "./mobility-analytics/AdminMobilityStatsCards";
import { useAdminMobilityAnalytics } from "./mobility-analytics/useAdminMobilityAnalytics";

const PERIOD_OPTIONS = [7, 30, 90];

const AdminMobilityCharts = lazy(() =>
  import("./mobility-analytics/AdminMobilityCharts").then((module) => ({
    default: module.AdminMobilityCharts,
  })),
);

const AdminMobilitySidebar = lazy(() =>
  import("./mobility-analytics/AdminMobilitySidebar").then((module) => ({
    default: module.AdminMobilitySidebar,
  })),
);

function AdminMobilityChartsFallback() {
  return (
    <div className="space-y-6 lg:col-span-2" role="status" aria-label="Carregando gráficos">
      <div className="h-[340px] animate-pulse rounded-lg border border-border bg-card" />
      <div className="h-[300px] animate-pulse rounded-lg border border-border bg-card" />
    </div>
  );
}

function AdminMobilitySidebarFallback() {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando indicadores">
      <div className="h-[292px] animate-pulse rounded-lg border border-border bg-card" />
      <div className="h-[220px] animate-pulse rounded-lg border border-border bg-card" />
      <div className="h-[160px] animate-pulse rounded-lg border border-border bg-card" />
    </div>
  );
}

export default function AdminAnalyticsMobilidade() {
  const { canModerate, isChecking } = useAdminGuard();
  const [days, setDays] = useState(30);
  const { stats, dailyData, topDrivers, loading } = useAdminMobilityAnalytics(
    days,
    !isChecking && canModerate,
  );

  if (!isChecking && !canModerate) {
    return <AdminAccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Carregando analytics de mobilidade</span>
      </div>
    );
  }

  if (!stats) return null;

  const rideDistribution = [
    { name: "Abertas", value: stats.openRides },
    { name: "Concluídas", value: stats.completedRides },
    { name: "Canceladas", value: stats.cancelledRides },
    {
      name: "Falhas/expiradas",
      value: stats.failedRides + stats.expiredRides,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-0.5 flex items-center gap-2 font-display text-2xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
            Analytics Mobilidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Lifecycle de corridas, valor concluído e verificação de motoristas.
          </p>
        </div>
        <div
          className="flex w-fit gap-1 rounded-lg bg-muted p-0.5"
          aria-label="Período dos analytics"
        >
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              aria-pressed={days === option}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                days === option
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      <AdminMobilityStatsCards stats={stats} />
      <AdminMobilityRates stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Suspense fallback={<AdminMobilityChartsFallback />}>
          <AdminMobilityCharts dailyData={dailyData} />
        </Suspense>
        <Suspense fallback={<AdminMobilitySidebarFallback />}>
          <AdminMobilitySidebar
            rideDistribution={rideDistribution}
            stats={stats}
            topDrivers={topDrivers}
          />
        </Suspense>
      </div>
    </div>
  );
}
