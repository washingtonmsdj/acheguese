/**
 * useUserLocation Hook
 *
 * Hook React para geolocalização do usuário.
 * Delega ao GeolocationService (SSOT) via useRobustGeolocation.
 *
 * @module core/maps/hooks
 */

import { useState, useCallback, useEffect } from 'react';
import { useRobustGeolocation } from '@/shared/hooks';
import { GeolocationService } from '../services/GeolocationService';
import type { Coordinates } from '../types/core';

export type LocationStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied' | 'ip-fallback';

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
  message: string;
}

export interface UseUserLocationOptions {
  /** Rastreamento contínuo (watchPosition) */
  liveTracking?: boolean;
  /** Usar fallback de IP geolocation quando GPS for negado */
  useIpFallback?: boolean;
  /** Callback quando localização muda */
  onLocationChange?: (coordinates: Coordinates) => void;
  /** Callback quando erro ocorre */
  onError?: (error: LocationError) => void;
}

export interface UseUserLocationReturn {
  coordinates: Coordinates | null;
  status: LocationStatus;
  error: LocationError | null;
  accuracy: number | null;
  requestLocation: () => void;
  clearLocation: () => void;
}

export function useUserLocation(options: UseUserLocationOptions = {}): UseUserLocationReturn {
  const { liveTracking = false, onLocationChange, onError } = options;

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<LocationError | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const handleSuccess = useCallback((coords: { latitude: number; longitude: number; accuracy: number }) => {
    const c: Coordinates = { latitude: coords.latitude, longitude: coords.longitude };
    setCoordinates(c);
    setAccuracy(coords.accuracy);
    setStatus('success');
    setError(null);
    onLocationChange?.(c);
  }, [onLocationChange]);

  const handleError = useCallback((msg: string) => {
    const isDenied = msg.includes('negada') || msg.includes('denied');
    const locationError: LocationError = {
      code: isDenied ? 'PERMISSION_DENIED' : 'POSITION_UNAVAILABLE',
      message: msg,
    };
    setError(locationError);
    setStatus(isDenied ? 'denied' : 'error');
    onError?.(locationError);
  }, [onError]);

  const {
    requestLocation: robustRequest,
    startWatching,
    stopWatching,
    loading,
  } = useRobustGeolocation({
    watch: liveTracking,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // Sincronizar loading state
  useEffect(() => {
    if (loading) setStatus('loading');
  }, [loading]);

  const requestLocation = useCallback(() => {
    setStatus('loading');
    setError(null);
    robustRequest();
  }, [robustRequest]);

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setStatus('idle');
    setError(null);
    setAccuracy(null);
    GeolocationService.clearCache();
    if (liveTracking) stopWatching();
  }, [liveTracking, stopWatching]);

  // Solicitar localização automaticamente ao montar (apenas se não for liveTracking)
  useEffect(() => {
    if (!liveTracking) {
      requestLocation();
    }
    return () => {
      GeolocationService.abort();
      if (liveTracking) stopWatching();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTracking]);

  return {
    coordinates,
    status,
    error,
    accuracy,
    requestLocation,
    clearLocation,
  };
}
