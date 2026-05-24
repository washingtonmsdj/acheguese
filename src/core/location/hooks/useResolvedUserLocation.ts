/**
 * useResolvedUserLocation - Hook SSOT para posi??o do usu?rio com fallback.
 *
 * Resolve a posi??o do usu?rio com estrat?gia progressiva:
 * 1. GPS, se permitido.
 * 2. Territ?rio ativo no seletor.
 * 3. Centro padr?o configurado por ambiente.
 *
 * Diferente de useGeolocation, este hook sempre retorna uma posi??o ?til
 * ap?s a resolu??o, mesmo sem GPS.
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
  /** Posi??o resolvida. */
  location: ResolvedEntityLocation | null;
  /** Status da resolu??o. */
  status: LocationResolutionStatus;
  /** Se a posi??o veio de GPS real. */
  isGps: boolean;
  /** Se a posi??o ? boa o suficiente para proximidade precisa. */
  isGoodForProximity: boolean;
  /** Coordenadas simplificadas. */
  coords: { latitude: number; longitude: number } | null;
  /** Solicitar resolu??o ou re-resolu??o. */
  resolve: () => Promise<void>;
  /** Se est? carregando. */
  isLoading: boolean;
  /** Mensagem explicativa para o usu?rio sobre a fonte. */
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
        return 'Usando sua localiza??o GPS';
      case 'territory':
        return `Mostrando resultados ${location?.locationName ? `em ${location.locationName}` : 'do territ?rio selecionado'}`;
      case 'fallback':
        return 'Mostrando resultados da regi?o padr?o';
      case 'resolving':
        return 'Obtendo localiza??o...';
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