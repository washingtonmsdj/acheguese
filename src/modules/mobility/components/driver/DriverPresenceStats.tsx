import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Clock, TrendingUp, Calendar, Radio } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  DriverActivityStatsService,
  type DriverActivityStats,
} from "@/core/mobility/services";

interface DriverPresenceStatsProps {
  driverProfileId: string;
  className?: string;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function statusLabel(stats: DriverActivityStats): string {
  if (!stats.isCurrentlyOnline) return "Offline";
  if (stats.availabilityStatus === "busy") return "Em operação";
  if (stats.availabilityStatus === "online_available") return "Disponível";
  return "Online";
}

export function DriverPresenceStats({
  driverProfileId,
  className,
}: DriverPresenceStatsProps) {
  const [stats, setStats] = useState<DriverActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    DriverActivityStatsService.getStats(driverProfileId)
      .then((data) => {
        if (!isMounted) return;
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setStats(null);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [driverProfileId]);

  if (loading || !stats) {
    return null;
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Radio className="h-4 w-4 text-teal-500" />
            <span className="text-xs text-muted-foreground">Agora</span>
          </div>
          <div className="text-lg font-bold text-teal-500">
            {statusLabel(stats)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Presença operacional em tempo real
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Hoje</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">
            {formatMinutes(stats.completedRideMinutesToday)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Em corridas concluídas
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Esta semana</span>
          </div>
          <div className="text-2xl font-bold text-purple-500">
            {formatMinutes(stats.completedRideMinutesThisWeek)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Em corridas concluídas
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Histórico</span>
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {formatMinutes(stats.completedRideMinutesTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.completedRideCount} corridas concluídas
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
