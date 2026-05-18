/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { adminStatsService } from "@/core/admin/services/AdminStatsService";
import type { ActivityData, RecentActivity } from "@/core/admin/services/AdminStatsService";
import { TrendIndicator, TrendData } from "../components/TrendIndicator";
import {
  Building2,
  Wrench,
  Tag,
  Calendar,
  FileText,
  Users,
  Loader2,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Crown,
  AlertCircle,
  RefreshCw,
  Car,
  Navigation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
} from "recharts";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { useNavigate } from "react-router-dom";
import { logger } from "@/shared/utils/logger";
const statConfig: {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  route?: string;
}[] = [
  {
    key: "businesses",
    label: "Empresas",
    icon: Building2,
    color: "bg-primary/10 text-primary",
    route: "/admin/empresas",
  },
  {
    key: "professionals",
    label: "Profissionais",
    icon: Wrench,
    color: "bg-amber-500/10 text-amber-600",
    route: "/admin/services",
  },
  {
    key: "classifieds",
    label: "Classificados",
    icon: Tag,
    color: "bg-emerald-500/10 text-emerald-600",
    route: "/admin/classificados",
  },
  {
    key: "events",
    label: "Eventos",
    icon: Calendar,
    color: "bg-violet-500/10 text-violet-600",
    route: "/admin/eventos",
  },
  {
    key: "posts",
    label: "Posts",
    icon: FileText,
    color: "bg-rose-500/10 text-rose-600",
    route: "/admin/moderacao",
  },
  {
    key: "profiles",
    label: "Usuários",
    icon: Users,
    color: "bg-sky-500/10 text-sky-600",
    route: "/admin/users",
  },
  {
    key: "comments",
    label: "Comentários",
    icon: MessageSquare,
    color: "bg-orange-500/10 text-orange-600",
    route: "/admin/moderacao",
  },
  {
    key: "drivers",
    label: "Motoristas",
    icon: Car,
    color: "bg-blue-500/10 text-blue-600",
    route: "/admin/motoristas",
  },
  {
    key: "ride_requests",
    label: "Corridas",
    icon: Navigation,
    color: "bg-indigo-500/10 text-indigo-600",
    route: "/admin/analytics-mobilidade",
  },
];

const chartConfig = {
  posts: { label: "Posts", color: "hsl(var(--destructive))" },
  users: { label: "Usuários", color: "hsl(var(--primary))" },
  businesses: { label: "Empresas", color: "hsl(45 93% 47%)" },
  eventos: { label: "Eventos", color: "hsl(262 83% 58%)" },
  classificados: { label: "Classificados", color: "hsl(160 60% 45%)" },
};

