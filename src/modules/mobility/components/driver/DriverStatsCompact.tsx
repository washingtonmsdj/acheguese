import React from "react";
import {
  CheckCircle2,
  XCircle,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mobilityService } from "@/core/mobility/services/MobilityService";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles/services";
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/core/mobility/constants";

interface DriverStatsCompactProps {
  className?: string;
}

export function DriverStatsCompact({
  className = "",
}: DriverStatsCompactProps) {
  const { activeProfile } = useSessionContext();

  const { data: stats } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.driverStatsCompact(activeProfile?.id || ""),
    queryFn: async () => {
      if (!activeProfile?.id || !activeProfile.userId) return null;

      const driverProfileId =
        activeProfile.profileType === "driver"
          ? activeProfile.id
          : (await profileService.getProfileByType(activeProfile.userId, "driver"))?.id;

      if (!driverProfileId) return null;

      const data = (await mobilityService.getDriverStatsDetailed(
        driverProfileId,
      )) as Record<string, unknown> | null;

      if (!data) return null;

      const totalRides = Number(data.total_rides ?? 0);
      const completedRides = Number(data.total_rides_completed ?? 0);
      const completionRate =
        totalRides > 0 ? Math.min(100, (completedRides / totalRides) * 100) : 0;

      return {
        completion_rate: completionRate,
        cancellation_rate: Number(data.cancellation_rate ?? 0),
        rating: Number(data.rating ?? 0),
      };
    },
    enabled: !!activeProfile?.id,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  if (!stats) return null;

  const isCompletionGood = stats.completion_rate >= 85;
  const isCancellationGood = stats.cancellation_rate <= 15;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-1.5">
        <CheckCircle2
          className={`w-4 h-4 ${isCompletionGood ? "text-green-500" : "text-yellow-500"}`}
        />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Conclusão</span>
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-bold ${isCompletionGood ? "text-green-500" : "text-yellow-500"}`}
            >
              {stats.completion_rate.toFixed(0)}%
            </span>
            {isCompletionGood ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-yellow-500" />
            )}
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <XCircle
          className={`w-4 h-4 ${isCancellationGood ? "text-green-500" : "text-red-500"}`}
        />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Cancelamento</span>
          <div className="flex items-center gap-1">
            <span
              className={`text-sm font-bold ${isCancellationGood ? "text-green-500" : "text-red-500"}`}
            >
              {stats.cancellation_rate.toFixed(0)}%
            </span>
            {isCancellationGood ? (
              <TrendingDown className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingUp className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Avaliação</span>
          <span className="text-sm font-bold text-yellow-500">
            {stats.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
