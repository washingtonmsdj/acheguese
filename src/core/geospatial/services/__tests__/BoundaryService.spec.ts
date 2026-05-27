import { describe, expect, it, vi } from 'vitest';
import {
  BoundaryServiceClass,
  type BoundaryServiceDeps,
} from '../BoundaryService';
import {
  type ILocationRepository,
  type Location,
} from '@/core/location';
import { LocationStatus, LocationType } from '@/core/location/types';

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

function createSupabaseStub(boundaryRows: Record<string, unknown>) {
  const rowsByLocationId = new Map<string, unknown>(Object.entries(boundaryRows));
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn((_: string, locationId: string) => ({
          maybeSingle: vi.fn(async () => ({
            data: rowsByLocationId.get(locationId) ?? null,
            error: null,
          })),
        })),
      })),
    })),
  };
}

function createService(
  locations: Location[],
  boundaryRows: Record<string, unknown> = {},
  customBoundariesEnabled = false,
): BoundaryServiceClass {
  const deps: BoundaryServiceDeps = {
    locationRepository: createRepository(locations),
    supabaseClient: createSupabaseStub(boundaryRows) as BoundaryServiceDeps['supabaseClient'],
    locationCacheTtlMs: 60_000,
    customBoundariesEnabled,
  };

  return new BoundaryServiceClass(deps);
}

describe('BoundaryService', () => {
  it('uses stored custom polygon when available', async () => {
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
      metadata: { center_latitude: -12.97, center_longitude: -38.5 },
    });
    const district = buildLocation({
      id: 'district-rio-vermelho',
      parent_id: city.id,
      type: LocationType.DISTRICT,
      slug: 'rio-vermelho',
      name: 'Rio Vermelho',
      geographic_path: '/br/ba/salvador/rio-vermelho',
    });

    const service = createService(
      [state, city, district],
      {
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

  it('falls back to canonical location center when polygon is absent', async () => {
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

    const service = createService([state, city]);
    const result = await service.getCityBounds({ city: 'Salvador', state: 'BA' });

    expect(result.rings).toEqual([]);
    expect(result.center).toEqual([-12.9714, -38.5124]);
  });

  it('uses parent center when district lacks its own boundary and center metadata', async () => {
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
