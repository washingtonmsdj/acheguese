/**
 * Public ride tracking.
 *
 * The bearer token belongs to the Safety bounded context. The page consumes
 * only the privacy-limited projection exposed by SafetyService; it never reads
 * ride_requests or ride_shares directly.
 */

import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  MapPin,
  Clock,
  Car,
  AlertTriangle,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { RIDE_STATUS } from "@/core/mobility/constants";
import { useSharedRideData } from "@/core/safety/hooks/useRideShare";
import { incrementRideViewCount } from "@/core/mobility/services/mobility.mutations";

export default function TrackRidePage() {
  const { token } = useParams<{ token: string }>();
  const countedRideId = useRef<string | null>(null);
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useSharedRideData(token);

  useEffect(() => {
    if (!data?.rideId || countedRideId.current === data.rideId) {
      return;
    }

    countedRideId.current = data.rideId;
    void incrementRideViewCount(data.rideId);
  }, [data?.rideId]);

  const handleManualRefresh = async () => {
    await refetch();
    toast.success("Rastreamento atualizado");
  };

  if (isLoading) {
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
              Buscando informacoes da corrida...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (queryError || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500/40 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Link invalido</h1>
          <p className="text-muted-foreground">
            Este link nao existe, expirou ou foi revogado.
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
    [RIDE_STATUS.COMPLETED]: "Viagem concluida",
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
  const hasDriver = Boolean(data.driverName || data.vehicleModel || data.vehiclePlate);

  return (
    <div className="min-h-screen bg-background">
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
              disabled={isFetching}
              variant="outline"
              size="icon"
              className="h-10 w-10"
            >
              <RefreshCw className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
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

        {hasDriver && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Motorista</h2>
            </div>
            <div className="space-y-2">
              {data.driverName && (
                <p className="text-foreground font-medium">{data.driverName}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {data.vehicleModel && <span>{data.vehicleModel}</span>}
                {data.vehiclePlate && (
                  <span className="font-mono">{data.vehiclePlate}</span>
                )}
              </div>
            </div>
          </div>
        )}

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
                <p className="text-sm font-medium text-foreground">{data.origin}</p>
              </div>
            </div>
            <div className="ml-1.5 border-l-2 border-dashed border-border h-6" />
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm font-medium text-foreground">{data.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {data.currentLocation && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Ultima localizacao</h2>
            </div>
            <p className="text-sm text-foreground font-medium">
              {data.currentLocation.latitude.toFixed(5)},{" "}
              {data.currentLocation.longitude.toFixed(5)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizada em{" "}
              {new Date(data.currentLocation.timestamp).toLocaleString("pt-BR")}
            </p>
          </div>
        )}

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

        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            Este link e privado e expira ou pode ser revogado automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
