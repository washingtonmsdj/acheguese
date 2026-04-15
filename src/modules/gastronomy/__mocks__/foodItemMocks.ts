/**
 * DEV ONLY
 * Mock food catalog for local development.
 *
 * Shape mirrors public runtime food cards and keeps canonical territory paths.
 */

export interface MockFoodItem {
  id: string;
  business_data_id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image_url: string;
  category: string;
  tags: string[];
  business_name: string;
  business_slug: string;
  business_cuisine: string;
  business_rating: number;
  business_neighborhood: string;
  business_geographic_path: string;
  business_is_open: boolean;
  business_delivery_enabled: boolean;
  business_takeout_enabled: boolean;
  business_delivery_time_min?: number;
  business_delivery_time_max?: number;
  business_delivery_fee?: number;
  is_featured: boolean;
  is_promotion: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  is_gluten_free: boolean;
  orders_count: number;
}

function toCanonicalGeoPath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (withSlash.startsWith('/br/')) return withSlash;
  return `/br${withSlash}`;
}

function createFoodItem(item: Omit<MockFoodItem, 'business_data_id'> & { business_data_id?: string }): MockFoodItem {
  const businessDataId = item.business_data_id || item.business_id;
  return {
    ...item,
    business_data_id: businessDataId,
    business_id: businessDataId,
    business_geographic_path: toCanonicalGeoPath(item.business_geographic_path),
  };
}

