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
import { profileService } from "@/core/profiles/services";
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
      if (!activeProfile?.id || !activeProfile.userId) return null;

      const driverProfileId =
        activeProfile.profileType === "driver"
          ? activeProfile.id
          : (await profileService.getProfileByType(activeProfile.userId, "driver"))?.id;

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

  const isCompletionGood = stats.completion_rate >= 85;
  const isCancellationGood = stats.cancellation_rate <= 15;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg">Suas Estatísticas</CardTitle>
        <CardDescription>Desempenho registrado como motorista</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 ${isCompletionGood ? "text-green-500" : "text-yellow-500"}`}
              />
              <span className="text-sm font-medium">Taxa de Conclusão</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-bold ${isCompletionGood ? "text-green-500" : "text-yellow-500"}`}
              >
                {stats.completion_rate.toFixed(1)}%
              </span>
              {isCompletionGood ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>
          <Progress
            value={stats.completion_rate}
            className={`h-2 ${isCompletionGood ? "[&>div]:bg-green-500" : "[&>div]:bg-yellow-500"}`}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {stats.completed_rides} concluídas de {stats.total_rides} corridas
              registradas
            </span>
            {!isCompletionGood && stats.total_rides > 0 && (
              <span className="text-yellow-600 font-medium">
                Referência: 85% ou mais
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle
                className={`w-4 h-4 ${isCancellationGood ? "text-green-500" : "text-red-500"}`}
              />
              <span className="text-sm font-medium">Taxa de Cancelamento</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-bold ${isCancellationGood ? "text-green-500" : "text-red-500"}`}
              >
                {stats.cancellation_rate.toFixed(1)}%
              </span>
              {isCancellationGood ? (
                <TrendingDown className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          <Progress
            value={stats.cancellation_rate}
            className={`h-2 ${isCancellationGood ? "[&>div]:bg-green-500" : "[&>div]:bg-red-500"}`}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stats.cancelled_rides} corridas canceladas</span>
            {!isCancellationGood && (
              <span className="text-red-600 font-medium">
                Referência: 15% ou menos
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium">Avaliação</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-yellow-500">
                {stats.rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({stats.total_ratings} avaliações)
              </span>
            </div>
          </div>
          <Progress
            value={(stats.rating / 5) * 100}
            className="h-2 [&>div]:bg-yellow-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {stats.total_rides}
            </p>
            <p className="text-xs text-muted-foreground">Registradas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.completed_rides}
            </p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {stats.cancelled_rides}
            </p>
            <p className="text-xs text-muted-foreground">Canceladas</p>
          </div>
        </div>

        {stats.completion_rate < 85 && stats.total_rides > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-yellow-600">
                  Taxa de conclusão abaixo da referência
                </p>
                <p className="text-muted-foreground">
                  O indicador usa corridas concluídas sobre o total de corridas
                  registradas para este motorista.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.cancellation_rate > 15 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-red-600">
                  Taxa de cancelamento alta
                </p>
                <p className="text-muted-foreground">
                  Evite cancelar corridas após aceitá-las quando puder concluir o
                  atendimento com segurança.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
