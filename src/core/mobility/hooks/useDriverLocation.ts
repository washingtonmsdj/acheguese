/**
 * useDriverLocation - Hook para rastreio de localização de motorista
 *
 * Driver self-observation continues through core/tracking. Passenger ride
 * tracking is ride-scoped and must be authorized by Postgres before a generic
 * realtime subscription is opened.
 */
import { logger } from '@/shared/utils/logger';
import { useState, useEffect, useCallback } from "react";
import { routingService } from '@/core/routing';
import { trackingService } from '@/core/tracking';
import type { TrackingPosition } from '@/core/tracking';
import { RideTrackingAccessService } from '@/core/mobility/services/RideTrackingAccessService';

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

function toDriverLocation(position: TrackingPosition): DriverLocationData {
  return {
    latitude: position.latitude,
    longitude: position.longitude,
    heading: position.heading ?? 0,
    speed: position.speed ?? 0,
    accuracy: position.accuracy,
    updated_at: position.timestamp as string,
    timestamp: position.timestamp as string,
  };
}

export function useDriverLocation(
  params:
    | string
    | { driverProfileId: string; rideId?: string; enabled?: boolean },
) {
  const driverProfileId =
    typeof params === "string" ? params : params.driverProfileId;
  const rideId = typeof params === "string" ? undefined : params.rideId;
  const enabled = typeof params === "string" ? true : (params.enabled ?? true);

  const [location, setLocation] = useState<DriverLocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eta, setEta] = useState<DriverEtaData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!driverProfileId || !enabled) {
      setLoading(false);
      setIsConnected(false);
      return;
    }

    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      setLoading(true);
      setError(null);
      setIsConnected(false);

      let initialPosition: TrackingPosition | null = null;

      if (rideId) {
        const access = await RideTrackingAccessService.getDriverPositionForRide(rideId);
        if (!active) return;

        if (!access.success || !access.data) {
          setLocation(null);
          setError("Não foi possível autorizar o rastreamento desta corrida.");
          setLoading(false);
          return;
        }

        if (
          !access.data.trackingAllowed ||
          access.data.driverProfileId !== driverProfileId
        ) {
          setLocation(null);
          setLoading(false);
          return;
        }

        initialPosition = access.data.position;
      } else {
        // Generic driver lookup is reserved for driver-self/operational callers.
        initialPosition = await trackingService.getCurrentPosition(
          driverProfileId,
          'driver',
        );
        if (!active) return;
      }

      if (initialPosition) {
        setLocation(toDriverLocation(initialPosition));
      } else {
        setLocation(null);
      }

      // Postgres Realtime remains a second security layer: driver_locations RLS
      // filters every row delivered to this authenticated subscription. For a
      // passenger ride we only open it after the ride-scoped authorization above.
      subscription = trackingService.subscribeToPosition(
        driverProfileId,
        (position: TrackingPosition) => {
          if (!active) return;
          setLocation(toDriverLocation(position));
          setIsConnected(true);
        },
        'driver',
      );

      setIsConnected(true);
      setLoading(false);
    };

    void init().catch((initError) => {
      if (!active) return;
      logger.error('[useDriverLocation] Tracking initialization failed', initError);
      setLocation(null);
      setError("Não foi possível iniciar o rastreamento desta corrida.");
      setIsConnected(false);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [driverProfileId, enabled, rideId]);

  const calculateETA = useCallback(
    async (destLat: number, destLng: number) => {
      if (!location) return;

      try {
        const response = await routingService.calculateSimpleETA(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: destLat, longitude: destLng },
          'car',
        );

        if (response) {
          const minutes = Math.round(response.durationSeconds / 60);
          const distanceKm = (response.distanceMeters / 1000).toFixed(1);

          setEta({
            eta_minutes: minutes,
            distance_km: parseFloat(distanceKm),
            duration_seconds: response.durationSeconds,
            distance_meters: response.distanceMeters,
          });
        }
      } catch (routingError) {
        logger.error('[useDriverLocation] Erro ao calcular ETA via routing real:', routingError);
        // ETA is never estimated locally when authoritative routing fails.
        setEta(null);
      }
    },
    [location],
  );

  const refetch = useCallback(async () => {
    setError(null);

    if (rideId) {
      const access = await RideTrackingAccessService.getDriverPositionForRide(rideId);
      if (
        !access.success ||
        !access.data ||
        !access.data.trackingAllowed ||
        access.data.driverProfileId !== driverProfileId
      ) {
        setLocation(null);
        setIsConnected(false);
        if (!access.success) {
          setError("Não foi possível autorizar o rastreamento desta corrida.");
        }
        return;
      }

      setLocation(
        access.data.position ? toDriverLocation(access.data.position) : null,
      );
      return;
    }

    const position = await trackingService.getCurrentPosition(
      driverProfileId,
      'driver',
    );
    setLocation(position ? toDriverLocation(position) : null);
  }, [driverProfileId, rideId]);

  return { location, loading, error, eta, isConnected, calculateETA, refetch };
}
