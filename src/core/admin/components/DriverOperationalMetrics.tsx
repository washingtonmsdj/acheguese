import {
  Activity,
  Car,
  Route,
  Star,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export interface DriverOperationalMetricRow {
  id: string;
  name: string;
  avatar_url?: string;
  total_rides: number;
  rating: number;
  is_online: boolean;
}

interface DriverOperationalMetricsProps {
  drivers: readonly DriverOperationalMetricRow[];
}

function averageRating(drivers: readonly DriverOperationalMetricRow[]): number | null {
  const ratedDrivers = drivers.filter(
    (driver) => Number.isFinite(driver.rating) && driver.rating > 0,
  );
  if (ratedDrivers.length === 0) return null;

  return ratedDrivers.reduce((sum, driver) => sum + driver.rating, 0) / ratedDrivers.length;
}

export function DriverOperationalMetrics({ drivers }: DriverOperationalMetricsProps) {
  const onlineDrivers = drivers.filter((driver) => driver.is_online).length;
  const totalRides = drivers.reduce(
    (sum, driver) => sum + Math.max(0, driver.total_rides || 0),
    0,
  );
  const avgRating = averageRating(drivers);
  const topRated = [...drivers]
    .filter((driver) => driver.total_rides >= 5 && driver.rating > 0)
    .sort((a, b) => b.rating - a.rating || b.total_rides - a.total_rides)
    .slice(0, 5);

  const overview = [
    {
      label: "Motoristas cadastrados",
      value: String(drivers.length),
      helper: "Perfis presentes no read model administrativo",
      icon: Users,
    },
    {
      label: "Online agora",
      value: String(onlineDrivers),
      helper: "Presenca lida de driver_availability",
      icon: Activity,
    },
    {
      label: "Corridas registradas",
      value: String(totalRides),
      helper: "Soma do contador operacional dos motoristas",
      icon: Route,
    },
    {
      label: "Avaliacao media",
      value: avgRating == null ? "N/A" : avgRating.toFixed(1),
      helper: "Media entre motoristas com avaliacao registrada",
      icon: Star,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardContent className="p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4 text-primary" />
            Motoristas melhor avaliados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topRated.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda nao ha motoristas com pelo menos cinco corridas e avaliacao registrada.
            </p>
          ) : (
            <div className="space-y-3">
              {topRated.map((driver, index) => (
                <div
                  key={driver.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={driver.avatar_url} />
                    <AvatarFallback>
                      {(driver.name || "M").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{driver.name || "Motorista"}</p>
                      {driver.is_online ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="Online" />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {driver.total_rides} corridas registradas
                    </p>
                  </div>
                  <div className="flex items-center gap-1 font-semibold">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    {driver.rating.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
