/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Car,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Loader2,
  BarChart3,
  Activity,
  Percent,
  Star,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { Progress } from "@/shared/components/ui/progress";
import { RIDE_STATUS } from "@/shared/types/constants";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";
import { logger } from "@/shared/utils/logger";
import { adminMobilityService } from "@/core/admin"; // ✅ MIGRADO - Usa AdminMobilityService do core
import type { RideRequest } from "@/shared/services/mobilityAdmin"; // ✅ MIGRADO - Tipo movido para core

interface MobilidadeStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  pendingRides: number;
  inProgressRides: number;
  totalDrivers: number;
  verifiedDrivers: number;
  pendingDrivers: number;
  rejectedDrivers: number;
  totalRevenue: number;
  avgRating: number;
  approvalRate: number;
  completionRate: number;
}

interface DailyData {
  date: string;
  rides: number;
  revenue: number;
  completed: number;
  cancelled: number;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(142 71% 45%)",
  "hsl(var(--destructive))",
  "hsl(45 93% 47%)",
];

const chartConfig = {
  rides: { label: "Corridas", color: "hsl(var(--primary))" },
  revenue: { label: "Receita", color: "hsl(142 71% 45%)" },
  completed: { label: "Completas", color: "hsl(142 71% 45%)" },
  cancelled: { label: "Canceladas", color: "hsl(var(--destructive))" },
};

