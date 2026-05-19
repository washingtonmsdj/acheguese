import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
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
        <CardTitle className="text-sm font-medium">Distribuição de Corridas</CardTitle>
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
            <div className="flex flex-wrap gap-2 justify-center -mt-2">
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
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
        )}
      </CardContent>
    </Card>
  );
}

function TopDrivers({ topDrivers }: { topDrivers: TopDriverAnalytics[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top Motoristas</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        {topDrivers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Sem dados</p>
        ) : (
          <div className="space-y-3">
            {topDrivers.map((item, index) => (
              <div key={item.driver.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.driver.profile?.name || item.driver.name || "Motorista"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} corridas · {formatAnalyticsCurrency(item.revenue)}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
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
        <CardTitle className="text-sm font-medium">Status dos Motoristas</CardTitle>
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
            <span className="text-sm">Pendentes</span>
          </div>
          <span className="text-sm font-bold">{stats.pendingDrivers}</span>
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
