/**
 * useUserPosition
 *
 * Hook para gerenciar a posição GPS do usuário no módulo de empresas.
 * Usado para filtros "Perto de mim" e ordenação por distância.
 *
 * Delega ao GeolocationService (SSOT) — cache de 5 minutos incluso.
 */

import { useState, useCallback, useEffect } from 'react';
import { GeolocationService } from '@/core/maps/services/GeolocationService';

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
      setHasPermission(true);
    } catch (err) {
      const error = err as GeolocationPositionError;
      const isDenied = error?.code === 1 || error?.message?.includes('negada');
      setError(error?.message ?? 'Erro ao obter localização');
      if (isDenied) setHasPermission(false);
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

  // Carregar do cache ao montar (sem solicitar permissão)
  useEffect(() => {
    GeolocationService.getCurrentLocation({ useCache: true, maxRetries: 0 })
      .then((result) => {
        if (result.source === 'cache') {
          setPosition({
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            accuracy: result.coords.accuracy,
            timestamp: result.coords.timestamp,
          });
          setHasPermission(true);
        }
      })
      .catch(() => {/* sem cache, sem problema */});
  }, []);

  return { position, requestPosition, clearPosition, loading, error, isAvailable, hasPermission };
}
