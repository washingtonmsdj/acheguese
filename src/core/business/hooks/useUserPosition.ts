/**
 * useUserPosition
 *
 * Hook para gerenciar a posição GPS do usuário no módulo de empresas.
 * Usado para filtros "Perto de mim" e ordenação por distância.
 *
 * Delega ao GeolocationService compartilhado (SSOT).
 */

import { useState, useCallback, useEffect } from 'react';
import {
  GeolocationService,
  isGeolocationPermissionDeniedError,
} from '@/shared/services/GeolocationService';

export interface UserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface UseUserPositionResult {
  position: UserPosition | null;
  requestPosition: () => void;
  clearPosition: () => void;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
  hasPermission: boolean;
}

export function useUserPosition(): UseUserPositionResult {
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const isAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const requestPosition = useCallback(async () => {
    if (!isAvailable) {
      setError('Geolocalização não disponível neste navegador');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await GeolocationService.getCurrentLocation({ useCache: true });

      setPosition({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        timestamp: result.coords.timestamp,
      });
      if (result.source === 'gps') setHasPermission(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao obter localização');
      if (isGeolocationPermissionDeniedError(err)) setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, [isAvailable]);

  const clearPosition = useCallback(() => {
    setPosition(null);
    setHasPermission(false);
    setError(null);
    GeolocationService.clearCache();
  }, []);

  // Hidrata apenas do cache; não dispara GPS nem fallback IP durante a montagem.
  useEffect(() => {
    const result = GeolocationService.getCachedLocation();
    if (!result) return;

    setPosition({
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
      accuracy: result.coords.accuracy,
      timestamp: result.coords.timestamp,
    });
  }, []);

  return { position, requestPosition, clearPosition, loading, error, isAvailable, hasPermission };
}
