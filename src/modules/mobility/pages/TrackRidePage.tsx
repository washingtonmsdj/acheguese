/**
 * PROFILE.1.3b - BURN-DOWN AGRESSIVO
 *
 * TrackRidePage migrado para usar ProfileService como fonte unica de verdade
 * Elimina regras manuais: is_verified
 * Score original: 84 (7 regras manuais)
 */

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Clock,
  User,
  Car,
  Shield,
  AlertTriangle,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { RIDE_STATUS } from "@/modules/mobility/constants";
import { trackError } from "@/shared/utils/errorTracking";
import { profileService } from "@/core/profiles/services/ProfileService"; // ✅ MIGRADO - Usa ProfileService
import { getRideByShareToken, getDriverCompleteProfile } from "@/modules/mobility/services/mobility.queries";
import { incrementRideViewCount } from "@/modules/mobility/services/mobility.mutations";
import type { ProfileContext } from "@/core/profiles/views/ProfileContext"; // ✅ MIGRADO - views/ProfileContext

interface RideTrackingData {
  share_token: string;
  expires_at: string;
  is_active: boolean;
  ride_id: string;
  status: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  type: string;
  ride_created_at: string;
  ride_updated_at: string;
  driver_info: {
    name: string;
    vehicle_model: string;
    vehicle_color: string;
    vehicle_plate: string;
    rating: number;
    // MIGRADO - Removida regra manual is_verified, dados vem do ProfileService
    profileContext?: ProfileContext; // Contexto completo do ProfileService
  } | null;
  passenger_info: {
    name: string;
  };
}

type RideShareRow = {
  id: string;
  passenger_profile_id: string;
  driver_profile_id?: string | null;
  share_token: string;
  share_expires_at?: string | null;
  share_is_active?: boolean | null;
  status: string;
  origin: string;
  destination: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  type: string;
  created_at: string;
  updated_at: string;
};

