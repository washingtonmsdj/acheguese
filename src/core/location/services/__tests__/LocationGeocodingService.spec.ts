import { describe, expect, it } from 'vitest';
import type {
  GeocodeRequest,
  GeocodeResult,
  PostalCodeLookupRequest,
  PostalCodeLookupResult,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
} from '@/core/geocoding';
import type { ILocationRepository } from '@/core/location/repositories/ILocationRepository';
import {
  LocationGeocodingService,
} from '../LocationGeocodingService';
import {
  LocationStatus,
  LocationType,
  type Location,
} from '../../types';

function createLocation(
  partial: Partial<Location> & Pick<Location, 'id' | 'name' | 'slug' | 'type' | 'geographic_path'>,
): Location {
  return {
    id: partial.id,
    parent_id: partial.parent_id ?? null,
    type: partial.type,
    slug: partial.slug,
    name: partial.name,
    full_name: partial.full_name ?? partial.name,
    geographic_path: partial.geographic_path,
    status: partial.status ?? LocationStatus.ACTIVE,
    metadata: partial.metadata ?? {},
    created_at: partial.created_at ?? '2026-01-01T00:00:00.000Z',
    updated_at: partial.updated_at ?? '2026-01-01T00:00:00.000Z',
  };
}

class RepositoryStub implements ILocationRepository {
  constructor(private readonly locations: Location[]) {}

  async findById(_id: string): Promise<Location | null> {
    return null;
  }

  async findByPath(_path: string): Promise<Location | null> {
    return null;
  }

  async findBySlugWithinParent(_slug: string, _parentId: string): Promise<Location | null> {
    return null;
  }

  async findAncestors(_locationId: string, _includeSelf?: boolean): Promise<Location[]> {
    return [];
  }

  async findDescendants(
    _locationId: string,
    _options: {
      include_self?: boolean;
      max_depth?: number;
      page?: number;
      page_size?: number;
    },
  ): Promise<{ locations: Location[]; total_count: number }> {
    return { locations: [], total_count: 0 };
  }

  async findChildren(
    _locationId: string,
    _options: {
      type?: LocationType;
      status?: LocationStatus;
      page?: number;
      page_size?: number;
    },
  ): Promise<{ locations: Location[]; total_count: number }> {
    return { locations: [], total_count: 0 };
  }

  async findAll(): Promise<Location[]> {
    return this.locations;
  }
}

function createGeocodingEngine(overrides: {
  geocode?: (request: GeocodeRequest) => Promise<GeocodeResult[]>;
  reverseGeocode?: (request: ReverseGeocodeRequest) => Promise<ReverseGeocodeResult | null>;
  lookupPostalCode?: (request: PostalCodeLookupRequest) => Promise<PostalCodeLookupResult | null>;
}) {
  return {
    geocode: overrides.geocode ?? (async () => []),
    reverseGeocode: overrides.reverseGeocode ?? (async () => null),
    lookupPostalCode: overrides.lookupPostalCode ?? (async () => null),
  };
}

const state = createLocation({
  id: 'state-ba',
  type: LocationType.STATE,
  slug: 'ba',
  name: 'Bahia',
  full_name: 'Bahia',
  geographic_path: '/br/ba',
  metadata: { state_code: 'BA' },
});

const city = createLocation({
  id: 'city-salvador',
  parent_id: state.id,
  type: LocationType.CITY,
  slug: 'salvador',
  name: 'Salvador',
  full_name: 'Salvador, Bahia',
  geographic_path: '/br/ba/salvador',
});

const district = createLocation({
  id: 'district-pituba',
  parent_id: city.id,
  type: LocationType.DISTRICT,
  slug: 'pituba',
  name: 'Pituba',
  full_name: 'Pituba, Salvador, Bahia',
  geographic_path: '/br/ba/salvador/pituba',
});

describe('LocationGeocodingService', () => {
  it('reconcilia geocode com o SSOT territorial antes de expor bairro/cidade/estado', async () => {
    const service = new LocationGeocodingService({
      geocoding: createGeocodingEngine({
        geocode: async () => [
          {
            formattedAddress: 'Rua das Flores, Pituba, Salvador - BA',
            addressComponents: {
              street: 'Rua das Flores',
              number: '10',
              neighborhood: 'Pituba',
              city: 'Salvador',
              state: 'BA',
              postalCode: '41810-000',
              country: 'Brasil',
            },
            coordinates: { latitude: -12.981, longitude: -38.455 },
            confidence: 0.93,
            source: 'nominatim',
          },
        ],
      }),
      locationRepository: new RepositoryStub([state, city, district]),
    });

    const [result] = await service.geocode({
      query: 'Rua das Flores, Pituba, Salvador - BA',
      country: 'BR',
      limit: 1,
    });

    expect(result.territory.status).toBe('matched');
    expect(result.territory.authoritativeLocation?.id).toBe(district.id);
    expect(result.systemAddress.neighborhood).toBe('Pituba');
    expect(result.systemAddress.city).toBe('Salvador');
    expect(result.systemAddress.state).toBe('Bahia');
    expect(result.systemAddress.stateCode).toBe('BA');
    expect(result.providerAddress.state).toBe('BA');
  });

  it('mantem provider apenas como display quando o SSOT nao reconhece o territorio', async () => {
    const service = new LocationGeocodingService({
      geocoding: createGeocodingEngine({
        geocode: async () => [
          {
            formattedAddress: 'Rua Desconhecida, Atlantis',
            addressComponents: {
              street: 'Rua Desconhecida',
              city: 'Atlantis',
              state: 'OC',
              country: 'Brasil',
            },
            coordinates: { latitude: 0, longitude: 0 },
            confidence: 0.5,
            source: 'nominatim',
          },
        ],
      }),
      locationRepository: new RepositoryStub([state, city, district]),
    });

    const [result] = await service.geocode({
      query: 'Rua Desconhecida, Atlantis',
      country: 'BR',
      limit: 1,
    });

    expect(result.territory.status).toBe('unmatched');
    expect(result.territory.authoritativeLocation).toBeNull();
    expect(result.systemAddress.neighborhood).toBeNull();
    expect(result.systemAddress.city).toBeNull();
    expect(result.systemAddress.state).toBeNull();
    expect(result.providerAddress.city).toBe('Atlantis');
  });

  it('reconcilia CEP para location_id canônico do SSOT', async () => {
    const service = new LocationGeocodingService({
      geocoding: createGeocodingEngine({
        lookupPostalCode: async () => ({
          postalCode: '41810-000',
          street: 'Rua das Flores',
          complement: '',
          neighborhood: 'Pituba',
          city: 'Salvador',
          state: 'BA',
          ibgeCode: '2927408',
          coordinates: { latitude: -12.981, longitude: -38.455 },
        }),
      }),
      locationRepository: new RepositoryStub([state, city, district]),
    });

    const result = await service.lookupPostalCode({ postalCode: '41810000' });

    expect(result).not.toBeNull();
    expect(result?.territory.status).toBe('matched');
    expect(result?.locationData?.locationId).toBe(district.id);
    expect(result?.city).toBe('Salvador');
    expect(result?.state).toBe('Bahia');
    expect(result?.stateCode).toBe('BA');
  });
});
