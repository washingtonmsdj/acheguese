/**
 * MapaPageV4 - Página do mapa
 *
 * SSoTs respeitados:
 * - Território   → useModuleTerritoryFilter({ routeResolved, activeMemberIds })
 * - Focus target → URL com lat/lng explicita, sem herdar filtro territorial artificial
 * - Layers       → providers injetados pelo boundary de aplicação
 * - Viewport     → useMapViewportFetch + MapLibreAdapter
 * - Geoloc GPS   → MapLibreAdapter.controls.location (via MapLocationControl → useRobustGeolocation → GeolocationService)
 *
 * @module core/maps/pages
 */

import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Layers3, Navigation } from 'lucide-react';
import { MapLibreAdapter, type MapLibreAdapterHandle } from '../components/v3/MapLibreAdapter';
import { MapMarkerPopup } from '../components/v3/MapMarkerPopup';
import { useMapViewportFetch, type LayerFetcher } from '../hooks/useMapViewportFetch';
import { DEFAULT_TILE_STYLE } from '../providers/MapProvider';
import { MAP_DEFAULT_BOUNDS, MAP_DEFAULT_ZOOM } from '../config/defaultCoordinates';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useResolvedUserLocation } from '@/core/location/hooks/useResolvedUserLocation';
import { useModuleTerritoryFilter } from '@/core/location/hooks/useModuleTerritoryFilter';
import { useTerritoryLabels } from '@/core/location/hooks/useTerritoryLabels';
import { useTerritoryPolygon, type TerritoryPolygon } from '../hooks/useTerritoryPolygon';
import { useQuery } from '@tanstack/react-query';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { APP_MODULE_SLUGS, buildAppModulePath } from '@/shared/config/moduleSlugs';
import {
  MODULE_SLUGS,
  buildGroupBaseUrl,
  buildModuleTerritoryUrl,
  geoPathToPublicUrl,
} from '@/core/routing/utils/territoryUrls';
import { boundaryService } from '@/core/geospatial';
import type { BoundingBox, MapLayerKey, MapMarker, MapViewport } from '../types/core';
import { EntityStatus } from '@/shared/types/enums';
import { LocationStatus, type Location } from '@/core/location/types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import type {
  MapLayerProviderRuntime,
  MapProviderBrowseLink,
} from '../providers/types';

export interface MapaPageV4Props {
  resolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
  presentation?: 'standalone' | 'embedded';
  initialLayers?: readonly MapLayerKey[];
  providers?: readonly MapLayerProviderRuntime[];
  nearbyEnabled?: boolean;
}

const TILE_STYLE_URL = DEFAULT_TILE_STYLE.styleUrl;
const NEARBY_URL = buildAppModulePath(APP_MODULE_SLUGS.nearby);
const INITIAL_BOUNDS: BoundingBox = MAP_DEFAULT_BOUNDS;
const INITIAL_ZOOM = MAP_DEFAULT_ZOOM;
const EMPTY_MAP_LAYERS: readonly MapLayerKey[] = [];
const EMPTY_MAP_PROVIDERS: readonly MapLayerProviderRuntime[] = [];

