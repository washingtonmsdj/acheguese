import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBusinessesActionHandler } from '../SearchBusinessesActionHandler';
import type { AIIntent, AIActionContext } from '../../domain/types';

// Mock dos serviços
vi.mock('@/core/business', () => ({
  BusinessService: {
    getBusinessesList: vi.fn(),
    getBusinessesByIds: vi.fn(),
  },
  BusinessUrlService: {
    getShareUrl: vi.fn((ctx) => `/empresas/${ctx.slug}`),
  },
  hasGastronomyProfile: vi.fn(),
}));

vi.mock('@/core/verticals/gastronomy', () => ({
  GastronomyUrlService: {
    getCanonicalUrl: vi.fn((ctx) => `/gastronomia/${ctx.slug}`),
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
    const { BusinessService } = await import('@/core/business');
    
    (BusinessService.getBusinessesList as any).mockResolvedValue({
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
    const { spatialSearchService } = await import('@/core/geospatial');
    const { BusinessService } = await import('@/core/business');

    mockContext.coordinates = { latitude: -12.9977, longitude: -38.4502 };

    (spatialSearchService.searchHybrid as any).mockResolvedValue([
      {
        id: '1',
        name: 'Pizzaria Central',
        distance_meters: 500,
      },
    ]);

    (BusinessService.getBusinessesByIds as any).mockResolvedValue([
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

  it('deve usar URL de gastronomia quando negócio tem perfil gastronômico', async () => {
    const { BusinessService, hasGastronomyProfile } = await import('@/core/business');
    
    (hasGastronomyProfile as any).mockResolvedValue(true);
    
    (BusinessService.getBusinessesList as any).mockResolvedValue({
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

    expect(results[0].url).toContain('/gastronomia/');
  });

  it('deve usar URL premium quando negócio é premium', async () => {
    const { BusinessService, hasGastronomyProfile } = await import('@/core/business');
    
    (hasGastronomyProfile as any).mockResolvedValue(false);
    
    (BusinessService.getBusinessesList as any).mockResolvedValue({
      businesses: [
        {
          id: '1',
          name: 'Empresa Premium',
          category: 'servicos',
          slug: 'empresa-premium',
          geographic_path: 'ba/salvador/pituba',
          is_premium: true,
          rating: 5.0,
        },
      ],
    });

    const results = await handler.execute(mockIntent, mockContext);

    expect(results[0].url).toContain('/empresas/');
  });

  it('deve fazer fallback quando busca geoespacial falhar', async () => {
    const { spatialSearchService } = await import('@/core/geospatial');
    const { BusinessService } = await import('@/core/business');

    mockContext.coordinates = { latitude: -12.9977, longitude: -38.4502 };

    (spatialSearchService.searchHybrid as any).mockRejectedValue(
      new Error('RPC error: type mismatch')
    );

    (BusinessService.getBusinessesList as any).mockResolvedValue({
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
