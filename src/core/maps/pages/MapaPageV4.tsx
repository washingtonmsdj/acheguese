/**
 * MapaPageV4 - Página do mapa
 *
 * SSoTs respeitados:
 * - Território   → useTerritoryFilter(resolved, activeMemberIds)
 * - Businesses   → BusinessService.getBusinesses com territoryFilter
 * - Eventos      → EventsService.getByBounds com territoryFilter
 * - Projeção     → mapEntityProjection (MapEntityProjectionService)
 * - Viewport     → useMapViewportFetch + MapLibreAdapter
 * - Geoloc GPS   → MapLibreAdapter.controls.location (via MapLocationControl → useRobustGeolocation → GeolocationService)
 *
 * @module core/maps/pages
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapLibreAdapter, type MapLibreAdapterHandle } from '../components/v3/MapLibreAdapter';
import { MapMarkerPopup } from '../components/v3/MapMarkerPopup';
import { useMapViewportFetch } from '../hooks/useMapViewportFetch';
import { mapEntityProjection } from '../services/MapEntityProjectionService';
import { DEFAULT_TILE_STYLE } from '../providers/MapProvider';
import { MAP_RUNTIME_LAYER_KEYS } from '../config/runtimeConfig';
import { BusinessService } from '@/core/business/services/BusinessService';
import { EventsService } from '@/core/events/services/EventsService';
import { communityAlertService } from '@/core/community-alerts';
import { gastronomyMapService } from '@/core/gastronomy';
import { useTerritoryFilter, territoryFilterKey, useResolvedUserLocation } from '@/core/location';
import { useTerritoryPolygon } from '../hooks/useTerritoryPolygon';
import { useTouristPointsByBounds } from '@/core/tourist-points/hooks/useTouristPointsSpatial';
import type { BoundingBox, MapLayerKey, MapMarker, MapViewport } from '../types/core';
import type { TerritoryFilter } from '@/core/location/types';
import type { Business } from '@/core/business/types/Business';
import type { Event } from '@/core/events/services/EventsService';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapaPageV4Props {
  /** Território resolvido pela rota (vem do TerritorialLayout via TerritorialMapPage) */
  resolved?: ResolvedTerritory | null;
  /** IDs dos membros ativos do grupo (para rollout parcial) */
  activeMemberIds?: string[];
}

// ─── Tile style — SSOT: DEFAULT_TILE_STYLE do MapProvider ────────────────────
// Mesmo estilo usado pelo StandaloneMap (mini mapa da empresa).
// Os avisos de sprite (office, swimming_pool, etc.) são suprimidos via
// styleimagemissing no MapLibreAdapter — não trocamos de estilo por isso.
const TILE_STYLE_URL = DEFAULT_TILE_STYLE.styleUrl;

// ─── Bounds e zoom iniciais (Salvador, BA) ────────────────────────────────────
const SALVADOR_BOUNDS: BoundingBox = [-38.6, -13.1, -38.3, -12.8];
const INITIAL_ZOOM = 13;

function createInitialVisibleLayers(): Partial<Record<MapLayerKey, boolean>> {
  return Object.fromEntries(
    MAP_RUNTIME_LAYER_KEYS.map((layer) => [layer, true]),
  ) as Partial<Record<MapLayerKey, boolean>>;
}

// ─── Helper de filtro por bounds (client-side) ────────────────────────────────
function isInsideBounds(
  lat: number | null | undefined,
  lng: number | null | undefined,
  bounds: BoundingBox,
): boolean {
  if (lat == null || lng == null) return false;
  const [west, south, east, north] = bounds;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

// ─── Factories de fetchers ────────────────────────────────────────────────────

function makeBusinessFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const businesses: Business[] = await BusinessService.getBusinesses({
        sortBy: 'created_at',
        territoryFilter,
      });
      const filtered = businesses.filter((b) =>
        isInsideBounds(b.address?.latitude, b.address?.longitude, bounds),
      );
      return mapEntityProjection.projectEntities(
        filtered.map((b) => ({
          id: b.id,
          name: b.name,
          latitude: b.address?.latitude ?? null,
          longitude: b.address?.longitude ?? null,
          status: b.status,
          slug: b.slug,
          is_premium: b.is_premium,
          is_verified: b.is_verified,
          rating: b.rating,
          map_layer_key: 'businesses',
        })),
        'business',
        { includeMetadata: true, calculateScore: true, baseUrl: '/empresas' },
      );
    } catch {
      return [];
    }
  };
}

function makeEventFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const events: Event[] = await EventsService.getByBounds(bounds, {
        limit: 200,
        territoryFilter,
      });
      return mapEntityProjection.projectEntities(
        events.map((e) => ({
          id: e.id,
          name: e.title,
          latitude: e.latitude ?? null,
          longitude: e.longitude ?? null,
          status: e.status, // normalizeStatus no MapEntityProjectionService
          description: e.description,
          created_at: e.created_at,
          coordinate_source: e.coordinate_source,
          map_layer_key: 'events',
        })),
        'event',
        { includeMetadata: true, baseUrl: '/eventos' },
      );
    } catch {
      return [];
    }
  };
}

function makeGastronomyFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const gastronomyBusinesses = await gastronomyMapService.getByBounds(bounds, {
        territoryFilter,
        limit: 200,
      });

      return mapEntityProjection.projectEntities(
        gastronomyBusinesses.map((business) => ({
          id: business.id,
          name: business.name,
          slug: business.slug,
          latitude: business.latitude,
          longitude: business.longitude,
          status: 'active',
          is_premium: business.is_premium,
          is_verified: business.is_verified,
          rating: business.rating,
          category: 'gastronomy',
          cuisine_type: business.cuisine_type,
          delivery_enabled: business.delivery_enabled,
          map_layer_key: 'gastronomy',
        })),
        'business',
        { includeMetadata: true, calculateScore: true, baseUrl: '/gastronomia' },
      );
    } catch {
      return [];
    }
  };
}

function makeAlertFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      // Calcular centro e raio dos bounds
      const [west, south, east, north] = bounds;
      const centerLat = (south + north) / 2;
      const centerLng = (west + east) / 2;
      
      // Calcular raio aproximado em metros (distância do centro ao canto)
      const latDiff = north - south;
      const lngDiff = east - west;
      const radiusMeters = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000 / 2; // 111km por grau
      
      const alerts = await communityAlertService.getBySpatialRadius(
        [centerLat, centerLng],
        radiusMeters,
        { territoryFilter, limit: 50 }
      );
      
      return mapEntityProjection.projectEntities(
        alerts.map((a) => ({
          id: a.id,
          name: `🚨 Alerta em ${a.neighborhood_display || 'região'}`,
          latitude: a.latitude,
          longitude: a.longitude,
          status: 'active',
          description: a.description,
          created_at: a.created_at,
          map_layer_key: 'alerts',
        })),
        'alert',
        { includeMetadata: true, baseUrl: '/alertas' },
      );
    } catch {
      return [];
    }
  };
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MapaPageV4({ resolved, activeMemberIds = [] }: MapaPageV4Props) {
  const adapterRef = useRef<MapLibreAdapterHandle>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [currentBounds, setCurrentBounds] = useState<BoundingBox>(SALVADOR_BOUNDS);
  const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM);
  const [visibleLayers, setVisibleLayers] = useState<Partial<Record<MapLayerKey, boolean>>>(
    createInitialVisibleLayers,
  );
  const navigate = useNavigate();

  // Localização do usuário com fallback territorial
  const { 
    coords: userLocation, 
    isGps,
    status: locationStatus,
    sourceMessage,
  } = useResolvedUserLocation({ 
    autoResolve: true,
    tryGps: true 
  });

  // SSOT territorial
  const territoryFilter = useTerritoryFilter(resolved, activeMemberIds);
  const { polygons: territoryPolygons } = useTerritoryPolygon(resolved);

  const touristLayerVisible = visibleLayers.tourist_points !== false;
  const businessesLayerVisible = visibleLayers.businesses !== false;
  const gastronomyLayerVisible = visibleLayers.gastronomy !== false;
  const eventsLayerVisible = visibleLayers.events !== false;
  const alertsLayerVisible = visibleLayers.alerts !== false;

  // Busca de pontos turísticos por bounds (modo normal)
  const { data: touristPointsData } = useTouristPointsByBounds(
    {
      west: currentBounds[0],
      south: currentBounds[1],
      east: currentBounds[2],
      north: currentBounds[3],
    },
    { 
      // NÃO filtrar por locationId - pontos turísticos devem aparecer em toda a cidade
      enabled: touristLayerVisible && currentZoom >= 10,
    }
  );

  const filterKey = territoryFilterKey(territoryFilter);
  const fetchers = React.useMemo(
    () => ({
      ...(businessesLayerVisible ? { businesses: makeBusinessFetcher(territoryFilter) } : {}),
      ...(gastronomyLayerVisible ? { gastronomy: makeGastronomyFetcher(territoryFilter) } : {}),
      ...(eventsLayerVisible ? { events: makeEventFetcher(territoryFilter) } : {}),
      ...(alertsLayerVisible ? { alerts: makeAlertFetcher(territoryFilter) } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey, businessesLayerVisible, gastronomyLayerVisible, eventsLayerVisible, alertsLayerVisible],
  );

  const { layerData, loadingLayers, fetchByBounds, clearLayer } = useMapViewportFetch({
    fetchers,
    debounceMs: 400,
    minZoom: 10,
  });

  const handleLayerToggle = useCallback((key: string, visible: boolean) => {
    if (!MAP_RUNTIME_LAYER_KEYS.includes(key as MapLayerKey)) return;

    setVisibleLayers((prev) => ({
      ...prev,
      [key]: visible,
    }));

    if (!visible) {
      if (key === 'businesses' || key === 'gastronomy' || key === 'events' || key === 'alerts') {
        clearLayer(key as MapLayerKey);
      }
    }
  }, [clearLayer]);

  // Fetch inicial com bounds de Salvador.
  // Quando os polígonos do território chegarem, o MapLibreAdapter centraliza
  // automaticamente e o onViewportChange dispara fetchByBounds com os bounds reais.
  useEffect(() => {
    fetchByBounds(SALVADOR_BOUNDS, INITIAL_ZOOM);
  }, [fetchByBounds]);

  // Re-fetch quando o território muda (fetchers recriados com novo territoryFilter)
  useEffect(() => {
    if (territoryPolygons.length === 0) return;
    const allCoords = territoryPolygons.flatMap((p) => p.coordinates);
    const lats = allCoords.map(([lat]) => lat);
    const lngs = allCoords.map(([, lng]) => lng);
    const bounds: BoundingBox = [
      Math.min(...lngs), Math.min(...lats),
      Math.max(...lngs), Math.max(...lats),
    ];
    fetchByBounds(bounds, territoryPolygons.length === 1 ? 13 : 12);
  }, [territoryPolygons, fetchByBounds]);

  const handleViewportChange = useCallback(
    (viewport: MapViewport, bounds: BoundingBox) => {
      setCurrentBounds(bounds);
      setCurrentZoom(viewport.zoom);
      fetchByBounds(bounds, viewport.zoom);
    },
    [fetchByBounds],
  );

  // Marcadores de dados — MapMarker[] canônico, sem conversão.
  // O marcador de usuário é gerenciado pelo MapLibreAdapter via userLocationMarker.autoAdd.
  const markers = React.useMemo(() => {
    // Modo normal: busca por bounds
    // Combinar marcadores de viewport fetch + pontos turísticos
    const touristPointMarkers = touristLayerVisible
      ? mapEntityProjection.projectEntities(
          (touristPointsData || []).map((result) => ({
            id: result.id,
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            status: 'active',
            location_id: result.location_id,
            map_layer_key: 'tourist_points',
          })),
          'tourist_point',
          { includeMetadata: true, calculateScore: true, baseUrl: '/pontos-turisticos' },
        )
      : [];

    return [...Object.values(layerData).flat(), ...touristPointMarkers];
  }, [touristPointsData, layerData, touristLayerVisible]);

  return (
    <div
      className="relative w-full h-full min-h-0"
      data-page="mapa-v4"
      data-territory-scope={territoryFilter.scope}
    >
      <div className="absolute inset-0">
        <MapLibreAdapter
          ref={adapterRef}
          styleUrl={TILE_STYLE_URL}
          territoryPolygons={territoryPolygons}
          markers={markers}
          resolved={resolved}
          enableClustering={false}
          onMarkerClick={(id) => {
            const marker = markers.find((m) => m.id === id);
            if (!marker) return;
            setSelectedMarker(marker);
            adapterRef.current?.flyTo({ center: marker.coordinates, zoom: 17 });
          }}
          onViewportChange={handleViewportChange}
          controls={{
            search: {
              type: 'geocoding',
              position: 'top-left',
              placeholder: 'Buscar lugar ou endereço...',
              debounceMs: 300,
            },
            location: {
              enabled: true,
              position: 'top-right',
              showAccuracy: true,
              autoFlyTo: true,
            },
            layers: {
              enabled: true,
              position: 'bottom-left',
              layers: MAP_RUNTIME_LAYER_KEYS,
              layout: 'vertical',
              visibleLayers,
              onLayerToggle: handleLayerToggle,
            },
            territory: {
              enabled: true,
              position: 'top-right',
              showSelector: true,
              showIndicator: territoryFilter.scope !== 'none',
              compact: true,
            },
          }}
          userLocationMarker={{ enabled: true, autoAdd: true }}
        />
      </div>

      {selectedMarker && (
        <MapMarkerPopup
          marker={selectedMarker}
          onClose={() => setSelectedMarker(null)}
          onNavigate={(url) => navigate(url)}
        />
      )}

      {loadingLayers.size > 0 && (
        <div
          style={{ position: 'absolute', top: 64, right: 16, zIndex: 10 }}
          role="status"
          aria-live="polite"
          aria-label="Carregando dados do mapa"
          data-loading
        >
          ⏳
        </div>
      )}

      {/* Indicador de fonte de localização */}
      {sourceMessage && locationStatus !== 'idle' && locationStatus !== 'resolving' && (
        <div
          style={{ 
            position: 'absolute', 
            bottom: 16, 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: isGps ? 'rgba(34, 197, 94, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          role="status"
          aria-live="polite"
        >
          <span>{isGps ? '📍' : '📌'}</span>
          <span>{sourceMessage}</span>
        </div>
      )}
    </div>
  );
}
