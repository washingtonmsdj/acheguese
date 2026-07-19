import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBusinessesActionHandler } from '../SearchBusinessesActionHandler';
import type { AIActionContext, AIIntent } from '../../domain/types';
import { BusinessService } from '@/core/business';
import { spatialSearchService } from '@/core/geospatial';

vi.mock('@/core/business', () => ({
  BusinessService: {
    getBusinessesList: vi.fn(),
    getBusinessesByIds: vi.fn(),
  },
  BusinessUrlService: {
    getCanonicalUrl: vi.fn((ctx) => `/empresas/ba/salvador/pituba/${ctx.slug}`),
  },
}));

vi.mock('@/core/geospatial', () => ({
  spatialSearchService: {
    searchHybrid: vi.fn(),
  },
}));

describe('SearchBusinessesActionHandler', () => {
  let handler: SearchBusinessesActionHandler;
  let mockIntent: AIIntent;
  let mockContext: AIActionContext;

  beforeEach(() => {
    handler = new SearchBusinessesActionHandler();
    vi.clearAllMocks();

    mockIntent = {
      type: 'business_search',
      normalizedQuery: 'pizzaria',
      filters: {
        category: 'restaurante',
      },
    } as AIIntent;

    mockContext = {
      locationId: '384add59-4e53-489d-a7b5-97dea2b3f442',
      territoryFilter: {
        scope: 'location',
        location_id: '384add59-4e53-489d-a7b5-97dea2b3f442',
      },
    } as AIActionContext;
  });

  it('deve buscar empresas sem coordenadas', async () => {
    vi.mocked(BusinessService.getBusinessesList).mockResolvedValue({
      businesses: [
        {
          id: '1',
          name: 'Pizzaria Central',
          category: 'restaurante',
          slug: 'pizzaria-central',
          geographic_path: 'ba/salvador/pituba',
          is_premium: false,
          rating: 4.5,
        },
      ],
    });

    const results = await handler.execute(mockIntent, mockContext);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Pizzaria Central');
    expect(BusinessService.getBusinessesList).toHaveBeenCalledWith({
      searchQuery: 'pizzaria',
      category: 'restaurante',
      filter: mockContext.territoryFilter,
      pageSize: 20,
      sortBy: 'rating',
    });
  });

  it('deve usar busca geoespacial quando houver coordenadas', async () => {
    mockContext.coordinates = { latitude: -12.9977, longitude: -38.4502 };

    vi.mocked(spatialSearchService.searchHybrid).mockResolvedValue([
      {
        id: '1',
        name: 'Pizzaria Central',
        distance_meters: 500,
      },
    ]);

    vi.mocked(BusinessService.getBusinessesByIds).mockResolvedValue([
      {
        id: '1',
        name: 'Pizzaria Central',
        category: 'restaurante',
        slug: 'pizzaria-central',
        geographic_path: 'ba/salvador/pituba',
        is_premium: false,
        rating: 4.5,
      },
    ]);

    const results = await handler.execute(mockIntent, mockContext);

    expect(spatialSearchService.searchHybrid).toHaveBeenCalledWith({
      center: mockContext.coordinates,
      radiusKm: 8,
      entityType: 'business',
      locationIds: [mockContext.locationId],
      limit: 30,
    });
    expect(results).toHaveLength(1);
    expect(results[0].distanceMeters).toBe(500);
  });

  it('deve usar URL publica canonica para negocio gastronomico', async () => {
    vi.mocked(BusinessService.getBusinessesList).mockResolvedValue({
      businesses: [
        {
          id: '1',
          name: 'Restaurante Gourmet',
          category: 'restaurante',
          slug: 'restaurante-gourmet',
          geographic_path: 'ba/salvador/pituba',
          is_premium: false,
          rating: 4.8,
        },
      ],
    });

    const results = await handler.execute(mockIntent, mockContext);

    expect(results[0].url).toBe('/empresas/ba/salvador/pituba/restaurante-gourmet');
  });

  it('deve manter URL publica canonica mesmo quando negocio e premium', async () => {
    vi.mocked(BusinessService.getBusinessesList).mockResolvedValue({
      businesses: [
        {
          id: '1',
          name: 'Empresa Premium',
          category: 'servicos',
          slug: 'empresa-premium',
          geographic_path: 'ba/salvador/pituba',
          is_premium: true,
          rating: 5,
        },
      ],
    });

    const results = await handler.execute(mockIntent, mockContext);

    expect(results[0].url).toBe('/empresas/ba/salvador/pituba/empresa-premium');
  });

  it('deve fazer fallback quando busca geoespacial falhar', async () => {
    mockContext.coordinates = { latitude: -12.9977, longitude: -38.4502 };

    vi.mocked(spatialSearchService.searchHybrid).mockRejectedValue(
      new Error('RPC error: type mismatch'),
    );

    vi.mocked(BusinessService.getBusinessesList).mockResolvedValue({
      businesses: [
        {
          id: '1',
          name: 'Pizzaria Central',
          category: 'restaurante',
          slug: 'pizzaria-central',
          geographic_path: 'ba/salvador/pituba',
          is_premium: false,
          rating: 4.5,
        },
      ],
    });

    const results = await handler.execute(mockIntent, mockContext);

    expect(results).toHaveLength(1);
    expect(BusinessService.getBusinessesList).toHaveBeenCalled();
  });
});