function MvpMapHeader({
  territoryName,
  mapLabel,
  providerLinks,
  nearbyHref,
}: {
  territoryName: string;
  mapLabel: string;
  providerLinks: readonly MapProviderBrowseLink[];
  nearbyHref: string | null;
}) {
  return (
    <section className="rounded-[24px] border border-border bg-card px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {territoryName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {mapLabel}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Veja as empresas disponíveis no território e abra cada resultado para saber mais.
          </p>
        </div>
        {(providerLinks.length > 0 || nearbyHref) && (
          <nav
            className="flex shrink-0 flex-wrap gap-2"
            aria-label="Atalhos relacionados ao mapa"
          >
            {providerLinks.map((link) => (
              <Link
                key={`${link.label}:${link.href}`}
                to={link.href}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Layers3 className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
            {nearbyHref && (
              <Link
                to={nearbyHref}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Perto de mim
              </Link>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}

function createInitialVisibleLayers(
  layerKeys: readonly MapLayerKey[],
): Partial<Record<MapLayerKey, boolean>> {
  return Object.fromEntries(
    layerKeys.map((layer) => [layer, true]),
  ) as Partial<Record<MapLayerKey, boolean>>;
}

function parseLayerQuery(
  searchParams: URLSearchParams,
  layerKeys: readonly MapLayerKey[],
): MapLayerKey[] {
  const rawValues = [
    ...searchParams.getAll('layer'),
    ...searchParams.getAll('layers'),
  ];

  const requested = rawValues
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return requested.filter((value): value is MapLayerKey =>
    layerKeys.includes(value as MapLayerKey),
  );
}

function createFocusedVisibleLayers(
  layers: readonly MapLayerKey[],
  layerKeys: readonly MapLayerKey[],
): Partial<Record<MapLayerKey, boolean>> {
  if (layers.length === 0) return createInitialVisibleLayers(layerKeys);
  const activeLayers = new Set(layers);
  return Object.fromEntries(
    layerKeys.map((layer) => [layer, activeLayers.has(layer)]),
  ) as Partial<Record<MapLayerKey, boolean>>;
}

function buildCityGeoPath(state: string, city: string): string | null {
  const safeState = state.trim();
  const safeCity = city.trim();
  if (!safeState || !safeCity) return null;
  return `/br/${safeState}/${safeCity}`;
}

function readLocationCenter(location: Location | null | undefined): MapViewport['center'] | null {
  const metadata = location?.metadata;
  if (!metadata) return null;

  const latitude = Number(
    metadata.center_latitude ?? metadata.canonical_lat ?? metadata.latitude,
  );
  const longitude = Number(
    metadata.center_longitude ?? metadata.canonical_lng ?? metadata.longitude,
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001)
  ) {
    return null;
  }

  return { latitude, longitude };
}

function toViewportCenter(center: [number, number] | null | undefined): MapViewport['center'] | null {
  if (!center) return null;
  const [latitude, longitude] = center;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001)
  ) {
    return null;
  }
  return { latitude, longitude };
}

function parseLocationGeoPath(geoPath: string): { state: string; city: string; neighborhood: string | null } | null {
  const parts = geoPath.split('/').filter(Boolean);
  if (parts.length === 3) {
    return {
      state: parts[1],
      city: parts[2].replace(/-/g, ' '),
      neighborhood: null,
    };
  }
  if (parts.length >= 4) {
    return {
      state: parts[1],
      city: parts[2].replace(/-/g, ' '),
      neighborhood: parts[3].replace(/-/g, ' '),
    };
  }
  return null;
}

async function resolveCanonicalCenter(resolved: ResolvedTerritory | null): Promise<MapViewport['center'] | null> {
  if (!resolved) return null;

  if (resolved.kind === 'location') {
    const parsed = parseLocationGeoPath(resolved.location.geographic_path);
    if (!parsed) return readLocationCenter(resolved.location);

    const bounds = parsed.neighborhood
      ? await boundaryService.getNeighborhoodBounds({
          neighborhood: parsed.neighborhood,
          city: parsed.city,
          state: parsed.state,
          locationId: resolved.location.id,
        })
      : await boundaryService.getCityBounds({
          city: parsed.city,
          state: parsed.state,
        });

    return toViewportCenter(bounds.center) ?? readLocationCenter(resolved.location);
  }

  const centers = await Promise.all(
    resolved.group.members.map(async (member) => {
      const parsed = parseLocationGeoPath(member.geographic_path);
      if (!parsed) return readLocationCenter(member);
      const bounds = parsed.neighborhood
        ? await boundaryService.getNeighborhoodBounds({
            neighborhood: parsed.neighborhood,
            city: parsed.city,
            state: parsed.state,
            locationId: member.id,
          })
        : await boundaryService.getCityBounds({
            city: parsed.city,
            state: parsed.state,
          });
      return toViewportCenter(bounds.center) ?? readLocationCenter(member);
    }),
  );

  const validCenters = centers.filter((center): center is MapViewport['center'] => Boolean(center));
  if (validCenters.length === 0) return null;

  return {
    latitude: validCenters.reduce((sum, center) => sum + center.latitude, 0) / validCenters.length,
    longitude: validCenters.reduce((sum, center) => sum + center.longitude, 0) / validCenters.length,
  };
}

function resolvedCenterKey(resolved: ResolvedTerritory | null): string {
  if (!resolved) return 'none';
  if (resolved.kind === 'location') return `location:${resolved.location.id}`;
  return `group:${resolved.group.id}`;
}

function resolveNearbyUrl(resolved: ResolvedTerritory | null): string {
  if (!resolved) return NEARBY_URL;

  if (resolved.kind === 'location') {
    return buildModuleTerritoryUrl(
      MODULE_SLUGS.nearby,
      geoPathToPublicUrl(resolved.location.geographic_path),
    );
  }

  const firstMember = resolved.group.members.at(0);
  if (!firstMember?.geographic_path) return NEARBY_URL;

  const [country, state, city] = firstMember.geographic_path
    .split("/")
    .filter(Boolean);
  if (!country || !state || !city) return NEARBY_URL;

  return buildModuleTerritoryUrl(
    MODULE_SLUGS.nearby,
    buildGroupBaseUrl(resolved.group, `/${country}/${state}/${city}`),
  );
}

export default function MapaPageV4({
  resolved,
  activeMemberIds = [],
  presentation = 'standalone',
  initialLayers = EMPTY_MAP_LAYERS,
  providers = EMPTY_MAP_PROVIDERS,
  nearbyEnabled = true,
}: MapaPageV4Props) {
  const adapterRef = useRef<MapLibreAdapterHandle>(null);
  const runtimeLayerKeys = React.useMemo(
    () => providers.map((provider) => provider.layerKey),
    [providers],
  );
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Partial<Record<MapLayerKey, boolean>>>(() =>
    createFocusedVisibleLayers(initialLayers, runtimeLayerKeys),
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { active: publicBrowsingCity } = usePublicBrowsingCity();
  const requestedLayers = React.useMemo(
    () => parseLayerQuery(searchParams, runtimeLayerKeys),
    [searchParams, runtimeLayerKeys],
  );
  const requestedLayersKey = React.useMemo(() => requestedLayers.join(','), [requestedLayers]);

  const focusTarget = React.useMemo(() => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    if (!latParam || !lngParam) return null;

    const rawLat = Number(latParam);
    const rawLng = Number(lngParam);
    const rawZoom = Number(searchParams.get('z') ?? searchParams.get('zoom') ?? 16);
    const name = searchParams.get('name') ?? searchParams.get('highlight') ?? 'Estabelecimento';

    const validLat = Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90;
    const validLng = Number.isFinite(rawLng) && rawLng >= -180 && rawLng <= 180;
    if (!validLat || !validLng) return null;

    const zoom = Number.isFinite(rawZoom) ? Math.min(20, Math.max(10, rawZoom)) : 16;

    return {
      latitude: rawLat,
      longitude: rawLng,
      zoom,
      name,
    };
  }, [searchParams]);

  const fallbackCityGeoPath = React.useMemo(
    () => buildCityGeoPath(publicBrowsingCity.state, publicBrowsingCity.city),
    [publicBrowsingCity.city, publicBrowsingCity.state],
  );

  const { data: fallbackMapLocation = null } = useQuery({
    queryKey: ['mapa-v4-fallback-location', fallbackCityGeoPath],
    queryFn: async () => {
      if (!fallbackCityGeoPath) return null;
      const location = await createLocationRepository().findByPath(fallbackCityGeoPath);
      return location?.status === LocationStatus.ACTIVE ? location : null;
    },
    enabled: !resolved && !focusTarget && Boolean(fallbackCityGeoPath),
    staleTime: 30 * 60 * 1000,
  });

  const effectiveResolved = React.useMemo<ResolvedTerritory | null>(() => {
    if (resolved) return resolved;
    if (focusTarget || !fallbackMapLocation) return null;
    return { kind: 'location', location: fallbackMapLocation };
  }, [fallbackMapLocation, focusTarget, resolved]);

  const effectiveResolvedCenterKey = React.useMemo(
    () => resolvedCenterKey(effectiveResolved),
    [effectiveResolved],
  );

  const { data: canonicalTerritoryCenter = null } = useQuery({
    queryKey: ['mapa-v4-canonical-center', effectiveResolvedCenterKey],
    queryFn: () => resolveCanonicalCenter(effectiveResolved),
    enabled: !focusTarget && Boolean(effectiveResolved),
    staleTime: 30 * 60 * 1000,
  });

  const initialViewport = React.useMemo(
    () => {
      if (focusTarget) {
        return {
          center: {
            latitude: focusTarget.latitude,
            longitude: focusTarget.longitude,
          },
          zoom: focusTarget.zoom,
        };
      }

      const fallbackCenter = readLocationCenter(fallbackMapLocation) ?? canonicalTerritoryCenter;
      return fallbackCenter
        ? { center: fallbackCenter, zoom: 12 }
        : undefined;
    },
    [canonicalTerritoryCenter, fallbackMapLocation, focusTarget],
  );

  const {
    isGps,
    status: locationStatus,
    sourceMessage,
  } = useResolvedUserLocation({
    autoResolve: true,
    tryGps: true,
  });

  const moduleTerritory = useModuleTerritoryFilter({
    routeResolved: effectiveResolved,
    activeMemberIds,
    nearbyEnabled: false,
  });
  const territoryFilter = moduleTerritory.territoryFilter;
  const isFocusOnlyMode = Boolean(focusTarget) && !effectiveResolved;
  const runtimeTerritoryFilter = isFocusOnlyMode ? undefined : territoryFilter;
  const { polygons: territoryPolygons } = useTerritoryPolygon(effectiveResolved);
  const territoryLabels = useTerritoryLabels(effectiveResolved);
  const territoryName = territoryLabels.name || publicBrowsingCity.city || 'Seu território';
  const providerLinks = React.useMemo(
    () =>
      providers.flatMap((provider) => {
        const link = provider.getBrowseLink?.(effectiveResolved) ?? null;
        return link ? [link] : [];
      }),
    [effectiveResolved, providers],
  );
  const nearbyUrl = React.useMemo(
    () => (nearbyEnabled ? resolveNearbyUrl(effectiveResolved) : null),
    [effectiveResolved, nearbyEnabled],
  );

  const fetchers = React.useMemo(() => {
    const next: Partial<Record<MapLayerKey, LayerFetcher>> = {};

    for (const provider of providers) {
      if (visibleLayers[provider.layerKey] === false) continue;
      next[provider.layerKey] = provider.createFetcher(runtimeTerritoryFilter);
    }

    return next;
  }, [providers, runtimeTerritoryFilter, visibleLayers]);

  const { layerData, loadingLayers, fetchByBounds, clearLayer } = useMapViewportFetch({
    fetchers,
    debounceMs: 400,
    minZoom: 10,
  });

  const handleLayerToggle = useCallback((key: string, visible: boolean) => {
    if (!runtimeLayerKeys.includes(key as MapLayerKey)) return;

    setVisibleLayers((prev) => ({
      ...prev,
      [key]: visible,
    }));

    if (!visible) clearLayer(key as MapLayerKey);
  }, [clearLayer, runtimeLayerKeys]);

  useEffect(() => {
    if (requestedLayers.length > 0) {
      setVisibleLayers(
        createFocusedVisibleLayers(requestedLayers, runtimeLayerKeys),
      );
      return;
    }
    setVisibleLayers(
      createFocusedVisibleLayers(initialLayers, runtimeLayerKeys),
    );
  }, [initialLayers, requestedLayers, requestedLayersKey, runtimeLayerKeys]);

  useEffect(() => {
    fetchByBounds(INITIAL_BOUNDS, INITIAL_ZOOM);
  }, [fetchByBounds]);

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
      fetchByBounds(bounds, viewport.zoom);
    },
    [fetchByBounds],
  );

  const focusMarkers = React.useMemo(() => {
    if (!focusTarget) return [] as MapMarker[];

    return [
      {
        id: 'focus-target',
        type: 'user_location',
        coordinates: {
          latitude: focusTarget.latitude,
          longitude: focusTarget.longitude,
        },
        title: focusTarget.name,
        status: EntityStatus.ACTIVE,
        metadata: { focusTarget: true },
      },
    ] satisfies MapMarker[];
  }, [focusTarget]);

  const markers = React.useMemo(
    () => [...focusMarkers, ...Object.values(layerData).flat()],
    [focusMarkers, layerData],
  );

  useEffect(() => {
    if (!focusTarget || selectedMarker || focusMarkers.length === 0) return;
    setSelectedMarker(focusMarkers[0]);
  }, [focusTarget, selectedMarker, focusMarkers]);

  const mapCanvas = (
    <div
      className="relative h-full min-h-[24rem] w-full md:min-h-[34rem]"
      data-page="mapa-v4"
      data-territory-scope={territoryFilter.scope}
      data-map-mode={isFocusOnlyMode ? 'focus-target' : 'territory'}
    >
      <div className="absolute inset-0">
        <MapLibreAdapter
          ref={adapterRef}
          styleUrl={TILE_STYLE_URL}
          initialViewport={initialViewport}
          territoryPolygons={territoryPolygons}
          markers={markers}
          resolved={effectiveResolved}
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
              enabled: runtimeLayerKeys.length > 1,
              position: 'bottom-left',
              layers: runtimeLayerKeys,
              layout: 'vertical',
              visibleLayers,
              onLayerToggle: handleLayerToggle,
            },
            territory: {
              enabled: true,
              position: 'top-right',
              showSelector: false,
              showIndicator: !isFocusOnlyMode && territoryFilter.scope !== 'none',
              compact: true,
            },
          }}
          userLocationMarker={{ enabled: true, autoAdd: false }}
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
          Carregando...
        </div>
      )}

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
            gap: '8px',
          }}
          role="status"
          aria-live="polite"
        >
          <span>{isGps ? 'GPS' : 'Território'}</span>
          <span>{sourceMessage}</span>
        </div>
      )}
    </div>
  );

  if (presentation === 'embedded') {
    return mapCanvas;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-20 pt-3 sm:px-6 md:pb-6 md:pt-5">
      <MvpMapHeader
        territoryName={territoryName}
        mapLabel={territoryLabels.mapLabel}
        providerLinks={providerLinks}
        nearbyHref={nearbyUrl}
      />
      <section className="overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
        <div className="h-[68vh] min-h-[28rem]">
          {mapCanvas}
        </div>
      </section>
    </div>
  );

}
