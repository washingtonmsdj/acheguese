/**
 * useGeolocation (mobility)
 *
 * Hook de geolocalização para o módulo de mobilidade.
 * Delega ao GeolocationService (SSOT).
 */

import { useState, useCallback } from 'react';
import { GeolocationService } from '@/core/maps/services/GeolocationService';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string } | null>(null);
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const requestLocation = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    if (!supported) {
      setError({ message: 'Geolocalização não suportada' });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await GeolocationService.getCurrentLocation({ useCache: true });
      const coords: GeolocationCoordinates = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
      };
      setCoordinates(coords);
      return coords;
    } catch (err: any) {
      setError({ message: err?.message ?? 'Erro ao obter localização' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { coordinates, loading, error, requestLocation, clearLocation, clearError, supported };
}
