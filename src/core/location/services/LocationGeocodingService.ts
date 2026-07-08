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
import { supabase } from '@/integrations/supabase';
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
import { LocationRpcService } from './LocationRpcService';

type GeocodingEngine = Pick<
  typeof providerGeocodingService,
  'geocode' | 'reverseGeocode' | 'lookupPostalCode'
>;

type TerritoryMatchStatus = 'matched' | 'partial' | 'unmatched';
type TerritoryReviewStatus = 'resolved' | 'needs_review' | 'unresolved';

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
  citiesByIbgeCode: Map<string, Location>;
  aliasesByNormalizedValue: Map<string, Set<string>>;
  territorialGroupsByDistrictId: Map<string, Array<{ id: string; slug: string; name: string }>>;
}

export interface TerritoryResolution {
  sourceOfTruth: 'locations';
  status: TerritoryMatchStatus;
  reviewStatus: TerritoryReviewStatus;
  reviewReason: string | null;
  state: Location | null;
  city: Location | null;
  district: Location | null;
  groups: Array<{ id: string; slug: string; name: string }>;
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

function extractIbgeCodeFromLocation(location: Location): string | null {
  const candidates = [
    location.metadata?.ibge_code,
    location.metadata?.ibgeCode,
    location.metadata?.municipio_ibge,
    location.metadata?.city_ibge_code,
  ];
  for (const value of candidates) {
    if (typeof value !== 'string') continue;
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 6) {
      return digits;
    }
  }
  return null;
}

export class LocationGeocodingService {
  private readonly geocoding: GeocodingEngine;
  private readonly locationRepository: ILocationRepository;
  private readonly locationCacheTtlMs: number;
  private territoryIndex: CachedTerritoryIndex | null = null;
  private territoryIndexPromise: Promise<CachedTerritoryIndex> | null = null;
  private aliasLookupDisabled = false;

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

    const coordinates =
      postalCodeResult.coordinates &&
      Number.isFinite(postalCodeResult.coordinates.latitude) &&
      Number.isFinite(postalCodeResult.coordinates.longitude)
        ? {
            latitude: postalCodeResult.coordinates.latitude,
            longitude: postalCodeResult.coordinates.longitude,
          }
        : undefined;

    const territory = await this.reconcileTerritory(
      providerAddress,
      postalCodeResult.ibgeCode,
      coordinates,
    );
    const authoritativeLocation = territory.authoritativeLocation;

    return {
      postalCode: postalCodeResult.postalCode,
      street: providerAddress.street,
      complement: providerAddress.complement,
      neighborhood: territory.district?.name ?? providerAddress.neighborhood ?? null,
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

    const territory = await this.reconcileTerritory(
      providerAddress,
      undefined,
      providerResult.coordinates,
    );

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
    ibgeCode?: string,
    coordinates?: { latitude: number; longitude: number },
  ): Promise<TerritoryResolution> {
    const index = await this.getTerritoryIndex();

    let state = this.matchState(providerAddress.state, index.states);
    let city: Location | null = null;
    const normalizedIbge = (ibgeCode ?? '').replace(/\D/g, '');
    if (normalizedIbge) {
      city = index.citiesByIbgeCode.get(normalizedIbge) ?? null;
      if (!city) {
        const stateCodeForSeed =
          getStateCode(state) ??
          ((providerAddress.state ?? '').trim().length === 2
            ? (providerAddress.state ?? '').trim().toUpperCase()
            : null);
        const seededCity = await this.ensureCanonicalCityByIbge(
          stateCodeForSeed,
          providerAddress.city,
          normalizedIbge,
        );
        if (seededCity) {
          this.invalidateTerritoryCache();
          const freshIndex = await this.getTerritoryIndex();
          city = freshIndex.citiesByIbgeCode.get(normalizedIbge) ?? null;
          if (city && !state && city.parent_id) {
            state = freshIndex.byId.get(city.parent_id) ?? null;
          }
        }
      }
      if (city && !state && city.parent_id) {
        state = index.byId.get(city.parent_id) ?? null;
      }
    }
    if (!city) {
      city = this.matchLocation(
        providerAddress.city,
        state ? index.citiesByStateId.get(state.id) ?? [] : index.cities,
        (location) => [location.name, location.slug],
        index.aliasesByNormalizedValue,
      );
    }

    let district: Location | null = null;
    if (city) {
      district = this.matchLocation(
        providerAddress.neighborhood,
        index.districtsByCityId.get(city.id) ?? [],
        (location) => [location.name, location.slug],
        index.aliasesByNormalizedValue,
      );
    }

    if (!district && city && coordinates) {
      district = await this.matchDistrictByBoundary(city.id, coordinates);
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
      reviewStatus: 'resolved' as TerritoryReviewStatus,
      reviewReason: null as string | null,
      state,
      city,
      district,
      groups: district ? index.territorialGroupsByDistrictId.get(district.id) ?? [] : [],
      authoritativeLocation: district ?? city ?? state ?? null,
    };

    if (territory.status === 'partial') {
      territory.reviewStatus = 'needs_review';
      territory.reviewReason = 'district_unresolved_for_city';
    } else if (territory.status === 'unmatched') {
      territory.reviewStatus = 'unresolved';
      territory.reviewReason = 'city_unresolved_from_provider';
    }

    if (territory.status === 'unmatched') {
      logger.warn('[LocationGeocodingService] Provider result outside territorial SSOT', {
        providerState: providerAddress.state,
        providerCity: providerAddress.city,
        providerNeighborhood: providerAddress.neighborhood,
      });
    }

    return territory;
  }

