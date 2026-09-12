import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type {
  MobilidadeStats,
  RideDistributionItem,
  TopDriverAnalytics,
} from "./AdminMobilityAnalytics.types";
import { PIE_COLORS } from "./AdminMobilityAnalytics.types";
import { formatAnalyticsCurrency } from "./AdminMobilityAnalytics.formatters";

function RideDistribution({ items }: { items: RideDistributionItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Distribuição do Lifecycle</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {items.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-2 flex flex-wrap justify-center gap-2">
              {items.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}

function TopDrivers({ topDrivers }: { topDrivers: TopDriverAnalytics[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top Motoristas por Conclusões</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {topDrivers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sem dados</p>
        ) : (
          <div className="space-y-3">
            {topDrivers.map((item, index) => (
              <div key={item.driver.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.driver.profile?.name || item.driver.name || "Motorista"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} concluídas · {formatAnalyticsCurrency(item.completedValue)} em valor concluído
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DriverStatus({ stats }: { stats: MobilidadeStats }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Verificação dos Motoristas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm">Verificados</span>
          </div>
          <span className="text-sm font-bold">{stats.verifiedDrivers}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-sm">Não verificados</span>
          </div>
          <span className="text-sm font-bold">{stats.unverifiedDrivers}</span>
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
  );
}

export function AdminMobilitySidebar({
  rideDistribution,
  stats,
  topDrivers,
}: {
  rideDistribution: RideDistributionItem[];
  stats: MobilidadeStats;
  topDrivers: TopDriverAnalytics[];
}) {
  return (
    <div className="space-y-6">
      <RideDistribution items={rideDistribution} />
      <TopDrivers topDrivers={topDrivers} />
      <DriverStatus stats={stats} />
    </div>
  );
}
