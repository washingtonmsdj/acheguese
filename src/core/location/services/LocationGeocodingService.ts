/**
 * LocationGeocodingService
 *
 * Camada central de geocoding consumida pelos módulos de domínio.
 *
 * Regras arquiteturais:
 * - Nominatim (ou qualquer provider futuro) é apenas fonte de geocoding/reverse geocoding.
 * - Bairro/cidade/estado usados pelo sistema só podem sair do SSOT territorial (`locations`).
 * - Consumidores recebem dados normalizados + reconciliação explícita.
 * - Troca futura de provider não quebra consumidores, pois todos dependem deste contrato.
 */
import { logger } from '@/shared/utils/logger';
import {
  geocodingService as providerGeocodingService,
  type GeocodeRequest,
  type GeocodeResult as ProviderGeocodeResult,
  type PostalCodeLookupRequest,
  type ReverseGeocodeRequest,
} from '@/core/geocoding';
import type { ILocationRepository } from '../repositories/ILocationRepository';
import { createLocationRepository } from '../repositories/createLocationRepository';
import { LocationStatus, LocationType, type Location } from '../types';

type GeocodingEngine = Pick<
  typeof providerGeocodingService,
  'geocode' | 'reverseGeocode' | 'lookupPostalCode'
>;

type TerritoryMatchStatus = 'matched' | 'partial' | 'unmatched';

