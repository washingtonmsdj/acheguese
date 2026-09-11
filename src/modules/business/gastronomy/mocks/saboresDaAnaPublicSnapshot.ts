import type {
  GastronomyBusiness,
  GastronomyProfile,
} from "@/core/business/types/gastronomy";
import type {
  MenuCategory,
  MenuItemWithRelations,
  MenuPromotion,
  MenuWithCategories,
} from "@/core/business/types/gastronomyMenu";
import type { PublicGastronomySnapshot } from "@/core/business/types/publicSnapshots";
import type { Business } from "@/core/business/types/Business";
import catAcaiImage from "@/assets/gastronomy/cat-acai.jpg";
import catCafesImage from "@/assets/gastronomy/cat-cafes.jpg";
import catLanchonetesImage from "@/assets/gastronomy/cat-lanchonetes.jpg";
import catMarmitasImage from "@/assets/gastronomy/cat-marmitas.jpg";
import catRestaurantesImage from "@/assets/gastronomy/cat-restaurantes.jpg";

const MOCK_TIMESTAMP = "2026-01-01T12:00:00.000Z";
const MOCK_BUSINESS_ID = "mock-business-sabores-da-ana";
const MOCK_PROFILE_ID = "mock-profile-sabores-da-ana";
const MOCK_MENU_ID = "mock-menu-sabores-da-ana";

const categoriesSeed = [
  { id: "mock-category-refeicoes", name: "Refeições", displayOrder: 0 },
  { id: "mock-category-bebidas", name: "Bebidas", displayOrder: 1 },
  { id: "mock-category-sobremesas", name: "Sobremesas", displayOrder: 2 },
] as const;

function createMenuItem({
  id,
  categoryId,
  name,
  description,
  price,
  imageUrl,
  displayOrder,
  featured = false,
  available = true,
  vegetarian = false,
  vegan = false,
  ordersCount,
}: {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  displayOrder: number;
  featured?: boolean;
  available?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  ordersCount: number;
}): MenuItemWithRelations {
  return {
    id,
    category_id: categoryId,
    name,
    description,
    base_price: price,
    image_url: imageUrl,
    preparation_time: 25,
    is_vegetarian: vegetarian,
    is_vegan: vegan,
    is_gluten_free: false,
    is_lactose_free: false,
    is_spicy: false,
    is_available: available,
    is_featured: featured,
    display_order: displayOrder,
    metadata: { orders_count: ordersCount },
    created_at: MOCK_TIMESTAMP,
    updated_at: MOCK_TIMESTAMP,
  };
}

const profile: GastronomyProfile = {
  id: MOCK_PROFILE_ID,
  business_id: MOCK_BUSINESS_ID,
  niche_key: "comida-caseira",
  cuisine_type: "Comida caseira",
  cuisine_subtypes: ["Marmitas", "Comida brasileira"],
  price_range: "$$",
  delivery_enabled: true,
  takeout_enabled: true,
  dine_in_enabled: true,
  delivery_fee: 6,
  delivery_time_min: 30,
  delivery_time_max: 45,
  minimum_order: 20,
  accepts_reservations: false,
  has_parking: false,
  has_wifi: false,
  has_accessibility: true,
  has_kids_area: false,
  has_live_music: false,
  status: "active",
  metadata: {},
  created_at: MOCK_TIMESTAMP,
  updated_at: MOCK_TIMESTAMP,
};

const menuCategories: Array<MenuCategory & { items: MenuItemWithRelations[] }> =
  categoriesSeed.map((category) => ({
    id: category.id,
    menu_id: MOCK_MENU_ID,
    name: category.name,
    description:
      category.name === "Refeições"
        ? "Receitas da casa preparadas no bairro."
        : undefined,
    display_order: category.displayOrder,
    is_available: true,
    created_at: MOCK_TIMESTAMP,
    updated_at: MOCK_TIMESTAMP,
    items: [],
  }));

