/**
 * Componente para motorista enviar localização em tempo real
 * 
 * AGORA USA: core/tracking (SSOT)
 * 
 * Usa useGeolocationTracking do core para rastreio GPS.
 * Integra com TrackingService para persistência.
 */

import { memo, useEffect } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { useGeolocationTracking } from "@/core/tracking";
import { cn } from "@/shared/utils/cn";
import { logger } from "@/shared/utils/logger";

interface DriverLocationSenderProps {
  driverProfileId: string;
  rideId?: string;
  isDriverOnline: boolean;
  updateInterval?: number;
  className?: string;
}

export const DriverLocationSender = memo(
  ({
    driverProfileId,
    rideId,
    isDriverOnline,
    updateInterval = 10,
    className,
  }: DriverLocationSenderProps) => {
    // Usa hook do core/tracking para rastreio GPS
    const {
      isTracking,
      currentPosition,
      error,
      lastUpdate,
      startTracking,
      stopTracking,
    } = useGeolocationTracking({
      entityId: driverProfileId,
      entityType: 'driver',
      enabled: isDriverOnline,
      updateInterval: updateInterval * 1000, // converte para ms
      geolocationOptions: {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    });

    // Controle automático baseado no status online
    useEffect(() => {
      if (!driverProfileId) {
        if (import.meta.env.DEV) {
          logger.info("⏳ Aguardando driverProfileId ser carregado...");
        }
        return;
      }

      if (isDriverOnline) {
        if (import.meta.env.DEV) {
          logger.info(" Iniciando rastreamento para driverProfileId:", driverProfileId);
        }
        startTracking();
      } else {
        stopTracking();
      }
    }, [isDriverOnline, driverProfileId, startTracking, stopTracking]);

    return (
      <div className={cn("flex items-center gap-3", className)}>
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isDriverOnline ? (
            isTracking ? (
              error ? (
                <Badge
                  variant="outline"
                  className="bg-red-500/20 text-red-400 border-red-500/30"
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Erro GPS
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-green-500/20 text-green-400 border-green-500/30"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                  GPS Ativo
                </Badge>
              )
            ) : (
              <Badge
                variant="outline"
                className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              >
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Iniciando GPS...
              </Badge>
            )
          ) : (
            <Badge
              variant="outline"
              className="bg-gray-500/20 text-gray-400 border-gray-500/30"
            >
              <MapPin className="w-3 h-3 mr-1" />
              GPS Inativo
            </Badge>
          )}
        </div>

        {/* Mensagem de erro detalhada */}
        {error && <div className="text-xs text-red-400 max-w-xs">{error}</div>}

        {/* Última atualização */}
        {lastUpdate && (
          <span className="text-xs text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </span>
        )}

        {/* Coordenadas atuais (debug) */}
        {import.meta.env.DEV && currentPosition && (
          <span className="text-xs text-gray-500">
            {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
          </span>
        )}
      </div>
    );
  },
);

DriverLocationSender.displayName = "DriverLocationSender";