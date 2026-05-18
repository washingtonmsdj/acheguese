import React from "react";
import {
  CheckCircle2,
  XCircle,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { mobilityService } from "@/modules/mobility/services/MobilityService";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles/services";
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/modules/mobility/constants";

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
      if (!activeProfile?.id) return null;

      // SSOT: Buscar profile_id do motorista usando ProfileService
      const driverProfile = await profileService.getProfileByType(
        activeProfile.id,
        "driver",
      );

      if (!driverProfile) return null;

      // SSOT: Buscar dados de driver_data via MobilityService
      const data = (await mobilityService.getDriverStatsDetailed(
        driverProfile.id,
      )) as Record<string, unknown> | null;

      if (!data) return null;

      // Calcular completion_rate a partir de acceptance_rate
      const completion_rate = Number(data.acceptance_rate || 100);

      return {
        completion_rate: completion_rate,
        cancellation_rate: Number(data.cancellation_rate || 0),
        rating: Number(data.rating || 5.0),
        priority_score: Math.max(0, 100 - Number(data.cancellation_rate || 0) * 2), // Score baseado em cancelamento
      };
    },
    enabled: !!activeProfile?.id,
    // ✅ REALTIME: Estatísticas compactas, cache mais longo
    staleTime: TIMEOUTS.CACHE_STALE_TIME_VERY_LONG,
  });

  if (!stats) return null;

  const isCompletionGood = stats.completion_rate >= 85;
  const isCancellationGood = stats.cancellation_rate <= 15;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Taxa de Conclusão */}
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

      {/* Taxa de Cancelamento */}
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

      {/* Rating */}
      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Avaliação</span>
          <span className="text-sm font-bold text-yellow-500">
            {stats.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="h-8 w-px bg-border" />

      {/* Priority Score */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Prioridade</span>
          <span
            className={`text-sm font-bold ${
              stats.priority_score >= 90
                ? "text-green-500"
                : stats.priority_score >= 75
                  ? "text-blue-500"
                  : stats.priority_score >= 60
                    ? "text-yellow-500"
                    : "text-red-500"
            }`}
          >
            {stats.priority_score.toFixed(0)}/100
          </span>
        </div>
      </div>
    </div>
  );
}
