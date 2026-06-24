/**
 * useResolvedUserLocation - Hook SSOT para posição do usuário com fallback.
 *
 * Resolve a posição do usuário com estratégia progressiva:
 * 1. GPS, se permitido.
 * 2. Território ativo no seletor.
 * 3. Centro padrão configurado por ambiente.
 *
 * Diferente de useGeolocation, este hook sempre retorna uma posição útil
 * após a resolução, mesmo sem GPS.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { userLocationResolver } from '../services/UserLocationResolver';
import type { ResolvedEntityLocation } from '../types/entityLocation';
import { useLocationContext } from './useLocationContext';

export type LocationResolutionStatus =
  | 'idle'
  | 'resolving'
  | 'gps'
  | 'territory'
  | 'fallback'
  | 'error';

export interface UseResolvedUserLocationOptions {
  /** Solicitar GPS automaticamente ao montar. */
  autoResolve?: boolean;
  /** Tentar GPS antes do fallback territorial. */
  tryGps?: boolean;
}

export interface UseResolvedUserLocationReturn {
  /** Posição resolvida. */
  location: ResolvedEntityLocation | null;
  /** Status da resolução. */
  status: LocationResolutionStatus;
  /** Se a posição veio de GPS real. */
  isGps: boolean;
  /** Se a posição é boa o suficiente para proximidade precisa. */
  isGoodForProximity: boolean;
  /** Coordenadas simplificadas. */
  coords: { latitude: number; longitude: number } | null;
  /** Solicitar resolução ou re-resolução. */
  resolve: () => Promise<void>;
  /** Se está carregando. */
  isLoading: boolean;
  /** Mensagem explicativa para o usuário sobre a fonte. */
  sourceMessage: string;
}

export function useResolvedUserLocation(
  options: UseResolvedUserLocationOptions = {},
): UseResolvedUserLocationReturn {
  const { autoResolve = true, tryGps = true } = options;
  const { activeTerritory } = useLocationContext();

  const [location, setLocation] = useState<ResolvedEntityLocation | null>(null);
  const [status, setStatus] = useState<LocationResolutionStatus>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const resolvedOnce = useRef(false);

  const resolve = useCallback(async () => {
    setIsLoading(true);
    setStatus('resolving');

    try {
      const result = await userLocationResolver.resolve({ tryGps });
      setLocation(result);

      if (result.source === 'gps') {
        setStatus('gps');
      } else if (result.source === 'territory_center' && result.locationId) {
        setStatus('territory');
      } else {
        setStatus('fallback');
      }
    } catch {
      const fallback = userLocationResolver.resolveFromTerritory();
      setLocation(fallback);
      setStatus('fallback');
    } finally {
      setIsLoading(false);
    }
  }, [tryGps]);

  useEffect(() => {
    if (autoResolve && !resolvedOnce.current) {
      resolvedOnce.current = true;
      resolve();
    }
  }, [autoResolve, resolve]);

  useEffect(() => {
    if (status === 'territory' || status === 'fallback') {
      const fallback = userLocationResolver.resolveFromTerritory();
      setLocation(fallback);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTerritory]);

  const isGps = location?.source === 'gps';
  const isGoodForProximity = location ? userLocationResolver.isGoodForProximity(location) : false;

  const coords = location?.latitude != null && location?.longitude != null
    ? { latitude: location.latitude, longitude: location.longitude }
    : null;

  const sourceMessage = (() => {
    switch (status) {
      case 'gps':
        return 'Usando sua localização GPS';
      case 'territory':
        return `Mostrando resultados ${location?.locationName ? `em ${location.locationName}` : 'do território selecionado'}`;
      case 'fallback':
        return 'Mostrando resultados da região padrão';
      case 'resolving':
        return 'Obtendo localização...';
      default:
        return '';
    }
  })();

  return {
    location,
    status,
    isGps,
    isGoodForProximity,
    coords,
    resolve,
    isLoading,
    sourceMessage,
  };
}
