import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BoundaryServiceClass,
  type BoundaryServiceDeps,
} from '../BoundaryService';
import {
  type ILocationRepository,
  type Location,
} from '@/core/location';
import { LocationStatus, LocationType } from '@/core/location/types';

type SupabaseRows = Record<string, Record<string, unknown>>;

function buildLocation(partial: Partial<Location>): Location {
  return {
    id: partial.id ?? crypto.randomUUID(),
    parent_id: partial.parent_id ?? null,
    type: partial.type ?? LocationType.CITY,
    slug: partial.slug ?? 'location',
    name: partial.name ?? 'Location',
    full_name: partial.full_name ?? partial.name ?? 'Location',
    geographic_path: partial.geographic_path ?? '/br/ba/location',
    status: partial.status ?? LocationStatus.ACTIVE,
    metadata: partial.metadata ?? {},
    created_at: partial.created_at ?? '2026-01-01T00:00:00.000Z',
    updated_at: partial.updated_at ?? '2026-01-01T00:00:00.000Z',
  };
}

function createRepository(locations: Location[]): ILocationRepository {
  const byId = new Map(locations.map((location) => [location.id, location]));

  return {
    findById: vi.fn(async (id: string) => byId.get(id) ?? null),
    findByPath: vi.fn(),
    findBySlugWithinParent: vi.fn(),
    findAncestors: vi.fn(),
    findDescendants: vi.fn(),
    findChildren: vi.fn(),
    findAll: vi.fn(async () => locations),
  } as unknown as ILocationRepository;
}

function createSupabaseStub(rowsByTable: SupabaseRows = {}) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn((_: string, locationId: string) => ({
          maybeSingle: vi.fn(async () => ({
            data: rowsByTable[table]?.[locationId] ?? null,
            error: null,
          })),
        })),
      })),
    })),
  };
}

function createService(
  locations: Location[],
  rowsByTable: SupabaseRows = {},
  customBoundariesEnabled = false,
): BoundaryServiceClass {
  const deps: BoundaryServiceDeps = {
    locationRepository: createRepository(locations),
    supabaseClient: createSupabaseStub(rowsByTable) as unknown as BoundaryServiceDeps['supabaseClient'],
    locationCacheTtlMs: 60_000,
    customBoundariesEnabled,
  };

  return new BoundaryServiceClass(deps);
}

function createStateCityDistrict() {
  const state = buildLocation({
    id: 'state-ba',
    type: LocationType.STATE,
    slug: 'ba',
    name: 'Bahia',
    geographic_path: '/br/ba',
    metadata: { state_code: 'BA' },
  });
  const city = buildLocation({
    id: 'city-salvador',
    parent_id: state.id,
    type: LocationType.CITY,
    slug: 'salvador',
    name: 'Salvador',
    geographic_path: '/br/ba/salvador',
    metadata: { center_latitude: -12.9714, center_longitude: -38.5124 },
  });
  const district = buildLocation({
    id: 'district-rio-vermelho',
    parent_id: city.id,
    type: LocationType.DISTRICT,
    slug: 'rio-vermelho',
    name: 'Rio Vermelho',
    geographic_path: '/br/ba/salvador/rio-vermelho',
  });

  return { state, city, district };
}

