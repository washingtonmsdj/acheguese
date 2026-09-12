import { lazy, Suspense, useState } from "react";
import { BarChart3, Loader2, Shield } from "lucide-react";

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
    <div className="space-y-6 lg:col-span-2">
      <div className="h-[340px] animate-pulse rounded-lg border bg-card" />
      <div className="h-[300px] animate-pulse rounded-lg border bg-card" />
    </div>
  );
}

function AdminMobilitySidebarFallback() {
  return (
    <div className="space-y-6">
      <div className="h-[292px] animate-pulse rounded-lg border bg-card" />
      <div className="h-[220px] animate-pulse rounded-lg border bg-card" />
      <div className="h-[160px] animate-pulse rounded-lg border bg-card" />
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0F14] p-4">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 text-2xl font-bold text-white">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-0.5 flex items-center gap-2 font-display text-2xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Mobilidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Lifecycle de corridas, valor concluído e verificação de motoristas
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-0.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setDays(option)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
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