const menuItems = [
  createMenuItem({
    id: "mock-item-prato-do-dia",
    categoryId: categoriesSeed[0].id,
    name: "Prato do dia",
    description: "Arroz, feijão, salada e proteína do dia.",
    price: 24,
    imageUrl: catMarmitasImage,
    displayOrder: 0,
    featured: true,
    ordersCount: 98,
  }),
  createMenuItem({
    id: "mock-item-moqueca-de-peixe",
    categoryId: categoriesSeed[0].id,
    name: "Moqueca de peixe",
    description: "Peixe ao leite de coco, com arroz e farofa.",
    price: 38,
    imageUrl: catRestaurantesImage,
    displayOrder: 1,
    ordersCount: 92,
  }),
  createMenuItem({
    id: "mock-item-opcao-vegetariana",
    categoryId: categoriesSeed[0].id,
    name: "Opção vegetariana",
    description: "Legumes grelhados, arroz integral e salada.",
    price: 22,
    imageUrl: catAcaiImage,
    displayOrder: 2,
    vegetarian: true,
    vegan: true,
    ordersCount: 72,
  }),
  createMenuItem({
    id: "mock-item-suco-maracuja",
    categoryId: categoriesSeed[1].id,
    name: "Suco de maracujá",
    description: "Suco natural de maracujá.",
    price: 8,
    imageUrl: catCafesImage,
    displayOrder: 0,
    ordersCount: 80,
  }),
  createMenuItem({
    id: "mock-item-pudim-caseiro",
    categoryId: categoriesSeed[2].id,
    name: "Pudim caseiro",
    description: "Receita tradicional da Ana.",
    price: 10,
    imageUrl: catLanchonetesImage,
    displayOrder: 0,
    available: false,
    ordersCount: 20,
  }),
];

for (const category of menuCategories) {
  category.items = menuItems.filter((item) => item.category_id === category.id);
}

const menu: MenuWithCategories = {
  id: MOCK_MENU_ID,
  business_id: MOCK_BUSINESS_ID,
  name: "Cardápio Sabores da Ana",
  description: "Comida caseira preparada no bairro.",
  is_active: true,
  display_order: 0,
  created_at: MOCK_TIMESTAMP,
  updated_at: MOCK_TIMESTAMP,
  categories: menuCategories,
};

const business = {
  id: MOCK_PROFILE_ID,
  business_data_id: MOCK_BUSINESS_ID,
  profile_id: MOCK_PROFILE_ID,
  name: "Sabores da Ana",
  description: "Comida caseira feita com cuidado para o dia a dia do bairro.",
  category: "restaurante",
  subcategoria: "Comida caseira",
  phone: "(71) 99999-1111",
  whatsapp: "5571999991111",
  email: "oi@saboresdaana.example",
  location_id: "mock-location-santa-cruz",
  business_address: "Rua da Esperança, 120",
  business_city: "Salvador",
  business_state: "BA",
  business_zip: "41900-000",
  location: {
    name: "Santa Cruz",
    full_name: "Santa Cruz, Salvador - BA",
    geographic_path: "/br/ba/salvador/pituba",
    canonical_lat: -13.004,
    canonical_lng: -38.495,
  },
  address: {
    street: "Rua da Esperança",
    number: "120",
    postal_code: "41900-000",
    latitude: -13.004,
    longitude: -38.495,
  },
  horario_funcionamento: {
    schedules: {
      sunday: { open: "11:00", close: "15:00" },
      monday: { open: "11:00", close: "20:30" },
      tuesday: { open: "11:00", close: "20:30" },
      wednesday: { open: "11:00", close: "20:30" },
      thursday: { open: "11:00", close: "20:30" },
      friday: { open: "11:00", close: "21:00" },
      saturday: { open: "11:00", close: "21:00" },
    },
  },
  tem_delivery: true,
  aceita_cartao: true,
  aceita_pix: true,
  logo_url: catMarmitasImage,
  banner_url: catRestaurantesImage,
  fotos: [catMarmitasImage, catRestaurantesImage, catLanchonetesImage],
  status: "active",
  rating: 4.8,
  total_reviews: 32,
  favorites_count: 86,
  recommendations_count: 24,
  total_products: menuItems.length,
  is_premium: true,
  is_verified: true,
  can_post_vagas: false,
  slug: "sabores-da-ana",
  formas_pagamento: ["pix", "cartao"],
  especialidades: ["Comida caseira", "Marmitas"],
  facilidades: ["Retirada", "Delivery", "Acessível"],
  modos_atendimento: ["delivery", "takeout", "dine_in"],
  created_at: MOCK_TIMESTAMP,
  updated_at: MOCK_TIMESTAMP,
  gastronomy_profile: profile,
} as unknown as GastronomyBusiness;