export default function AdminAnalyticsMobilidade() {
  const { canModerate, isChecking } = useAdminGuard();
  const [stats, setStats] = useState<MobilidadeStats | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topDrivers, setTopDrivers] = useState<
    Array<{
      driver: {
        id: string;
        name?: string;
        profile?: {
          name?: string;
          avatar_url?: string;
          neighborhood?: string;
        };
      };
      count: number;
      revenue: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!isChecking && canModerate) {
      loadData();
    }
  }, [days, canModerate, isChecking]);

  async function loadData() {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startISO = startDate.toISOString();

      // Fetch rides
      const rides = await adminMobilityService.getAllRides();
      const allRides: RideRequest[] = (rides || []).filter(
        (r) => r.created_at >= startISO,
      );

      // SSOT: Fetch all drivers usando driver_complete_profile
      const allDrivers = await adminMobilityService.getAllDriversComplete();

      // Fetch ratings
      const allRatings = await adminMobilityService.getAllRideRatings();

      const completed = allRides.filter(
        (r) => r.status === RIDE_STATUS.COMPLETED,
      );
      const cancelled = allRides.filter(
        (r) => r.status === RIDE_STATUS.CANCELLED,
      );
      const pending = allRides.filter((r) => r.status === RIDE_STATUS.PENDING);
      const inProgress = allRides.filter(
        (r) =>
          r.status === RIDE_STATUS.IN_PROGRESS ||
          r.status === "driver_assigned",
      );

      const verified = allDrivers.filter((d) => d.is_verified === true);
      const pendingDrivers = allDrivers.filter((d) => d.is_verified === false);

      const totalRevenue = completed.reduce(
        (sum, r) =>
          sum + (r.final_price || (r as RideRequest).suggested_price || 0),
        0,
      );
      const avgRating =
        allRatings.length > 0
          ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
          : 0;

      setStats({
        totalRides: allRides.length,
        completedRides: completed.length,
        cancelledRides: cancelled.length,
        pendingRides: pending.length,
        inProgressRides: inProgress.length,
        totalDrivers: allDrivers.length,
        verifiedDrivers: verified.length,
        pendingDrivers: pendingDrivers.length,
        rejectedDrivers: 0,
        totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
        approvalRate:
          allDrivers.length > 0
            ? Math.round((verified.length / allDrivers.length) * 100)
            : 0,
        completionRate:
          allRides.length > 0
            ? Math.round((completed.length / allRides.length) * 100)
            : 0,
      });

      // Build daily data
      const dailyMap = new Map<string, DailyData>();
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().split("T")[0];
        dailyMap.set(key, {
          date: key,
          rides: 0,
          revenue: 0,
          completed: 0,
          cancelled: 0,
        });
      }
      allRides.forEach((r) => {
        const key = r.created_at?.split("T")[0];
        const daily = dailyMap.get(key);
        if (daily) {
          daily.rides += 1;
          if (r.status === RIDE_STATUS.COMPLETED) {
            daily.completed += 1;
            daily.revenue +=
              r.final_price || (r as RideRequest).suggested_price || 0;
          }
          if (r.status === RIDE_STATUS.CANCELLED) daily.cancelled += 1;
        }
      });
      setDailyData(Array.from(dailyMap.values()));

      // Top drivers by completed rides
      const driverRideCount = new Map<
        string,
        { driver: any; count: number; revenue: number }
      >();
      completed.forEach((r) => {
        const driverProfileId =
          (r as RideRequest).driver_profile_id || r.driver_profile_id;
        if (driverProfileId) {
          if (!driverRideCount.has(driverProfileId)) {
            const drv = allDrivers.find((d) => d.id === driverProfileId);
            driverRideCount.set(driverProfileId, {
              driver: drv,
              count: 0,
              revenue: 0,
            });
          }
          const entry = driverRideCount.get(driverProfileId);
          if (!entry) {
            return;
          }
          entry.count += 1;
          entry.revenue +=
            r.final_price || (r as RideRequest).suggested_price || 0;
        }
      });
      const sorted = Array.from(driverRideCount.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopDrivers(sorted);
    } catch (err) {
      logger.error("Error loading mobilidade analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${day}/${m}`;
  };

  const formatCurrency = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

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
  ].filter((d) => d.value > 0);

  const statCards = [
    {
      label: "Total de Corridas",
      value: stats.totalRides,
      icon: Car,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Receita Total",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Motoristas Ativos",
      value: stats.verifiedDrivers,
      icon: Users,
      color: "bg-sky-500/10 text-sky-600",
    },
    {
      label: "Avaliação Média",
      value: `${stats.avgRating} ⭐`,
      icon: Star,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  // Validação de admin
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

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                days === d
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    s.color,
                  )}
                >
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Taxa de Conclusão</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">
              {stats.completionRate}%
            </p>
            <Progress value={stats.completionRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.completedRides} de {stats.totalRides} corridas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Taxa de Aprovação</span>
            </div>
            <p className="text-3xl font-bold text-primary">
              {stats.approvalRate}%
            </p>
            <Progress value={stats.approvalRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.verifiedDrivers} de {stats.totalDrivers} motoristas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Taxa de Cancelamento</span>
            </div>
            <p className="text-3xl font-bold text-destructive">
              {stats.totalRides > 0
                ? Math.round((stats.cancelledRides / stats.totalRides) * 100)
                : 0}
              %
            </p>
            <Progress
              value={
                stats.totalRides > 0
                  ? (stats.cancelledRides / stats.totalRides) * 100
                  : 0
              }
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cancelledRides} canceladas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area Chart - Corridas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Corridas por Dia
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <AreaChart
                  data={dailyData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(142 71% 45%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(142 71% 45%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillCancelled"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--destructive))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--destructive))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => formatDate(v as string)}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey={RIDE_STATUS.COMPLETED}
                    stroke="hsl(142 71% 45%)"
                    fill="url(#fillCompleted)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey={RIDE_STATUS.CANCELLED}
                    stroke="hsl(var(--destructive))"
                    fill="url(#fillCancelled)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Receita */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-medium">
                  Receita Diária (R$)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart
                  data={dailyData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => formatDate(v as string)}
                      />
                    }
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(142 71% 45%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Distribuição de Corridas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rideDistribution.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rideDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {rideDistribution.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 justify-center -mt-2">
                    {rideDistribution.map((d, idx) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground">
                          {d.name}: {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sem dados
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Drivers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Top Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {topDrivers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sem dados
                </p>
              ) : (
                <div className="space-y-3">
                  {topDrivers.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.driver?.profile?.name ||
                            item.driver?.name ||
                            "Motorista"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} corridas · {formatCurrency(item.revenue)}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] shrink-0"
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Driver Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Status dos Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm">Verificados</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.verifiedDrivers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.pendingDrivers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                  <span className="text-sm">Total</span>
                </div>
                <span className="text-sm font-bold">{stats.totalDrivers}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


