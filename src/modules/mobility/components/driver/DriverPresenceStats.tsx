import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/shared/components/ui/card";
import { Clock, TrendingUp, Calendar, Award } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import {
  DriverPresenceService,
  type DriverPresenceStats as PresenceStats,
} from "@/core/mobility/services";

interface DriverPresenceStatsProps {
  driverProfileId: string;
  className?: string;
}

export function DriverPresenceStats({
  driverProfileId,
  className,
}: DriverPresenceStatsProps) {
  const [stats, setStats] = useState<PresenceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    DriverPresenceService.getDriverPresenceStats(driverProfileId)
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

  function formatMinutes(minutes: number): string {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  if (loading || !stats) {
    return null;
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-3", className)}>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-teal-500" />
            <span className="text-xs text-muted-foreground">Sessao atual</span>
          </div>
          <div className="text-2xl font-bold text-teal-500">
            {stats.is_currently_online
              ? formatMinutes(stats.current_session_minutes)
              : "---"}
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
            {formatMinutes(stats.online_today_minutes)}
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
            {formatMinutes(stats.online_this_week_minutes)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {formatMinutes(stats.total_online_time_minutes)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.total_sessions} sessoes
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

