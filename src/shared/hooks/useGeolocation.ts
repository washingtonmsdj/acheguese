/**
 * useGeolocation
 *
 * Hook simples de geolocalização para uso geral.
 * Delega ao GeolocationService (SSOT).
 *
 * Para casos mais avançados (retry, watch, precisão), use useRobustGeolocation.
 */

import { useState, useCallback } from 'react';
import { GeolocationService } from '@/core/maps/services/GeolocationService';
import { logger } from '@/shared/utils/logger';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionGranted: false,
  });

  const requestPermission = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await GeolocationService.getCurrentLocation({ useCache: true });

      setState({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        loading: false,
        error: null,
        permissionGranted: true,
      });

      return true;
    } catch (error: any) {
      const message = error?.message ?? 'Erro ao obter localização';
      setState((prev) => ({ ...prev, loading: false, error: message, permissionGranted: false }));
      return false;
    }
  }, []);

  // watchPosition permanece direto — GeolocationService não expõe watch
  const watchPosition = useCallback(() => {
    if (!('geolocation' in navigator)) return null;

    return navigator.geolocation.watchPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          permissionGranted: true,
        }));
      },
      (error) => logger.error('Erro no watchPosition:', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const updateUserLocation = useCallback(async (userId: string) => {
    if (!state.latitude || !state.longitude) return false;
    logger.info('Localização do usuário:', { userId, lat: state.latitude, lng: state.longitude });
    return true;
  }, [state.latitude, state.longitude]);

  return { ...state, requestPermission, updateUserLocation, watchPosition };
}
