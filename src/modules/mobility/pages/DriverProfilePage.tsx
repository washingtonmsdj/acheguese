import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";

import { MOBILITY_QUERY_KEYS, TIMEOUTS } from "@/core/mobility/constants";
import { mobilityService } from "@/core/mobility/services/runtime";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
import { useServiceAreas } from "@/core/service-areas";
import { useDriverProfile } from "@/modules/mobility/hooks/useDriverProfile";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import { formatBrlNoCents } from "@/shared/utils/currency";

function formatNumber(value: unknown, digits = 0): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Nao informado";
  }

  return value.toFixed(digits);
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return "Nao informado";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Nao informado";
  }

  return parsed.toLocaleDateString("pt-BR");
}

export default function DriverProfilePage() {
  const navigate = useNavigate();
  const mobilityUrls = useMobilityUrls();
  const {
    driverProfile: profile,
    driverProfileId,
    driverIdentity,
    isLoading: loading,
  } = useDriverProfile();

  const { data: profileMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: MOBILITY_QUERY_KEYS.driverProfileMetrics(driverProfileId ?? ""),
    queryFn: async () => {
      if (!driverProfileId) return null;

      const [earnings30d, reviewCount] = await Promise.all([
        mobilityService.getDriverEarnings(driverProfileId, 30),
        ReviewsService.getReviewCount(driverProfileId, "driver" as never),
      ]);

      return {
        earnings30d,
        reviewCount: reviewCount ?? 0,
      };
    },
    enabled: !!driverProfileId,
    staleTime: TIMEOUTS.CACHE_STALE_TIME_LONG,
  });

  const {
    data: serviceAreas = [],
    isLoading: serviceAreasLoading,
    error: serviceAreasError,
  } = useServiceAreas(driverProfileId ?? "");

  const error = !profile && !loading;

  if (loading) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="mb-4 h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(mobilityUrls.motorista.home)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              {error ? "Erro ao carregar perfil" : "Perfil de motorista nao encontrado"}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = driverIdentity?.displayName || "Motorista";
  const avatarUrl = driverIdentity?.avatarUrl || undefined;
  const bio = driverIdentity?.bio || "";
  const hasActiveSubscription = profile.subscription_active === true;

  const ratingText = formatNumber(profile.rating, 1);
  const totalRidesText =
    typeof profile.total_rides === "number" ? String(profile.total_rides) : "0";
  const totalEarningsText = metricsLoading
    ? "Carregando"
    : profileMetrics
      ? formatBrlNoCents(profileMetrics.earnings30d)
      : "Nao informado";
  const acceptanceRateText = formatNumber(profile.acceptance_rate, 0);
  const totalRatingsText = metricsLoading
    ? "..."
    : String(profileMetrics?.reviewCount ?? 0);

  const licenseNumber =
    typeof profile.license_number === "string" && profile.license_number
      ? profile.license_number
      : "Nao informado";
  const licenseExpiryText = formatDate(profile.license_expiry);

  const activeServiceAreas = serviceAreas.filter((area) => area.is_active);
  const primaryServiceArea =
    activeServiceAreas.find((area) => area.is_primary) ?? activeServiceAreas[0] ?? null;

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(mobilityUrls.motorista.home)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Card className="mb-4 p-6">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex flex-col items-center md:items-start">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-teal-400/30">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-2xl font-bold text-white">
                    {displayName[0] || "M"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background",
                    profile.is_online ? "bg-emerald-400" : "bg-gray-600",
                  )}
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      profile.is_online ? "animate-pulse bg-white" : "bg-gray-400",
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {profile.is_verified ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : null}
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <Badge
                  className={cn(
                    "text-xs",
                    hasActiveSubscription
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "bg-white/10 text-gray-400",
                  )}
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {hasActiveSubscription ? "Assinatura ativa" : "Sem assinatura ativa"}
                </Badge>
                {profile.is_verified ? (
                  <Badge className="border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400">
                    Verificado
                  </Badge>
                ) : null}
                <Badge
                  className={cn(
                    "text-xs",
                    profile.is_online
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-gray-500/10 text-gray-400",
                  )}
                >
                  {profile.is_online ? "Online" : "Offline"}
                </Badge>
              </div>

              {bio ? (
                <p className="mb-4 text-sm text-muted-foreground">{bio}</p>
              ) : null}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-3 text-center">
                  <Star className="mx-auto mb-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <p className="text-lg font-bold text-yellow-400">{ratingText}</p>
                  <p className="text-xs text-muted-foreground">{totalRatingsText} avaliacoes</p>
                </div>
                <div className="rounded-lg border border-teal-500/10 bg-teal-500/5 p-3 text-center">
                  <TrendingUp className="mx-auto mb-1 h-4 w-4 text-teal-400" />
                  <p className="text-lg font-bold text-teal-400">{totalRidesText}</p>
                  <p className="text-xs text-muted-foreground">Corridas</p>
                </div>
                <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 text-center">
                  <TrendingUp className="mx-auto mb-1 h-4 w-4 text-emerald-400" />
                  <p className="text-lg font-bold text-emerald-400">
                    {totalEarningsText}
                  </p>
                  <p className="text-xs text-muted-foreground">Ganhos nos ultimos 30 dias</p>
                </div>
                <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 p-3 text-center">
                  <Clock className="mx-auto mb-1 h-4 w-4 text-purple-400" />
                  <p className="text-lg font-bold text-purple-400">
                    {acceptanceRateText === "Nao informado"
                      ? acceptanceRateText
                      : `${acceptanceRateText}%`}
                  </p>
                  <p className="text-xs text-muted-foreground">Aceitacao</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-4 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Car className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold">Veiculo</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Modelo</p>
              <p className="font-medium">{profile.vehicle_model || "Nao informado"}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Placa</p>
              <p className="font-mono font-medium">{profile.vehicle_plate || "Nao informado"}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Ano</p>
              <p className="font-medium">{profile.vehicle_year || "Nao informado"}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Cor</p>
              <p className="font-medium">{profile.vehicle_color || "Nao informado"}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-4 p-6">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold">Documentacao</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">CNH</p>
              <p className="font-mono font-medium">{licenseNumber}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Validade da CNH</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{licenseExpiryText}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold">Area de atuacao</h2>
          </div>

          {serviceAreasLoading ? (
            <p className="text-sm text-muted-foreground">Carregando cobertura territorial...</p>
          ) : serviceAreasError ? (
            <p className="text-sm text-destructive">Nao foi possivel carregar a area de atuacao.</p>
          ) : !primaryServiceArea ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma area de atuacao ativa configurada para este perfil.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Area principal
                </p>
                <p className="mt-1 font-medium">{primaryServiceArea.location_full_name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {primaryServiceArea.radius_km != null
                    ? `Cobertura em raio de ${primaryServiceArea.radius_km} km`
                    : "Cobertura territorial cadastrada"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted-foreground">
                  {activeServiceAreas.length} {activeServiceAreas.length === 1 ? "area ativa" : "areas ativas"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeServiceAreas.slice(0, 4).map((area) => (
                    <Badge key={area.id} variant="outline">
                      {area.location_name}
                    </Badge>
                  ))}
                  {activeServiceAreas.length > 4 ? (
                    <Badge variant="secondary">+{activeServiceAreas.length - 4}</Badge>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
