import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityData } from "@/core/admin/services/AdminStatsService";
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

const chartConfig = {
  posts: { label: "Posts", color: "hsl(var(--destructive))" },
  users: { label: "Usuários", color: "hsl(var(--primary))" },
  businesses: { label: "Empresas", color: "hsl(45 93% 47%)" },
  eventos: { label: "Eventos", color: "hsl(262 83% 58%)" },
  classificados: { label: "Classificados", color: "hsl(160 60% 45%)" },
};

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

export function AdminDashboardCharts({ activity }: { activity: ActivityData[] }) {
  return (
    <div className="lg:col-span-2 space-y-6">
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
                <linearGradient id="fillUsuarios" x1="0" y1="0" x2="0" y2="1">
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
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent labelFormatter={(value) => formatDate(value as string)} />
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cadastros por tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart
              data={activity}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent labelFormatter={(value) => formatDate(value as string)} />
                }
              />
              <Bar dataKey="businesses" fill="hsl(45 93% 47%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="eventos" fill="hsl(262 83% 58%)" radius={[3, 3, 0, 0]} />
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
  );
}
