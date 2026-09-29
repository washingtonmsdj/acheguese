/**
 * MapaPageV4 - Página do mapa
 *
 * SSoTs respeitados:
 * - Território   → useModuleTerritoryFilter({ routeResolved, activeMemberIds })
 * - Focus target → URL com lat/lng explicita, sem herdar filtro territorial artificial
 * - Layers       → providers injetados pelo boundary de aplicação
 * - Viewport     → useMapViewportFetch + MapLibreAdapter
 * - Geoloc GPS   → opcional, solicitado apenas pelo controle explícito do mapa
 *
 * @module core/maps/pages
 */

import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  Layers3,
  MapPin,
  Navigation,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  X,
} from 'lucide-react';
import { MapLibreAdapter, type MapLibreAdapterHandle } from '../components/v3/MapLibreAdapter';
import { MapMarkerPopup } from '../components/v3/MapMarkerPopup';
import './MapaTerritorialExplorer.css';
import { useMapViewportFetch, type LayerFetcher } from '../hooks/useMapViewportFetch';
import { DEFAULT_TILE_STYLE } from '../providers/MapProvider';
import { MAP_DEFAULT_BOUNDS, MAP_DEFAULT_ZOOM } from '../config/defaultCoordinates';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useModuleTerritoryFilter } from '@/core/location/hooks/useModuleTerritoryFilter';
import { useTerritoryLabels } from '@/core/location/hooks/useTerritoryLabels';
import { useTerritoryPolygon, type TerritoryPolygon } from '../hooks/useTerritoryPolygon';
import { getLayerConfig } from '../config/markerConfig';
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
import { getBusinessCategoryLabel } from '@/shared/taxonomy/businessCategories';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import type {
  MapLayerProviderRuntime,
  MapProviderBrowseLink,
} from '../providers/types';

export interface MapaPageV4Props {
  resolved?: ResolvedTerritory | null;
  activeMemberIds?: string[];
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
    <section className="map-page-header rounded-[24px] border border-border bg-card px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {territoryName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {mapLabel}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Explore o território, filtre as camadas disponíveis e abra cada lugar para saber mais.
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

type MapSortMode = 'relevance' | 'alphabetical' | 'rating';

interface MapCategoryOption {
  key: string;
  label: string;
  count: number;
}

interface MapViewportReference {
  bounds: BoundingBox;
  zoom: number;
}

function hasMeaningfulViewportChange(
  reference: MapViewportReference,
  current: MapViewportReference,
): boolean {
  const referenceCenter = {
    longitude: (reference.bounds[0] + reference.bounds[2]) / 2,
    latitude: (reference.bounds[1] + reference.bounds[3]) / 2,
  };
  const currentCenter = {
    longitude: (current.bounds[0] + current.bounds[2]) / 2,
    latitude: (current.bounds[1] + current.bounds[3]) / 2,
  };
  const longitudeSpan = Math.max(Math.abs(reference.bounds[2] - reference.bounds[0]), 0.0001);
  const latitudeSpan = Math.max(Math.abs(reference.bounds[3] - reference.bounds[1]), 0.0001);
  const horizontalMovement = Math.abs(currentCenter.longitude - referenceCenter.longitude) / longitudeSpan;
  const verticalMovement = Math.abs(currentCenter.latitude - referenceCenter.latitude) / latitudeSpan;

  return Math.max(horizontalMovement, verticalMovement) >= 0.12
    || Math.abs(current.zoom - reference.zoom) >= 0.35;
}

function getMarkerCategory(marker: MapMarker): string | null {
  const category = marker.metadata?.category;
  return typeof category === 'string' && category.trim() ? category.trim() : null;
}

function getMarkerCategoryLabel(marker: MapMarker): string {
  const category = getMarkerCategory(marker);
  if (marker.type === 'business' && category) return getBusinessCategoryLabel(category);
  const label = category ?? marker.type.replace(/_/g, ' ');
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1);
}

