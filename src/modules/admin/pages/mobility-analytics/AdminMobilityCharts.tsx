import { Activity, DollarSign } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/components/ui/chart";
import type { DailyData } from "./AdminMobilityAnalytics.types";
import {
  chartConfig,
  rideStatusDataKeys,
} from "./AdminMobilityAnalytics.types";
import { formatAnalyticsDate } from "./AdminMobilityAnalytics.formatters";

export function AdminMobilityCharts({ dailyData }: { dailyData: DailyData[] }) {
  return (
    <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Corridas por Dia</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillCancelled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tickFormatter={formatAnalyticsDate}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent labelFormatter={(value) => formatAnalyticsDate(value as string)} />
                }
              />
              <Area
                type="monotone"
                dataKey={rideStatusDataKeys.completed}
                stroke="hsl(142 71% 45%)"
                fill="url(#fillCompleted)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey={rideStatusDataKeys.cancelled}
                stroke="hsl(var(--destructive))"
                fill="url(#fillCancelled)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-sm font-medium">Receita Diária (R$)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tickFormatter={formatAnalyticsDate}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent labelFormatter={(value) => formatAnalyticsDate(value as string)} />
                }
              />
              <Bar dataKey="revenue" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