const activityIcons: Record<string, { icon: LucideIcon; color: string }> = {
  post: { icon: FileText, color: "text-rose-500" },
  business: { icon: Building2, color: "text-primary" },
  event: { icon: Calendar, color: "text-violet-500" },
  classified: { icon: Tag, color: "text-emerald-500" },
  user: { icon: Users, color: "text-sky-500" },
  service: { icon: Wrench, color: "text-amber-500" },
  comment: { icon: MessageSquare, color: "text-orange-500" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [trends, setTrends] = useState<Record<string, TrendData>>({});
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [premiumStats, setPremiumStats] = useState({ total: 0, percentage: 0 });
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ SSOT AAA - Usa AdminStatsService diretamente
      const [activityData, recentData, statsWithTrends] = await Promise.all([
        adminStatsService.getActivity(days),
        adminStatsService.getRecentActivity(10),
        adminStatsService.getTableStatsWithTrends(days),
      ]);

      setStats(statsWithTrends.stats);
      setTrends(
        Object.entries(statsWithTrends.trends).reduce((acc, [key, trend]) => {
          acc[key] = {
            ...trend,
            period: days === 7 ? "vs semana passada" : days === 30 ? "vs mês passado" : "vs período anterior",
          };
          return acc;
        }, {} as Record<string, TrendData>)
      );
      setActivity(activityData);
      setRecent(Array.isArray(recentData) ? recentData : []);

      // Buscar estatísticas premium
      const totalBusinesses = statsWithTrends.stats.businesses || 0;
      const premiumData = await adminStatsService.getPremiumBusinessStats(totalBusinesses);
      setPremiumStats(premiumData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      logger.error("Erro ao carregar dados do dashboard", err as Error, {
        component: "AdminDashboard",
        action: "loadData",
        days,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [days]);

  const formatDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${day}/${m}`;
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Erro ao carregar dados</h3>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mt-4"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const totalRecords = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display mb-0.5">Dashboard Administrativo</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da plataforma ·{" "}
            <span className="font-medium text-foreground">{totalRecords.toLocaleString('pt-BR')}</span>{" "}
            registros totais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Período:</span>
          <div className="flex gap-1 bg-muted rounded-lg p-0.5">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                aria-label={`Filtrar por ${d} dias`}
                aria-pressed={days === d}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  days === d
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50",
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statConfig.map((s) => (
          <button
            key={s.key}
            onClick={() => s.route && navigate(s.route)}
            aria-label={`Ver detalhes de ${s.label}`}
            className="bg-card rounded-xl border p-4 text-left hover:shadow-lg hover:border-primary/20 transition-all group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                  s.color,
                )}
              >
                <s.icon className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold mb-0.5">{(stats[s.key] ?? 0).toLocaleString('pt-BR')}</p>
            <span className="text-xs text-muted-foreground">{s.label}</span>
            {trends[s.key] && (
              <div className="mt-2">
                <TrendIndicator trend={trends[s.key]} size="sm" />
              </div>
            )}
          </button>
        ))}

        {/* Card Premium Stats */}
        <button
          onClick={() => navigate("/admin/empresas")}
          aria-label="Ver empresas premium"
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-4 text-left hover:shadow-lg hover:border-amber-500/40 transition-all group focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-500 text-white transition-transform group-hover:scale-110">
              <Crown className="h-4 w-4" />
            </div>
            <Badge className="bg-amber-500/20 text-amber-700 border-0 text-[10px] font-semibold">
              {premiumStats.percentage}%
            </Badge>
          </div>
          <p className="text-2xl font-bold text-amber-700 mb-0.5">
            {premiumStats.total.toLocaleString('pt-BR')}
          </p>
          <span className="text-xs text-amber-600/80">Empresas Premium</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Charts - takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Area Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Atividade</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[260px] w-full">
                <AreaChart
                  data={activity}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillPosts" x1="0" y1="0" x2="0" y2="1">
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
                    <linearGradient
                      id="fillUsuarios"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
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
                    dataKey="posts"
                    stroke="hsl(var(--destructive))"
                    fill="url(#fillPosts)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(var(--primary))"
                    fill="url(#fillUsuarios)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Cadastros por tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[220px] w-full">
                <BarChart
                  data={activity}
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
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => formatDate(v as string)}
                      />
                    }
                  />
                  <Bar
                    dataKey="businesses"
                    fill="hsl(45 93% 47%)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="eventos"
                    fill="hsl(262 83% 58%)"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="classificados"
                    fill="hsl(160 60% 45%)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Resumo Rápido */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Resumo Rápido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total Usuários</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {(stats.profiles ?? 0).toLocaleString('pt-BR')}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-500/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Empresas</span>
                </div>
                <span className="text-lg font-bold text-amber-600">
                  {(stats.businesses ?? 0).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-rose-500/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-medium">Posts</span>
                </div>
                <span className="text-lg font-bold text-rose-600">
                  {(stats.posts ?? 0).toLocaleString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Atividade recente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {recent.length === 0 ? (
                <div className="text-center py-8">
                  <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhuma atividade recente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recent.map((item, i) => {
                    const config =
                      activityIcons[item.type] || activityIcons.post;
                    const Icon = config.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div
                          className={cn(
                            "mt-0.5 h-7 w-7 rounded-full flex items-center justify-center bg-muted shrink-0",
                            config.color,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed line-clamp-2">
                            {item.label}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelative(item.date)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