const promotions: MenuPromotion[] = [
  {
    id: "mock-promotion-prato-suco",
    business_id: MOCK_BUSINESS_ID,
    title: "Prato do dia + suco",
    description: "Uma combinação da casa por R$ 29,00.",
    discount_type: "fixed_amount",
    discount_value: 3,
    rules: { label: "Oferta demonstrativa" },
    applicable_items: ["mock-item-prato-do-dia", "mock-item-suco-maracuja"],
    valid_from: MOCK_TIMESTAMP,
    valid_until: "2026-12-31T23:59:59.000Z",
    is_active: true,
    created_at: MOCK_TIMESTAMP,
    updated_at: MOCK_TIMESTAMP,
  },
];

const institutionalBusiness = business as unknown as Business;

export const saboresDaAnaPublicSnapshot: PublicGastronomySnapshot = {
  identity: {
    profileId: MOCK_PROFILE_ID,
    businessId: MOCK_BUSINESS_ID,
    slug: "sabores-da-ana",
    displayName: "Sabores da Ana",
    canonicalBusinessUrl:
      "/gastronomia/ba/salvador/pituba/sabores-da-ana",
  },
  institutional: {
    name: "Sabores da Ana",
    description: "Comida caseira feita com cuidado para o dia a dia do bairro.",
    category: "restaurante",
    subcategory: "Comida caseira",
    logoUrl: catMarmitasImage,
    bannerUrl: catRestaurantesImage,
    photos: [catMarmitasImage, catRestaurantesImage, catLanchonetesImage],
    addressText: "Rua da Esperança, 120",
    locationText: "Santa Cruz, Salvador - BA",
    phone: "(71) 99999-1111",
    whatsapp: "5571999991111",
    email: "oi@saboresdaana.example",
    openStatus: { open: true, todayHours: "11:00 - 21:00" },
    openingHours: business.horario_funcionamento,
    rating: 4.8,
    reviewCount: 32,
    business: institutionalBusiness,
  },
  verticals: {
    activeVerticals: ["gastronomy"],
    primaryVertical: "gastronomy",
    canonicalVerticalUrl:
      "/gastronomia/ba/salvador/pituba/sabores-da-ana",
    verticalPublicUrls: {
      gastronomy: "/gastronomia/ba/salvador/pituba/sabores-da-ana",
    },
  },
  gastronomy: {
    profile,
    business,
    menu,
    promotions,
    hasUsefulMenuContent: true,
    commerce: {
      businessDataId: MOCK_BUSINESS_ID,
      deliveryEnabled: true,
      takeoutEnabled: true,
      dineInEnabled: true,
      minimumOrder: 20,
      deliveryFee: 6,
      currency: "BRL",
    },
  },
  seo: {
    title: "Sabores da Ana - Cardápio e pedidos | Achegue-se",
    description: "Comida caseira, cardápio e pedidos no bairro Santa Cruz.",
    canonical: "/gastronomia/ba/salvador/pituba/sabores-da-ana",
    canonicalGastronomyUrl:
      "/gastronomia/ba/salvador/pituba/sabores-da-ana",
    canonicalBusinessUrl:
      "/gastronomia/ba/salvador/pituba/sabores-da-ana",
    robots: "noindex, nofollow",
    schemaType: "Restaurant",
    hasLocalBusinessSchema: true,
    hasRestaurantSchema: true,
    shouldNoIndex: true,
  },
};
