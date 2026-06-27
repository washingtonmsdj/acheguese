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

import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, LayoutList, MapPin, Tag, UtensilsCrossed, Wrench } from 'lucide-react';
import { MapLibreAdapter, type MapLibreAdapterHandle } from '../components/v3/MapLibreAdapter';
import { MapMarkerPopup } from '../components/v3/MapMarkerPopup';
import { useMapViewportFetch } from '../hooks/useMapViewportFetch';
import { mapEntityProjection } from '../services/MapEntityProjectionService';
import { DEFAULT_TILE_STYLE } from '../providers/MapProvider';
import { MAP_DEFAULT_BOUNDS, MAP_DEFAULT_ZOOM } from '../config/defaultCoordinates';
import {
  MAP_PUBLIC_RUNTIME_LAYER_KEYS,
  isMapRuntimeLayerEnabled,
} from '../config/runtimeConfig';
import { BusinessService } from '@/core/business/services/BusinessService';
import { mapClassifiedsLayerRuntimeService } from '@/core/maps/services/MapClassifiedsLayerRuntimeService';
import { mapGastronomyLayerRuntimeService } from '@/core/maps/services/MapGastronomyLayerRuntimeService';
import { mapServicesLayerRuntimeService } from '@/core/maps/services/MapServicesLayerRuntimeService';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useResolvedUserLocation } from '@/core/location/hooks/useResolvedUserLocation';
import { useTerritoryFilter, territoryFilterKey } from '@/core/location/hooks/useTerritoryFilter';
import { useTerritoryLabels } from '@/core/location/hooks/useTerritoryLabels';
import { useTerritoryPolygon, type TerritoryPolygon } from '../hooks/useTerritoryPolygon';
import { useQuery } from '@tanstack/react-query';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import { APP_MODULE_SLUGS, buildAppModulePath } from '@/config/moduleSlugs';
import { NeighborhoodTerritoryArt } from '@/core/community/components/public/NeighborhoodTerritoryArt';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { boundaryService } from '@/core/geospatial';
import { spatialSearchService } from '@/core/geospatial/services/SpatialSearchService';
import { useTouristPointPublicUrls } from '@/core/verticals/guide/routes/useTouristPointPublicUrls';
import { EntityStatus } from '@/shared/types/enums';
import type { BoundingBox, MapLayerKey, MapMarker, MapViewport } from '../types/core';
import { LocationStatus, type Location, type TerritoryFilter } from '@/core/location/types';
import type { Business } from '@/core/business/types/Business';
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
const BUSINESS_MAP_BASE_URL = buildAppModulePath(APP_MODULE_SLUGS.business);
const GASTRONOMY_MAP_BASE_URL = buildAppModulePath(APP_MODULE_SLUGS.gastronomy);

// ─── Bounds e zoom iniciais vindos do SSOT de mapas ───────────────────────────
const INITIAL_BOUNDS: BoundingBox = MAP_DEFAULT_BOUNDS;
const INITIAL_ZOOM = MAP_DEFAULT_ZOOM;

const COMMUNITY_MODULE_TABS = [
  { key: 'feed', label: 'Feed', shortLabel: 'Feed', icon: LayoutList },
  { key: 'business', label: 'Empresas', shortLabel: 'Emp.', icon: Building2 },
  { key: 'services', label: 'Servicos', shortLabel: 'Serv.', icon: Wrench },
  { key: 'classifieds', label: 'Classificados', shortLabel: 'Class.', icon: Tag },
  { key: 'gastronomy', label: 'Gastronomia', shortLabel: 'Gast.', icon: UtensilsCrossed },
  { key: 'map', label: 'Mapa', shortLabel: 'Mapa', icon: MapPin },
] as const;

const COMMUNITY_MAP_LAYER_BADGES = [
  { key: 'businesses', label: 'Negocios' },
  { key: 'services', label: 'Servicos' },
  { key: 'gastronomy', label: 'Gastronomia' },
  { key: 'classifieds', label: 'Classificados' },
] as const;

