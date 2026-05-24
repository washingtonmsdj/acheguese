import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Star,
  Target,
  Award,
  AlertTriangle,
} from "lucide-react";
import { useSessionContext } from "@/core/session";
import { profileService } from "@/core/profiles/services";
import { useQuery } from "@tanstack/react-query";
import { mobilityService } from "@/modules/mobility/services/MobilityService";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/modules/mobility/constants";

interface DriverStats {
  // Métricas principais
  accepted_rides: number;
  completed_rides: number;
  failed_rides: number;
  total_rides: number;

  // Taxas calculadas
  completion_rate: number;
  cancellation_rate: number;
  priority_score: number;

  // Rating
  rating: number;
  total_ratings: number;

  // Ganhos
  total_earnings: number;
}

export function DriverStatsCard() {
  const { activeProfile } = useSessionContext();

  const { data: stats, isLoading } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.driverStats(activeProfile?.id || ""),
    queryFn: async () => {
      if (!activeProfile?.id) return null;

      // SSOT: Buscar profile_id do motorista usando ProfileService
      const driverProfile = await profileService.getProfileByType(
        activeProfile.id,
        "driver",
      );

      if (!driverProfile) return null;

      // SSOT: Buscar dados de driver_data via MobilityService
      const driverData = (await mobilityService.getDriverStatsDetailed(
        driverProfile.id,
      )) as Record<string, unknown> | null;

      if (!driverData) return null;

      // Buscar total de ganhos dos últimos 30 dias via MobilityService
      const totalEarnings = await mobilityService.getDriverEarnings(
        driverProfile.id,
        30,
      );

      // Buscar contagem de reviews via ReviewsService
      const reviewCount = await ReviewsService.getReviewCount(
        driverProfile.id,
        "driver" as never,
      );

      return {
        accepted_rides: Number(driverData.total_rides || 0),
        completed_rides: Number(driverData.total_rides_completed || 0),
        failed_rides: Number(driverData.total_rides_cancelled || 0),
        total_rides: Number(driverData.total_rides || 0),
        completion_rate: Number(driverData.acceptance_rate || 100),
        cancellation_rate: Number(driverData.cancellation_rate || 0),
        priority_score: Math.max(
          0,
          100 - Number(driverData.cancellation_rate || 0) * 2,
        ),
        rating: Number(driverData.rating || 5.0),
        total_ratings: reviewCount || 0,
        total_earnings: totalEarnings,
      } as DriverStats;
    },
    enabled: !!activeProfile?.id,
    // ✅ REALTIME: Estatísticas não críticas, cache mais longo
    staleTime: TIMEOUTS.CACHE_STALE_TIME_LONG,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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

  // Determinar nível de prioridade
  const getPriorityLevel = (score: number) => {
    if (score >= 90)
      return { label: "Excelente", color: "bg-green-500", icon: Award };
    if (score >= 75)
      return { label: "Bom", color: "bg-blue-500", icon: TrendingUp };
    if (score >= 60)
      return { label: "Regular", color: "bg-yellow-500", icon: Target };
    return { label: "Baixo", color: "bg-red-500", icon: AlertTriangle };
  };

  const priorityLevel = getPriorityLevel(stats.priority_score);
  const PriorityIcon = priorityLevel.icon;

  // Determinar se taxas são boas ou ruins
  const isCompletionGood = stats.completion_rate >= 85;
  const isCancellationGood = stats.cancellation_rate <= 15;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Suas Estatísticas</CardTitle>
            <CardDescription>Desempenho como motorista</CardDescription>
          </div>
          <Badge className={`${priorityLevel.color} text-white`}>
            <PriorityIcon className="w-3 h-3 mr-1" />
            {priorityLevel.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score de Prioridade */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Score de Prioridade</span>
            </div>
            <span className="text-2xl font-bold text-primary">
              {stats.priority_score.toFixed(0)}/100
            </span>
          </div>
          <Progress value={stats.priority_score} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Quanto maior, mais prioridade você tem no sistema de match
          </p>
        </div>

        {/* Taxa de Conclusão */}
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
              {stats.completed_rides} completadas de {stats.accepted_rides}{" "}
              aceitas
            </span>
            {!isCompletionGood && (
              <span className="text-yellow-600 font-medium">
                Mantenha acima de 85%
              </span>
            )}
          </div>
        </div>

        {/* Taxa de Cancelamento */}
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
            <span>
              {stats.failed_rides} canceladas de {stats.accepted_rides} aceitas
            </span>
            {!isCancellationGood && (
              <span className="text-red-600 font-medium">
                Mantenha abaixo de 15%
              </span>
            )}
          </div>
        </div>

        {/* Rating */}
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

        {/* Resumo de Corridas */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              {stats.total_rides}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">
              {stats.completed_rides}
            </p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">
              {stats.failed_rides}
            </p>
            <p className="text-xs text-muted-foreground">Canceladas</p>
          </div>
        </div>

        {/* Alertas e Dicas */}
        {stats.completion_rate < 85 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-yellow-600">
                  Sua taxa de conclusão está abaixo do ideal
                </p>
                <p className="text-muted-foreground">
                  Complete mais corridas para melhorar sua prioridade no sistema
                  de match. Meta: 85% ou mais.
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
                  Evite cancelar corridas após aceitar. Isso reduz seu score de
                  prioridade. Meta: 15% ou menos.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.priority_score >= 90 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Award className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-medium text-green-600">
                  Excelente desempenho!
                </p>
                <p className="text-muted-foreground">
                  Você tem prioridade máxima no sistema de match. Continue
                  assim!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
