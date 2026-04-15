/**
 * useMapViewportFetch - Busca de entidades por bounds do viewport
 *
 * Ouve mudanças de viewport e dispara fetch de entidades dentro dos bounds.
 * Debounced para evitar spam de requisições durante pan/zoom.
 *
 * SSOT: consome MapViewportService via useMapViewport.
 * Não conhece providers. Não acessa banco diretamente.
 *
 * @module core/maps/hooks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { BoundingBox, MapLayerKey, MapMarker } from '../types/core';

/**
 * Função fetcher por camada — injetada externamente para manter SSOT.
 * Cada camada tem seu próprio fetcher (BusinessService, EventService, etc.)
 */
export type LayerFetcher = (bounds: BoundingBox) => Promise<MapMarker[]>;

export interface UseMapViewportFetchOptions {
  /** Fetchers por camada */
  fetchers: Partial<Record<MapLayerKey, LayerFetcher>>;
  /** Debounce em ms (padrão: 400) */
  debounceMs?: number;
  /** Zoom mínimo para disparar fetch (padrão: 10) */
  minZoom?: number;
  /** Callback de erro */
  onError?: (layerKey: MapLayerKey, error: Error) => void;
}

export interface UseMapViewportFetchReturn {
  /** Dados por camada */
  layerData: Partial<Record<MapLayerKey, MapMarker[]>>;
  /** Camadas em loading */
  loadingLayers: Set<MapLayerKey>;
  /** Erros por camada */
  errors: Partial<Record<MapLayerKey, string>>;
  /** Disparar fetch manual com bounds */
  fetchByBounds: (bounds: BoundingBox, zoom: number) => void;
  /** Limpar dados de uma camada */
  clearLayer: (key: MapLayerKey) => void;
}

/**
 * Hook para buscar entidades do mapa por bounds do viewport.
 *
 * @example
 * ```tsx
 * const { layerData, fetchByBounds } = useMapViewportFetch({
 *   fetchers: {
 *     businesses: async (bounds) => {
 *       const items = await BusinessService.getByBounds(bounds);
 *       return items.map(b => mapEntityProjection.projectBusiness(b)).filter(Boolean);
 *     },
 *   },
 *   debounceMs: 400,
 *   minZoom: 10,
 * });
 *
 * // Conectar ao moveend do mapa:
 * map.on('moveend', () => {
 *   const b = map.getBounds();
 *   fetchByBounds(
 *     [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
 *     map.getZoom()
 *   );
 * });
 * ```
 */
export function useMapViewportFetch({
  fetchers,
  debounceMs = 400,
  minZoom = 10,
  onError,
}: UseMapViewportFetchOptions): UseMapViewportFetchReturn {
  const [layerData, setLayerData] = useState<Partial<Record<MapLayerKey, MapMarker[]>>>({});
  const [loadingLayers, setLoadingLayers] = useState<Set<MapLayerKey>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<MapLayerKey, string>>>({});

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllersRef = useRef<Partial<Record<MapLayerKey, AbortController>>>({});
  // Keep fetchers in a ref so callbacks don't need to re-create when fetchers object identity changes
  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Cancelar fetches em andamento para uma camada
  const cancelFetch = useCallback((key: MapLayerKey) => {
    abortControllersRef.current[key]?.abort();
    delete abortControllersRef.current[key];
  }, []);

  // Fetch de uma camada específica
  const fetchLayer = useCallback(
    async (key: MapLayerKey, bounds: BoundingBox) => {
      const fetcher = fetchersRef.current[key];
      if (!fetcher) return;

      cancelFetch(key);

      setLoadingLayers((prev) => new Set([...prev, key]));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      try {
        const markers = await fetcher(bounds);
        setLayerData((prev) => ({ ...prev, [key]: markers }));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Erro ao buscar dados';
        setErrors((prev) => ({ ...prev, [key]: message }));
        onErrorRef.current?.(key, err instanceof Error ? err : new Error(message));
      } finally {
        setLoadingLayers((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [cancelFetch]
  );

  // Fetch de todas as camadas com fetcher registrado
  const fetchByBounds = useCallback(
    (bounds: BoundingBox, zoom: number) => {
      if (zoom < minZoom) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const layerKeys = Object.keys(fetchersRef.current) as MapLayerKey[];
        layerKeys.forEach((key) => fetchLayer(key, bounds));
      }, debounceMs);
    },
    [fetchLayer, debounceMs, minZoom]
  );

  // Limpar dados de uma camada
  const clearLayer = useCallback((key: MapLayerKey) => {
    cancelFetch(key);
    setLayerData((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [cancelFetch]);

  // Cleanup no unmount
  useEffect(() => {
    const debounceTimer = debounceTimerRef;
    const abortControllers = abortControllersRef;
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      Object.values(abortControllers.current).forEach((ac) => ac?.abort());
    };
  }, []);

  return { layerData, loadingLayers, errors, fetchByBounds, clearLayer };
}