export const MOCK_FOOD_ITEMS: MockFoodItem[] = [
  createFoodItem({
    id: 'food-1',
    business_id: 'mock-biz-cantina',
    name: 'Fettuccine Alfredo',
    description: 'Massa fresca com molho cremoso de parmesao.',
    price: 42.9,
    image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400',
    category: 'massas',
    tags: ['massa', 'italiana', 'vegetariano'],
    business_name: 'Cantina da Nonna',
    business_slug: 'cantina-da-nonna',
    business_cuisine: 'italiana',
    business_rating: 4.8,
    business_neighborhood: 'Pituba',
    business_geographic_path: '/ba/salvador/pituba',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 35,
    business_delivery_time_max: 55,
    business_delivery_fee: 7.99,
    is_featured: true,
    is_promotion: false,
    is_vegetarian: true,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 342,
  }),
  createFoodItem({
    id: 'food-2',
    business_id: 'mock-biz-cantina',
    name: 'Lasanha Bolonhesa',
    description: 'Camadas de massa, ragu de carne e bechamel.',
    price: 48.9,
    image_url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400',
    category: 'massas',
    tags: ['massa', 'italiana', 'carne'],
    business_name: 'Cantina da Nonna',
    business_slug: 'cantina-da-nonna',
    business_cuisine: 'italiana',
    business_rating: 4.8,
    business_neighborhood: 'Pituba',
    business_geographic_path: '/ba/salvador/pituba',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 35,
    business_delivery_time_max: 55,
    business_delivery_fee: 7.99,
    is_featured: true,
    is_promotion: false,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 510,
  }),
  createFoodItem({
    id: 'food-3',
    business_id: 'mock-biz-cantina',
    name: 'Tiramisu',
    description: 'Sobremesa italiana com cafe e mascarpone.',
    price: 22.9,
    original_price: 28.9,
    image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    category: 'doces',
    tags: ['sobremesa', 'italiana', 'cafe'],
    business_name: 'Cantina da Nonna',
    business_slug: 'cantina-da-nonna',
    business_cuisine: 'italiana',
    business_rating: 4.8,
    business_neighborhood: 'Pituba',
    business_geographic_path: '/ba/salvador/pituba',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 35,
    business_delivery_time_max: 55,
    business_delivery_fee: 7.99,
    is_featured: false,
    is_promotion: true,
    is_vegetarian: true,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 280,
  }),
  createFoodItem({
    id: 'food-4',
    business_id: 'mock-biz-burger',
    name: 'Smash Burger Duplo',
    description: 'Dois blends smash, cheddar e bacon.',
    price: 34.9,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    category: 'hamburguer',
    tags: ['burger', 'carne', 'cheddar'],
    business_name: 'Burger House',
    business_slug: 'burger-house',
    business_cuisine: 'hamburgueria',
    business_rating: 4.6,
    business_neighborhood: 'Barra',
    business_geographic_path: '/ba/salvador/barra',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 20,
    business_delivery_time_max: 35,
    business_delivery_fee: 5.99,
    is_featured: true,
    is_promotion: false,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 890,
  }),
  createFoodItem({
    id: 'food-5',
    business_id: 'mock-biz-burger',
    name: 'Burger Vegano',
    description: 'Burger plant based com molho de ervas.',
    price: 38.9,
    image_url: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400',
    category: 'hamburguer',
    tags: ['burger', 'vegano', 'plant-based'],
    business_name: 'Burger House',
    business_slug: 'burger-house',
    business_cuisine: 'hamburgueria',
    business_rating: 4.6,
    business_neighborhood: 'Barra',
    business_geographic_path: '/ba/salvador/barra',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 20,
    business_delivery_time_max: 35,
    business_delivery_fee: 5.99,
    is_featured: false,
    is_promotion: false,
    is_vegetarian: true,
    is_vegan: true,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 145,
  }),
  createFoodItem({
    id: 'food-6',
    business_id: 'mock-biz-sushi',
    name: 'Combinado Premium 30 pecas',
    description: 'Combinado com sashimis, nigiris e uramakis.',
    price: 89.9,
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    category: 'japonesa',
    tags: ['sushi', 'sashimi', 'combinado'],
    business_name: 'Sushi Kento',
    business_slug: 'sushi-kento',
    business_cuisine: 'japonesa',
    business_rating: 4.9,
    business_neighborhood: 'Itaigara',
    business_geographic_path: '/ba/salvador/itaigara',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 45,
    business_delivery_time_max: 70,
    business_delivery_fee: 12.99,
    is_featured: true,
    is_promotion: false,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: true,
    orders_count: 620,
  }),
  createFoodItem({
    id: 'food-7',
    business_id: 'mock-biz-pizza',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mozzarella e manjericao.',
    price: 44.9,
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    category: 'pizza',
    tags: ['pizza', 'margherita'],
    business_name: 'Pizza do Forno',
    business_slug: 'pizza-do-forno',
    business_cuisine: 'pizzaria',
    business_rating: 4.4,
    business_neighborhood: 'Rio Vermelho',
    business_geographic_path: '/ba/salvador/rio-vermelho',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 30,
    business_delivery_time_max: 50,
    business_delivery_fee: 4.99,
    is_featured: true,
    is_promotion: false,
    is_vegetarian: true,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 730,
  }),
  createFoodItem({
    id: 'food-8',
    business_id: 'mock-biz-pizza',
    name: 'Pizza Calabresa Especial',
    description: 'Calabresa, cebola roxa e oregano.',
    price: 39.9,
    original_price: 49.9,
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    category: 'pizza',
    tags: ['pizza', 'calabresa', 'promocao'],
    business_name: 'Pizza do Forno',
    business_slug: 'pizza-do-forno',
    business_cuisine: 'pizzaria',
    business_rating: 4.4,
    business_neighborhood: 'Rio Vermelho',
    business_geographic_path: '/ba/salvador/rio-vermelho',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 30,
    business_delivery_time_max: 50,
    business_delivery_fee: 4.99,
    is_featured: false,
    is_promotion: true,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 590,
  }),
  createFoodItem({
    id: 'food-9',
    business_id: 'mock-biz-acai',
    name: 'Acai Tradicional 500ml',
    description: 'Acai com banana, granola e leite em po.',
    price: 18.9,
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400',
    category: 'acai',
    tags: ['acai', 'sobremesa', 'frio'],
    business_name: 'Acai da Terra',
    business_slug: 'acai-da-terra',
    business_cuisine: 'sorveteria',
    business_rating: 4.7,
    business_neighborhood: 'Ondina',
    business_geographic_path: '/ba/salvador/ondina',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 15,
    business_delivery_time_max: 30,
    business_delivery_fee: 3.99,
    is_featured: true,
    is_promotion: false,
    is_vegetarian: true,
    is_vegan: true,
    is_spicy: false,
    is_gluten_free: true,
    orders_count: 410,
  }),
  createFoodItem({
    id: 'food-10',
    business_id: 'mock-biz-cafe',
    name: 'Cappuccino Italiano',
    description: 'Cafe espresso com leite vaporizado e canela.',
    price: 12.9,
    image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    category: 'cafe',
    tags: ['cafe', 'bebida-quente'],
    business_name: 'Cafe e Brisa',
    business_slug: 'cafe-brisa',
    business_cuisine: 'cafeteria',
    business_rating: 4.3,
    business_neighborhood: 'Graca',
    business_geographic_path: '/ba/salvador/graca',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 25,
    business_delivery_time_max: 40,
    business_delivery_fee: 4.99,
    is_featured: false,
    is_promotion: false,
    is_vegetarian: true,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: true,
    orders_count: 188,
  }),
  createFoodItem({
    id: 'food-11',
    business_id: 'mock-biz-cafe',
    name: 'Cheesecake de Frutas Vermelhas',
    description: 'Cheesecake cremoso com calda artesanal.',
    price: 19.9,
    original_price: 24.9,
    image_url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400',
    category: 'doces',
    tags: ['doce', 'sobremesa'],
    business_name: 'Cafe e Brisa',
    business_slug: 'cafe-brisa',
    business_cuisine: 'cafeteria',
    business_rating: 4.3,
    business_neighborhood: 'Graca',
    business_geographic_path: '/ba/salvador/graca',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 25,
    business_delivery_time_max: 40,
    business_delivery_fee: 4.99,
    is_featured: true,
    is_promotion: true,
    is_vegetarian: true,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: false,
    orders_count: 246,
  }),
  createFoodItem({
    id: 'food-12',
    business_id: 'mock-biz-marmita',
    name: 'Marmita Executiva de Frango',
    description: 'Frango grelhado, arroz, feijao e salada.',
    price: 22.9,
    image_url: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400',
    category: 'marmita',
    tags: ['almoco', 'caseiro', 'pf'],
    business_name: 'Marmitex da Vovo',
    business_slug: 'marmitex-da-vovo',
    business_cuisine: 'regional',
    business_rating: 4.6,
    business_neighborhood: 'Brotas',
    business_geographic_path: '/ba/salvador/brotas',
    business_is_open: true,
    business_delivery_enabled: true,
    business_takeout_enabled: true,
    business_delivery_time_min: 20,
    business_delivery_time_max: 35,
    business_delivery_fee: 2.99,
    is_featured: false,
    is_promotion: false,
    is_vegetarian: false,
    is_vegan: false,
    is_spicy: false,
    is_gluten_free: true,
    orders_count: 620,
  }),
];

