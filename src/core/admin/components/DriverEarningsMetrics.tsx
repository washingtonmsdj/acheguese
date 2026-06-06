import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Car,
  Star,
  Calendar,
  Clock,
  Award,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatBrl, formatBrlNoCents } from "@/shared/utils/currency";

interface DriverEarning {
  id: string;
  name: string;
  avatar_url?: string;
  total_rides: number;
  total_earnings: number;
  avg_rating: number;
  subscription_plan: string;
  is_online: boolean;
  last_ride_at?: string;
  earnings_today: number;
  earnings_week: number;
  earnings_month: number;
}

interface DriverEarningsMetricsProps {
  drivers: DriverEarning[];
}

export function DriverEarningsMetrics({ drivers }: DriverEarningsMetricsProps) {
  const totalEarnings = drivers.reduce((sum, d) => sum + d.total_earnings, 0);
  const totalRides = drivers.reduce((sum, d) => sum + d.total_rides, 0);
  const avgEarningsPerRide = totalRides > 0 ? totalEarnings / totalRides : 0;
  const activeDrivers = drivers.filter((d) => d.is_online).length;

  const todayEarnings = drivers.reduce((sum, d) => sum + d.earnings_today, 0);
  const weekEarnings = drivers.reduce((sum, d) => sum + d.earnings_week, 0);
  const monthEarnings = drivers.reduce((sum, d) => sum + d.earnings_month, 0);

  const topEarners = [...drivers]
    .sort((a, b) => b.total_earnings - a.total_earnings)
    .slice(0, 5);

  const topRated = [...drivers]
    .filter((d) => d.total_rides >= 5)
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, 5);

  const premiumDrivers = drivers.filter(
    (d) => d.subscription_plan === "prioritario",
  );
  const premiumEarnings = premiumDrivers.reduce(
    (sum, d) => sum + d.total_earnings,
    0,
  );
  const premiumPercentage =
    totalEarnings > 0 ? (premiumEarnings / totalEarnings) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Faturamento Total
              </span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              {formatBrl(totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalRides} corridas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Ticket Médio
              </span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">
              {formatBrl(avgEarningsPerRide)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por corrida</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Motoristas Ativos
              </span>
              <Car className="h-4 w-4 text-teal-500" />
            </div>
            <div className="text-2xl font-bold text-teal-500">
              {activeDrivers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {drivers.length} cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Plano Premium
              </span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-500">
              {premiumPercentage.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {premiumDrivers.length} motoristas premium
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Earnings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-500" />
            Faturamento por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">
                  Hoje
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {formatBrl(todayEarnings)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">
                  Esta Semana
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatBrl(weekEarnings)}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-600">
                  Este Mês
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatBrl(monthEarnings)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Earners */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Top 5 - Maior Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEarners.map((driver, index) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                      index === 0 && "bg-amber-500/20 text-amber-600",
                      index === 1 && "bg-gray-400/20 text-gray-600",
                      index === 2 && "bg-orange-500/20 text-orange-600",
                      index > 2 && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={driver.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(driver.name ?? '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {driver.name ?? 'Nome não informado'}
                      </p>
                      {driver.is_online && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {driver.total_rides} corridas
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      {formatBrl(driver.total_earnings)}
                    </p>
                    {driver.subscription_plan === "prioritario" && (
                      <Badge
                        variant="outline"
                        className="text-[0.65rem] h-5 px-1.5 border-amber-500/30 text-amber-600"
                      >
                        <Zap className="h-2.5 w-2.5 mr-0.5" /> PRO
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Rated */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Top 5 - Melhor Avaliados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRated.map((driver, index) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm",
                      index === 0 && "bg-yellow-500/20 text-yellow-600",
                      index === 1 && "bg-gray-400/20 text-gray-600",
                      index === 2 && "bg-orange-500/20 text-orange-600",
                      index > 2 && "bg-secondary text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarImage src={driver.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(driver.name ?? '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {driver.name ?? 'Nome não informado'}
                      </p>
                      {driver.is_online && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {driver.total_rides} corridas
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <p className="font-bold text-yellow-600">
                        {driver.avg_rating.toFixed(1)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBrlNoCents(driver.total_earnings)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
