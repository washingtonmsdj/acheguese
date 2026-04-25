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

const MAP_LAYER_KEYS: MapLayerKey[] = [
  'businesses',
  'gastronomy',
  'services',
  'classifieds',
  'events',
  'alerts',
  'professionals',
  'tourist_points',
  'mobility',
  'user_location',
  'service_areas',
  'boundaries',
];

function getFetcherByKey(
  fetchers: Partial<Record<MapLayerKey, LayerFetcher>>,
  key: MapLayerKey,
): LayerFetcher | undefined {
  switch (key) {
    case 'businesses': return fetchers.businesses;
    case 'gastronomy': return fetchers.gastronomy;
    case 'services': return fetchers.services;
    case 'classifieds': return fetchers.classifieds;
    case 'events': return fetchers.events;
    case 'alerts': return fetchers.alerts;
    case 'professionals': return fetchers.professionals;
    case 'tourist_points': return fetchers.tourist_points;
    case 'mobility': return fetchers.mobility;
    case 'user_location': return fetchers.user_location;
    case 'service_areas': return fetchers.service_areas;
    case 'boundaries': return fetchers.boundaries;
    default: return undefined;
  }
}

function withLayerMarkers(
  prev: Partial<Record<MapLayerKey, MapMarker[]>>,
  key: MapLayerKey,
  markers: MapMarker[],
): Partial<Record<MapLayerKey, MapMarker[]>> {
  switch (key) {
    case 'businesses': return { ...prev, businesses: markers };
    case 'gastronomy': return { ...prev, gastronomy: markers };
    case 'services': return { ...prev, services: markers };
    case 'classifieds': return { ...prev, classifieds: markers };
    case 'events': return { ...prev, events: markers };
    case 'alerts': return { ...prev, alerts: markers };
    case 'professionals': return { ...prev, professionals: markers };
    case 'tourist_points': return { ...prev, tourist_points: markers };
    case 'mobility': return { ...prev, mobility: markers };
    case 'user_location': return { ...prev, user_location: markers };
    case 'service_areas': return { ...prev, service_areas: markers };
    case 'boundaries': return { ...prev, boundaries: markers };
    default: return prev;
  }
}

function withoutLayerData(
  prev: Partial<Record<MapLayerKey, MapMarker[]>>,
  key: MapLayerKey,
): Partial<Record<MapLayerKey, MapMarker[]>> {
  const next = { ...prev };
  switch (key) {
    case 'businesses': delete next.businesses; return next;
    case 'gastronomy': delete next.gastronomy; return next;
    case 'services': delete next.services; return next;
    case 'classifieds': delete next.classifieds; return next;
    case 'events': delete next.events; return next;
    case 'alerts': delete next.alerts; return next;
    case 'professionals': delete next.professionals; return next;
    case 'tourist_points': delete next.tourist_points; return next;
    case 'mobility': delete next.mobility; return next;
    case 'user_location': delete next.user_location; return next;
    case 'service_areas': delete next.service_areas; return next;
    case 'boundaries': delete next.boundaries; return next;
    default: return next;
  }
}

function withLayerError(
  prev: Partial<Record<MapLayerKey, string>>,
  key: MapLayerKey,
  message: string,
): Partial<Record<MapLayerKey, string>> {
  switch (key) {
    case 'businesses': return { ...prev, businesses: message };
    case 'gastronomy': return { ...prev, gastronomy: message };
    case 'services': return { ...prev, services: message };
    case 'classifieds': return { ...prev, classifieds: message };
    case 'events': return { ...prev, events: message };
    case 'alerts': return { ...prev, alerts: message };
    case 'professionals': return { ...prev, professionals: message };
    case 'tourist_points': return { ...prev, tourist_points: message };
    case 'mobility': return { ...prev, mobility: message };
    case 'user_location': return { ...prev, user_location: message };
    case 'service_areas': return { ...prev, service_areas: message };
    case 'boundaries': return { ...prev, boundaries: message };
    default: return prev;
  }
}

function withoutLayerError(
  prev: Partial<Record<MapLayerKey, string>>,
  key: MapLayerKey,
): Partial<Record<MapLayerKey, string>> {
  const next = { ...prev };
  switch (key) {
    case 'businesses': delete next.businesses; return next;
    case 'gastronomy': delete next.gastronomy; return next;
    case 'services': delete next.services; return next;
    case 'classifieds': delete next.classifieds; return next;
    case 'events': delete next.events; return next;
    case 'alerts': delete next.alerts; return next;
    case 'professionals': delete next.professionals; return next;
    case 'tourist_points': delete next.tourist_points; return next;
    case 'mobility': delete next.mobility; return next;
    case 'user_location': delete next.user_location; return next;
    case 'service_areas': delete next.service_areas; return next;
    case 'boundaries': delete next.boundaries; return next;
    default: return next;
  }
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
  const abortControllersRef = useRef<Map<MapLayerKey, AbortController>>(new Map());
  // Keep fetchers in a ref so callbacks don't need to re-create when fetchers object identity changes
  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Cancelar fetches em andamento para uma camada
  const cancelFetch = useCallback((key: MapLayerKey) => {
    const controller = abortControllersRef.current.get(key);
    controller?.abort();
    abortControllersRef.current.delete(key);
  }, []);

  // Fetch de uma camada específica
  const fetchLayer = useCallback(
    async (key: MapLayerKey, bounds: BoundingBox) => {
      const fetcher = getFetcherByKey(fetchersRef.current, key);
      if (!fetcher) return;

      cancelFetch(key);

      setLoadingLayers((prev) => new Set([...prev, key]));
      setErrors((prev) => withoutLayerError(prev, key));

      try {
        const markers = await fetcher(bounds);
        setLayerData((prev) => withLayerMarkers(prev, key, markers));
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Erro ao buscar dados';
        setErrors((prev) => withLayerError(prev, key, message));
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
        const layerKeys = MAP_LAYER_KEYS.filter(
          (layerKey) => getFetcherByKey(fetchersRef.current, layerKey) !== undefined,
        );
        layerKeys.forEach((key) => fetchLayer(key, bounds));
      }, debounceMs);
    },
    [fetchLayer, debounceMs, minZoom]
  );

  // Limpar dados de uma camada
  const clearLayer = useCallback((key: MapLayerKey) => {
    cancelFetch(key);
    setLayerData((prev) => withoutLayerData(prev, key));
  }, [cancelFetch]);

  // Cleanup no unmount
  useEffect(() => {
    const debounceTimer = debounceTimerRef;
    const abortControllers = abortControllersRef;
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      abortControllers.current.forEach((ac) => ac.abort());
    };
  }, []);

  return { layerData, loadingLayers, errors, fetchByBounds, clearLayer };
}