export function getMostOrderedItems(limit = 8): MockFoodItem[] {
  return [...MOCK_FOOD_ITEMS]
    .sort((a, b) => b.orders_count - a.orders_count)
    .slice(0, limit);
}

export function getPromotionItems(): MockFoodItem[] {
  return MOCK_FOOD_ITEMS.filter((item) => item.is_promotion);
}

export function getFeaturedItems(limit = 6): MockFoodItem[] {
  return MOCK_FOOD_ITEMS.filter((item) => item.is_featured).slice(0, limit);
}

export function getItemsByCategory(category: string): MockFoodItem[] {
  return MOCK_FOOD_ITEMS.filter(
    (item) =>
      item.category === category ||
      item.tags.includes(category) ||
      item.business_cuisine === category,
  );
}

export function getOpenNowItems(): MockFoodItem[] {
  return MOCK_FOOD_ITEMS.filter((item) => item.business_is_open);
}

export function getSweetsAndCoffeeItems(): MockFoodItem[] {
  return MOCK_FOOD_ITEMS.filter(
    (item) =>
      ['doces', 'cafe'].includes(item.category) ||
      item.tags.some((tag) => ['sobremesa', 'bolo', 'cafe', 'doce'].includes(tag)),
  );
}

export function getLunchItems(): MockFoodItem[] {
  return MOCK_FOOD_ITEMS.filter(
    (item) =>
      ['marmita', 'pratos-principais'].includes(item.category) ||
      item.tags.some((tag) => ['almoco', 'pf', 'caseiro'].includes(tag)),
  );
}

export function searchFoodItems(query: string): MockFoodItem[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return MOCK_FOOD_ITEMS;
  }

  return MOCK_FOOD_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.tags.some((tag) => tag.includes(normalizedQuery)) ||
      item.business_name.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery),
  );
}