  private async ensureCanonicalCityByIbge(
    stateCode: string | null,
    city: string | null,
    ibgeCode: string,
  ): Promise<boolean> {
    const normalizedStateCode = (stateCode ?? '').trim().toUpperCase();
    const normalizedCity = (city ?? '').trim();
    if (!normalizedStateCode || !normalizedCity || !ibgeCode) {
      return false;
    }

    const upserted = await LocationRpcService.upsertCanonicalCityByIbge({
      stateCode: normalizedStateCode,
      cityName: normalizedCity,
      ibgeCode,
    });

    if (!upserted) {
      logger.warn('[LocationGeocodingService] Could not upsert canonical city by IBGE', {
        state: normalizedStateCode,
        city: normalizedCity,
        ibgeCode,
      });
      return false;
    }

    return true;
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
    aliasesByNormalizedValue?: Map<string, Set<string>>,
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

    if (partialMatches.length === 1) {
      return partialMatches[0];
    }

    if (!aliasesByNormalizedValue) {
      return null;
    }

    const aliasMatchedLocationIds = aliasesByNormalizedValue.get(normalizedNeedle);
    if (!aliasMatchedLocationIds || aliasMatchedLocationIds.size === 0) {
      return null;
    }

    const candidateById = new Map(candidates.map((item) => [item.id, item]));
    const aliasMatches = Array.from(aliasMatchedLocationIds)
      .map((locationId) => candidateById.get(locationId))
      .filter((item): item is Location => Boolean(item));

    return aliasMatches.length === 1 ? aliasMatches[0] : null;
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
    const citiesByIbgeCode = new Map<string, Location>();
    for (const city of cities) {
      const ibgeCode = extractIbgeCodeFromLocation(city);
      if (ibgeCode) {
        citiesByIbgeCode.set(ibgeCode, city);
      }
    }

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

    const aliasesByNormalizedValue = new Map<string, Set<string>>();
    let aliasesData: Array<{ location_id: string; alias_value: string }> | null = null;

    if (!this.aliasLookupDisabled) {
      const aliasesWithValidity = await supabase
        .from('location_aliases' as never)
        .select('location_id, alias_value, valid_until')
        .is('valid_until', null);

      if (aliasesWithValidity.error) {
        // Compatibilidade com ambientes onde `valid_until` ainda não existe.
        const aliasesFallback = await supabase
          .from('location_aliases' as never)
          .select('location_id, alias_value');
        if (aliasesFallback.error) {
          // 42P17: recursão de policy (ex.: admin_users) => desabilita leitura de aliases no cliente.
          if ((aliasesFallback.error as { code?: string }).code === '42P17') {
            this.aliasLookupDisabled = true;
            logger.warn('[LocationGeocodingService] Alias lookup disabled due to recursive RLS policy (42P17)');
          } else {
            logger.warn('[LocationGeocodingService] Failed to load location aliases', aliasesFallback.error);
          }
        } else {
          aliasesData = aliasesFallback.data as Array<{ location_id: string; alias_value: string }>;
        }
      } else {
        aliasesData = aliasesWithValidity.data as Array<{ location_id: string; alias_value: string }>;
      }
    }

    for (const row of aliasesData ?? []) {
      const key = normalizeText(row.alias_value);
      if (!key) continue;
      const existing = aliasesByNormalizedValue.get(key) ?? new Set<string>();
      existing.add(row.location_id);
      aliasesByNormalizedValue.set(key, existing);
    }

    const territorialGroupsByDistrictId = new Map<
      string,
      Array<{ id: string; slug: string; name: string }>
    >();
    const { data: groupsData } = await supabase
      .from('territorial_group_members' as never)
      .select('location_id, territorial_groups(id, slug, name)');
    for (const row of (groupsData ?? []) as Array<{
      location_id: string;
      territorial_groups: { id: string; slug: string; name: string } | null;
    }>) {
      if (!row.territorial_groups) continue;
      const bucket = territorialGroupsByDistrictId.get(row.location_id) ?? [];
      bucket.push(row.territorial_groups);
      territorialGroupsByDistrictId.set(row.location_id, bucket);
    }

    return {
      loadedAt: Date.now(),
      byId,
      states,
      cities,
      districts,
      citiesByStateId,
      districtsByCityId,
      citiesByIbgeCode,
      aliasesByNormalizedValue,
      territorialGroupsByDistrictId,
    };
  }

  private async matchDistrictByBoundary(
    cityId: string,
    coordinates: { latitude: number; longitude: number },
  ): Promise<Location | null> {
    const { data, error } = await supabase.rpc('rpc_match_district_by_point', {
      p_city_id: cityId,
      p_lat: coordinates.latitude,
      p_lng: coordinates.longitude,
    });

    if (error) {
      logger.warn('[LocationGeocodingService] Boundary match RPC failed', error);
      return null;
    }

    const locationId = Array.isArray(data) ? (data[0]?.location_id as string | undefined) : null;
    if (!locationId) return null;
    return this.locationRepository.findById(locationId);
  }
}

export const locationGeocodingService = new LocationGeocodingService();
