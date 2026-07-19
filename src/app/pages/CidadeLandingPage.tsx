/**
 * CidadeLandingPage
 *
 * Página operacional territorial da cidade. Usa o contexto resolvido da rota,
 * filtros territoriais canônicos e o mapa real do produto.
 */

import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CloudSun,
  ExternalLink,
  Heart,
  HelpCircle,
  LayoutGrid,
  List,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Moon,
  Plus,
  Repeat2,
  Search,
  ShieldCheck,
  Star,
  Store,
  Sun,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import heroImg from "@/assets/hero-landing-main.jpg";
import bairroPituba from "@/assets/bairro-pituba.jpg";
import bairroRioVermelho from "@/assets/bairro-riovermelho.jpg";
import empresasHero from "@/assets/empresas-hero.jpg";
import neighborhoodFeatured from "@/assets/neighborhood-featured.jpg";
import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";
import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { useTheme } from "@/shared/hooks/useTheme";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Business } from "@/core/business/types/Business";
import { useCityFeatured } from "@/core/city/hooks/useCityFeatured";
import { useCityMetadata } from "@/core/city/hooks/useCityMetadata";
import {
  LandingFeaturedService,
  buildNeighborhoodStreamItems,
  getNeighborhoodStreamMoreConfig,
  type FeaturedBusiness,
  type FeaturedClassified,
  type FeaturedService,
} from "@/core/landing/services";
import { classifiedUrlService } from "@/core/classifieds/services/ClassifiedUrlService";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { LocationService } from "@/core/location/services/LocationService";
import {
  LocationStatus,
  LocationType,
  type Location,
  type TerritoryFilter,
} from "@/core/location/types";
import {
  DARK_TILE_STYLE,
  DEFAULT_TILE_STYLE,
  MapLibreAdapter,
  mapEntityProjection,
  useTerritoryPolygon,
  type MapMarker,
  type TerritoryPolygon,
} from "@/core/maps";
import { mapClassifiedsLayerRuntimeService } from "@/core/maps/services/MapClassifiedsLayerRuntimeService";
import { mapGastronomyLayerRuntimeService } from "@/core/maps/services/MapGastronomyLayerRuntimeService";
import { mapServicesLayerRuntimeService } from "@/core/maps/services/MapServicesLayerRuntimeService";
import type { BoundingBox } from "@/core/maps/types/core";
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import {
  CommunityOverviewSurface,
  type CommunityOverviewSection,
  type CommunityOverviewView,
} from "@/core/community/components/page/CommunityOverviewSurface";
import {
  isCommunityOverviewView,
  isCommunitySocialView,
} from "@/core/community/components/page/communityOverviewNavigation";
import { useCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
import { PublicHeaderMobileMenu } from "@/core/navigation/PublicHeaderMobileMenu";
import {
  buildPublicHeaderNavigation,
  type PublicHeaderNavItem,
  type PublicHeaderNavItemId,
} from "@/core/navigation/publicHeaderNavigation";
import { useTouristPoints } from "@/core/guide/tourist-points/hooks/useTouristPoints";
import type { TouristPoint } from "@/core/guide/tourist-points/types";
import { residenceService } from "@/core/residence/services/ResidenceService";
import type { Post } from "@/core/posts/types";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { useCommunityUrls } from "@/core/routing/hooks/useCommunityUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { parsePublicTerritoryPath } from "@/core/routing/utils/publicTerritoryPath";
import { isPublicTerritoryFallbackLocation } from "@/core/routing/utils/publicTerritoryFallbacks";
import {
  formatCategory,
  formatMetric,
  formatPrice,
} from "./CidadeLanding.constants";
import {
  buildCityModuleUrls,
  type CityModuleUrls,
  getBusinessPublicUrl,
  withQueryParams,
} from "./CidadeLanding.utils";
import {
  NeighborhoodStream,
  type NeighborhoodCommunityTab,
  type NeighborhoodCommunityTabId,
} from "./CidadeLanding.neighborhood-stream";
import {
  NeighborhoodAlertsPanel,
  NeighborhoodGateCard,
  NeighborhoodStatsPanel,
  type NeighborhoodAccessStatus,
  type PopulationMetric,
} from "./CidadeLanding.neighborhood-panels";
import { NeighborhoodTerritoryHero } from "./CidadeLanding.neighborhood-hero";
import { NeighborhoodTerritoryArt } from "@/core/community/components/public/NeighborhoodTerritoryArt";
import "./CidadeLandingPage.css";

const CommunityCreatePostModal = lazy(() =>
  import("@/core/community/components/composer/CreatePostModal").then(
    (module) => ({
      default: module.CreatePostModal,
    }),
  ),
);

type Coordinates = {
  latitude: number;
  longitude: number;
};

type WeatherBadgeState = {
  label: string;
  ariaLabel: string;
  isLoading: boolean;
};

type NavItem = {
  label: string;
  href: string;
  surface: LaunchSurfaceKey;
};

const COMMUNITY_DESKTOP_NAV_IDS = new Set<PublicHeaderNavItemId>([
  "home",
  "community",
  "business",
  "classifieds",
  "services",
  "map",
]);

type StatCard = {
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
  tone: "cyan" | "blue" | "amber" | "pink";
};

type DistrictCard = {
  name: string;
  description: string;
  image: string;
  href: string;
  meta: string;
};

const salvadorCenter: Coordinates = { latitude: -12.94, longitude: -38.45 };

const salvadorFallbackCoordinates: [number, number][] = [
  [-13.0127, -38.5856],
  [-13.0149, -38.4687],
  [-12.956, -38.385],
  [-12.9571, -38.3535],
  [-12.9109, -38.3043],
  [-12.8947, -38.3549],
  [-12.8391, -38.3534],
  [-12.8243, -38.374],
  [-12.867, -38.416],
  [-12.8294, -38.464],
  [-12.7915, -38.4623],
  [-12.7793, -38.5038],
  [-12.7483, -38.5085],
  [-12.7387, -38.535],
  [-12.7339, -38.5879],
  [-12.754, -38.5879],
  [-12.7541, -38.6952],
  [-12.8006, -38.6986],
  [-12.8454, -38.6749],
  [-12.8926, -38.5888],
  [-12.9327, -38.5611],
  [-13.0127, -38.5856],
];

const salvadorFallbackTerritoryPolygons: TerritoryPolygon[] = [
  {
    name: "Salvador",
    coordinates: salvadorFallbackCoordinates,
    center: [salvadorCenter.latitude, salvadorCenter.longitude],
    color: "#18d6cd",
  },
];

const salvadorBounds: BoundingBox = [-38.72, -13.04, -38.27, -12.71];
const weatherCacheTtlMs = 10 * 60 * 1000;
const currentWeatherCache = new globalThis.Map<
  string,
  { temperatureCelsius: number; expiresAt: number }
>();
const locationReadService = new LocationService(createLocationRepository());
const districtImages = [
  bairroRioVermelho,
  bairroPituba,
  neighborhoodFeatured,
  empresasHero,
];

function toDisplayName(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugToTerritoryLabel(slug: string): string {
  const lowercaseWords = new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "em",
    "a",
    "o",
  ]);
  return slug
    .split("-")
    .filter(Boolean)
    .map((part, index) => {
      if (index > 0 && lowercaseWords.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function isSalvadorRoute(state: string, city: string): boolean {
  return normalizeText(state) === "ba" && normalizeText(city) === "salvador";
}

function getFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLocationCenter(
  location: Location | null | undefined,
): Coordinates | null {
  const metadata = location?.metadata;
  if (!metadata) return null;

  const latitude =
    getFiniteNumber(metadata.center_latitude) ??
    getFiniteNumber(metadata.center_lat) ??
    getFiniteNumber(metadata.canonical_lat) ??
    getFiniteNumber(metadata.latitude) ??
    getFiniteNumber(metadata.lat);
  const longitude =
    getFiniteNumber(metadata.center_longitude) ??
    getFiniteNumber(metadata.center_lng) ??
    getFiniteNumber(metadata.canonical_lng) ??
    getFiniteNumber(metadata.longitude) ??
    getFiniteNumber(metadata.lng);

  return latitude != null && longitude != null ? { latitude, longitude } : null;
}

function getResolvedTerritoryLocations(
  resolved: ResolvedTerritory | null,
): Location[] {
  if (!resolved) return [];
  return resolved.kind === "group"
    ? resolved.group.members
    : [resolved.location];
}

function getCityPartsFromResolved(resolved: ResolvedTerritory | null): {
  state?: string;
  city?: string;
} {
  const location = getResolvedTerritoryLocations(resolved)[0];
  const parts = location?.geographic_path.split("/").filter(Boolean) ?? [];
  const publicParts = parts[0] === "br" ? parts.slice(1) : parts;
  return {
    state: publicParts[0],
    city: publicParts[1],
  };
}

function getResolvedTerritoryName(
  resolved: ResolvedTerritory | null,
  fallback: string,
): string {
  if (!resolved) return fallback;
  return resolved.kind === "group"
    ? resolved.group.name
    : resolved.location.name;
}

function getPublicTerritoryDisplayName(
  pathname: string,
  resolved: ResolvedTerritory | null,
  fallback: string,
): string {
  const parsed = parsePublicTerritoryPath(pathname);
  if (parsed.territorySlug) return slugToTerritoryLabel(parsed.territorySlug);
  return getResolvedTerritoryName(resolved, fallback);
}

function getResolvedTerritoryCenter(
  resolved: ResolvedTerritory | null,
): Coordinates | null {
  const locations = getResolvedTerritoryLocations(resolved);
  const centers = locations
    .map(getLocationCenter)
    .filter((center): center is Coordinates => Boolean(center));
  if (centers.length === 0) return null;

  const latitude =
    centers.reduce((sum, center) => sum + center.latitude, 0) / centers.length;
  const longitude =
    centers.reduce((sum, center) => sum + center.longitude, 0) / centers.length;
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

const POPULATION_METADATA_FIELDS = [
  { key: "ibge_population_2022", sourceLabel: "IBGE 2022" },
  { key: "population_2022", sourceLabel: "IBGE 2022" },
  { key: "ibge_population", sourceLabel: "IBGE" },
  { key: "population", sourceLabel: "metadata territorial" },
  { key: "residents_count", sourceLabel: "cadastro local" },
  { key: "moradores_count", sourceLabel: "cadastro local" },
  { key: "residents", sourceLabel: "cadastro local" },
] as const;

const BUSINESS_COUNT_METADATA_FIELDS = [
  "businesses_count",
  "business_count",
  "active_businesses",
  "verified_businesses_count",
] as const;

const SERVICES_COUNT_METADATA_FIELDS = [
  "services_count",
  "service_count",
  "professionals_count",
  "verified_services_count",
] as const;

function getLocationPopulationMetric(
  location: Location,
): PopulationMetric | null {
  for (const { key, sourceLabel } of POPULATION_METADATA_FIELDS) {
    const value = getFiniteNumber(getRecordValue(location.metadata, key));
    if (value != null) return { value, sourceLabel };
  }
  return null;
}

function getResolvedPopulationMetric(
  resolved: ResolvedTerritory | null,
): PopulationMetric {
  const values = getResolvedTerritoryLocations(resolved)
    .map(getLocationPopulationMetric)
    .filter((metric): metric is PopulationMetric =>
      Boolean(metric?.value && metric.value > 0),
    );

  if (values.length === 0) {
    return { sourceLabel: "IBGE pendente" };
  }

  const sourceLabel = values.every((metric) =>
    metric.sourceLabel.includes("IBGE"),
  )
    ? values[0].sourceLabel
    : "metadata territorial";
  return {
    value: values.reduce((sum, metric) => sum + (metric.value ?? 0), 0),
    sourceLabel,
  };
}

function getLocationNumericMetric(
  location: Location,
  fields: readonly string[],
): number | null {
  for (const field of fields) {
    const value = getFiniteNumber(getRecordValue(location.metadata, field));
    if (value != null) return value;
  }

  return null;
}

function getResolvedNumericMetric(
  resolved: ResolvedTerritory | null,
  fields: readonly string[],
): number | undefined {
  const values = getResolvedTerritoryLocations(resolved)
    .map((location) => getLocationNumericMetric(location, fields))
    .filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value) && value > 0,
    );

  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function getNeighborhoodAccessStatus(
  isAuthenticated: boolean,
  isResidenceVerifiedInTerritory: boolean,
): NeighborhoodAccessStatus {
  if (!isAuthenticated) return "visitor";
  return isResidenceVerifiedInTerritory ? "verified" : "unverified";
}

function getCenterFromPolygons(
  polygons: TerritoryPolygon[],
): Coordinates | null {
  const center = polygons.find((polygon) => polygon.center)?.center;
  if (!center) return null;
  const [latitude, longitude] = center;
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

function getBoundsFromPolygons(
  polygons: TerritoryPolygon[],
): BoundingBox | null {
  const coordinates = polygons.flatMap((polygon) => polygon.coordinates);
  if (!coordinates.length) return null;

  const latitudes = coordinates.map(([latitude]) => latitude);
  const longitudes = coordinates.map(([, longitude]) => longitude);
  const west = Math.min(...longitudes);
  const south = Math.min(...latitudes);
  const east = Math.max(...longitudes);
  const north = Math.max(...latitudes);

  return [west, south, east, north];
}

function isInsideBounds(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  bounds: BoundingBox,
): boolean {
  if (latitude == null || longitude == null) return false;
  const [west, south, east, north] = bounds;
  return (
    longitude >= west &&
    longitude <= east &&
    latitude >= south &&
    latitude <= north
  );
}

function hasValidCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude)
  );
}

function formatLocationFromGeoPath(path: string | null | undefined): string {
  if (!path) return "Salvador";
  const parts = path.split("/").filter(Boolean);
  const last = parts.at(-1);
  return last ? toDisplayName(last) : "Salvador";
}

function firstMetric(
  ...values: Array<number | null | undefined>
): number | undefined {
  const positive = values.find(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  if (positive != null) return positive;
  return values.find(
    (value) => typeof value === "number" && Number.isFinite(value),
  );
}

function isGastronomyBusiness(business: FeaturedBusiness): boolean {
  const haystack = ` ${normalizeText(`${business.name} ${business.category}`).replace(/[^a-z0-9]+/g, " ")} `;
  const blockedTerms = [
    "academia",
    "beleza",
    "colegio",
    "educacao",
    "escola",
    "farmacia",
    "saude",
    "servico",
    "servicos",
    "tecnologia",
  ];
  if (blockedTerms.some((term) => haystack.includes(` ${term} `))) return false;

  return [
    "acaraje",
    "acai",
    "adega",
    "alimentacao",
    "alimentos",
    "restaurante",
    "gastronomia",
    "bar",
    "cafeteria",
    "lanchonete",
    "marmitaria",
    "padaria",
    "pastelaria",
    "pizzaria",
    "cafe",
    "sorveteria",
    "comida",
  ].some((term) => haystack.includes(` ${term} `));
}

async function fetchCurrentTemperature(point: Coordinates): Promise<number> {
  const cacheKey = `${point.latitude.toFixed(3)},${point.longitude.toFixed(3)}`;
  const cached = currentWeatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.temperatureCelsius;

  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
    current: "temperature_2m",
    temperature_unit: "celsius",
    timezone: "auto",
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  );
  if (!response.ok) throw new Error("Weather request failed");

  const payload = (await response.json()) as {
    current?: { temperature_2m?: number };
  };
  const temperature = payload.current?.temperature_2m;
  if (typeof temperature !== "number" || !Number.isFinite(temperature)) {
    throw new Error("Weather response missing temperature");
  }

  currentWeatherCache.set(cacheKey, {
    temperatureCelsius: temperature,
    expiresAt: Date.now() + weatherCacheTtlMs,
  });
  return temperature;
}

function useCurrentTemperature(
  point: Coordinates | null,
  label: string,
  enabled = true,
): WeatherBadgeState {
  const [state, setState] = useState<WeatherBadgeState>({
    label: "--°C",
    ariaLabel: `Temperatura atual em ${label} indisponível`,
    isLoading: true,
  });

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({ ...current, isLoading: false }));
      return;
    }

    if (!point) {
      setState({
        label: "--°C",
        ariaLabel: `Temperatura atual em ${label} indisponível`,
        isLoading: false,
      });
      return;
    }

    let cancelled = false;
    setState((current) => ({ ...current, isLoading: true }));

    fetchCurrentTemperature(point)
      .then((temperature) => {
        if (cancelled) return;
        const rounded = Math.round(temperature);
        setState({
          label: `${rounded}°C`,
          ariaLabel: `Temperatura atual em ${label}: ${rounded} graus Celsius`,
          isLoading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          label: "--°C",
          ariaLabel: `Temperatura atual em ${label} indisponível`,
          isLoading: false,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, point, label]);

  return state;
}

function projectBusinessMarkers(
  businesses: Business[],
  bounds: BoundingBox,
  urls: CityModuleUrls,
): MapMarker[] {
  const entities = businesses
    .filter((business) =>
      isInsideBounds(
        business.address?.latitude,
        business.address?.longitude,
        bounds,
      ),
    )
    .slice(0, 90)
    .map((business) => ({
      id: `business-${business.profile_id || business.id}`,
      name: business.name,
      latitude: business.address?.latitude ?? null,
      longitude: business.address?.longitude ?? null,
      status: business.status,
      subtitle: formatLocationFromGeoPath(
        business.location?.geographic_path ?? business.geographic_path,
      ),
      category: business.category,
      slug: business.slug,
      url: getBusinessPublicUrl(
        {
          id: business.profile_id || business.id,
          slug: business.slug,
          is_premium: business.is_premium,
          geographic_path:
            business.location?.geographic_path ?? business.geographic_path,
        },
        urls.business,
      ),
      is_premium: business.is_premium,
      is_verified: business.is_verified,
      rating: business.rating,
      map_layer_key: "businesses",
    }));

  return mapEntityProjection.projectEntities(entities, "business", {
    includeMetadata: true,
    calculateScore: true,
  });
}

async function fetchCityMapMarkers(
  bounds: BoundingBox,
  territoryFilter: TerritoryFilter,
  urls: CityModuleUrls,
): Promise<MapMarker[]> {
  if (territoryFilter.scope === "none") return [];

  const [businesses, gastronomy, services, classifieds] = await Promise.all([
    BusinessService.getBusinesses({ sortBy: "rating", territoryFilter }),
    mapGastronomyLayerRuntimeService.getGastronomyByBounds(bounds, {
      territoryFilter,
      limit: 80,
    }),
    mapServicesLayerRuntimeService.getServicesByBounds(bounds, {
      territoryFilter,
      limit: 80,
    }),
    mapClassifiedsLayerRuntimeService.getClassifiedsByBounds(bounds, {
      territoryFilter,
      limit: 80,
    }),
  ]);

  const businessMarkers = projectBusinessMarkers(businesses, bounds, urls);
  const gastronomyMarkers = mapEntityProjection.projectEntities(
    gastronomy.map((item) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      status: "active",
      subtitle: item.cuisine_type || item.category || "Gastronomia",
      slug: item.slug,
      url: item.slug ? `${urls.gastronomy}/${item.slug}` : urls.gastronomy,
      is_premium: item.is_premium,
      is_verified: item.is_verified,
      rating: item.rating,
      map_layer_key: "gastronomy",
    })),
    "business",
    { includeMetadata: true, calculateScore: true },
  );
  const serviceMarkers = mapEntityProjection.projectEntities(
    services.map((item) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      status: "active",
      subtitle: item.subcategory || item.category || "Serviço",
      url: item.url ?? urls.services,
      is_verified: item.is_verified,
      rating: item.rating,
      map_layer_key: "services",
    })),
    "service",
    { includeMetadata: true, calculateScore: true },
  );
  const classifiedMarkers = mapEntityProjection.projectEntities(
    classifieds.map((item) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      status: "active",
      subtitle: item.price
        ? formatPrice(item.price)
        : item.category || "Classificado",
      url: item.url ?? urls.classifieds,
      map_layer_key: "classifieds",
    })),
    "classified",
    { includeMetadata: true, calculateScore: true },
  );

  return [
    ...businessMarkers,
    ...gastronomyMarkers,
    ...serviceMarkers,
    ...classifiedMarkers,
  ];
}

