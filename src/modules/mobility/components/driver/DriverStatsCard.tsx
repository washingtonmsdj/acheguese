import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Star,
  AlertTriangle,
} from "lucide-react";
import { useSessionContext } from "@/core/session";
import { useQuery } from "@tanstack/react-query";
import { mobilityService } from "@/core/mobility/services/MobilityService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/core/mobility/constants";

interface DriverStats {
  completed_rides: number;
  cancelled_rides: number;
  total_rides: number;
  completion_rate: number;
  cancellation_rate: number;
  rating: number;
  total_ratings: number;
}

export function DriverStatsCard() {
  const { activeProfile } = useSessionContext();

  const { data: stats, isLoading } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.driverStats(activeProfile?.id || ""),
    queryFn: async () => {
      if (!activeProfile?.id) return null;

      const driverProfile = activeProfile.userId
        ? await import("@/core/profiles/services/ProfileService").then(({ profileService }) =>
            profileService.getProfileByType(activeProfile.userId, "driver"),
          )
        : null;
      const driverProfileId = driverProfile?.id ?? null;

      if (!driverProfileId) return null;

      const driverData = (await mobilityService.getDriverStatsDetailed(
        driverProfileId,
      )) as Record<string, unknown> | null;

      if (!driverData) return null;

      const reviewCount = await ReviewsService.getReviewCount(
        driverProfileId,
        "driver" as never,
      );

      const totalRides = Number(driverData.total_rides ?? 0);
      const completedRides = Number(driverData.total_rides_completed ?? 0);
      const cancelledRides = Number(driverData.total_rides_cancelled ?? 0);
      const completionRate =
        totalRides > 0 ? Math.min(100, (completedRides / totalRides) * 100) : 0;

      return {
        completed_rides: completedRides,
        cancelled_rides: cancelledRides,
        total_rides: totalRides,
        completion_rate: completionRate,
        cancellation_rate: Number(driverData.cancellation_rate ?? 0),
        rating: Number(driverData.rating ?? 0),
        total_ratings: reviewCount ?? 0,
      } as DriverStats;
    },
    enabled: !!activeProfile?.id,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_LONG,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Estatísticas não disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas do motorista</CardTitle>
        <CardDescription>Desempenho recente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Corridas concluídas</span>
          <span className="font-semibold">{stats.completed_rides}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Taxa de conclusão</span>
            <span className="font-semibold">{stats.completion_rate.toFixed(0)}%</span>
          </div>
          <Progress value={stats.completion_rate} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cancelamentos</span>
          <span className="font-semibold">{stats.cancelled_rides}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avaliação</span>
          <span className="flex items-center gap-1 font-semibold">
            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            {stats.rating.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {stats.completion_rate >= 85 ? (
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {stats.completion_rate >= 85
              ? "Boa taxa de conclusão"
              : "A taxa de conclusão pode melhorar"}
          </span>
        </div>
        {stats.cancellation_rate > 15 ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Taxa de cancelamento elevada</span>
          </div>
        ) : null}
        {stats.total_ratings > 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{stats.total_ratings} avaliações</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            <span>Ainda sem avaliações</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}