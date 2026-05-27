import { describe, expect, it, vi } from 'vitest';
import { GastronomyPublicPreviewService } from '../services/GastronomyPublicPreviewService';
import { GastronomyFacade } from '../services/GastronomyService';

vi.mock('../services/GastronomyService', () => ({
  GastronomyFacade: {
    queries: {
      getGastronomyProfile: vi.fn(async () => ({
        id: 'gp-1',
        business_id: 'business-data-1',
        status: 'active',
      })),
      getFeaturedMenuItems: vi.fn(async () => [
        {
          id: 'item-1',
          name: 'Moqueca',
          description: 'Peixe com leite de coco',
          base_price: 42,
          image_url: '/moqueca.jpg',
          is_featured: true,
          variants: [
            { is_available: true, price_adjustment: -5 },
            { is_available: false, price_adjustment: -20 },
          ],
        },
        {
          id: 'item-2',
          name: 'Acaraje',
          base_price: 18,
          is_featured: true,
          variants: [],
        },
        {
          id: 'item-3',
          name: 'Suco',
          base_price: 9,
          is_featured: true,
          variants: [],
        },
        {
          id: 'item-4',
          name: 'Sobremesa',
          base_price: 15,
          is_featured: true,
          variants: [],
        },
      ]),
      getPublicFoodItems: vi.fn(async () => []),
    },
  },
}));

describe('GastronomyPublicPreviewService', () => {
  it('returns a limited public preview without cart or order details', async () => {
    const preview = await GastronomyPublicPreviewService.getBusinessPreview(
      'profile-id-legacy',
      10,
    );

    expect(preview.businessId).toBe('business-data-1');
    expect(preview.items).toHaveLength(3);
    expect(preview.items[0]).toMatchObject({
      id: 'item-1',
      name: 'Moqueca',
      priceFrom: 37,
      isFeatured: true,
    });
    expect(preview.items[0]).not.toHaveProperty('addons');
    expect(preview.items[0]).not.toHaveProperty('quantity');
  });

  it('returns empty preview when no active gastronomy profile exists', async () => {
    vi.mocked(GastronomyFacade.queries.getGastronomyProfile).mockResolvedValueOnce(null);

    const preview = await GastronomyPublicPreviewService.getBusinessPreview(
      'non-gastronomy-profile',
      3,
    );

    expect(preview.items).toHaveLength(0);
    expect(preview.totalVisibleItems).toBe(0);
  });
});
