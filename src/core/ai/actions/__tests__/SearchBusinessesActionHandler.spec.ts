import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBusinessesActionHandler } from '../SearchBusinessesActionHandler';
import type { AIActionContext, AIIntent } from '../../domain/types';
import { BusinessService } from '@/core/business';
import type { Business } from '@/core/business';
import { spatialSearchService } from '@/core/geospatial';
import type { SpatialSearchResult } from '@/core/geospatial';

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

function buildBusiness(overrides: Partial<Business> = {}): Business {
  return {
    id: '1',
    profile_id: 'profile-1',
    name: 'Pizzaria Central',
    description: 'Sabor autêntico',
    category: 'restaurante' as Business['category'],
    location_id: 'loc-1',
    slug: 'pizzaria-central',
    geographic_path: 'ba/salvador/pituba',
    tem_delivery: true,
    aceita_cartao: true,
    aceita_pix: true,
    status: 'active',
    rating: 4.5,
    total_reviews: 10,
    total_products: 0,
    is_premium: false,
    is_verified: true,
    can_post_vagas: false,
    formas_pagamento: [],
    especialidades: [],
    facilidades: [],
    modos_atendimento: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildSpatialResult(
  overrides: Partial<SpatialSearchResult> = {},
): SpatialSearchResult {
  return {
    id: '1',
    name: 'Pizzaria Central',
    latitude: -12.9977,
    longitude: -38.4502,
    ...overrides,
  };
}

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
      businesses: [buildBusiness()],
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
      buildSpatialResult({ distance_meters: 500 }),
    ]);

    vi.mocked(BusinessService.getBusinessesByIds).mockResolvedValue([
      buildBusiness(),
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
      businesses: [buildBusiness({ name: 'Restaurante Gourmet', slug: 'restaurante-gourmet', rating: 4.8 })],
    });

    const results = await handler.execute(mockIntent, mockContext);

    expect(results[0].url).toBe('/empresas/ba/salvador/pituba/restaurante-gourmet');
  });

  it('deve manter URL publica canonica mesmo quando negocio e premium', async () => {
    vi.mocked(BusinessService.getBusinessesList).mockResolvedValue({
      businesses: [
        buildBusiness({
          name: 'Empresa Premium',
          category: 'servicos' as Business['category'],
          slug: 'empresa-premium',
          is_premium: true,
          rating: 5,
        }),
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
      businesses: [buildBusiness()],
    });

    const results = await handler.execute(mockIntent, mockContext);

    expect(results).toHaveLength(1);
    expect(BusinessService.getBusinessesList).toHaveBeenCalled();
  });
});
