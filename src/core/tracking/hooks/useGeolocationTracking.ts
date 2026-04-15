/**
 * useGeolocationTracking - Hook para rastreio GPS do dispositivo
 *
 * Usa Geolocation API do navegador.
 * Integra com TrackingService para persistência.
 *
 * Padrão: Banco → Service → Hook → Component
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { trackingService } from '../services/TrackingService';
import { logger } from '@/shared/utils/logger';
import type { TrackingPosition } from '../types';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationTrackingOptions {
  entityId: string;
  entityType?: 'driver' | 'user' | 'vehicle' | 'device';
  enabled?: boolean;
  updateInterval?: number;
  geolocationOptions?: GeolocationOptions;
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

export function useGeolocationTracking(
  options: UseGeolocationTrackingOptions
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
  const lastSentRef = useRef<number>(0);

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 0,
  } = geolocationOptions;

  // Enviar posição para o servidor com throttling
  const sendPosition = useCallback(
    async (position: GeolocationPosition) => {
      const now = Date.now();
      
      // Throttle: não enviar mais que o intervalo configurado
      if (now - lastSentRef.current < updateInterval) {
        return;
      }

      const trackingPosition: TrackingPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // m/s para km/h
        altitude: position.coords.altitude ?? undefined,
        timestamp: new Date().toISOString(),
      };

      try {
        await trackingService.updatePosition(entityId, trackingPosition, entityType);
        lastSentRef.current = now;
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        logger.error('[useGeolocationTracking] Error sending position:', err);
        setError('Erro ao enviar localização');
      }
    },
    [entityId, entityType, updateInterval]
  );

  // Iniciar rastreamento
  const startTracking = useCallback(() => {
    if (!enabled || isTracking) return;

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      return;
    }

    logger.info('[useGeolocationTracking] Iniciando rastreamento GPS...');

    // Obter posição inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const trackingPosition: TrackingPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined,
          altitude: position.coords.altitude ?? undefined,
          timestamp: new Date().toISOString(),
        };
        setCurrentPosition(trackingPosition);
        sendPosition(position);
      },
      (err) => {
        let errorMsg = 'Erro ao obter localização';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Permissão de localização negada';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Localização indisponível';
            break;
          case err.TIMEOUT:
            errorMsg = 'Timeout ao obter localização';
            break;
        }
        setError(errorMsg);
        logger.error('[useGeolocationTracking] Error getting position:', err);
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    // Monitorar posição continuamente
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const trackingPosition: TrackingPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ? position.coords.speed * 3.6 : undefined,
          altitude: position.coords.altitude ?? undefined,
          timestamp: new Date().toISOString(),
        };
        setCurrentPosition(trackingPosition);
        sendPosition(position);
      },
      (err) => {
        logger.error('[useGeolocationTracking] Error watching position:', err);
        setError('Erro ao monitorar localização');
      },
      { enableHighAccuracy, timeout, maximumAge }
    );

    watchIdRef.current = id;
    setIsTracking(true);
    logger.info('[useGeolocationTracking] Rastreamento iniciado');
  }, [enabled, isTracking, enableHighAccuracy, timeout, maximumAge, sendPosition]);

  // Parar rastreamento
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    logger.info('[useGeolocationTracking] Rastreamento parado');
  }, []);

  // Auto-start se configurado
  useEffect(() => {
    if (autoStart && enabled) {
      startTracking();
    }
  }, [autoStart, enabled, startTracking]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
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