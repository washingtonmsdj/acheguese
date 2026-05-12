/**
 * useDriverLocation - Hook para rastreio de localização de motorista
 *
 * AGORA USA: core/tracking (SSOT)
 *
 * Mantém interface compatível para consumidores existentes.
 * Internamente delega para useTracking do core.
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from "react";
import { routingService } from '@/core/routing';
import { trackingService } from '@/core/tracking';
import type { TrackingPosition } from '@/core/tracking';
interface DriverLocationData {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  accuracy: number;
  updated_at: string;
  timestamp: string;
}

interface DriverEtaData {
  eta_minutes: number;
  distance_km: number;
  duration_seconds: number;
  distance_meters: number;
}

export function useDriverLocation(
  params:
    | string
    | { driverProfileId: string; rideId?: string; enabled?: boolean },
) {
  const driverProfileId =
    typeof params === "string" ? params : params.driverProfileId;
  const enabled = typeof params === "string" ? true : (params.enabled ?? true);

  const [location, setLocation] = useState<DriverLocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState<DriverEtaData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!driverProfileId || !enabled) return;

    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      // Carregar posição inicial via TrackingService
      const position = await trackingService.getCurrentPosition(driverProfileId, 'driver');
      if (position) {
        setLocation({
          latitude: position.latitude,
          longitude: position.longitude,
          heading: position.heading ?? 0,
          speed: position.speed ?? 0,
          accuracy: position.accuracy,
          updated_at: position.timestamp as string,
          timestamp: position.timestamp as string,
        });
        setIsConnected(true);
      }
      setLoading(false);

      // Subscrever a atualizações via TrackingService
      subscription = trackingService.subscribeToPosition(
        driverProfileId,
        (position: TrackingPosition) => {
          setLocation({
            latitude: position.latitude,
            longitude: position.longitude,
            heading: position.heading ?? 0,
            speed: position.speed ?? 0,
            accuracy: position.accuracy,
            updated_at: position.timestamp as string,
            timestamp: position.timestamp as string,
          });
          setIsConnected(true);
        },
        'driver'
      );
    };

    init();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [driverProfileId, enabled]);

  const calculateETA = useCallback(
    async (destLat: number, destLng: number) => {
      if (!location) return;
      
      try {
        const response = await routingService.calculateSimpleETA(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: destLat, longitude: destLng },
          'car'
        );
        
        if (response) {
          const minutes = Math.round(response.durationSeconds / 60);
          const distanceKm = (response.distanceMeters / 1000).toFixed(1);
          
          // Retornar objeto com mais informações
          setEta({
            eta_minutes: minutes,
            distance_km: parseFloat(distanceKm),
            duration_seconds: response.durationSeconds,
            distance_meters: response.distanceMeters,
          });
        }
      } catch (error) {
        logger.error('[useDriverLocation] Erro ao calcular ETA via routing real:', error);
        // GATE 1: Fallback removido - ETA deve usar rota real sempre
        // Se routing falhar, não mostrar ETA ao invés de mostrar valor errado
        setEta(null);
      }
    },
    [location],
  );

  const refetch = useCallback(async () => {
    const position = await trackingService.getCurrentPosition(driverProfileId, 'driver');
    if (position) {
      setLocation({
        latitude: position.latitude,
        longitude: position.longitude,
        heading: position.heading ?? 0,
        speed: position.speed ?? 0,
        accuracy: position.accuracy,
        updated_at: position.timestamp as string,
        timestamp: position.timestamp as string,
      });
    }
  }, [driverProfileId]);

  return { location, loading, error, eta, isConnected, calculateETA, refetch };
}
