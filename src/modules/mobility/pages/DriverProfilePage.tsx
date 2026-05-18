import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Crown,
  FileText,
  MapPin,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";

import { useDriverProfile } from "@/modules/mobility/hooks/useDriverProfile";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";

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
  const { driverProfile: profile, isLoading: loading } = useDriverProfile();
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

  const profileAny = profile as Record<string, unknown>;
  const displayName =
    (typeof profileAny.display_name === "string" && profileAny.display_name) ||
    (typeof profileAny.name === "string" && profileAny.name) ||
    "Motorista";
  const avatarUrl =
    typeof profileAny.avatar_url === "string" ? profileAny.avatar_url : undefined;
  const bio = typeof profileAny.bio === "string" ? profileAny.bio : "";
  const isPrioritario = profileAny.subscription_plan === "prioritario";

  const ratingText = formatNumber(profile.rating, 1);
  const totalRidesText =
    typeof profile.total_rides === "number" ? String(profile.total_rides) : "0";
  const totalEarningsText = formatNumber(profileAny.total_earnings, 0);
  const acceptanceRateText = formatNumber(profile.acceptance_rate, 0);
  const totalRatingsText =
    typeof profileAny.total_ratings === "number"
      ? String(profileAny.total_ratings)
      : "0";

  const licenseNumber =
    typeof profile.license_number === "string" && profile.license_number
      ? profile.license_number
      : "Nao informado";
  const licenseExpiryText = formatDate(profile.license_expiry);
  const searchRadiusText =
    typeof profileAny.max_search_radius_km === "number"
      ? `${profileAny.max_search_radius_km} km`
      : "Nao informado";

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
                    isPrioritario
                      ? "border-amber-500/30 bg-amber-500/20 text-amber-400"
                      : "bg-white/10 text-gray-400",
                  )}
                >
                  {isPrioritario ? (
                    <Crown className="mr-1 h-3 w-3" />
                  ) : (
                    <Shield className="mr-1 h-3 w-3" />
                  )}
                  {isPrioritario ? "Prioritario" : "Padrao"}
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
                    {totalEarningsText === "Nao informado"
                      ? totalEarningsText
                      : `R$ ${totalEarningsText}`}
                  </p>
                  <p className="text-xs text-muted-foreground">Total ganho</p>
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
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Raio de busca</p>
            <p className="font-medium">{searchRadiusText}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