describe('BoundaryService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses stored custom polygon when available', async () => {
    const { state, city, district } = createStateCityDistrict();

    const service = createService(
      [state, city, district],
      {
        location_boundaries: {
          [district.id]: {
            boundary: {
              type: 'Polygon',
              coordinates: [
                [
                  [-38.5, -12.99],
                  [-38.49, -12.99],
                  [-38.49, -12.98],
                  [-38.5, -12.99],
                ],
              ],
            },
            center_lat: -12.985,
            center_lng: -38.495,
          },
        },
      },
      true,
    );

    const result = await service.getNeighborhoodBounds({
      neighborhood: 'Rio Vermelho',
      city: 'Salvador',
      state: 'BA',
      locationId: district.id,
    });

    expect(result.center).toEqual([-12.985, -38.495]);
    expect(result.rings).toHaveLength(1);
    expect(result.rings[0][0]).toEqual([-12.99, -38.5]);
  });

  it('skips optional location_boundaries when disabled', async () => {
    const { state, city, district } = createStateCityDistrict();
    const supabaseStub = createSupabaseStub({
      location_boundaries: {
        [district.id]: {
          boundary: {
            type: 'Polygon',
            coordinates: [
              [
                [-38.5, -12.99],
                [-38.49, -12.99],
                [-38.49, -12.98],
                [-38.5, -12.99],
              ],
            ],
          },
          center_lat: -12.985,
          center_lng: -38.495,
        },
      },
    });
    const service = new BoundaryServiceClass({
      locationRepository: createRepository([state, city, district]),
      supabaseClient: supabaseStub as unknown as BoundaryServiceDeps['supabaseClient'],
      customBoundariesEnabled: false,
    });

    const result = await service.getNeighborhoodBounds({
      neighborhood: 'Rio Vermelho',
      city: 'Salvador',
      state: 'BA',
      locationId: district.id,
    });

    expect(supabaseStub.from).not.toHaveBeenCalledWith('location_boundaries');
    expect(result.rings).toEqual([]);
  });

  it('uses legacy neighborhood boundary geometry when available', async () => {
    const { state, city, district } = createStateCityDistrict();
    const service = createService([state, city, district], {
      neighborhood_boundaries: {
        [district.id]: {
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-38.49, -12.98],
                [-38.48, -12.98],
                [-38.48, -12.97],
                [-38.49, -12.98],
              ],
            ],
          },
        },
      },
    });

    const result = await service.getNeighborhoodBounds({
      neighborhood: 'Rio Vermelho',
      city: 'Salvador',
      state: 'BA',
      locationId: district.id,
    });

    expect(result.rings).toHaveLength(1);
    expect(result.rings[0][0]).toEqual([-12.98, -38.49]);
  });

  it('hydrates boundary from the official FeatureServer declared on location metadata', async () => {
    const { state, city } = createStateCityDistrict();
    const district = buildLocation({
      id: 'district-nordeste',
      parent_id: city.id,
      type: LocationType.DISTRICT,
      slug: 'nordeste-de-amaralina',
      name: 'Nordeste de Amaralina',
      geographic_path: '/br/ba/salvador/nordeste-de-amaralina',
      metadata: {
        center_latitude: -13.006,
        center_longitude: -38.459,
        source_url:
          'https://services6.arcgis.com/demo/arcgis/rest/services/bairros/FeatureServer/0',
        source_object_id: 112,
      },
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        features: [
          {
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-38.46, -13.01],
                  [-38.45, -13.01],
                  [-38.45, -13],
                  [-38.46, -13.01],
                ],
              ],
            },
          },
        ],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const service = createService([state, city, district]);
    const result = await service.getNeighborhoodBounds({
      neighborhood: 'Nordeste de Amaralina',
      city: 'Salvador',
      state: 'BA',
      locationId: district.id,
    });

    expect(result.center).toEqual([-13.006, -38.459]);
    expect(result.rings).toHaveLength(1);
    expect(result.rings[0][0]).toEqual([-13.01, -38.46]);

    const firstCall = fetchMock.mock.calls[0] as unknown as [string];
    const requestUrl = new URL(firstCall[0]);
    expect(requestUrl.searchParams.get('where')).toBe('OBJECTID = 112');
    expect(requestUrl.searchParams.get('f')).toBe('geojson');
  });

  it('does not invent a boundary when only a canonical center exists', async () => {
    const { state, city, district } = createStateCityDistrict();
    const centeredDistrict = {
      ...district,
      metadata: { center_latitude: -12.98, center_longitude: -38.49 },
    };

    const service = createService([state, city, centeredDistrict]);
    const result = await service.getNeighborhoodBounds({
      neighborhood: 'Rio Vermelho',
      city: 'Salvador',
      state: 'BA',
      locationId: centeredDistrict.id,
    });

    expect(result.rings).toEqual([]);
    expect(result.center).toEqual([-12.98, -38.49]);
  });

  it('uses parent center when district lacks its own boundary and center metadata', async () => {
    const { state, city } = createStateCityDistrict();
    const district = buildLocation({
      id: 'district-pituba',
      parent_id: city.id,
      type: LocationType.DISTRICT,
      slug: 'pituba',
      name: 'Pituba',
      geographic_path: '/br/ba/salvador/pituba',
    });

    const service = createService([state, city, district]);
    const result = await service.getNeighborhoodBounds({
      neighborhood: 'Pituba',
      city: 'Salvador',
      state: 'Bahia',
    });

    expect(result.rings).toEqual([]);
    expect(result.center).toEqual([-12.9714, -38.5124]);
  });
});
