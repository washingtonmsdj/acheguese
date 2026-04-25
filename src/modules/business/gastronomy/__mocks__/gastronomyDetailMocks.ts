/**
 * DEV ONLY
 * Mock data for gastronomy detail page (menu, reviews, promotions).
 */

import type { MenuItemWithRelations, MenuWithCategories, MenuPromotion } from '../types/menu';
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

function buildPizzaMockItems(businessDataId: string, categoryId: string): MenuItemWithRelations[] {
  const timestamps = {
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };

  return [
    {
      id: `mock-item-${businessDataId}-pizza-montavel`,
      category_id: categoryId,
      name: 'Pizza Montável',
      description: 'Escolha tamanho, 1 a 4 sabores, borda e massa.',
      base_price: 0,
      image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_lactose_free: false,
      is_spicy: false,
      is_available: true,
      is_featured: true,
      display_order: 1,
      metadata: {},
      variants: [],
      addons: [
        {
          id: `mock-addon-${businessDataId}-queijo-extra`,
          item_id: `mock-item-${businessDataId}-pizza-montavel`,
          name: 'Queijo extra',
          price: 6,
          max_quantity: 2,
          is_available: true,
          display_order: 1,
          ...timestamps,
        },
      ],
      ...timestamps,
    },
    {
      id: `mock-item-${businessDataId}-pizza-calabresa`,
      category_id: categoryId,
      name: 'Pizza Calabresa Especial',
      description: 'Pizza pronta de calabresa, cebola roxa e oregano.',
      base_price: 39.9,
      image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_lactose_free: false,
      is_spicy: false,
      is_available: true,
      is_featured: false,
      display_order: 2,
      metadata: {},
      variants: [],
      addons: [],
      ...timestamps,
    },
  ];
}

