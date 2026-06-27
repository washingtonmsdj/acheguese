/**
 * BoundaryService
 *
 * SSOT para boundaries geográficos do produto.
 *
 * Regras arquiteturais:
 * - Boundaries territoriais saem do SSOT `locations` e, quando habilitado, da tabela `location_boundaries`.
 * - Nominatim não é usado para polígonos, bounds ou definição territorial.
 * - Quando não existir polígono cadastrado, o serviço retorna somente o centro canônico do território.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { createLocationRepository } from '@/core/location/repositories/createLocationRepository';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import type { Location } from '@/core/location/types';
import { LocationStatus, LocationType } from '@/core/location/types';

export interface BoundsResult {
  rings: [number, number][][];
  center: [number, number];
}

export interface CityBoundsInput {
  city: string;
  state: string;
}

export interface NeighborhoodBoundsInput {
  neighborhood: string;
  city: string;
  state: string;
  locationId?: string;
}

export interface BoundaryServiceDeps {
  locationRepository?: ILocationRepository;
  supabaseClient?: any;
  locationCacheTtlMs?: number;
  customBoundariesEnabled?: boolean;
}

interface CachedTerritoryIndex {
  loadedAt: number;
  byId: Map<string, Location>;
  states: Location[];
  cities: Location[];
  districts: Location[];
  citiesByStateId: Map<string, Location[]>;
  districtsByCityId: Map<string, Location[]>;
}

interface GeoJsonBoundary {
  type: 'Polygon' | 'MultiPolygon' | string;
  coordinates: unknown;
}

interface BoundaryRow {
  boundary: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: unknown;
  } | null;
  center_lat: number | null;
  center_lng: number | null;
}

interface InlineLocationBoundaryRow {
  boundary: GeoJsonBoundary | null;
}

interface NeighborhoodBoundaryRow {
  geometry: GeoJsonBoundary | string | null;
}

interface GeoJsonFeatureCollection {
  features?: Array<{
    geometry?: GeoJsonBoundary | null;
  }>;
}

interface BoundaryQueryError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

const DEFAULT_LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_CUSTOM_BOUNDARIES_ENABLED =
  import.meta.env.VITE_ENABLE_LOCATION_BOUNDARIES === 'true';
const FALLBACK_BOUNDARY_RINGS_KEY = 'fallback_boundary_rings';

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, ' ')
    .trim();
}

function getLocationCenterFromMetadata(location: Location): [number, number] | null {
  const latitude = location.metadata?.center_latitude;
  const longitude = location.metadata?.center_longitude;

  return isUsableCenter(latitude, longitude)
    ? [latitude as number, longitude as number]
    : null;
}

function isPublicFallbackLocation(location: Location): boolean {
  return location.metadata?.public_fallback === true;
}

function isUsableCenter(
  latitude: unknown,
  longitude: unknown,
): boolean {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001)
  );
}

class BoundaryServiceClass {
  private static instance: BoundaryServiceClass;

  private readonly FALLBACK_CENTER: [number, number] = [-12.975, -38.476];
  private readonly locationRepository: ILocationRepository;
  private readonly supabaseClient: any;
  private readonly locationCacheTtlMs: number;
  private readonly customBoundariesEnabled: boolean;
  private territoryIndex: CachedTerritoryIndex | null = null;
  private territoryIndexPromise: Promise<CachedTerritoryIndex> | null = null;
  private locationBoundariesAvailable: boolean | null = null;
  private locationBoundariesUnavailableLogged = false;
  private inlineLocationBoundaryAvailable: boolean | null = null;
  private neighborhoodBoundariesAvailable: boolean | null = null;
  private metadataSourceBoundaryCache = new Map<string, BoundsResult | null>();

  constructor(deps: BoundaryServiceDeps = {}) {
    this.locationRepository = deps.locationRepository ?? createLocationRepository();
    this.supabaseClient = deps.supabaseClient ?? supabase;
    this.locationCacheTtlMs = deps.locationCacheTtlMs ?? DEFAULT_LOCATION_CACHE_TTL_MS;
    this.customBoundariesEnabled =
      deps.customBoundariesEnabled ?? DEFAULT_CUSTOM_BOUNDARIES_ENABLED;
    this.locationBoundariesAvailable = this.customBoundariesEnabled ? null : false;
  }

  static getInstance(): BoundaryServiceClass {
    if (!BoundaryServiceClass.instance) {
      BoundaryServiceClass.instance = new BoundaryServiceClass();
    }
    return BoundaryServiceClass.instance;
  }

  async getCityBounds(input: CityBoundsInput): Promise<BoundsResult> {
    try {
      const city = await this.resolveCity(input.city, input.state);
      return this.resolveBoundsForLocation(city);
    } catch (error) {
      logger.error('[BoundaryService] Error getting city bounds', error);
      return { rings: [], center: this.FALLBACK_CENTER };
    }
  }

  async getNeighborhoodBounds(input: NeighborhoodBoundsInput): Promise<BoundsResult> {
    try {
      const district = input.locationId
        ? await this.locationRepository.findById(input.locationId)
        : await this.resolveDistrict(input.neighborhood, input.city, input.state);

      if (district) {
        return this.resolveBoundsForLocation(district);
      }

      const city = await this.resolveCity(input.city, input.state);
      return this.resolveBoundsForLocation(city);
    } catch (error) {
      logger.error('[BoundaryService] Error getting neighborhood bounds', error);
      return { rings: [], center: this.FALLBACK_CENTER };
    }
  }

  async getLocationBounds(location: Location | null): Promise<BoundsResult> {
    try {
      return this.resolveBoundsForLocation(location);
    } catch (error) {
      logger.error('[BoundaryService] Error getting location bounds', error);
      return { rings: [], center: this.FALLBACK_CENTER };
    }
  }

  async getCustomBoundary(locationId: string): Promise<BoundsResult | null> {
    if (!this.customBoundariesEnabled || this.locationBoundariesAvailable === false) {
      return null;
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('location_boundaries')
        .select('boundary, center_lat, center_lng')
        .eq('location_id', locationId)
        .maybeSingle();

      const row = data as BoundaryRow | null;

      if (error) {
        if (this.isLocationBoundariesTableUnavailable(error)) {
          this.locationBoundariesAvailable = false;
          if (!this.locationBoundariesUnavailableLogged) {
            this.locationBoundariesUnavailableLogged = true;
            logger.warn(
              '[BoundaryService] location_boundaries unavailable; using canonical fallback sources',
              {
                code: error.code,
                message: error.message,
              },
            );
          }
        }
        return null;
      }

      this.locationBoundariesAvailable = true;

      if (!row) {
        return null;
      }

      const rings = row.boundary
        ? this.extractRingsFromGeoJSON(row.boundary)
        : [];

      if (rings.length === 0) {
        return null;
      }

      const center = this.toCenter(row.center_lat, row.center_lng)
        ?? this.calculateCenter(rings);

      if (!center) {
        return null;
      }

      return { rings, center };
    } catch (error) {
      logger.error('[BoundaryService] Error getting custom boundary', error);
      return null;
    }
  }

  async setCustomBoundary(
    locationId: string,
    boundary: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown },
    center?: [number, number],
  ): Promise<void> {
    if (!this.customBoundariesEnabled) {
      throw new Error('location_boundaries support is disabled');
    }

    if (this.locationBoundariesAvailable === false) {
      throw new Error('location_boundaries table is unavailable');
    }

    try {
      const rings = this.extractRingsFromGeoJSON(boundary);
      if (rings.length === 0) {
        throw new Error('Invalid boundary geometry');
      }

      const resolvedCenter = center ?? this.calculateCenter(rings);

      const { error } = await this.supabaseClient.from('location_boundaries').upsert(
        {
          location_id: locationId,
          boundary,
          center_lat: resolvedCenter[0],
          center_lng: resolvedCenter[1],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'location_id' },
      );

      if (error) {
        if (this.isLocationBoundariesTableUnavailable(error)) {
          this.locationBoundariesAvailable = false;
        }
        throw error;
      }

      this.locationBoundariesAvailable = true;
    } catch (error) {
      logger.error('[BoundaryService] Error setting custom boundary', error);
      throw error;
    }
  }

  invalidateLocationCache(): void {
    this.territoryIndex = null;
    this.territoryIndexPromise = null;
  }

  private async resolveBoundsForLocation(location: Location | null): Promise<BoundsResult> {
    if (!location) {
      return { rings: [], center: this.FALLBACK_CENTER };
    }

    if (isPublicFallbackLocation(location)) {
      const metadataFallbackBoundary = this.getFallbackBoundaryFromMetadata(location);
      if (metadataFallbackBoundary) return metadataFallbackBoundary;

      const canonicalLocation = await this.resolveCanonicalLocationForFallback(location);
      if (canonicalLocation) {
        return this.resolveBoundsForLocation(canonicalLocation);
      }

      const metadataSourceBoundary = await this.getMetadataSourceBoundary(location);
      if (metadataSourceBoundary) return metadataSourceBoundary;

      return {
        rings: [],
        center: getLocationCenterFromMetadata(location) ?? this.FALLBACK_CENTER,
      };
    }

    const customBoundary = await this.getCustomBoundary(location.id);
    if (customBoundary) return customBoundary;

    const inlineLocationBoundary = await this.getInlineLocationBoundary(location.id);
    if (inlineLocationBoundary) return inlineLocationBoundary;

    const neighborhoodBoundary = await this.getNeighborhoodBoundary(location.id);
    if (neighborhoodBoundary) return neighborhoodBoundary;

    const metadataSourceBoundary = await this.getMetadataSourceBoundary(location);
    if (metadataSourceBoundary) return metadataSourceBoundary;

    const center = await this.resolveLocationCenter(location);
    return { rings: [], center };
  }

  private async resolveCanonicalLocationForFallback(location: Location): Promise<Location | null> {
    if (!location.geographic_path) {
      return null;
    }

    try {
      const canonical = await this.locationRepository.findByPath(location.geographic_path);
      if (!canonical || canonical.id === location.id || isPublicFallbackLocation(canonical)) {
        return null;
      }

      return canonical;
    } catch (error) {
      logger.warn('[BoundaryService] Canonical fallback location unavailable', {
        locationId: location.id,
        geographicPath: location.geographic_path,
        error,
      });
      return null;
    }
  }

  private getFallbackBoundaryFromMetadata(location: Location): BoundsResult | null {
    const rawRings = location.metadata?.[FALLBACK_BOUNDARY_RINGS_KEY];
    if (!Array.isArray(rawRings)) {
      return null;
    }

    const rings = rawRings
      .map((rawRing) => {
        if (!Array.isArray(rawRing)) {
          return [];
        }

        return rawRing.filter((candidate): candidate is [number, number] => {
          if (!Array.isArray(candidate) || candidate.length < 2) {
            return false;
          }

          const [latitude, longitude] = candidate;
          return isUsableCenter(latitude, longitude);
        });
      })
      .filter((ring): ring is [number, number][] => ring.length >= 3);

    if (rings.length === 0) {
      return null;
    }

    return {
      rings,
      center: getLocationCenterFromMetadata(location) ?? this.calculateCenter(rings),
    };
  }

  private async getInlineLocationBoundary(
    locationId: string,
  ): Promise<BoundsResult | null> {
    if (this.inlineLocationBoundaryAvailable === false) {
      return null;
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('locations')
        .select('boundary')
        .eq('id', locationId)
        .maybeSingle();

      if (error) {
        if (this.isQueryTargetUnavailable(error, ['locations', 'boundary'])) {
          this.inlineLocationBoundaryAvailable = false;
        }
        return null;
      }

      this.inlineLocationBoundaryAvailable = true;

      const row = data as InlineLocationBoundaryRow | null;
      if (!row?.boundary) {
        return null;
      }

      const rings = this.extractRingsFromGeoJSON(row.boundary);
      if (rings.length === 0) {
        return null;
      }

      return { rings, center: this.calculateCenter(rings) };
    } catch (error) {
      logger.error('[BoundaryService] Error getting inline location boundary', error);
      return null;
    }
  }

  private async getNeighborhoodBoundary(
    locationId: string,
  ): Promise<BoundsResult | null> {
    if (this.neighborhoodBoundariesAvailable === false) {
      return null;
    }

    try {
      const { data, error } = await this.supabaseClient
        .from('neighborhood_boundaries')
        .select('geometry')
        .eq('location_id', locationId)
        .maybeSingle();

      if (error) {
        if (this.isQueryTargetUnavailable(error, ['neighborhood_boundaries'])) {
          this.neighborhoodBoundariesAvailable = false;
        }
        return null;
      }

      this.neighborhoodBoundariesAvailable = true;

      const row = data as NeighborhoodBoundaryRow | null;
      const geometry = this.parseBoundaryGeometry(row?.geometry ?? null);
      if (!geometry) {
        return null;
      }

      const rings = this.extractRingsFromGeoJSON(geometry);
      if (rings.length === 0) {
        return null;
      }

      return { rings, center: this.calculateCenter(rings) };
    } catch (error) {
      logger.error('[BoundaryService] Error getting neighborhood boundary', error);
      return null;
    }
  }

  private async getMetadataSourceBoundary(
    location: Location,
  ): Promise<BoundsResult | null> {
    const source = this.getOfficialFeatureServerSource(location);
    if (!source) {
      return null;
    }

    const cacheKey = `${source.sourceUrl}::${source.objectId}`;
    if (this.metadataSourceBoundaryCache.has(cacheKey)) {
      return this.metadataSourceBoundaryCache.get(cacheKey) ?? null;
    }

    if (typeof fetch !== 'function') {
      this.metadataSourceBoundaryCache.set(cacheKey, null);
      return null;
    }

    try {
      const url = new URL(`${source.sourceUrl.replace(/\/+$/, '')}/query`);
      url.search = new URLSearchParams({
        where: `OBJECTID = ${source.objectId}`,
        outFields: '*',
        returnGeometry: 'true',
        f: 'geojson',
        outSR: '4326',
      }).toString();

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`FeatureServer responded with ${response.status}`);
      }

      const payload = (await response.json()) as GeoJsonFeatureCollection;
      const geometry = payload.features?.find((feature) => feature.geometry)?.geometry;
      const rings = geometry ? this.extractRingsFromGeoJSON(geometry) : [];

      if (rings.length === 0) {
        this.metadataSourceBoundaryCache.set(cacheKey, null);
        return null;
      }

      const result = {
        rings,
        center: getLocationCenterFromMetadata(location) ?? this.calculateCenter(rings),
      };
      this.metadataSourceBoundaryCache.set(cacheKey, result);
      return result;
    } catch (error) {
      logger.warn('[BoundaryService] Official boundary source unavailable', {
        locationId: location.id,
        sourceUrl: source.sourceUrl,
        sourceObjectId: source.objectId,
        error,
      });
      this.metadataSourceBoundaryCache.set(cacheKey, null);
      return null;
    }
  }

  private async resolveLocationCenter(location: Location): Promise<[number, number]> {
    const directCenter = getLocationCenterFromMetadata(location);
    if (directCenter) {
      return directCenter;
    }

    let currentParentId = location.parent_id;
    while (currentParentId) {
      const parent = await this.locationRepository.findById(currentParentId);
      if (!parent) {
        break;
      }

      const parentCenter = getLocationCenterFromMetadata(parent);
      if (parentCenter) {
        return parentCenter;
      }

      currentParentId = parent.parent_id;
    }

    return this.FALLBACK_CENTER;
  }

  private async resolveCity(city: string, state: string): Promise<Location | null> {
    const index = await this.getTerritoryIndex();
    const matchedState = this.matchState(state, index.states);
    const cityCandidates = matchedState
      ? index.citiesByStateId.get(matchedState.id) ?? []
      : index.cities;

    return this.matchLocation(city, cityCandidates, (location) => [
      location.name,
      location.slug,
    ]);
  }

  private async resolveDistrict(
    neighborhood: string,
    city: string,
    state: string,
  ): Promise<Location | null> {
    const matchedCity = await this.resolveCity(city, state);
    if (!matchedCity) {
      return null;
    }

    const index = await this.getTerritoryIndex();
    return this.matchLocation(
      neighborhood,
      index.districtsByCityId.get(matchedCity.id) ?? [],
      (location) => [location.name, location.slug],
    );
  }

  private matchState(rawState: string, candidates: Location[]): Location | null {
    return this.matchLocation(rawState, candidates, (location) => [
      location.name,
      location.slug,
      typeof location.metadata?.state_code === 'string'
        ? location.metadata.state_code
        : null,
      typeof location.metadata?.abbreviation === 'string'
        ? location.metadata.abbreviation
        : null,
    ]);
  }

  private matchLocation(
    rawValue: string | null | undefined,
    candidates: Location[],
    tokenBuilder: (location: Location) => Array<string | null | undefined>,
  ): Location | null {
    const normalizedNeedle = normalizeText(rawValue);
    if (!normalizedNeedle) {
      return null;
    }

    const exactMatches = candidates.filter((candidate) =>
      tokenBuilder(candidate)
        .map((token) => normalizeText(token))
        .filter(Boolean)
        .some((token) => token === normalizedNeedle),
    );

    if (exactMatches.length === 1) {
      return exactMatches[0];
    }

    if (exactMatches.length > 1) {
      return null;
    }

    const partialMatches = candidates.filter((candidate) =>
      tokenBuilder(candidate)
        .map((token) => normalizeText(token))
        .filter(Boolean)
        .some(
          (token) =>
            token.includes(normalizedNeedle) || normalizedNeedle.includes(token),
        ),
    );

    return partialMatches.length === 1 ? partialMatches[0] : null;
  }

  private async getTerritoryIndex(): Promise<CachedTerritoryIndex> {
    const cache = this.territoryIndex;
    if (cache && Date.now() - cache.loadedAt < this.locationCacheTtlMs) {
      return cache;
    }

    if (this.territoryIndexPromise) {
      return this.territoryIndexPromise;
    }

    this.territoryIndexPromise = this.buildTerritoryIndex()
      .then((index) => {
        this.territoryIndex = index;
        return index;
      })
      .finally(() => {
        this.territoryIndexPromise = null;
      });

    return this.territoryIndexPromise;
  }

  private async buildTerritoryIndex(): Promise<CachedTerritoryIndex> {
    const locations = await this.locationRepository.findAll();
    const activeLocations = locations.filter(
      (location) => location.status === LocationStatus.ACTIVE,
    );

    const byId = new Map(activeLocations.map((location) => [location.id, location]));
    const states = activeLocations.filter(
      (location) => location.type === LocationType.STATE,
    );
    const cities = activeLocations.filter(
      (location) => location.type === LocationType.CITY,
    );
    const districts = activeLocations.filter(
      (location) =>
        location.type === LocationType.NEIGHBORHOOD ||
        location.type === LocationType.DISTRICT,
    );

    const citiesByStateId = new Map<string, Location[]>();
    for (const city of cities) {
      if (!city.parent_id) {
        continue;
      }
      const bucket = citiesByStateId.get(city.parent_id) ?? [];
      bucket.push(city);
      citiesByStateId.set(city.parent_id, bucket);
    }

    const districtsByCityId = new Map<string, Location[]>();
    for (const district of districts) {
      if (!district.parent_id) {
        continue;
      }
      const bucket = districtsByCityId.get(district.parent_id) ?? [];
      bucket.push(district);
      districtsByCityId.set(district.parent_id, bucket);
    }

    return {
      loadedAt: Date.now(),
      byId,
      states,
      cities,
      districts,
      citiesByStateId,
      districtsByCityId,
    };
  }

  private toCenter(
    latitude: number | null | undefined,
    longitude: number | null | undefined,
  ): [number, number] | null {
    return isUsableCenter(latitude, longitude)
      ? [latitude as number, longitude as number]
      : null;
  }

  private isLocationBoundariesTableUnavailable(
    error: BoundaryQueryError | null | undefined,
  ): boolean {
    return this.isQueryTargetUnavailable(error, ['location_boundaries']);
  }

  private isQueryTargetUnavailable(
    error: BoundaryQueryError | null | undefined,
    requiredTokens: string[],
  ): boolean {
    if (!error) {
      return false;
    }

    const combinedMessage = [
      error.code,
      error.message,
      error.details,
      error.hint,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return requiredTokens.every((token) => combinedMessage.includes(token.toLowerCase()))
      && (
        combinedMessage.includes('pgrst205')
        || combinedMessage.includes('pgrst204')
        || combinedMessage.includes('404')
        || combinedMessage.includes('does not exist')
        || combinedMessage.includes('could not find')
        || combinedMessage.includes('undefined table')
        || combinedMessage.includes('schema cache')
      );
  }

  private parseBoundaryGeometry(value: GeoJsonBoundary | string | null): GeoJsonBoundary | null {
    if (!value) {
      return null;
    }

    if (typeof value !== 'string') {
      return value;
    }

    try {
      const parsed = JSON.parse(value) as GeoJsonBoundary;
      return parsed && typeof parsed.type === 'string' ? parsed : null;
    } catch {
      return null;
    }
  }

  private getOfficialFeatureServerSource(
    location: Location,
  ): { sourceUrl: string; objectId: number } | null {
    const sourceUrl = location.metadata?.source_url;
    const sourceObjectId = location.metadata?.source_object_id;

    if (
      typeof sourceUrl !== 'string' ||
      !sourceUrl.includes('/FeatureServer/') ||
      sourceObjectId === null ||
      sourceObjectId === undefined
    ) {
      return null;
    }

    const objectId = Number(sourceObjectId);
    if (!Number.isFinite(objectId)) {
      return null;
    }

    return { sourceUrl, objectId };
  }

  private extractRingsFromGeoJSON(geojson: {
    type: string;
    coordinates: unknown;
  }): [number, number][][] {
    const isValidCoord = (candidate: unknown): candidate is [number, number] => {
      if (!Array.isArray(candidate) || candidate.length < 2) {
        return false;
      }

      const [lng, lat] = candidate;
      return (
        typeof lng === 'number' &&
        Number.isFinite(lng) &&
        typeof lat === 'number' &&
        Number.isFinite(lat)
      );
    };

    const toLatLng = ([lng, lat]: [number, number]): [number, number] => [lat, lng];
    const sanitizeRing = (ring: unknown[]): [number, number][] =>
      ring.filter(isValidCoord).map(toLatLng);

    try {
      if (geojson.type === 'Polygon') {
        const polygon = Array.isArray(geojson.coordinates)
          ? (geojson.coordinates as unknown[][])
          : [];
        const ring = Array.isArray(polygon[0]) ? sanitizeRing(polygon[0]) : [];
        return ring.length >= 3 ? [ring] : [];
      }

      if (geojson.type === 'MultiPolygon') {
        const polygons = Array.isArray(geojson.coordinates)
          ? (geojson.coordinates as unknown[][][])
          : [];

        return polygons
          .map((polygon) =>
            Array.isArray(polygon[0]) ? sanitizeRing(polygon[0]) : [],
          )
          .filter((ring) => ring.length >= 3);
      }

      return [];
    } catch (error) {
      logger.error('[BoundaryService] Error extracting rings from GeoJSON', error);
      return [];
    }
  }

  private calculateCenter(rings: [number, number][][]): [number, number] {
    if (rings.length === 0 || rings[0].length === 0) {
      return this.FALLBACK_CENTER;
    }

    const ring = rings[0];
    const sum = ring.reduce(
      (acc, [lat, lng]) => {
        acc.lat += lat;
        acc.lng += lng;
        return acc;
      },
      { lat: 0, lng: 0 },
    );

    return [sum.lat / ring.length, sum.lng / ring.length];
  }
}

export { BoundaryServiceClass };
export const boundaryService = BoundaryServiceClass.getInstance();