function buildTouristPointMarkers(
  points: TouristPoint[],
  urls: CityModuleUrls,
): MapMarker[] {
  return mapEntityProjection.projectEntities(
    points
      .filter((point) => hasValidCoordinates(point.latitude, point.longitude))
      .map((point) => ({
        id: `tourist-${point.id}`,
        name: point.name,
        latitude: point.latitude,
        longitude: point.longitude,
        status: "active",
        subtitle: point.neighborhood || formatCategory(point.category),
        slug: point.slug,
        url: point.slug
          ? `${urls.touristPoints}/${point.slug}`
          : urls.touristPoints,
        rating: point.rating,
        map_layer_key: "tourist_points",
      })),
    "tourist_point",
    { includeMetadata: true, calculateScore: true },
  );
}

function buildLocationMarkers(
  locations: Location[],
  bounds: BoundingBox,
  cityPath: string,
): MapMarker[] {
  const entities = locations
    .map((location) => {
      const center = getLocationCenter(location);
      if (!center || !isInsideBounds(center.latitude, center.longitude, bounds))
        return null;

      return {
        id: `location-${location.id}`,
        name: location.name,
        latitude: center.latitude,
        longitude: center.longitude,
        subtitle:
          location.type === LocationType.NEIGHBORHOOD ? "Bairro" : "Distrito",
        status: "active",
        url: `${cityPath}/${location.slug}`,
        location_id: location.id,
        geographic_path: location.geographic_path,
        map_layer_key: "territory",
        coordinate_source: "location_metadata",
      };
    })
    .filter((entity): entity is NonNullable<typeof entity> => Boolean(entity))
    .slice(0, 60);

  return mapEntityProjection.projectEntities(entities, "user_location", {
    includeMetadata: true,
    calculateScore: true,
  });
}