function buildMockCategory(
  menuId: string,
  businessDataId: string,
  categoryIndex: number,
  name: string,
  items: Array<{ name: string; description: string; base_price: number; is_vegetarian?: boolean; is_vegan?: boolean; is_gluten_free?: boolean; is_spicy?: boolean; is_featured?: boolean; image_url?: string }>
) {
  const catId = `mock-cat-${businessDataId}-${categoryIndex}`;
  const timestamps = { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' };
  return {
    id: catId,
    menu_id: menuId,
    name,
    display_order: categoryIndex,
    is_available: true,
    ...timestamps,
    items: items.map((item, itemIndex) => ({
      id: `mock-item-${businessDataId}-${categoryIndex}-${itemIndex}`,
      category_id: catId,
      name: item.name,
      description: item.description,
      base_price: item.base_price,
      image_url: item.image_url ?? null,
      is_vegetarian: item.is_vegetarian ?? false,
      is_vegan: item.is_vegan ?? false,
      is_gluten_free: item.is_gluten_free ?? false,
      is_lactose_free: false,
      is_spicy: item.is_spicy ?? false,
      is_available: true,
      is_featured: item.is_featured ?? false,
      display_order: itemIndex,
      metadata: {},
      ...timestamps,
    })),
  };
}

function buildBellaNapoliMenu(businessDataId: string): MenuWithCategories {
  const menuId = `mock-menu-${businessDataId}`;
  const timestamps = { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' };
  const pizzaCatId = `mock-cat-${businessDataId}-0`;

  return {
    id: menuId,
    business_id: businessDataId,
    name: 'Cardapio Bella Napoli',
    description: 'Pizzas artesanais, bebidas e sobremesas italianas.',
    is_active: true,
    display_order: 1,
    ...timestamps,
    categories: [
      {
        id: pizzaCatId,
        menu_id: menuId,
        name: 'Pizzas Tradicionais',
        display_order: 0,
        is_available: true,
        ...timestamps,
        items: [
          {
            id: `mock-item-${businessDataId}-pizza-montavel`,
            category_id: pizzaCatId,
            name: 'Pizza Montável',
            description: 'Escolha tamanho, 1 a 4 sabores, borda e massa.',
            base_price: 0,
            image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
            is_vegetarian: false,
            is_vegan: false,
            is_gluten_free: false,
            is_lactose_free: false,
            is_spicy: false,
            is_available: true,
            is_featured: true,
            display_order: 0,
            metadata: {},
            variants: [],
            addons: [
              {
                id: `mock-addon-${businessDataId}-queijo-extra`,
                item_id: `mock-item-${businessDataId}-pizza-montavel`,
                name: 'Queijo extra',
                price: 6,
                max_quantity: 2,
                is_available: true,
                display_order: 0,
                ...timestamps,
              },
            ],
            ...timestamps,
          },
          {
            id: `mock-item-${businessDataId}-0-1`,
            category_id: pizzaCatId,
            name: 'Margherita',
            description: 'Molho de tomate San Marzano, mussarela de búfala e manjericão fresco.',
            base_price: 45.00,
            image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
            is_vegetarian: true,
            is_vegan: false,
            is_gluten_free: false,
            is_lactose_free: false,
            is_spicy: false,
            is_available: true,
            is_featured: true,
            display_order: 1,
            metadata: {},
            variants: [],
            addons: [],
            ...timestamps,
          },
        ],
      },
      buildMockCategory(menuId, businessDataId, 1, 'Pizzas Especiais', [
        { name: 'Quattro Formaggi', description: 'Gorgonzola dolce, parmesão 24 meses, mussarela e provolone.', base_price: 58.00, is_vegetarian: true, is_featured: true, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400' },
        { name: 'Frango com Catupiry', description: 'Frango desfiado caseiro, catupiry original e milho.', base_price: 52.00, is_featured: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
        { name: 'Camarão Tropical', description: 'Camarões ao alho e óleo, abacaxi grelhado e cream cheese.', base_price: 68.00, is_featured: true, image_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400' },
        { name: 'Filé Mignon', description: 'Filé mignon grelhado, cogumelos frescos e queijo brie.', base_price: 72.00, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
      ]),
      buildMockCategory(menuId, businessDataId, 2, 'Pizzas Premium', [
        { name: 'Trufada de Filé', description: 'Filé mignon, cogumelos trufados e queijo gruyère.', base_price: 89.00, is_featured: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
        { name: 'Lagosta Thermidor', description: 'Lagosta fresca ao molho thermidor e parmesão gratinado.', base_price: 98.00, is_featured: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
        { name: 'Burrata e Parma', description: 'Burrata fresca italiana, presunto parma DOP e rúcula.', base_price: 78.00, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
      ]),
      buildMockCategory(menuId, businessDataId, 3, 'Pizzas Doces', [
        { name: 'Nutella com Morango', description: 'Nutella, morangos frescos e avelãs torradas.', base_price: 42.00, is_vegetarian: true, is_featured: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
        { name: 'Banana com Canela', description: 'Banana caramelizada, canela e chocolate branco.', base_price: 38.00, is_vegetarian: true, is_featured: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
        { name: 'Romeu e Julieta', description: 'Goiabada cremosa e queijo minas meia cura.', base_price: 35.00, is_vegetarian: true, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
      ]),
      buildMockCategory(menuId, businessDataId, 4, 'Refrigerantes', [
        { name: 'Coca-Cola Original 350ml', description: 'Lata.', base_price: 6.00 },
        { name: 'Coca-Cola Zero 350ml', description: 'Lata.', base_price: 6.00 },
        { name: 'Guaraná Antarctica 350ml', description: 'Lata.', base_price: 5.50 },
        { name: 'Sprite 350ml', description: 'Lata.', base_price: 5.50 },
        { name: 'Coca-Cola 2L', description: 'Garrafa.', base_price: 15.00, is_featured: true },
      ]),
      buildMockCategory(menuId, businessDataId, 5, 'Sucos e Águas', [
        { name: 'Suco de Laranja Natural', description: 'Copo 300ml - espremido na hora.', base_price: 10.00, is_vegetarian: true, is_vegan: true, is_featured: true },
        { name: 'Suco de Maracujá', description: 'Copo 300ml.', base_price: 9.00, is_vegetarian: true, is_vegan: true },
        { name: 'Água Mineral sem Gás', description: '500ml.', base_price: 4.00, is_vegetarian: true, is_vegan: true },
        { name: 'Limonada Suíça', description: 'Jarra 1L.', base_price: 22.00, is_vegetarian: true, is_vegan: true, is_featured: true },
      ]),
      buildMockCategory(menuId, businessDataId, 6, 'Cervejas', [
        { name: 'Heineken', description: 'Long neck 330ml.', base_price: 12.00, is_featured: true },
        { name: 'Stella Artois', description: 'Long neck 330ml.', base_price: 11.00 },
        { name: 'Corona', description: 'Long neck 330ml.', base_price: 13.00 },
        { name: 'Brahma Duplo Malte', description: 'Long neck 330ml.', base_price: 9.00 },
      ]),
      buildMockCategory(menuId, businessDataId, 7, 'Vinhos', [
        { name: 'Chianti Classico', description: 'Taça 150ml - vinho tinto.', base_price: 28.00, is_featured: true },
        { name: 'Chianti Classico', description: 'Garrafa 750ml - vinho tinto.', base_price: 120.00, is_featured: true },
        { name: 'Prosecco DOCG', description: 'Taça 150ml - espumante italiano.', base_price: 32.00, is_featured: true },
        { name: 'Prosecco DOCG', description: 'Garrafa 750ml - espumante italiano.', base_price: 140.00, is_featured: true },
      ]),
      buildMockCategory(menuId, businessDataId, 8, 'Sobremesas', [
        { name: 'Tiramisù Clássico', description: 'Porção individual com café espresso.', base_price: 22.00, is_vegetarian: true, is_featured: true, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
        { name: 'Panna Cotta', description: 'Com calda de frutas vermelhas.', base_price: 18.00, is_vegetarian: true, is_featured: true, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400' },
        { name: 'Cannoli Siciliano', description: '2 unidades - recheio de ricota e pistache.', base_price: 24.00, is_vegetarian: true, image_url: 'https://images.unsplash.com/photo-1601409751311-cbec055f63e4?w=400' },
        { name: 'Gelato Artesanal', description: '2 bolas - sabores: creme, chocolate, pistache, morango.', base_price: 16.00, is_vegetarian: true, image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400' },
      ]),
    ],
  };
}

export function getMockMenuForBusiness(businessIdOrSlug: string): MenuWithCategories {
  const business = resolveMockBusiness(businessIdOrSlug);
  const businessDataId = business?.business_data_id || businessIdOrSlug;
  const cuisineType = business?.gastronomy_profile?.cuisine_type || 'brasileira';

  // Menu completo para Bella Napoli
  if (businessDataId === 'mock-biz-bella-napoli' || businessIdOrSlug === 'pizzaria-bella-napoli') {
    return buildBellaNapoliMenu(businessDataId);
  }

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
  const menuId = `mock-menu-${businessDataId}`;

  if (cuisineType === 'pizzaria') {
    const pizzaCategoryId = `mock-cat-${businessDataId}-pizzas`;

    return {
      id: menuId,
      business_id: businessDataId,
      name: 'Cardapio Mock Pizzaria (DEV)',
      description: 'Cardapio de desenvolvimento com pizza montavel.',
      is_active: true,
      display_order: 1,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      categories: [
        {
          id: pizzaCategoryId,
          menu_id: menuId,
          name: 'Pizzas',
          display_order: 1,
          is_available: true,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          items: buildPizzaMockItems(businessDataId, pizzaCategoryId),
        },
      ],
    };
  }

  return {
    id: menuId,
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
        image_url: item.image_url ?? null,
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
