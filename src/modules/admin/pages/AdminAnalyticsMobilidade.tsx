import { useState } from "react";
import { BarChart3, Loader2, Shield } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { AdminMobilityCharts } from "./mobility-analytics/AdminMobilityCharts";
import { AdminMobilityRates } from "./mobility-analytics/AdminMobilityRates";
import { AdminMobilitySidebar } from "./mobility-analytics/AdminMobilitySidebar";
import { AdminMobilityStatsCards } from "./mobility-analytics/AdminMobilityStatsCards";
import { useAdminMobilityAnalytics } from "./mobility-analytics/useAdminMobilityAnalytics";

const PERIOD_OPTIONS = [7, 30, 90];

export default function AdminAnalyticsMobilidade() {
  const { canModerate, isChecking } = useAdminGuard();
  const [days, setDays] = useState(30);
  const { stats, dailyData, topDrivers, loading } = useAdminMobilityAnalytics(
    days,
    !isChecking && canModerate,
  );

  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
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
    { name: "Completas", value: stats.completedRides },
    { name: "Em andamento", value: stats.inProgressRides },
    { name: "Canceladas", value: stats.cancelledRides },
    { name: "Pendentes", value: stats.pendingRides },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display mb-0.5 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Analytics Mobilidade
          </h1>
          <p className="text-sm text-muted-foreground">
            Métricas de corridas, receita e motoristas
          </p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setDays(option)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
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

      <div className="grid lg:grid-cols-3 gap-6">
        <AdminMobilityCharts dailyData={dailyData} />
        <AdminMobilitySidebar
          rideDistribution={rideDistribution}
          stats={stats}
          topDrivers={topDrivers}
        />
      </div>
    </div>
  );
}