function buildTerritoryAnchorMarker(
  center: Coordinates,
  label: string,
  urls: CityModuleUrls,
): MapMarker {
  return mapEntityProjection.projectEntity(
    {
      id: "territory-anchor",
      name: label,
      latitude: center.latitude,
      longitude: center.longitude,
      subtitle: "Território ativo",
      status: "active",
      url: urls.map,
      map_layer_key: "territory",
      coordinate_source: "territory_center",
    },
    "user_location",
    {
      includeMetadata: true,
      calculateScore: true,
    },
  )!;
}

function EmptyAction({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <Link to={href} className="city-op-empty-action">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="city-op-empty-action-icon" aria-hidden="true">
        <ChevronRight />
      </span>
      <span className="sr-only">{action}</span>
    </Link>
  );
}

function CityHeader({
  navItems,
  mobileNavItems,
  cityLabel,
  theme,
  onToggleTheme,
  publishHref,
  authHref,
  authLabel,
}: {
  navItems: NavItem[];
  mobileNavItems: PublicHeaderNavItem[];
  cityLabel: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  publishHref: string;
  authHref: string;
  authLabel: string;
}) {
  return (
    <header className="city-op-header">
      <Link to="/" className="city-op-brand" aria-label="Achegue-se">
        <span className="city-op-brand-mark" aria-hidden="true">
          <MapPin />
        </span>
        <span>Achegue-se</span>
      </Link>

      <Link to={navItems[0]?.href ?? "/"} className="city-op-location-switch">
        <MapPin aria-hidden="true" />
        <span>{cityLabel}</span>
        <ChevronDown aria-hidden="true" />
      </Link>

      <nav className="city-op-nav" aria-label="Navegação da cidade">
        {navItems.map((item) => (
          <Link key={item.label} to={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="city-op-header-actions">
        <Link
          to={navItems[0]?.href ?? "/"}
          className="city-op-icon-button city-op-mobile-location"
          aria-label={`Abrir ${cityLabel}`}
        >
          <MapPin aria-hidden="true" />
        </Link>
        <button
          type="button"
          className="city-op-icon-button city-op-theme-button"
          onClick={onToggleTheme}
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </button>
        <Link
          to="/notificacoes"
          className="city-op-icon-button city-op-notification"
          aria-label="Notificações"
        >
          <Bell aria-hidden="true" />
          <span aria-hidden="true">3</span>
        </Link>
        <Link
          to={authHref}
          className="city-op-login-link"
          aria-label={authLabel}
        >
          <Users aria-hidden="true" />
          <span>{authLabel}</span>
        </Link>
        <Link to={publishHref} className="city-op-publish-link">
          <Plus aria-hidden="true" />
          <span>Publicar</span>
        </Link>
        <PublicHeaderMobileMenu
          items={mobileNavItems}
          className="city-op-mobile-menu"
        />
      </div>
    </header>
  );
}

function StatGrid({ stats }: { stats: StatCard[] }) {
  return (
    <div className="city-op-stat-grid" aria-label="Indicadores da cidade">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link
            key={stat.label}
            to={stat.href}
            className={`city-op-stat-card is-${stat.tone}`}
          >
            <span className="city-op-stat-icon" aria-hidden="true">
              <Icon />
            </span>
            <span>
              <strong>{stat.value}</strong>
              <small>{stat.label}</small>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function CityMapPanel({
  urls,
  markers,
  polygons,
  resolved,
  center,
  cityLabel,
  isLoading,
  onMarkerClick,
  mapStyleUrl = DEFAULT_TILE_STYLE.styleUrl,
  zoom = 10.35,
  showFilters = true,
  fitTerritoryBounds = false,
  territoryFitPadding,
  territoryFitMaxZoom,
}: {
  urls: CityModuleUrls;
  markers: MapMarker[];
  polygons: TerritoryPolygon[];
  resolved: ResolvedTerritory | null;
  center: Coordinates;
  cityLabel: string;
  isLoading: boolean;
  onMarkerClick: (id: string) => void;
  mapStyleUrl?: string;
  zoom?: number;
  showFilters?: boolean;
  fitTerritoryBounds?: boolean;
  territoryFitPadding?: number;
  territoryFitMaxZoom?: number;
}) {
  const filters = [
    { label: "Todos", icon: MapIcon, href: urls.map, tone: "cyan" },
    {
      label: "Empresas",
      icon: Store,
      href: withQueryParams(urls.map, { layer: "businesses" }),
      tone: "blue",
    },
    {
      label: "Gastronomia",
      icon: UtensilsCrossed,
      href: withQueryParams(urls.map, { layer: "gastronomy" }),
      tone: "amber",
    },
    {
      label: "Serviços",
      icon: Wrench,
      href: withQueryParams(urls.map, { layer: "services" }),
      tone: "blue",
    },
    {
      label: "Classificados",
      icon: Tag,
      href: withQueryParams(urls.map, { layer: "classifieds" }),
      tone: "pink",
    },
    { label: "Comunidade", icon: Users, href: urls.community, tone: "green" },
  ];
  const showMapLoading =
    isLoading && markers.length === 0 && polygons.length === 0;

  return (
    <section className="city-op-map-panel" aria-labelledby="city-op-map-title">
      {showFilters && (
        <div className="city-op-map-filter-row" aria-label="Filtros do mapa">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Link
                key={filter.label}
                to={filter.href}
                className={`city-op-map-filter is-${filter.tone}`}
              >
                <Icon aria-hidden="true" />
                <span>{filter.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div
        className="city-op-map-canvas"
        aria-label={`Mapa territorial de ${cityLabel}`}
      >
        <MapLibreAdapter
          styleUrl={mapStyleUrl}
          initialViewport={{ center, zoom }}
          territoryPolygons={polygons}
          markers={markers}
          resolved={resolved}
          fitTerritoryBounds={fitTerritoryBounds}
          territoryFitPadding={territoryFitPadding}
          territoryFitMaxZoom={territoryFitMaxZoom}
          enableClustering
          clusterOptions={{ radius: 42, maxZoom: 13, minPoints: 2 }}
          markerPresentation="compact"
          userLocationMarker={{ enabled: false, autoAdd: false }}
          onMarkerClick={onMarkerClick}
          className="city-op-real-map"
        />
        <div className="city-op-map-label" aria-hidden="true">
          <strong id="city-op-map-title">{cityLabel}</strong>
          <span>
            {markers.length === 1 ? "1 ponto" : `${markers.length} pontos`}
          </span>
        </div>
        {showMapLoading && (
          <div className="city-op-map-loading" role="status" aria-live="polite">
            Carregando mapa local
          </div>
        )}
      </div>
    </section>
  );
}

function DistrictsPanel({
  cards,
  href,
  isLoading,
}: {
  cards: DistrictCard[];
  href: string;
  isLoading: boolean;
}) {
  return (
    <section
      className="city-op-panel city-op-districts-panel"
      aria-labelledby="city-op-districts-title"
    >
      <div className="city-op-panel-heading">
        <h2 id="city-op-districts-title">Bairros em destaque</h2>
        <Link to={href}>Ver todos</Link>
      </div>
      {cards.length > 0 ? (
        <div className="city-op-district-strip">
          {cards.map((card) => (
            <Link
              key={card.name}
              to={card.href}
              className="city-op-district-card"
            >
              <img src={card.image} alt="" loading="lazy" />
              <span className="city-op-district-shade" aria-hidden="true" />
              <span>
                <strong>{card.name}</strong>
                <small>{card.meta}</small>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyAction
          title={
            isLoading ? "Carregando bairros" : "Bairros serão listados aqui"
          }
          description="Abra a busca territorial para explorar áreas da cidade."
          href={href}
          action="Ver bairros"
        />
      )}
    </section>
  );
}

function NearbyBusinessesPanel({
  businesses,
  href,
}: {
  businesses: FeaturedBusiness[];
  href: string;
}) {
  return (
    <section className="city-op-panel" aria-labelledby="city-op-business-title">
      <div className="city-op-panel-heading">
        <h2 id="city-op-business-title">Empresas próximas</h2>
        <Link to={href}>Ver todas</Link>
      </div>
      {businesses.length > 0 ? (
        <div className="city-op-list">
          {businesses.slice(0, 3).map((business) => (
            <Link
              key={business.id}
              to={getBusinessPublicUrl(business, href)}
              className="city-op-row-card"
            >
              <span className="city-op-row-media">
                <BusinessLogo
                  name={business.name}
                  logoUrl={business.logo_url}
                />
              </span>
              <span className="city-op-row-copy">
                <strong>{business.name || "Empresa local"}</strong>
                <small>
                  {formatLocationFromGeoPath(business.geographic_path)} ·{" "}
                  {formatCategory(business.category || "empresa")}
                </small>
              </span>
              <span
                className={`city-op-row-badge ${business.is_verified ? "is-green" : ""}`}
              >
                {business.is_verified ? "Verificada" : "Local"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyAction
          title="Empresas serão exibidas aqui"
          description="Abra o módulo de empresas para ver negócios cadastrados."
          href={href}
          action="Ver empresas"
        />
      )}
    </section>
  );
}

function GastronomyPanel({
  items,
  href,
}: {
  items: FeaturedBusiness[];
  href: string;
}) {
  return (
    <section
      className="city-op-panel city-op-gastronomy-panel"
      aria-labelledby="city-op-gastronomy-title"
    >
      <div className="city-op-panel-heading">
        <h2 id="city-op-gastronomy-title">Gastronomia</h2>
        <Link to={href}>Ver todas</Link>
      </div>
      {items.length > 0 ? (
        <div className="city-op-list">
          {items.slice(0, 3).map((business) => (
            <Link
              key={business.id}
              to={getBusinessPublicUrl(business, href)}
              className="city-op-row-card city-op-food-row"
            >
              <span className="city-op-row-media">
                <BusinessLogo
                  name={business.name}
                  logoUrl={business.logo_url}
                />
              </span>
              <span className="city-op-row-copy">
                <strong>{business.name || "Restaurante local"}</strong>
                <small>
                  {formatCategory(business.category || "gastronomia")} ·{" "}
                  {formatLocationFromGeoPath(business.geographic_path)}
                </small>
              </span>
              <span className="city-op-rating">
                <Star aria-hidden="true" />
                {business.rating
                  ? business.rating.toFixed(1).replace(".", ",")
                  : "-"}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyAction
          title="Gastronomia local"
          description="Acesse restaurantes, bares e cardápios disponíveis."
          href={href}
          action="Ver gastronomia"
        />
      )}
    </section>
  );
}

function ClassifiedsPreview({
  classifieds,
  href,
}: {
  classifieds: FeaturedClassified[];
  href: string;
}) {
  if (!classifieds.length) return null;

  return (
    <div
      className="city-op-classified-strip"
      aria-label="Classificados recentes"
    >
      {classifieds.slice(0, 2).map((classified) => {
        const publicHref =
          classifiedUrlService.buildPublicUrl({
            id: classified.id,
            public_id: classified.public_id,
            slug: classified.slug,
            geographic_path: classified.geographic_path,
            category_slug: classified.category_slug,
            subcategory_slug: classified.subcategory_slug,
          }) ?? href;
        return (
          <Link key={classified.id} to={publicHref}>
            <Tag aria-hidden="true" />
            <span>
              <strong>{classified.titulo}</strong>
              <small>
                {classified.price
                  ? formatPrice(classified.price)
                  : formatCategory(classified.category || "classificado")}
              </small>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function CommunityPanel({
  urls,
  cityLabel,
  isAuthenticated,
  classifieds,
}: {
  urls: CityModuleUrls;
  cityLabel: string;
  isAuthenticated: boolean;
  classifieds: FeaturedClassified[];
}) {
  const actions = [
    {
      label: "Feed local",
      detail: `Acompanhe conversas de ${cityLabel}.`,
      href: urls.community,
      icon: MessageCircle,
    },
    {
      label: "Publicar",
      detail: isAuthenticated
        ? "Compartilhe uma atualização local."
        : "Entre para publicar no território.",
      href: urls.publish,
      icon: Plus,
    },
    {
      label: "Classificados",
      detail: "Veja anúncios e oportunidades próximos.",
      href: urls.classifieds,
      icon: Tag,
    },
  ];

  return (
    <section
      className="city-op-panel"
      aria-labelledby="city-op-community-title"
    >
      <div className="city-op-panel-heading">
        <h2 id="city-op-community-title">Comunidade</h2>
        <Link to={urls.community}>Ver tudo</Link>
      </div>
      <div className="city-op-community-actions">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.href}
              className="city-op-community-action"
            >
              <span aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{action.label}</strong>
                <small>{action.detail}</small>
              </span>
              <ChevronRight aria-hidden="true" />
            </Link>
          );
        })}
      </div>
      <ClassifiedsPreview classifieds={classifieds} href={urls.classifieds} />
    </section>
  );
}

function NeighborhoodCommunityHeader({
  urls,
  cityLabel,
  cityHref,
  notificationHref,
  authHref,
  authLabel,
}: {
  urls: CityModuleUrls;
  cityLabel: string;
  cityHref: string;
  notificationHref: string;
  authHref: string;
  authLabel: string;
}) {
  const communityNavItems = useMemo(
    () =>
      buildPublicHeaderNavigation({
        home: "/",
        community: urls.community,
        business: urls.business,
        gastronomy: urls.gastronomy,
        services: urls.services,
        classifieds: urls.classifieds,
        map: urls.map,
        search: urls.search,
      }).filter((item) => COMMUNITY_DESKTOP_NAV_IDS.has(item.id)),
    [
      urls.business,
      urls.classifieds,
      urls.community,
      urls.gastronomy,
      urls.map,
      urls.search,
      urls.services,
    ],
  );

  return (
    <header className="neighborhood-community-header">
      <Link
        to="/"
        className="city-op-brand neighborhood-community-brand"
        aria-label="Achegue-se"
      >
        <span className="city-op-brand-mark" aria-hidden="true">
          <MapPin />
        </span>
        <span>Achegue-se</span>
      </Link>

      <nav
        className="neighborhood-community-nav"
        aria-label="Navegacao principal"
      >
        {communityNavItems.map((item) =>
          item.href.startsWith("#") ? (
            <a key={item.id} href={item.href}>
              {item.label}
            </a>
          ) : (
            <Link
              key={item.id}
              to={item.href}
              className={item.id === "community" ? "is-active" : undefined}
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>

      <div className="neighborhood-community-actions">
        <Link
          to={cityHref}
          className="city-op-location-switch neighborhood-community-location"
        >
          <MapPin aria-hidden="true" />
          <span>{cityLabel}</span>
          <ChevronDown aria-hidden="true" />
        </Link>

        <Link
          to={notificationHref}
          className="city-op-icon-button neighborhood-community-bell"
          aria-label="Notificacoes"
        >
          <Bell aria-hidden="true" />
        </Link>

        <Link
          to={authHref}
          className="neighborhood-community-account"
          aria-label={authLabel}
        >
          <Users aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}

function NeighborhoodLandingContent({
  urls,
  communityUrls,
  cityLabel,
  cityHref,
  cityName,
  stateLabel,
  resolved,
  markers,
  polygons,
  center,
  businesses,
  services,
  classifieds,
  gastronomyItems,
  feedPosts,
  stats,
  territoryFilter,
  onMarkerClick,
  authHref,
  authLabel,
  isAuthenticated,
  isCommunityMode,
  accessStatus,
  residenceLoading,
  isLoading,
  communityContent,
  activeCommunitySection,
  requestedCommunityView,
}: {
  urls: CityModuleUrls;
  communityUrls: ReturnType<typeof useCommunityUrls>;
  cityLabel: string;
  cityHref: string;
  cityName: string;
  stateLabel: string;
  resolved: NonNullable<ResolvedTerritory>;
  markers: MapMarker[];
  polygons: TerritoryPolygon[];
  center: Coordinates;
  businesses: FeaturedBusiness[];
  services: FeaturedService[];
  classifieds: FeaturedClassified[];
  gastronomyItems: FeaturedBusiness[];
  feedPosts: Post[];
  stats:
    | { businesses?: number; services?: number; classifieds?: number }
    | undefined;
  territoryFilter: TerritoryFilter;
  onMarkerClick: (id: string) => void;
  authHref: string;
  authLabel: string;
  isAuthenticated: boolean;
  isCommunityMode: boolean;
  accessStatus: NeighborhoodAccessStatus;
  residenceLoading: boolean;
  isLoading: boolean;
  communityContent?: ReactNode;
  activeCommunitySection?: CommunityOverviewSection;
  requestedCommunityView?: CommunityOverviewView;
}) {
  const navigate = useNavigate();
  const [activeStreamTab, setActiveStreamTab] =
    useState<NeighborhoodCommunityTabId>("all");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const routeLocation = useLocation();
  const communityProfileQuery = useCommunityProfile(resolved);
  const territoryName = getPublicTerritoryDisplayName(
    routeLocation.pathname,
    resolved,
    cityLabel,
  );
  const memberLocations = getResolvedTerritoryLocations(resolved);
  const memberCount = Math.max(memberLocations.length, 1);
  const isGroup = resolved.kind === "group";
  const population = getResolvedPopulationMetric(resolved);
  const businessCount = firstMetric(
    stats?.businesses,
    getResolvedNumericMetric(resolved, BUSINESS_COUNT_METADATA_FIELDS),
    businesses.length,
  );
  const servicesCount = firstMetric(
    stats?.services,
    getResolvedNumericMetric(resolved, SERVICES_COUNT_METADATA_FIELDS),
    services.length,
  );
  const mapZoom =
    polygons.length > 1 ? 12.3 : polygons.length === 1 ? 13.3 : 12.2;
  const canInteract = accessStatus === "verified";
  const enterLoginHref = withQueryParams("/login", { redirect: urls.feed });
  const publishLoginHref = withQueryParams("/login", {
    redirect: urls.publish,
  });
  const residenceHref = "/conta/enderecos";
  const verifyHref =
    accessStatus === "visitor"
      ? withQueryParams("/login", { redirect: residenceHref })
      : residenceHref;
  const interactionHref = canInteract
    ? urls.publish
    : accessStatus === "visitor"
      ? publishLoginHref
      : verifyHref;
  const enterHref = isCommunityMode
    ? accessStatus === "verified"
      ? urls.feed
      : accessStatus === "visitor"
        ? enterLoginHref
        : verifyHref
    : urls.community;
  const gateActionHref =
    accessStatus === "verified"
      ? urls.publish
      : accessStatus === "visitor"
        ? enterLoginHref
        : verifyHref;
  const lockedActionHref =
    accessStatus === "visitor" ? enterLoginHref : verifyHref;
  const alertPosts = feedPosts.filter((post) => post.type === "alerta");
  const streamGroups = buildNeighborhoodStreamItems({
    posts: feedPosts,
    businesses,
    services,
    classifieds,
    gastronomyItems,
    urls,
    territoryName,
  });
  const streamItems =
    getRecordValue(streamGroups, activeStreamTab) ?? streamGroups.all;
  const streamMoreConfig = getNeighborhoodStreamMoreConfig(
    activeStreamTab,
    urls,
  );
  const tabs: NeighborhoodCommunityTab[] = [
    { id: "all", label: "Tudo", shortLabel: "Tudo", icon: LayoutGrid },
    { id: "feed", label: "Feed", shortLabel: "Feed", icon: List },
    { id: "business", label: "Empresas", shortLabel: "Emp.", icon: Store },
    { id: "services", label: "Serviços", shortLabel: "Serv.", icon: Wrench },
    {
      id: "classifieds",
      label: "Classificados",
      shortLabel: "Class.",
      icon: Tag,
    },
    {
      id: "gastronomy",
      label: "Gastronomia",
      shortLabel: "Gast.",
      icon: UtensilsCrossed,
    },
    { id: "map", label: "Mapa", shortLabel: "Mapa", icon: MapPin },
  ];

  if (isCommunityMode) {
    return (
      <main
        className="city-op-page neighborhood-community-page"
        data-page="bairro-landing"
        data-community-home="community-first"
      >
        <div
          className="city-op-backdrop neighborhood-community-backdrop"
          aria-hidden="true"
        >
          <span />
        </div>

        <NeighborhoodCommunityHeader
          urls={urls}
          cityLabel={cityLabel}
          cityHref={cityHref}
          notificationHref={isAuthenticated ? "/notificacoes" : authHref}
          authHref={authHref}
          authLabel={authLabel}
        />

        <CommunityOverviewSurface
          resolved={resolved}
          territoryName={territoryName}
          territoryFilter={territoryFilter}
          onRequireLogin={() =>
            navigate(canInteract ? urls.feed : lockedActionHref)
          }
          loginHref={enterHref}
          publishHref={interactionHref}
          communityProfile={communityProfileQuery.data ?? null}
          mode={canInteract ? "member" : "public"}
          onOpenCreatePost={() => setCreatePostOpen(true)}
          activeSection={activeCommunitySection}
          activeView={
            requestedCommunityView ??
            (isCommunitySocialView(activeCommunitySection)
              ? activeCommunitySection
              : undefined)
          }
          onViewChange={(view) =>
            navigate(
              view === "feed"
                ? communityUrls.feed
                : withQueryParams(communityUrls.feed, { view }),
            )
          }
        >
          {communityContent}
        </CommunityOverviewSurface>

        {createPostOpen ? (
          <Suspense fallback={null}>
            <CommunityCreatePostModal
              open
              onClose={() => setCreatePostOpen(false)}
              canCreatePost={canInteract}
              canCreateAlert={canInteract}
              canCreateIssue={canInteract}
            />
          </Suspense>
        ) : null}

        <footer className="city-op-footer neighborhood-community-footer">
          <span>
            <strong>Achegue-se</strong>
            <small>
              {territoryName} - {cityLabel}
            </small>
          </span>
          <nav aria-label="Rodape do bairro">
            <Link to="/termos">Termos</Link>
            <Link to="/privacidade">Privacidade</Link>
            <Link to={urls.feed}>Feed</Link>
            <Link to={urls.business}>Empresas</Link>
            <Link to={communityUrls.groups}>Grupos</Link>
            <Link to={urls.map}>Mapa</Link>
          </nav>
          <small>{new Date().getFullYear()}</small>
        </footer>
      </main>
    );
  }

  return (
    <main
      className="city-op-page neighborhood-community-page"
      data-page="bairro-landing"
      data-community-home="meu-bairro"
    >
      <div
        className="city-op-backdrop neighborhood-community-backdrop"
        aria-hidden="true"
      >
        <span />
      </div>

      <NeighborhoodCommunityHeader
        urls={urls}
        cityLabel={cityLabel}
        cityHref={cityHref}
        notificationHref={isAuthenticated ? "/notificacoes" : authHref}
        authHref={authHref}
        authLabel={authLabel}
      />

      <NeighborhoodTerritoryHero
        territoryName={territoryName}
        cityName={cityName}
        stateLabel={stateLabel}
        isGroup={isGroup}
        memberCount={memberCount}
        polygons={polygons}
        markers={markers}
        enterHref={enterHref}
        interactionHref={interactionHref}
        canInteract={canInteract}
        isCommunityMode={isCommunityMode}
      />

      <section
        className="neighborhood-community-shell"
        aria-label={`Meu bairro em ${territoryName}`}
      >
        <div className="neighborhood-community-main">
          <NeighborhoodStream
            items={streamItems}
            tabs={tabs}
            activeTab={activeStreamTab}
            moreConfig={streamMoreConfig}
            onTabChange={setActiveStreamTab}
            canInteract={canInteract}
            lockedActionHref={lockedActionHref}
          />
        </div>

        <aside className="neighborhood-community-sidebar">
          <section
            className="neighborhood-community-card neighborhood-community-map"
            aria-labelledby="neighborhood-community-map-title"
          >
            <div className="city-op-panel-heading">
              <h2 id="neighborhood-community-map-title">Mapa do bairro</h2>
              <Link to={urls.map}>
                Ver no mapa
                <ExternalLink aria-hidden="true" />
              </Link>
            </div>
            <div
              className="neighborhood-community-map-preview"
              aria-hidden="true"
            >
              <NeighborhoodTerritoryArt
                polygons={polygons}
                markers={markers}
                decorative
              />
            </div>
            <div
              className="neighborhood-community-map-legend"
              aria-label="Categorias do mapa do bairro"
            >
              <span className="is-blue">
                <Store aria-hidden="true" />
                Negócios
              </span>
              <span className="is-cyan">
                <Wrench aria-hidden="true" />
                Serviços
              </span>
              <span className="is-amber">
                <UtensilsCrossed aria-hidden="true" />
                Gastronomia
              </span>
              <span className="is-green">
                <Users aria-hidden="true" />
                Comunidade
              </span>
            </div>
          </section>

          <NeighborhoodGateCard
            status={accessStatus}
            loading={residenceLoading}
            actionHref={gateActionHref}
          />
          <NeighborhoodStatsPanel
            population={population}
            businessCount={businessCount ?? businesses.length}
            servicesCount={servicesCount ?? services.length}
          />
          <NeighborhoodAlertsPanel
            alerts={alertPosts}
            alertsHref={withQueryParams(urls.feed, { tab: "alertas" })}
            actionHref={interactionHref}
          />
        </aside>
      </section>

      <footer className="city-op-footer neighborhood-community-footer">
        <span>
          <strong>Achegue-se</strong>
          <small>
            {territoryName} - {cityLabel}
          </small>
        </span>
        <nav aria-label="Rodapé do bairro">
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to={urls.feed}>Feed</Link>
          <Link to={urls.business}>Empresas</Link>
          <Link to={communityUrls.groups}>Grupos</Link>
          <Link to={urls.map}>Mapa</Link>
        </nav>
        <small>{new Date().getFullYear()}</small>
      </footer>
    </main>
  );
}

interface CidadeLandingPageProps {
  readonly communityContent?: ReactNode;
  readonly activeCommunitySection?: CommunityOverviewSection;
}

function getCommunityView(search: string): CommunityOverviewView | undefined {
  const value = new URLSearchParams(search).get("view");
  return isCommunityOverviewView(value) ? value : undefined;
}

export default function CidadeLandingPage({
  communityContent,
  activeCommunitySection,
}: CidadeLandingPageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedCommunityView = getCommunityView(location.search);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { state: routeState = "", city: routeCity = "" } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const territorialContext = useTerritorialContextOptional();
  const routeResolved = territorialContext?.resolved ?? null;
  const isNeighborhoodLanding =
    routeResolved?.kind === "group" ||
    (routeResolved?.kind === "location" &&
      routeResolved.location.type !== LocationType.CITY);
  const communityRoot = `/${APP_MODULE_SLUGS.community}`;
  const isCommunityRoute =
    location.pathname === communityRoot ||
    location.pathname.startsWith(`${communityRoot}/`);
  const isEmbeddedCommunityModule = Boolean(
    communityContent && isNeighborhoodLanding && isCommunityRoute,
  );
  const cityPartsFromResolved = useMemo(
    () => getCityPartsFromResolved(routeResolved),
    [routeResolved],
  );
  const state = routeState || cityPartsFromResolved.state || "";
  const city = routeCity || cityPartsFromResolved.city || "";
  const communityUrls = useCommunityUrls(routeResolved);
  const moduleTerritory = useModuleTerritoryFilter({
    routeResolved,
    nearbyEnabled: false,
    includeDescendants: true,
  });
  const territoryKey = moduleTerritory.resolvedLocationIds.join("|");

  const { data: cityMetadata, isLoading: metadataLoading } = useCityMetadata(
    state,
    city,
  );
  const {
    businesses: featuredBusinesses,
    services: featuredServices,
    classifieds: featuredClassifieds,
    isLoading: featuredLoading,
  } = useCityFeatured(state, city, moduleTerritory.territoryFilter, {
    enabled: !isEmbeddedCommunityModule,
  });
  const { data: touristPoints = [] } = useTouristPoints(
    { state, city, limit: 24 },
    { enabled: !isEmbeddedCommunityModule },
  );
  const { polygons, isLoading: polygonLoading } = useTerritoryPolygon(
    routeResolved,
    {
      enabled: !isEmbeddedCommunityModule,
    },
  );

  const cityDisplayName = cityMetadata?.city
    ? toDisplayName(cityMetadata.city)
    : toDisplayName(city);
  const stateDisplayName = (cityMetadata?.state || state).toUpperCase();
  const territoryLabel = `${cityDisplayName}, ${stateDisplayName}`;
  const cityPath = territorialContext?.baseUrl ?? `/${state}/${city}`;
  const cityHomeHref = `/${state}/${city}`;

  const cityModuleUrls = useMemo<CityModuleUrls>(
    () =>
      buildCityModuleUrls({
        cityPath,
        communityBaseUrl: communityUrls.feed,
        communityScoped: false,
      }),
    [cityPath, communityUrls.feed],
  );

  const neighborhoodCommunityUrls = useMemo<CityModuleUrls>(
    () =>
      buildCityModuleUrls({
        cityPath,
        communityBaseUrl: communityUrls.feed,
        communityScoped: true,
      }),
    [cityPath, communityUrls.feed],
  );

  const activeModuleUrls =
    isNeighborhoodLanding && isCommunityRoute
      ? neighborhoodCommunityUrls
      : cityModuleUrls;

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: "Início", href: cityModuleUrls.home, surface: "home" },
      {
        label: "Bairros",
        href: withQueryParams(cityModuleUrls.search, { tipo: "bairros" }),
        surface: "search",
      },
      { label: "Empresas", href: cityModuleUrls.business, surface: "business" },
      {
        label: "Gastronomia",
        href: cityModuleUrls.gastronomy,
        surface: "gastronomy",
      },
      { label: "Serviços", href: cityModuleUrls.services, surface: "services" },
      {
        label: "Classificados",
        href: cityModuleUrls.classifieds,
        surface: "classifieds",
      },
      {
        label: "Comunidade",
        href: cityModuleUrls.community,
        surface: "community",
      },
      { label: "Mapa", href: cityModuleUrls.map, surface: "map" },
    ];
    return items.filter((item) => isLaunchSurfaceEnabled(item.surface));
  }, [cityModuleUrls]);
  const publicMobileNavItems = useMemo(
    () =>
      buildPublicHeaderNavigation(
        {
          home: cityModuleUrls.home,
          community: cityModuleUrls.community,
          business: cityModuleUrls.business,
          gastronomy: cityModuleUrls.gastronomy,
          services: cityModuleUrls.services,
          classifieds: cityModuleUrls.classifieds,
          map: cityModuleUrls.map,
          search: cityModuleUrls.search,
        },
        { communityLabel: "Comunidade" },
      ),
    [cityModuleUrls],
  );

  const territoryPolygons = useMemo(() => {
    if (polygons.length > 0) return polygons;
    const isResolvedCity =
      routeResolved?.kind === "location" &&
      routeResolved.location.type === LocationType.CITY;
    return isResolvedCity && isSalvadorRoute(state, city)
      ? salvadorFallbackTerritoryPolygons
      : [];
  }, [city, polygons, routeResolved, state]);

  const mapBounds = useMemo<BoundingBox>(() => {
    return (
      getBoundsFromPolygons(territoryPolygons) ??
      (isSalvadorRoute(state, city) ? salvadorBounds : salvadorBounds)
    );
  }, [city, state, territoryPolygons]);

  const territoryCenter = useMemo<Coordinates>(() => {
    return (
      getCenterFromPolygons(territoryPolygons) ??
      getResolvedTerritoryCenter(routeResolved) ??
      moduleTerritory.centerCoords ??
      getLocationCenter(moduleTerritory.location) ??
      (isSalvadorRoute(state, city) ? salvadorCenter : null) ??
      salvadorCenter
    );
  }, [
    city,
    moduleTerritory.centerCoords,
    moduleTerritory.location,
    routeResolved,
    state,
    territoryPolygons,
  ]);

  const weatherLabel = routeResolved
    ? getPublicTerritoryDisplayName(
        location.pathname,
        routeResolved,
        territoryLabel,
      )
    : territoryLabel;
  const temperature = useCurrentTemperature(
    territoryCenter,
    weatherLabel,
    !isNeighborhoodLanding,
  );

  const canonicalLocation =
    moduleTerritory.location &&
    !isPublicTerritoryFallbackLocation(moduleTerritory.location)
      ? moduleTerritory.location
      : routeResolved?.kind === "location" &&
          !isPublicTerritoryFallbackLocation(routeResolved.location)
        ? routeResolved.location
        : null;
  const cityLocationId = canonicalLocation?.id ?? null;

  const { data: cityDistricts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ["city-landing", "districts", cityLocationId],
    queryFn: async () => {
      if (!cityLocationId) return [];
      const output = await locationReadService.getDescendants({
        location_id: cityLocationId,
        include_self: false,
        page_size: 200,
      });
      return output.descendants.filter(
        (location) =>
          location.status === LocationStatus.ACTIVE &&
          (location.type === LocationType.DISTRICT ||
            location.type === LocationType.NEIGHBORHOOD),
      );
    },
    enabled: Boolean(cityLocationId) && !isEmbeddedCommunityModule,
    staleTime: 10 * 60 * 1000,
  });

  const { data: territoryStats } = useQuery({
    queryKey: ["city-landing", "territory-stats", territoryKey],
    queryFn: () =>
      LandingFeaturedService.getTerritoryStats(moduleTerritory.territoryFilter),
    enabled:
      moduleTerritory.territoryFilter.scope !== "none" &&
      !isEmbeddedCommunityModule,
    staleTime: 5 * 60 * 1000,
  });

  const { data: runtimeMapMarkers = [] } = useQuery({
    queryKey: [
      "city-landing",
      "map-markers",
      territoryKey,
      activeModuleUrls.community,
      mapBounds.map((value) => value.toFixed(4)).join(","),
    ],
    queryFn: () =>
      fetchCityMapMarkers(
        mapBounds,
        moduleTerritory.territoryFilter,
        activeModuleUrls,
      ),
    enabled:
      moduleTerritory.territoryFilter.scope !== "none" &&
      !isEmbeddedCommunityModule,
    staleTime: 5 * 60 * 1000,
  });

  const touristMarkers = useMemo(
    () => buildTouristPointMarkers(touristPoints, activeModuleUrls),
    [activeModuleUrls, touristPoints],
  );
  const locationMarkers = useMemo(
    () => buildLocationMarkers(cityDistricts, mapBounds, cityPath),
    [cityDistricts, cityPath, mapBounds],
  );
  const mapMarkers = useMemo(() => {
    const resolvedMarkers = [
      ...runtimeMapMarkers,
      ...touristMarkers,
      ...locationMarkers,
    ].slice(0, 240);
    return resolvedMarkers.length > 0
      ? resolvedMarkers
      : [
          buildTerritoryAnchorMarker(
            territoryCenter,
            territoryLabel,
            activeModuleUrls,
          ),
        ];
  }, [
    activeModuleUrls,
    locationMarkers,
    runtimeMapMarkers,
    territoryCenter,
    territoryLabel,
    touristMarkers,
  ]);
  const mapMarkersById = useMemo(
    () => new globalThis.Map(mapMarkers.map((marker) => [marker.id, marker])),
    [mapMarkers],
  );
  const communityFeed = useCommunityFeedSimple({
    locationScope: "neighborhood",
    territoryFilter: moduleTerritory.territoryFilter,
    limit: 8,
    enabled: !isEmbeddedCommunityModule,
  });
  const authUserId = typeof user?.id === "string" ? user.id : null;
  const { data: primaryResidence, isLoading: residenceLoading } = useQuery({
    queryKey: ["bairro-landing", "primary-residence", authUserId],
    queryFn: () =>
      residenceService.getPrimaryResidenceWithRelations(authUserId as string),
    enabled: Boolean(authUserId),
    staleTime: 2 * 60 * 1000,
  });
  const isResidenceVerifiedInTerritory = useMemo(() => {
    if (!primaryResidence?.is_verified || !primaryResidence.location_id)
      return false;
    return moduleTerritory.resolvedLocationIds.includes(
      primaryResidence.location_id,
    );
  }, [moduleTerritory.resolvedLocationIds, primaryResidence]);
  const neighborhoodAccessStatus = getNeighborhoodAccessStatus(
    Boolean(user),
    isResidenceVerifiedInTerritory,
  );

  const metadataDistrictCards = useMemo<DistrictCard[]>(
    () =>
      (cityMetadata?.featured_districts ?? []).map((district, index) => ({
        name: district.name,
        description: district.description || `Explore ${district.name}`,
        image:
          district.image_url || districtImages[index % districtImages.length],
        href: `${cityPath}/${slugify(district.name)}`,
        meta: district.posts_count
          ? `${formatMetric(district.posts_count)} posts`
          : district.residents_count
            ? `${formatMetric(district.residents_count)} moradores`
            : "Explorar",
      })),
    [cityMetadata?.featured_districts, cityPath],
  );

  const locationDistrictCards = useMemo<DistrictCard[]>(
    () =>
      cityDistricts.map((location, index) => ({
        name: location.name,
        description: location.full_name || location.name,
        image: districtImages[index % districtImages.length],
        href: `${cityPath}/${location.slug}`,
        meta:
          location.type === LocationType.NEIGHBORHOOD ? "Bairro" : "Distrito",
      })),
    [cityDistricts, cityPath],
  );

  const districtCards = (
    metadataDistrictCards.length > 0
      ? metadataDistrictCards
      : locationDistrictCards
  ).slice(0, 4);
  const gastronomyItems = featuredBusinesses.filter(isGastronomyBusiness);
  const servicePreview = getServicePreview(featuredServices);

  const stats: StatCard[] = [
    {
      label: "Bairros",
      value: formatMetric(
        firstMetric(cityMetadata?.districts_count, cityDistricts.length),
      ),
      href: withQueryParams(cityModuleUrls.search, { tipo: "bairros" }),
      icon: Building2,
      tone: "cyan",
    },
    {
      label: "Empresas",
      value: formatMetric(
        firstMetric(
          cityMetadata?.active_businesses,
          territoryStats?.businesses,
          featuredBusinesses.length,
        ),
      ),
      href: cityModuleUrls.business,
      icon: Store,
      tone: "blue",
    },
    {
      label: "Profissionais",
      value: formatMetric(
        firstMetric(
          cityMetadata?.professionals_count,
          territoryStats?.services,
          featuredServices.length,
        ),
      ),
      href: cityModuleUrls.services,
      icon: Users,
      tone: "amber",
    },
    {
      label: "Classificados",
      value: formatMetric(
        firstMetric(territoryStats?.classifieds, featuredClassifieds.length),
      ),
      href: cityModuleUrls.classifieds,
      icon: Tag,
      tone: "pink",
    },
  ];

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(
      query
        ? withQueryParams(activeModuleUrls.search, { q: query })
        : activeModuleUrls.search,
    );
  };

  const handleMarkerClick = (id: string) => {
    const marker = mapMarkersById.get(id);
    if (marker?.url) navigate(marker.url);
  };

  if (!state || !city) {
    return (
      <main className="city-op-missing-route">
        <h1>Cidade não informada</h1>
        <p>Use uma rota territorial com UF e cidade.</p>
      </main>
    );
  }

  if (isNeighborhoodLanding && routeResolved) {
    return (
      <NeighborhoodLandingContent
        urls={activeModuleUrls}
        communityUrls={communityUrls}
        cityLabel={territoryLabel}
        cityHref={cityHomeHref}
        cityName={cityDisplayName}
        stateLabel={stateDisplayName}
        resolved={routeResolved}
        markers={mapMarkers}
        polygons={territoryPolygons}
        center={territoryCenter}
        businesses={featuredBusinesses}
        services={featuredServices}
        classifieds={featuredClassifieds}
        gastronomyItems={gastronomyItems}
        feedPosts={communityFeed.posts}
        stats={territoryStats}
        territoryFilter={moduleTerritory.territoryFilter}
        onMarkerClick={handleMarkerClick}
        authHref={user ? "/conta" : "/login"}
        authLabel={user ? "Conta" : "Entrar"}
        isAuthenticated={Boolean(user)}
        isCommunityMode={isCommunityRoute}
        accessStatus={neighborhoodAccessStatus}
        residenceLoading={residenceLoading}
        isLoading={
          polygonLoading || featuredLoading || moduleTerritory.isLoading
        }
        communityContent={communityContent}
        activeCommunitySection={
          requestedCommunityView ?? activeCommunitySection
        }
        requestedCommunityView={requestedCommunityView}
      />
    );
  }

  return (
    <main className="city-op-page" data-page="cidade-landing">
      <div className="city-op-backdrop" aria-hidden="true">
        <img src={heroImg} alt="" />
        <span />
      </div>

      <CityHeader
        navItems={navItems}
        mobileNavItems={publicMobileNavItems}
        cityLabel={territoryLabel}
        theme={theme}
        onToggleTheme={toggleTheme}
        publishHref={cityModuleUrls.publish}
        authHref={user ? "/conta" : "/login"}
        authLabel={user ? "Conta" : "Entrar"}
      />

      <section className="city-op-hero-layout">
        <div className="city-op-intro">
          <div className="city-op-chip-row" aria-label="Status territorial">
            <span>
              <MapPin aria-hidden="true" />
              {territoryLabel}
            </span>
            <span aria-label={temperature.ariaLabel}>
              <CloudSun aria-hidden="true" />
              {temperature.isLoading ? "..." : temperature.label}
            </span>
            <span>
              <ShieldCheck aria-hidden="true" />
              Mapa ativo
            </span>
          </div>

          <h1>
            <span>{cityDisplayName}</span> em tempo real
          </h1>
          <p>
            Explore bairros, empresas, serviços e tudo que acontece na cidade
            com busca territorial e mapa vivo.
          </p>

          <form className="city-op-search" onSubmit={handleSearchSubmit}>
            <Search aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Buscar em ${cityDisplayName}`}
              aria-label={`Buscar em ${cityDisplayName}`}
            />
            <button type="submit" aria-label="Buscar">
              <Search aria-hidden="true" />
            </button>
          </form>

          <div className="city-op-meta-line">
            <span>
              <MapPin aria-hidden="true" />
              {territoryLabel}
            </span>
            <span>
              {new Intl.DateTimeFormat("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              }).format(new Date())}
            </span>
            <span>{servicePreview}</span>
          </div>

          <StatGrid stats={stats} />
        </div>

        <CityMapPanel
          urls={cityModuleUrls}
          markers={mapMarkers}
          polygons={territoryPolygons}
          resolved={routeResolved}
          center={territoryCenter}
          cityLabel={cityDisplayName}
          isLoading={false}
          onMarkerClick={handleMarkerClick}
        />
      </section>

      <section
        className="city-op-content-grid"
        aria-label={`Resumo operacional de ${cityDisplayName}`}
      >
        <DistrictsPanel
          cards={districtCards}
          href={withQueryParams(cityModuleUrls.search, { tipo: "bairros" })}
          isLoading={districtsLoading || metadataLoading}
        />
        <NearbyBusinessesPanel
          businesses={featuredBusinesses}
          href={cityModuleUrls.business}
        />
        <GastronomyPanel
          items={gastronomyItems}
          href={cityModuleUrls.gastronomy}
        />
        <CommunityPanel
          urls={cityModuleUrls}
          cityLabel={cityDisplayName}
          isAuthenticated={Boolean(user)}
          classifieds={featuredClassifieds}
        />
      </section>

      <section
        className="city-op-trust-strip"
        aria-label="Confiança da plataforma"
      >
        <Link to={cityModuleUrls.community}>
          <ShieldCheck aria-hidden="true" />
          <span>
            <strong>Território verificado</strong>
            <small>Conteúdo moderado e contexto local</small>
          </span>
        </Link>
        <Link to={cityModuleUrls.map}>
          <MapIcon aria-hidden="true" />
          <span>
            <strong>Mapa vivo</strong>
            <small>Área de {cityDisplayName} com pins agrupados</small>
          </span>
        </Link>
        <Link to={cityModuleUrls.community}>
          <Heart aria-hidden="true" />
          <span>
            <strong>Comunidade ativa</strong>
            <small>
              {featuredLoading
                ? "Atualizando dados"
                : "Empresas, anúncios e conversas locais"}
            </small>
          </span>
        </Link>
        <Link to={cityModuleUrls.search}>
          <Repeat2 aria-hidden="true" />
          <span>
            <strong>Busca territorial</strong>
            <small>Resultados conectados ao território atual</small>
          </span>
        </Link>
      </section>

      <footer className="city-op-footer">
        <span>
          <strong>Achegue-se</strong>
          <small>{territoryLabel}</small>
        </span>
        <nav aria-label="Rodapé da cidade">
          <Link to="/termos">Termos</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to={cityModuleUrls.business}>Empresas</Link>
          <Link to={cityModuleUrls.community}>Comunidade</Link>
        </nav>
        <small>{new Date().getFullYear()}</small>
      </footer>
    </main>
  );
}

function getServicePreview(services: FeaturedService[]): string {
  const category = services.find((service) => service.category)?.category;
  return category
    ? `${formatCategory(category)} em destaque`
    : "Serviços locais";
}
