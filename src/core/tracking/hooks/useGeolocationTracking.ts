/**
 * useGeolocationTracking - Hook para rastreio GPS do dispositivo.
 *
 * Browser Geolocation pertence ao GeolocationService compartilhado; este hook
 * cuida apenas de estado React, throttling e persistencia no TrackingService.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { GEOLOCATION_RUNTIME } from '@/shared/config/geolocation';
import {
  GeolocationService,
  getGeolocationErrorCode,
  isGeolocationPermissionDeniedError,
  type GeolocationCoords,
  type GeolocationWatchOptions,
} from '@/shared/services/GeolocationService';
import { logger } from '@/shared/utils/logger';
import { trackingService } from '../services/TrackingService';
import type { TrackingPosition } from '../types';

interface UseGeolocationTrackingOptions {
  entityId: string;
  entityType?: 'driver' | 'user' | 'vehicle' | 'device';
  enabled?: boolean;
  updateInterval?: number;
  geolocationOptions?: GeolocationWatchOptions;
  autoStart?: boolean;
}

interface UseGeolocationTrackingResult {
  isTracking: boolean;
  currentPosition: TrackingPosition | null;
  error: string | null;
  lastUpdate: Date | null;
  startTracking: () => void;
  stopTracking: () => void;
}

function toTrackingPosition(coords: GeolocationCoords): TrackingPosition {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy,
    heading: coords.heading ?? undefined,
    speed: coords.speed != null ? coords.speed * 3.6 : undefined,
    altitude: coords.altitude ?? undefined,
    timestamp: new Date(coords.timestamp).toISOString(),
  };
}

function getTrackingErrorMessage(error: unknown, fallback: string): string {
  if (isGeolocationPermissionDeniedError(error)) return 'Permissão de localização negada';

  const code = getGeolocationErrorCode(error) ?? (error as { code?: unknown } | null)?.code;
  if (code === 'POSITION_UNAVAILABLE' || code === 2) return 'Localização indisponível';
  if (code === 3) return 'Timeout ao obter localização';
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useGeolocationTracking(
  options: UseGeolocationTrackingOptions,
): UseGeolocationTrackingResult {
  const {
    entityId,
    entityType = 'driver',
    enabled = true,
    updateInterval = 10000,
    geolocationOptions = {},
    autoStart = false,
  } = options;

  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<TrackingPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  const {
    enableHighAccuracy = true,
    timeout = GEOLOCATION_RUNTIME.requestTimeoutMs,
    maximumAge = 0,
  } = geolocationOptions;

  const sendPosition = useCallback(
    async (coords: GeolocationCoords) => {
      const now = Date.now();
      if (now - lastSentRef.current < updateInterval) return;

      try {
        await trackingService.updatePosition(entityId, toTrackingPosition(coords), entityType);
        lastSentRef.current = now;
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        logger.error('[useGeolocationTracking] Error sending position:', err);
        setError('Erro ao enviar localização');
      }
    },
    [entityId, entityType, updateInterval],
  );

  const handlePosition = useCallback((coords: GeolocationCoords) => {
    setCurrentPosition(toTrackingPosition(coords));
    void sendPosition(coords);
  }, [sendPosition]);

  const startTracking = useCallback(() => {
    if (!enabled || isTracking) return;

    setError(null);

    void GeolocationService.getCurrentLocation({
      useCache: false,
      timeout,
      gpsMode: 'precise',
      allowIpFallback: false,
    })
      .then((result) => handlePosition(result.coords))
      .catch((err) => {
        const message = getTrackingErrorMessage(err, 'Erro ao obter localização');
        setError(message);
        logger.warn('[useGeolocationTracking] Initial position unavailable', { message });
      });

    const watchId = GeolocationService.watchLocation(
      handlePosition,
      (err) => {
        const message = getTrackingErrorMessage(err, 'Erro ao monitorar localização');
        setError(message);
        logger.warn('[useGeolocationTracking] Watch position unavailable', { message });
      },
      { enableHighAccuracy, timeout, maximumAge },
    );

    if (watchId === null) {
      setError('Geolocalização não suportada');
      return;
    }

    watchIdRef.current = watchId;
    setIsTracking(true);
  }, [enabled, isTracking, enableHighAccuracy, timeout, maximumAge, handlePosition]);

  const stopTracking = useCallback(() => {
    GeolocationService.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (autoStart && enabled) startTracking();
  }, [autoStart, enabled, startTracking]);

  useEffect(() => {
    return () => {
      GeolocationService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, []);

  return {
    isTracking,
    currentPosition,
    error,
    lastUpdate,
    startTracking,
    stopTracking,
  };
}