function NeighborhoodMapHero({
  territoryName,
  moduleUrls,
  mapLabel,
  polygons,
  markers,
}: {
  territoryName: string;
  moduleUrls: ReturnType<typeof useFriendlyModuleUrls>;
  mapLabel: string;
  polygons: TerritoryPolygon[];
  markers: MapMarker[];
}) {
  const moduleLinks = [
    { ...COMMUNITY_MODULE_TABS[5], href: moduleUrls.map, isActive: true },
    { ...COMMUNITY_MODULE_TABS[0], href: moduleUrls.community, isActive: false },
    { ...COMMUNITY_MODULE_TABS[1], href: moduleUrls.business, isActive: false },
    { ...COMMUNITY_MODULE_TABS[2], href: moduleUrls.services, isActive: false },
    { ...COMMUNITY_MODULE_TABS[3], href: moduleUrls.classifieds, isActive: false },
    { ...COMMUNITY_MODULE_TABS[4], href: moduleUrls.gastronomy, isActive: false },
  ] as const;

  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,24,32,0.98),rgba(7,17,24,0.98))] text-white shadow-xl shadow-black/10">
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {moduleLinks.map((item) => {
            const Icon = item.icon;
            return item.isActive ? (
              <span
                key={item.key}
                className="inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/12 px-3 text-xs font-semibold text-cyan-100 sm:px-4"
              >
                <Icon className="h-4 w-4" />
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            ) : (
              <Link
                key={item.key}
                to={item.href}
                className="inline-flex min-h-10 shrink-0 snap-start items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white sm:px-4"
              >
                <Icon className="h-4 w-4" />
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-cyan-300">
            {territoryName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[2rem]">
            {mapLabel}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
            Mapa vivo, contorno territorial e camadas locais no contexto real do bairro.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex min-h-8 items-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 text-xs font-semibold text-cyan-100">
              Territorio ativo
            </span>
            <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-white/75">
              Camadas ao vivo
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:max-w-xl sm:grid-cols-2 sm:gap-3">
            <Link
              to={moduleUrls.community}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300"
            >
              <LayoutList className="mr-2 h-4 w-4" />
              Ver feed do bairro
            </Link>
            <Link
              to={moduleUrls.business}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/14 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Explorar empresas
            </Link>
          </div>
        </div>

        <div className="grid gap-3 rounded-[20px] border border-white/10 bg-black/20 p-3 lg:p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Leitura territorial
            </p>
            <p className="mt-1 text-sm text-white/65">
              O contorno e os pins seguem o territorio ativo da comunidade.
            </p>
          </div>
          <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#07131a]">
            <NeighborhoodTerritoryArt polygons={polygons} markers={markers} compact decorative />
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_MAP_LAYER_BADGES.map((layer) => (
              <span
                key={layer.key}
                className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-white/75"
              >
                {layer.label}
              </span>
            ))}
          </div>
          <div className="hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] px-3 py-3 text-sm text-white/68 sm:block">
            A descoberta visual do bairro acontece aqui, sem trocar de landing e sem quebrar o contexto da comunidade.
          </div>
        </div>
      </div>
    </section>
  );
}

function createInitialVisibleLayers(): Partial<Record<MapLayerKey, boolean>> {
  return Object.fromEntries(
    MAP_PUBLIC_RUNTIME_LAYER_KEYS.map((layer) => [layer, true]),
  ) as Partial<Record<MapLayerKey, boolean>>;
}

function parseLayerQuery(searchParams: URLSearchParams): MapLayerKey[] {
  const rawValues = [
    ...searchParams.getAll('layer'),
    ...searchParams.getAll('layers'),
  ];

  const requested = rawValues
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return requested.filter((value): value is MapLayerKey =>
    MAP_PUBLIC_RUNTIME_LAYER_KEYS.includes(value as MapLayerKey),
  );
}

function createFocusedVisibleLayers(layers: readonly MapLayerKey[]): Partial<Record<MapLayerKey, boolean>> {
  if (layers.length === 0) return createInitialVisibleLayers();
  const activeLayers = new Set(layers);
  return Object.fromEntries(
    MAP_PUBLIC_RUNTIME_LAYER_KEYS.map((layer) => [layer, activeLayers.has(layer)]),
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
        { includeMetadata: true, calculateScore: true, baseUrl: BUSINESS_MAP_BASE_URL },
      );
    } catch {
      return [];
    }
  };
}

function makeGastronomyFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const gastronomyBusinesses = await mapGastronomyLayerRuntimeService.getGastronomyByBounds(bounds, {
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
          status: EntityStatus.ACTIVE,
          is_premium: business.is_premium,
          is_verified: business.is_verified,
          rating: business.rating,
          category: 'gastronomy',
          cuisine_type: business.cuisine_type,
          delivery_enabled: business.delivery_enabled,
          map_layer_key: 'gastronomy',
        })),
        'business',
        { includeMetadata: true, calculateScore: true, baseUrl: GASTRONOMY_MAP_BASE_URL },
      );
    } catch {
      return [];
    }
  };
}

function makeServicesFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const services = await mapServicesLayerRuntimeService.getServicesByBounds(bounds, {
        territoryFilter,
        limit: 200,
      });

      return mapEntityProjection.projectEntities(
        services.map((service) => ({
          id: service.id,
          name: service.name,
          url: service.url ?? undefined,
          latitude: service.latitude,
          longitude: service.longitude,
          status: EntityStatus.ACTIVE,
          is_verified: service.is_verified,
          rating: service.rating,
          category: service.category,
          subcategory: service.subcategory,
          description: service.description,
          map_layer_key: 'services',
        })),
        'service',
        { includeMetadata: true, calculateScore: true },
      );
    } catch {
      return [];
    }
  };
}

function makeClassifiedsFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    try {
      const classifieds = await mapClassifiedsLayerRuntimeService.getClassifiedsByBounds(bounds, {
        territoryFilter,
        limit: 200,
      });

      return mapEntityProjection.projectEntities(
        classifieds.map((classified) => ({
          id: classified.id,
          name: classified.name,
          url: classified.url ?? undefined,
          latitude: classified.latitude,
          longitude: classified.longitude,
          status: EntityStatus.ACTIVE,
          category: classified.category,
          description: classified.description,
          price: classified.price,
          condition: classified.condition,
          created_at: classified.created_at,
          map_layer_key: 'classifieds',
        })),
        'classified',
        { includeMetadata: true, calculateScore: true },
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
  const [currentBounds, setCurrentBounds] = useState<BoundingBox>(INITIAL_BOUNDS);
  const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM);
  const [visibleLayers, setVisibleLayers] = useState<Partial<Record<MapLayerKey, boolean>>>(
    createInitialVisibleLayers,
  );
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moduleUrls = useFriendlyModuleUrls();
  const { active: publicBrowsingCity } = usePublicBrowsingCity();
  const requestedLayers = React.useMemo(() => parseLayerQuery(searchParams), [searchParams]);
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
  const territoryFilter = useTerritoryFilter(effectiveResolved, activeMemberIds);
  const { polygons: territoryPolygons } = useTerritoryPolygon(effectiveResolved);
  const guideUrls = useTouristPointPublicUrls(effectiveResolved);
  const territoryLabels = useTerritoryLabels(effectiveResolved);
  const isCommunityScopedSurface = location.pathname.includes('/comunidade/');
  const territoryName = territoryLabels.name || publicBrowsingCity.city || 'Seu territorio';

  const touristLayerVisible = isMapRuntimeLayerEnabled('tourist_points') && visibleLayers.tourist_points !== false;
  const businessesLayerVisible = isMapRuntimeLayerEnabled('businesses') && visibleLayers.businesses !== false;
  const gastronomyLayerVisible = isMapRuntimeLayerEnabled('gastronomy') && visibleLayers.gastronomy !== false;
  const servicesLayerVisible = isMapRuntimeLayerEnabled('services') && visibleLayers.services !== false;
  const classifiedsLayerVisible = isMapRuntimeLayerEnabled('classifieds') && visibleLayers.classifieds !== false;

  const touristBounds = React.useMemo(
    () => ({
      west: currentBounds[0],
      south: currentBounds[1],
      east: currentBounds[2],
      north: currentBounds[3],
    }),
    [currentBounds],
  );

  const { data: touristPointsData } = useQuery({
    queryKey: ['tourist-points-spatial-bounds', touristBounds],
    queryFn: () =>
      spatialSearchService.searchByBounds({
        bounds: touristBounds,
        entityType: 'tourist_point',
        limit: 200,
      }),
    enabled: touristLayerVisible && currentZoom >= 10,
    staleTime: 1000 * 60 * 2,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const filterKey = territoryFilterKey(territoryFilter);
  const fetchers = React.useMemo(
    () => ({
      ...(businessesLayerVisible ? { businesses: makeBusinessFetcher(territoryFilter) } : {}),
      ...(gastronomyLayerVisible ? { gastronomy: makeGastronomyFetcher(territoryFilter) } : {}),
      ...(servicesLayerVisible ? { services: makeServicesFetcher(territoryFilter) } : {}),
      ...(classifiedsLayerVisible ? { classifieds: makeClassifiedsFetcher(territoryFilter) } : {}),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey, businessesLayerVisible, gastronomyLayerVisible, servicesLayerVisible, classifiedsLayerVisible],
  );

  const { layerData, loadingLayers, fetchByBounds, clearLayer } = useMapViewportFetch({
    fetchers,
    debounceMs: 400,
    minZoom: 10,
  });

  const handleLayerToggle = useCallback((key: string, visible: boolean) => {
    if (!MAP_PUBLIC_RUNTIME_LAYER_KEYS.includes(key as MapLayerKey)) return;

    setVisibleLayers((prev) => ({
      ...prev,
      [key]: visible,
    }));

    if (!visible) clearLayer(key as MapLayerKey);
  }, [clearLayer]);

  useEffect(() => {
    if (requestedLayers.length === 0) return;
    setVisibleLayers(createFocusedVisibleLayers(requestedLayers));
  }, [requestedLayers, requestedLayersKey]);

  // Fetch inicial com bounds configurados.
  // Quando os polígonos do território chegarem, o MapLibreAdapter centraliza
  // automaticamente e o onViewportChange dispara fetchByBounds com os bounds reais.
  useEffect(() => {
    fetchByBounds(INITIAL_BOUNDS, INITIAL_ZOOM);
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
  const focusMarkers = React.useMemo(() => {
    if (!focusTarget) return [] as MapMarker[];

    return mapEntityProjection.projectEntities(
      [
        {
          id: 'focus-target',
          name: focusTarget.name,
          latitude: focusTarget.latitude,
          longitude: focusTarget.longitude,
          status: EntityStatus.ACTIVE,
          map_layer_key: 'businesses',
        },
      ],
      'business',
      { includeMetadata: true, calculateScore: true, baseUrl: BUSINESS_MAP_BASE_URL },
    );
  }, [focusTarget]);

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
            status: EntityStatus.ACTIVE,
            location_id: result.location_id,
            map_layer_key: 'tourist_points',
          })),
          'tourist_point',
          { includeMetadata: true, calculateScore: true, baseUrl: guideUrls.touristPoints },
        )
      : [];

    const merged = [...Object.values(layerData).flat(), ...touristPointMarkers];
    return [...focusMarkers, ...merged];
  }, [touristPointsData, layerData, touristLayerVisible, focusMarkers, guideUrls.touristPoints]);

  useEffect(() => {
    if (!focusTarget || selectedMarker || focusMarkers.length === 0) return;
    setSelectedMarker(focusMarkers[0]);
  }, [focusTarget, selectedMarker, focusMarkers]);

  const mapCanvas = (
    <div
      className="relative h-full min-h-[24rem] w-full md:min-h-[34rem]"
      data-page="mapa-v4"
      data-territory-scope={territoryFilter.scope}
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
              enabled: true,
              position: isCommunityScopedSurface ? 'bottom-right' : 'bottom-left',
              layers: MAP_PUBLIC_RUNTIME_LAYER_KEYS,
              layout: 'vertical',
              visibleLayers,
              onLayerToggle: handleLayerToggle,
            },
            territory: {
              enabled: true,
              position: 'top-right',
              showSelector: false,
              showIndicator: territoryFilter.scope !== 'none',
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

      {/* Indicador de fonte de localização */}
      {sourceMessage && locationStatus !== 'idle' && locationStatus !== 'resolving' && (
        <div
          style={{ 
            position: 'absolute', 
            bottom: isCommunityScopedSurface ? 88 : 16,
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
          <span>{isGps ? 'GPS' : 'Território'}</span>
          <span>{sourceMessage}</span>
        </div>
      )}
    </div>
  );

  if (isCommunityScopedSurface) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-20 pt-3 sm:px-6 md:pb-6 md:pt-5">
        <NeighborhoodMapHero
          territoryName={territoryName}
          moduleUrls={moduleUrls}
          mapLabel={territoryLabels.mapLabel}
          polygons={territoryPolygons}
          markers={markers}
        />

        <section className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#0d161b] shadow-xl shadow-black/10">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                Vista operacional
              </p>
              <p className="mt-1 text-sm text-white/62">
                Navegue pelo mapa do bairro com camadas territoriais e pontos ativos.
              </p>
            </div>
          </div>
          <div className="h-[calc(100vh-33rem)] min-h-[22rem] md:h-[calc(100vh-12rem)]">
            {mapCanvas}
          </div>
        </section>
      </div>
    );
  }

  return mapCanvas;
}