interface ProviderAddressSeed {
  formattedAddress?: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
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

export interface TerritoryResolution {
  sourceOfTruth: 'locations';
  status: TerritoryMatchStatus;
  state: Location | null;
  city: Location | null;
  district: Location | null;
  authoritativeLocation: Location | null;
}

export interface ProviderAddressSnapshot {
  formattedAddress: string;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface SystemAddressSnapshot {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface LocationGeocodingResult {
  displayAddress: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  confidence: number;
  source: string;
  providerPlaceId?: string;
  bounds?: ProviderGeocodeResult['bounds'];
  providerAddress: ProviderAddressSnapshot;
  systemAddress: SystemAddressSnapshot;
  territory: TerritoryResolution;
  locationType?: string;
  distanceMeters?: number;
}

export interface LocationInfoExtraction {
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  locationId: string | null;
  locationType: Location['type'] | null;
  territoryStatus: TerritoryMatchStatus;
}

export interface LocationPostalCodeLookupResult {
  postalCode: string;
  street: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  stateCode: string | null;
  country: string | null;
  ibgeCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationData?: {
    locationId: string;
    locationName: string;
    locationType: string;
  };
  providerAddress: ProviderAddressSnapshot;
  territory: TerritoryResolution;
}

export interface LocationGeocodingServiceDeps {
  geocoding?: GeocodingEngine;
  locationRepository?: ILocationRepository;
  locationCacheTtlMs?: number;
}

const DEFAULT_LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeText(value?: string | null): string {
  return (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, ' ')
    .trim();
}

function compactSpaces(value?: string | null): string | null {
  const normalized = (value ?? '').trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function toProviderAddressSnapshot(seed: ProviderAddressSeed): ProviderAddressSnapshot {
  return {
    formattedAddress: compactSpaces(seed.formattedAddress) ?? '',
    street: compactSpaces(seed.street),
    number: compactSpaces(seed.number),
    complement: compactSpaces(seed.complement),
    neighborhood: compactSpaces(seed.neighborhood),
    city: compactSpaces(seed.city),
    state: compactSpaces(seed.state),
    postalCode: compactSpaces(seed.postalCode),
    country: compactSpaces(seed.country),
  };
}

function getStateCode(location: Location | null): string | null {
  if (!location) {
    return null;
  }

  const stateCode = location.metadata?.state_code;
  return typeof stateCode === 'string' && stateCode.trim().length > 0
    ? stateCode.trim().toUpperCase()
    : null;
}

function buildSystemAddress(
  providerAddress: ProviderAddressSnapshot,
  territory: TerritoryResolution,
): SystemAddressSnapshot {
  return {
    street: providerAddress.street,
    number: providerAddress.number,
    complement: providerAddress.complement,
    neighborhood: territory.district?.name ?? null,
    city: territory.city?.name ?? null,
    state: territory.state?.name ?? null,
    stateCode: getStateCode(territory.state),
    postalCode: providerAddress.postalCode,
    country: providerAddress.country,
  };
}

function buildTerritoryStatus(territory: {
  state: Location | null;
  city: Location | null;
  district: Location | null;
}): TerritoryMatchStatus {
  if (territory.district) {
    return 'matched';
  }

  if (territory.city || territory.state) {
    return 'partial';
  }

  return 'unmatched';
}

export class LocationGeocodingService {
  private readonly geocoding: GeocodingEngine;
  private readonly locationRepository: ILocationRepository;
  private readonly locationCacheTtlMs: number;
  private territoryIndex: CachedTerritoryIndex | null = null;
  private territoryIndexPromise: Promise<CachedTerritoryIndex> | null = null;

  constructor(deps: LocationGeocodingServiceDeps = {}) {
    this.geocoding = deps.geocoding ?? providerGeocodingService;
    this.locationRepository = deps.locationRepository ?? createLocationRepository();
    this.locationCacheTtlMs = deps.locationCacheTtlMs ?? DEFAULT_LOCATION_CACHE_TTL_MS;
  }

  async geocode(request: GeocodeRequest): Promise<LocationGeocodingResult[]> {
    const results = await this.geocoding.geocode(request);
    return Promise.all(results.map((result) => this.reconcileProviderResult(result)));
  }

  async reverseGeocode(
    request: ReverseGeocodeRequest,
  ): Promise<LocationGeocodingResult | null> {
    const result = await this.geocoding.reverseGeocode(request);
    if (!result) {
      return null;
    }

    return this.reconcileProviderResult(result.address, {
      locationType: result.locationType,
      distanceMeters: result.distanceMeters,
    });
  }

  async lookupPostalCode(
    request: PostalCodeLookupRequest,
  ): Promise<LocationPostalCodeLookupResult | null> {
    const postalCodeResult = await this.geocoding.lookupPostalCode(request);
    if (!postalCodeResult) {
      return null;
    }

    const providerAddress = toProviderAddressSnapshot({
      formattedAddress: [
        postalCodeResult.street,
        postalCodeResult.neighborhood,
        postalCodeResult.city,
        postalCodeResult.state,
      ]
        .filter(Boolean)
        .join(', '),
      street: postalCodeResult.street,
      complement: postalCodeResult.complement,
      neighborhood: postalCodeResult.neighborhood,
      city: postalCodeResult.city,
      state: postalCodeResult.state,
      postalCode: postalCodeResult.postalCode,
      country: 'Brasil',
    });

    const territory = await this.reconcileTerritory(providerAddress);
    const authoritativeLocation = territory.authoritativeLocation;

    return {
      postalCode: postalCodeResult.postalCode,
      street: providerAddress.street,
      complement: providerAddress.complement,
      neighborhood: territory.district?.name ?? null,
      city: territory.city?.name ?? null,
      state: territory.state?.name ?? null,
      stateCode: getStateCode(territory.state),
      country: providerAddress.country,
      ibgeCode: postalCodeResult.ibgeCode,
      coordinates: postalCodeResult.coordinates,
      locationData: authoritativeLocation
        ? {
            locationId: authoritativeLocation.id,
            locationName: authoritativeLocation.name,
            locationType: authoritativeLocation.type,
          }
        : undefined,
      providerAddress,
      territory,
    };
  }

  formatCompactAddress(
    result:
      | LocationGeocodingResult
      | LocationPostalCodeLookupResult
      | ProviderAddressSnapshot,
  ): string {
    const providerAddress =
      'providerAddress' in result ? result.providerAddress : result;
    const territory = 'territory' in result ? result.territory : null;

    const street = providerAddress.street;
    const number = providerAddress.number;
    const neighborhood = territory?.district?.name ?? providerAddress.neighborhood ?? null;
    const city = territory?.city?.name ?? providerAddress.city ?? null;

    const primaryLine =
      street && number
        ? `${street}, ${number}`
        : street ?? providerAddress.formattedAddress;

    return [primaryLine, neighborhood, city].filter(Boolean).join(' - ');
  }

  extractLocationInfo(
    result: LocationGeocodingResult | LocationPostalCodeLookupResult,
  ): LocationInfoExtraction {
    const authoritativeLocation = result.territory.authoritativeLocation;

    return {
      neighborhood: result.territory.district?.name ?? null,
      city: result.territory.city?.name ?? null,
      state: result.territory.state?.name ?? null,
      stateCode: getStateCode(result.territory.state),
      locationId: authoritativeLocation?.id ?? null,
      locationType: authoritativeLocation?.type ?? null,
      territoryStatus: result.territory.status,
    };
  }

  invalidateTerritoryCache(): void {
    this.territoryIndex = null;
    this.territoryIndexPromise = null;
  }

  private async reconcileProviderResult(
    providerResult: ProviderGeocodeResult,
    extras?: { locationType?: string; distanceMeters?: number },
  ): Promise<LocationGeocodingResult> {
    const providerAddress = toProviderAddressSnapshot({
      formattedAddress: providerResult.formattedAddress,
      street: providerResult.addressComponents.street,
      number: providerResult.addressComponents.number,
      complement: providerResult.addressComponents.complement,
      neighborhood: providerResult.addressComponents.neighborhood,
      city: providerResult.addressComponents.city,
      state: providerResult.addressComponents.state,
      postalCode: providerResult.addressComponents.postalCode,
      country: providerResult.addressComponents.country,
    });

    const territory = await this.reconcileTerritory(providerAddress);

    return {
      displayAddress: providerResult.formattedAddress,
      coordinates: providerResult.coordinates,
      confidence: providerResult.confidence,
      source: providerResult.source,
      providerPlaceId: providerResult.providerPlaceId,
      bounds: providerResult.bounds,
      providerAddress,
      systemAddress: buildSystemAddress(providerAddress, territory),
      territory,
      locationType: extras?.locationType,
      distanceMeters: extras?.distanceMeters,
    };
  }

  private async reconcileTerritory(
    providerAddress: Pick<ProviderAddressSnapshot, 'state' | 'city' | 'neighborhood'>,
  ): Promise<TerritoryResolution> {
    const index = await this.getTerritoryIndex();

    let state = this.matchState(providerAddress.state, index.states);
    let city = this.matchLocation(
      providerAddress.city,
      state ? index.citiesByStateId.get(state.id) ?? [] : index.cities,
      (location) => [location.name, location.slug],
    );

    let district: Location | null = null;
    if (city) {
      district = this.matchLocation(
        providerAddress.neighborhood,
        index.districtsByCityId.get(city.id) ?? [],
        (location) => [location.name, location.slug],
      );
    }

    if (district && !city && district.parent_id) {
      city = index.byId.get(district.parent_id) ?? null;
    }

    if (city && !state && city.parent_id) {
      state = index.byId.get(city.parent_id) ?? null;
    }

    const territory = {
      sourceOfTruth: 'locations' as const,
      status: buildTerritoryStatus({ state, city, district }),
      state,
      city,
      district,
      authoritativeLocation: district ?? city ?? state ?? null,
    };

    if (territory.status === 'unmatched') {
      logger.warn('[LocationGeocodingService] Provider result outside territorial SSOT', {
        providerState: providerAddress.state,
        providerCity: providerAddress.city,
        providerNeighborhood: providerAddress.neighborhood,
      });
    }

    return territory;
  }

  private matchState(rawState: string | null, states: Location[]): Location | null {
    return this.matchLocation(rawState, states, (location) => [
      location.name,
      location.slug,
      getStateCode(location),
      typeof location.metadata?.abbreviation === 'string'
        ? location.metadata.abbreviation
        : null,
    ]);
  }

  private matchLocation(
    rawValue: string | null,
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
      (location) => location.type === LocationType.DISTRICT,
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
}

export const locationGeocodingService = new LocationGeocodingService();