function MapResultItem({
  marker,
  selected,
  onSelect,
}: {
  marker: MapMarker;
  selected: boolean;
  onSelect: (marker: MapMarker) => void;
}) {
  const ratingValue = marker.metadata?.rating;
  const rating = typeof ratingValue === 'number' && ratingValue > 0 ? ratingValue : null;
  const reviewCountValue = marker.metadata?.review_count;
  const reviewCount = typeof reviewCountValue === 'number' && reviewCountValue > 0
    ? reviewCountValue
    : null;
  const isVerified = marker.metadata?.is_verified === true;

  return (
    <article className="map-result-item" data-selected={selected || undefined}>
      <button
        type="button"
        className="map-result-select"
        onClick={() => onSelect(marker)}
        aria-pressed={selected}
        aria-label={`Mostrar ${marker.title} no mapa`}
      >
        <span className="map-result-icon" aria-hidden="true">
          {marker.type === 'business' ? <Store /> : <MapPin />}
        </span>
        <span className="map-result-copy">
          <span className="map-result-category">{getMarkerCategoryLabel(marker)}</span>
          <strong>{marker.title}</strong>
          <span className="map-result-meta">
            {isVerified ? (
              <span className="map-result-verified"><CheckCircle2 aria-hidden="true" /> Verificado</span>
            ) : null}
            {rating !== null ? (
              <span className="map-result-rating">
                <Star aria-hidden="true" /> {rating.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                {reviewCount !== null ? ` (${reviewCount})` : ''}
              </span>
            ) : null}
          </span>
        </span>
      </button>
      {marker.url ? (
        <Link
          className="map-result-details"
          to={marker.url}
          aria-label={`Ver detalhes de ${marker.title}`}
          title="Ver detalhes"
        >
          <ArrowUpRight aria-hidden="true" />
        </Link>
      ) : null}
    </article>
  );
}

function MapFilterDialog({
  open,
  verifiedAvailable,
  ratingAvailable,
  verifiedOnly,
  ratedOnly,
  onVerifiedChange,
  onRatedChange,
  onClose,
  onClear,
}: {
  open: boolean;
  verifiedAvailable: boolean;
  ratingAvailable: boolean;
  verifiedOnly: boolean;
  ratedOnly: boolean;
  onVerifiedChange: (value: boolean) => void;
  onRatedChange: (value: boolean) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  if (!open) return null;

  return (
    <div className="map-filter-backdrop" onMouseDown={onClose}>
      <section
        className="map-filter-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-filter-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="map-filter-kicker"><Filter aria-hidden="true" /> Ajuste a exploração</span>
            <h2 id="map-filter-title">Filtros do mapa</h2>
          </div>
          <button type="button" className="map-filter-close" onClick={onClose} aria-label="Fechar filtros">
            <X aria-hidden="true" />
          </button>
        </header>
        {verifiedAvailable || ratingAvailable ? (
          <fieldset className="map-filter-options">
            <legend>Exibir somente</legend>
            {verifiedAvailable ? (
              <label>
                <input type="checkbox" checked={verifiedOnly} onChange={(event) => onVerifiedChange(event.target.checked)} />
                <span>Negócios verificados</span>
              </label>
            ) : null}
            {ratingAvailable ? (
              <label>
                <input type="checkbox" checked={ratedOnly} onChange={(event) => onRatedChange(event.target.checked)} />
                <span>Lugares com avaliação</span>
              </label>
            ) : null}
          </fieldset>
        ) : (
          <p className="map-filter-empty">Ainda não há critérios adicionais disponíveis para estes resultados.</p>
        )}
        <footer>
          <button type="button" className="map-filter-clear" onClick={onClear}>Limpar filtros</button>
          <button type="button" className="map-filter-apply" onClick={onClose}>
            <Check aria-hidden="true" /> Aplicar
          </button>
        </footer>
      </section>
    </div>
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
  const [mapQuery, setMapQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortMode, setSortMode] = useState<MapSortMode>('relevance');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [ratedOnly, setRatedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sheetState, setSheetState] = useState<'collapsed' | 'medium' | 'expanded'>('collapsed');
  const resultsExpanded = sheetState !== 'collapsed';
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [visibleBounds, setVisibleBounds] = useState<BoundingBox | null>(null);
  const fittedTerritoryRef = useRef<string | null>(null);
  const [areaSearchAvailable, setAreaSearchAvailable] = useState(false);
  const resultsListRef = useRef<HTMLDivElement>(null);
  const areaSearchBaselineRef = useRef<MapViewportReference | null>(null);
  const sheetDragStartYRef = useRef<number | null>(null);
  const suppressSheetClickRef = useRef(false);
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

      const territorialCenter = canonicalTerritoryCenter;
      const fallbackCenter = territorialCenter ?? readLocationCenter(fallbackMapLocation);
      const isNeighborhood = effectiveResolved?.kind === 'location'
        && parseLocationGeoPath(effectiveResolved.location.geographic_path)?.neighborhood;
      const zoom = territorialCenter
        ? effectiveResolved?.kind === 'group' || !isNeighborhood ? 13 : 14
        : 12;

      return fallbackCenter
        ? { center: fallbackCenter, zoom }
        : undefined;
    },
    [canonicalTerritoryCenter, effectiveResolved, fallbackMapLocation, focusTarget],
  );

  useEffect(() => {
    areaSearchBaselineRef.current = null;
    setAreaSearchAvailable(false);
  }, [
    initialViewport?.center?.latitude,
    initialViewport?.center?.longitude,
    initialViewport?.zoom,
  ]);

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
    (viewport: MapViewport, bounds: BoundingBox, userInitiated = false) => {
      const currentViewport = { bounds, zoom: viewport.zoom };
      setVisibleBounds(bounds);
      const baseline = areaSearchBaselineRef.current;

      if (!baseline) {
        areaSearchBaselineRef.current = currentViewport;
        setAreaSearchAvailable(false);
      } else if (userInitiated) {
        setAreaSearchAvailable(hasMeaningfulViewportChange(baseline, currentViewport));
      } else {
        areaSearchBaselineRef.current = currentViewport;
        setAreaSearchAvailable(false);
      }

      if (!userInitiated) fetchByBounds(bounds, viewport.zoom);
    },
    [fetchByBounds],
  );

  const handleMapLoad = useCallback(() => {
    setMapReady(true);
    if (areaSearchBaselineRef.current) return;
    const map = adapterRef.current?.getMap();
    if (!map) return;

    const bounds = map.getBounds();
    areaSearchBaselineRef.current = {
      bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom: map.getZoom(),
    };
  }, []);

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

  const allMarkers = React.useMemo(
    () => [...focusMarkers, ...Object.values(layerData).flat()],
    [focusMarkers, layerData],
  );

  const categoryOptions = React.useMemo<MapCategoryOption[]>(() => {
    const counts = new Map<string, number>();
    allMarkers.forEach((marker) => {
      const category = getMarkerCategory(marker);
      if (!category) return;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        count,
        label: getBusinessCategoryLabel(key),
      }))
      .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  }, [allMarkers]);

  const verifiedFilterAvailable = React.useMemo(
    () => allMarkers.some((marker) => marker.metadata?.is_verified === true),
    [allMarkers],
  );
  const ratingFilterAvailable = React.useMemo(
    () => allMarkers.some((marker) => typeof marker.metadata?.rating === 'number' && Number(marker.metadata.rating) > 0),
    [allMarkers],
  );

  const filteredMarkers = React.useMemo(() => {
    const normalizedQuery = mapQuery.trim().toLocaleLowerCase('pt-BR');
    const filtered = allMarkers.filter((marker) => {
      const category = getMarkerCategory(marker);
      if (activeCategory !== 'all' && category !== activeCategory) return false;
      if (verifiedOnly && marker.metadata?.is_verified !== true) return false;
      if (ratedOnly && !(typeof marker.metadata?.rating === 'number' && marker.metadata.rating > 0)) return false;
      if (!normalizedQuery) return true;

      return [marker.title, marker.subtitle ?? '', category ?? '']
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
    });

    return filtered.sort((left, right) => {
      if (sortMode === 'alphabetical') return left.title.localeCompare(right.title, 'pt-BR');
      if (sortMode === 'rating') {
        const leftRating = typeof left.metadata?.rating === 'number' ? left.metadata.rating : -1;
        const rightRating = typeof right.metadata?.rating === 'number' ? right.metadata.rating : -1;
        return rightRating - leftRating || left.title.localeCompare(right.title, 'pt-BR');
      }
      return (right.score ?? 0) - (left.score ?? 0) || left.title.localeCompare(right.title, 'pt-BR');
    });
  }, [activeCategory, allMarkers, mapQuery, ratedOnly, sortMode, verifiedOnly]);

  const visibleResults = React.useMemo(() => filteredMarkers.filter((marker) => !visibleBounds || (
    marker.coordinates.longitude >= visibleBounds[0] && marker.coordinates.longitude <= visibleBounds[2]
    && marker.coordinates.latitude >= visibleBounds[1] && marker.coordinates.latitude <= visibleBounds[3]
  )), [filteredMarkers, visibleBounds]);
  const renderedMarkers = React.useMemo(() => filteredMarkers.map((marker) => ({
    ...marker, metadata: { ...marker.metadata, selected: selectedMarker?.id === marker.id },
  })), [filteredMarkers, selectedMarker?.id]);

  useEffect(() => {
    const map = adapterRef.current?.getMap();
    if (!initialViewport?.center) return;
    const scopeKey = `${initialViewport.center.latitude}:${initialViewport.center.longitude}`;
    if (!mapReady || !map || loadingLayers.size > 0 || !filteredMarkers.length || fittedTerritoryRef.current === scopeKey) return;
    const points = filteredMarkers.map((marker) => marker.coordinates)
      .filter((point) => Number.isFinite(point.longitude) && Number.isFinite(point.latitude));
    if (!points.length) return;
    fittedTerritoryRef.current = scopeKey;
    const mobile = map.getContainer().clientWidth <= 760;
    map.fitBounds([
      [Math.min(...points.map((p) => p.longitude)), Math.min(...points.map((p) => p.latitude))],
      [Math.max(...points.map((p) => p.longitude)), Math.max(...points.map((p) => p.latitude))],
    ], { padding: { top: 64, right: 48, bottom: mobile ? 150 : 64, left: 48 }, maxZoom: 16, duration: 0 });
  }, [mapReady, filteredMarkers, loadingLayers.size, initialViewport]);

  useEffect(() => {
    if (!selectedMarker || filteredMarkers.some((marker) => marker.id === selectedMarker.id)) return;
    setSelectedMarker(null);
  }, [filteredMarkers, selectedMarker]);

  useEffect(() => {
    if (!selectedMarker) return;
    const list = resultsListRef.current;
    const selectedItem = list?.querySelector<HTMLElement>('[data-selected="true"]');
    if (!list || !selectedItem) return;

    const listBounds = list.getBoundingClientRect();
    const itemBounds = selectedItem.getBoundingClientRect();
    const offset = itemBounds.top < listBounds.top
      ? itemBounds.top - listBounds.top
      : itemBounds.bottom > listBounds.bottom
        ? itemBounds.bottom - listBounds.bottom
        : 0;

    if (offset) list.scrollTop += offset;
  }, [selectedMarker, filteredMarkers, sheetState]);

  useEffect(() => {
    if (!focusTarget || selectedMarker || focusMarkers.length === 0) return;
    setSelectedMarker(focusMarkers[0]);
  }, [focusTarget, selectedMarker, focusMarkers]);

  const mapCanvas = (
    <div
      className="map-page-canvas relative h-full w-full"
      data-page="mapa-v4"
      data-territory-scope={territoryFilter.scope}
      data-map-mode={isFocusOnlyMode ? 'focus-target' : 'territory'}
    >
      <div className="absolute inset-0">
        <MapLibreAdapter
          ref={adapterRef}
          styleUrl={TILE_STYLE_URL}
          initialViewport={initialViewport}
          onLoad={handleMapLoad}
          territoryPolygons={territoryPolygons}
          autoCenterTerritory={false}
          markers={renderedMarkers}
          resolved={effectiveResolved}
          enableClustering={filteredMarkers.length > 20}
          customAttribution={false}
          onMarkerClick={(id) => {
            const marker = filteredMarkers.find((m) => m.id === id);
            if (!marker) return;
            setSelectedMarker(marker);
            setSheetState('medium');
            adapterRef.current?.flyTo({ center: marker.coordinates, zoom: 17 });
          }}
          onViewportChange={handleViewportChange}
          controls={{
            location: {
              enabled: true,
              position: 'top-right',
              showAccuracy: true,
              autoFlyTo: true,
            },
            layers: {
              enabled: false,
              position: 'bottom-left',
              layers: runtimeLayerKeys,
              layout: 'vertical',
              visibleLayers,
              onLayerToggle: handleLayerToggle,
            },
            territory: {
              enabled: false,
              position: 'top-right',
              showSelector: false,
              showIndicator: false,
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

    </div>
  );

  const selectMarker = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setSheetState('medium');
    adapterRef.current?.flyTo({ center: marker.coordinates, zoom: 16 });
  };

  const beginResultsSheetDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    sheetDragStartYRef.current = event.clientY;
    suppressSheetClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveResultsSheetDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const startY = sheetDragStartYRef.current;
    if (startY !== null && Math.abs(event.clientY - startY) > 10) {
      suppressSheetClickRef.current = true;
      setSheetDragOffset(startY - event.clientY);
    }
  };

  const finishResultsSheetDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    const startY = sheetDragStartYRef.current;
    if (startY === null) return;

    const delta = event.clientY - startY;
    if (Math.abs(delta) > 10) suppressSheetClickRef.current = true;
    if (delta <= -42) setSheetState((state) => state === 'collapsed' ? 'medium' : 'expanded');
    if (delta >= 42) setSheetState((state) => state === 'expanded' ? 'medium' : 'collapsed');
    setSheetDragOffset(0);
    sheetDragStartYRef.current = null;
  };

  const refreshCurrentArea = () => {
    const map = adapterRef.current?.getMap();
    const bounds = map?.getBounds();
    if (!map || !bounds) return;

    const currentBounds: BoundingBox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    const zoom = map.getZoom();
    areaSearchBaselineRef.current = { bounds: currentBounds, zoom };
    setAreaSearchAvailable(false);
    fetchByBounds(currentBounds, zoom);
  };

  const clearMapFilters = () => {
    setActiveCategory('all');
    setVerifiedOnly(false);
    setRatedOnly(false);
    setMapQuery('');
  };

  return (
    <div className="map-page mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-20 pt-3 sm:px-6 md:pb-6 md:pt-5">
      <MvpMapHeader
        territoryName={territoryName}
        mapLabel={territoryLabels.mapLabel}
        providerLinks={providerLinks}
        nearbyHref={nearbyUrl}
      />
      <div className="map-explorer" data-map-explorer>
        <aside className="map-explorer-sidebar" aria-label="Busca e resultados do mapa">
          <div className="map-explorer-tools">
            <div className="map-explorer-heading">
              <span className="map-explorer-heading-icon"><Layers3 aria-hidden="true" /></span>
              <div>
                <h2>Mapa do território</h2>
                <p>Explore os lugares reais disponíveis nesta área.</p>
              </div>
            </div>

            <div className="map-explorer-search-row">
              <label className="map-explorer-search">
                <Search aria-hidden="true" />
                <input
                  type="search"
                  value={mapQuery}
                  onChange={(event) => setMapQuery(event.target.value)}
                  placeholder="Buscar no mapa..."
                  aria-label="Buscar lugares no mapa"
                />
                {mapQuery ? (
                  <button type="button" onClick={() => setMapQuery('')} aria-label="Limpar busca">
                    <X aria-hidden="true" />
                  </button>
                ) : null}
              </label>
              {verifiedFilterAvailable || ratingFilterAvailable ? (
                <button
                  type="button"
                  className="map-filter-trigger"
                  onClick={() => setFiltersOpen(true)}
                  aria-label="Abrir filtros"
                  title="Filtros"
                >
                  <SlidersHorizontal aria-hidden="true" />
                  {(verifiedOnly || ratedOnly) ? <span aria-label="Filtros ativos" /> : null}
                </button>
              ) : null}
            </div>

            {providers.length > 0 ? (
              <div className="map-explorer-layers" role="group" aria-label="Camadas do mapa">
                {providers.map((provider) => {
                  const isVisible = visibleLayers[provider.layerKey] !== false;
                  const layerConfig = getLayerConfig(provider.layerKey);
                  return (
                    <button
                      type="button"
                      key={provider.layerKey}
                      className="map-layer-chip"
                      data-active={isVisible}
                      aria-pressed={isVisible}
                      onClick={() => handleLayerToggle(provider.layerKey, !isVisible)}
                    >
                      <span style={{ backgroundColor: layerConfig.color }} aria-hidden="true" />
                      {provider.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {categoryOptions.length > 0 ? (
              <div className="map-category-area">
                <div className="map-category-heading">
                  <span>Categorias</span>
                  <span>{categoryOptions.length} disponíveis</span>
                </div>
                <div className="map-category-chips" role="group" aria-label="Filtrar por categoria">
                  <button
                    type="button"
                    className="map-category-chip"
                    data-active={activeCategory === 'all'}
                    aria-pressed={activeCategory === 'all'}
                    onClick={() => setActiveCategory('all')}
                  >
                    Todas <span>{allMarkers.length}</span>
                  </button>
                  {categoryOptions.map((category) => (
                    <button
                      type="button"
                      className="map-category-chip"
                      key={category.key}
                      data-active={activeCategory === category.key}
                      aria-pressed={activeCategory === category.key}
                      onClick={() => setActiveCategory(category.key)}
                    >
                      {category.label} <span>{category.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <section
            className="map-results-panel"
            data-expanded={resultsExpanded}
            data-sheet-state={sheetState}
            data-dragging={sheetDragOffset !== 0}
            style={{ '--sheet-drag-offset': `${sheetDragOffset}px` } as React.CSSProperties}
            aria-label="Resultados encontrados no mapa"
          >
            <div className="map-results-drag-handle-wrap">
              <button
                type="button"
                className="map-results-drag-handle"
                aria-label={resultsExpanded ? 'Recolher lista de lugares' : 'Expandir lista de lugares'}
                aria-expanded={resultsExpanded}
                aria-controls="territorial-map-results"
                onPointerDown={beginResultsSheetDrag}
                onPointerMove={moveResultsSheetDrag}
                onPointerUp={finishResultsSheetDrag}
                onPointerCancel={() => {
                  sheetDragStartYRef.current = null;
                  setSheetDragOffset(0);
                  suppressSheetClickRef.current = false;
                }}
                onClick={() => {
                  if (suppressSheetClickRef.current) {
                    suppressSheetClickRef.current = false;
                    return;
                  }
                  setSheetState((state) => state === 'collapsed' ? 'medium' : state === 'medium' ? 'expanded' : 'collapsed');
                }}
              >
                <span aria-hidden="true" />
              </button>
            </div>
            <div className="map-results-header">
              <div className="map-results-title">
                <span>
                  <strong>{visibleResults.length} {visibleResults.length === 1 ? 'lugar' : 'lugares'}</strong>
                  <small>visíveis no mapa</small>
                </span>
                <button
                  type="button"
                  className="map-results-expand"
                  aria-expanded={resultsExpanded}
                  aria-controls="territorial-map-results"
                  aria-label={resultsExpanded ? 'Recolher resultados' : 'Expandir resultados'}
                  onClick={() => setSheetState((state) => state === 'collapsed' ? 'medium' : state === 'medium' ? 'expanded' : 'collapsed')}
                >
                  <ChevronDown aria-hidden="true" />
                </button>
              </div>
              <label className="map-sort-control">
                <span>Ordenar</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as MapSortMode)}
                  aria-label="Ordenar resultados do mapa"
                >
                  <option value="relevance">Mais relevantes</option>
                  {ratingFilterAvailable ? <option value="rating">Melhor avaliados</option> : null}
                  <option value="alphabetical">Nome (A–Z)</option>
                </select>
                <ChevronDown aria-hidden="true" />
              </label>
            </div>

            <div ref={resultsListRef} id="territorial-map-results" className="map-results-list" aria-live="polite">
              {visibleResults.map((marker) => (
                <MapResultItem
                  key={`${marker.type}:${marker.id}`}
                  marker={marker}
                  selected={selectedMarker?.id === marker.id}
                  onSelect={selectMarker}
                />
              ))}
              {filteredMarkers.length === 0 ? (
                <div className="map-results-empty">
                  {loadingLayers.size > 0 ? (
                    <p role="status">Carregando lugares desta área…</p>
                  ) : allMarkers.length > 0 ? (
                    <>
                      <p>Nenhum lugar corresponde à busca e aos filtros.</p>
                      <button type="button" onClick={clearMapFilters}>Limpar busca e filtros</button>
                    </>
                  ) : (
                    <p>Nenhum lugar disponível nesta área do mapa.</p>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </aside>

        <section className="map-explorer-map-panel" aria-label={`Mapa de ${territoryName}`}>
          <div className="map-page-viewport">
            {mapCanvas}
          </div>
          <div className="map-territory-label" aria-label={`Território: ${territoryName}`}>
            <MapPin aria-hidden="true" />
            <span>{territoryName}</span>
          </div>
          {areaSearchAvailable ? (
            <button
              type="button"
              className="map-refresh-area"
              onClick={refreshCurrentArea}
              disabled={loadingLayers.size > 0}
            >
              <Search aria-hidden="true" />
              {loadingLayers.size > 0 ? 'Atualizando…' : 'Buscar nesta área'}
            </button>
          ) : null}
        </section>
      </div>

      <MapFilterDialog
        open={filtersOpen}
        verifiedAvailable={verifiedFilterAvailable}
        ratingAvailable={ratingFilterAvailable}
        verifiedOnly={verifiedOnly}
        ratedOnly={ratedOnly}
        onVerifiedChange={setVerifiedOnly}
        onRatedChange={setRatedOnly}
        onClose={() => setFiltersOpen(false)}
        onClear={() => {
          setVerifiedOnly(false);
          setRatedOnly(false);
        }}
      />
    </div>
  );

}