export default function TrackRidePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<RideTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrackingData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    
    try {
      const rideData = (await getRideByShareToken(token!)) as RideShareRow | null;

      if (!rideData) {
        setError("Link invalido ou expirado");
        return;
      }

      // Verificar expiracao
      if (
        rideData.share_expires_at &&
        new Date(rideData.share_expires_at) < new Date()
      ) {
        setError("Link expirado");
        return;
      }

      // MIGRADO - Buscar dados do passageiro usando ProfileService
      const passengerProfiles = await profileService.getProfilesSummary([
        rideData.passenger_profile_id,
      ]);
      const passengerData = passengerProfiles[0];

      // SSOT: Buscar dados do motorista (se houver)
      let driverData = null;
      if (rideData.driver_profile_id) {
        // MIGRADO - Buscar profile do motorista usando ProfileService
        const driverProfiles = await profileService.getProfilesSummary([
          rideData.driver_profile_id,
        ]);
        const driverProfile = driverProfiles[0];

        if (driverProfile) {
          // ✅ SSOT COMPLETO - Buscar dados usando MobilityService + ProfileService
          const [driverComplete, profileContext] = await Promise.all([
            getDriverCompleteProfile(driverProfile.id),
            profileService.getProfileContext(driverProfile.userId),
          ]);

          if (driverComplete) {
            driverData = {
              name: driverComplete.display_name,
              vehicle_model: driverComplete.vehicle_model,
              vehicle_color: driverComplete.vehicle_color,
              vehicle_plate: driverComplete.vehicle_plate,
              rating: driverComplete.avg_rating,
              profileContext, // ✅ MIGRADO - Contexto completo do ProfileService
            };
          }
        }
      }

      // Transformar para o formato esperado
      const trackingData: RideTrackingData = {
        share_token: rideData.share_token,
        expires_at: rideData.share_expires_at,
        is_active: rideData.share_is_active,
        ride_id: rideData.id,
        status: rideData.status,
        origin: rideData.origin,
        destination: rideData.destination,
        origin_lat: rideData.origin_lat,
        origin_lng: rideData.origin_lng,
        destination_lat: rideData.destination_lat,
        destination_lng: rideData.destination_lng,
        type: rideData.type,
        ride_created_at: rideData.created_at,
        ride_updated_at: rideData.updated_at,
        driver_info: driverData
          ? {
              name: driverData.name,
              vehicle_model: driverData.vehicle_model,
              vehicle_color: driverData.vehicle_color,
              vehicle_plate: driverData.vehicle_plate,
              rating: driverData.rating,
              profileContext: driverData.profileContext, // MIGRADO - Contexto completo do ProfileService
            }
          : null,
        passenger_info: {
          name: passengerData?.name || "Passageiro",
        },
      };

      setData(trackingData);

      // Incrementar contador de visualizações via MobilityService
      await incrementRideViewCount(rideData.id);
    } catch (err) {
      trackError(err as Error, {
        component: "TrackRidePage",
        action: "loadTrackingData",
        metadata: { token },
      });
      setError("Erro ao carregar rastreamento");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const handleManualRefresh = async () => {
    await loadTrackingData(true);
    toast.success("Rastreamento atualizado");
  };

  useEffect(() => {
    if (!token) return;

    loadTrackingData();

    // Realtime updates via useRideRealtime
    const interval = setInterval(() => {
      loadTrackingData();
    }, 10000); // Atualizar a cada 10 segundos

    return () => clearInterval(interval);
  }, [loadTrackingData, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <Navigation className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              Carregando rastreamento
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Buscando informações da corrida...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500/40 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Link invalido</h1>
          <p className="text-muted-foreground">
            {error || "Este link de rastreamento nao existe ou expirou."}
          </p>
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    [RIDE_STATUS.PENDING]: "Aguardando motorista",
    [RIDE_STATUS.DRIVER_ASSIGNED]: "Motorista a caminho",
    [RIDE_STATUS.DRIVER_ON_THE_WAY]: "Motorista chegando",
    [RIDE_STATUS.IN_PROGRESS]: "Viagem em andamento",
    [RIDE_STATUS.COMPLETED]: "Viagem concluída",
    [RIDE_STATUS.CANCELLED]: "Viagem cancelada",
  };

  const statusColors: Record<string, string> = {
    [RIDE_STATUS.PENDING]: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    [RIDE_STATUS.DRIVER_ASSIGNED]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    [RIDE_STATUS.DRIVER_ON_THE_WAY]: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    [RIDE_STATUS.IN_PROGRESS]: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    [RIDE_STATUS.COMPLETED]: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    [RIDE_STATUS.CANCELLED]: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  const activeStatuses: string[] = [
    RIDE_STATUS.DRIVER_ASSIGNED,
    RIDE_STATUS.DRIVER_ON_THE_WAY,
    RIDE_STATUS.IN_PROGRESS,
  ];
  const isActive = activeStatuses.includes(data.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Navigation className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Rastreamento de Corrida
                </h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhe em tempo real
                </p>
              </div>
            </div>
            <Button
              onClick={handleManualRefresh}
              disabled={refreshing}
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Status */}
        <div
          className={`p-4 rounded-2xl border ${statusColors[data.status] || statusColors.pending}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
            <div>
              <p className="text-sm font-semibold">Status da Viagem</p>
              <p className="text-lg font-bold">
                {statusLabels[data.status] || data.status}
              </p>
            </div>
          </div>
        </div>

        {/* Passenger Info */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Passageiro</h2>
          </div>
          <p className="text-foreground font-medium">
            {data.passenger_info.name}
          </p>
        </div>

        {/* Driver Info */}
        {data.driver_info && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Motorista</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-foreground font-medium">
                  {data.driver_info.name}
                </p>
                {data.driver_info.profileContext?.verified && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                    <Shield className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">
                      Verificado
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{data.driver_info.vehicle_model}</span>
                <span>/</span>
                <span>{data.driver_info.vehicle_color}</span>
                <span>/</span>
                <span className="font-mono">
                  {data.driver_info.vehicle_plate}
                </span>
              </div>
              {data.driver_info.rating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">*</span>
                  <span className="text-sm font-medium text-foreground">
                    {data.driver_info.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Route */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Rota</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="text-sm font-medium text-foreground">
                  {data.origin}
                </p>
              </div>
            </div>
            <div className="ml-1.5 border-l-2 border-dashed border-border h-6" />
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm font-medium text-foreground">
                  {data.destination}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Horarios</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criada em:</span>
              <span className="text-foreground font-medium">
                {new Date(data.ride_created_at).toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Ultima atualizacao:
              </span>
              <span className="text-foreground font-medium">
                {new Date(data.ride_updated_at).toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Link expira em:</span>
              <span className="text-foreground font-medium">
                {new Date(data.expires_at).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        {isActive && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm font-semibold text-emerald-400">
                Rastreamento ao vivo / Atualizacoes em tempo real
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            Este link e privado e expira automaticamente apos 24 horas
          </p>
        </div>
      </div>
    </div>
  );
}
