/**
 * DEV ONLY
 * Mock data for gastronomy detail page (menu, reviews, promotions).
 */

import type { MenuWithCategories, MenuPromotion } from '../types/menu';
import { MOCK_GASTRONOMY_BUSINESSES } from './gastronomyMocks';

function resolveMockBusiness(businessIdOrSlug: string) {
  return (
    MOCK_GASTRONOMY_BUSINESSES.find(
      (business) =>
        business.business_data_id === businessIdOrSlug ||
        business.id === businessIdOrSlug ||
        business.slug === businessIdOrSlug,
    ) || null
  );
}

export function getMockMenuForBusiness(businessIdOrSlug: string): MenuWithCategories {
  const business = resolveMockBusiness(businessIdOrSlug);
  const businessDataId = business?.business_data_id || businessIdOrSlug;
  const cuisineType = business?.gastronomy_profile?.cuisine_type || 'brasileira';

  const categoriesByCuisine: Record<string, Array<{ name: string; items: Array<{ name: string; description: string; base_price: number; is_vegetarian?: boolean; is_vegan?: boolean; is_gluten_free?: boolean; is_spicy?: boolean; is_featured?: boolean; image_url?: string }> }>> = {
    italiana: [
      {
        name: 'Massas',
        items: [
          { name: 'Fettuccine Alfredo', description: 'Massa fresca com molho de parmesao.', base_price: 42.9, is_vegetarian: true, is_featured: true, image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400' },
          { name: 'Lasanha Bolonhesa', description: 'Ragu de carne com bechamel.', base_price: 48.9, is_featured: true, image_url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400' },
        ],
      },
      {
        name: 'Sobremesas',
        items: [
          { name: 'Tiramisu', description: 'Mascarpone, cafe e cacau.', base_price: 22.9, is_vegetarian: true, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
        ],
      },
    ],
    hamburgueria: [
      {
        name: 'Burgers',
        items: [
          { name: 'Smash Burger Duplo', description: 'Dois blends smash com cheddar.', base_price: 34.9, is_featured: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
          { name: 'Burger Vegano', description: 'Plant based com molho de ervas.', base_price: 38.9, is_vegan: true, is_vegetarian: true, image_url: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400' },
        ],
      },
      {
        name: 'Acompanhamentos',
        items: [
          { name: 'Onion Rings', description: 'Aneis de cebola crocantes.', base_price: 19.9, is_vegetarian: true, image_url: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400' },
        ],
      },
    ],
    japonesa: [
      {
        name: 'Combinados',
        items: [
          { name: 'Combinado Premium 30 pecas', description: 'Sashimis, nigiris e uramakis.', base_price: 89.9, is_gluten_free: true, is_featured: true, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400' },
          { name: 'Hot Roll de Salmao', description: 'Uramaki empanado e frito.', base_price: 42.9, is_spicy: true, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400' },
        ],
      },
    ],
    default: [
      {
        name: 'Destaques',
        items: [
          { name: 'Prato Especial da Casa', description: 'Receita principal do restaurante.', base_price: 45.9, is_featured: true, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
          { name: 'Combo Familia', description: 'Opcao para compartilhar.', base_price: 89.9, image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400' },
        ],
      },
      {
        name: 'Bebidas',
        items: [
          { name: 'Suco Natural 500ml', description: 'Sabores do dia.', base_price: 10.9, is_vegetarian: true, is_vegan: true, is_gluten_free: true },
          { name: 'Agua Mineral', description: 'Com ou sem gas.', base_price: 5.9, is_vegetarian: true, is_vegan: true, is_gluten_free: true },
        ],
      },
    ],
  };

  const categoryTemplate = categoriesByCuisine[cuisineType] || categoriesByCuisine.default;

  return {
    id: `mock-menu-${businessDataId}`,
    business_id: businessDataId,
    name: 'Cardapio Mock (DEV)',
    description: 'Cardapio de desenvolvimento para validar UI/UX.',
    is_active: true,
    display_order: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    categories: categoryTemplate.map((category, categoryIndex) => ({
      id: `mock-cat-${businessDataId}-${categoryIndex + 1}`,
      menu_id: `mock-menu-${businessDataId}`,
      name: category.name,
      display_order: categoryIndex + 1,
      is_available: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      items: category.items.map((item, itemIndex) => ({
        id: `mock-item-${businessDataId}-${categoryIndex + 1}-${itemIndex + 1}`,
        category_id: `mock-cat-${businessDataId}-${categoryIndex + 1}`,
        name: item.name,
        description: item.description,
        base_price: item.base_price,
        image_url: item.image_url,
        is_vegetarian: item.is_vegetarian ?? false,
        is_vegan: item.is_vegan ?? false,
        is_gluten_free: item.is_gluten_free ?? false,
        is_lactose_free: false,
        is_spicy: item.is_spicy ?? false,
        is_available: true,
        is_featured: item.is_featured ?? false,
        display_order: itemIndex + 1,
        metadata: {},
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      })),
    })),
  };
}

export interface MockReview {
  id: string;
  author_name: string;
  author_avatar?: string;
  rating: number;
  comment: string;
  date: string;
  photos?: string[];
}

export function getMockReviews(_businessId: string): MockReview[] {
  return [
    {
      id: 'review-1',
      author_name: 'Maria Silva',
      rating: 5,
      comment: 'Comida excelente e entrega no tempo esperado.',
      date: '2026-03-28',
    },
    {
      id: 'review-2',
      author_name: 'Joao Santos',
      rating: 4,
      comment: 'Boa relacao custo-beneficio e porcao bem servida.',
      date: '2026-03-25',
    },
    {
      id: 'review-3',
      author_name: 'Ana Oliveira',
      rating: 5,
      comment: 'Pedido chegou quente e sem erros.',
      date: '2026-03-20',
      photos: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'],
    },
  ];
}

export function getMockPromotions(businessId: string): MenuPromotion[] {
  return [
    {
      id: `promo-${businessId}-1`,
      business_id: businessId,
      title: 'Happy Hour - 2 por 1 em drinks selecionados',
      description: 'Valido de terca a quinta, das 17h as 19h.',
      discount_type: 'buy_x_get_y',
      discount_value: 1,
      rules: {},
      applicable_items: [],
      valid_from: '2026-03-01T00:00:00.000Z',
      valid_until: '2026-04-30T23:59:59.000Z',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: `promo-${businessId}-2`,
      business_id: businessId,
      title: '15% OFF no primeiro pedido via app',
      description: 'Cupom PRIMEIRA15 para novos clientes.',
      discount_type: 'percentage',
      discount_value: 15,
      rules: {},
      applicable_items: [],
      valid_from: '2026-01-01T00:00:00.000Z',
      valid_until: '2026-12-31T23:59:59.000Z',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ];
}
