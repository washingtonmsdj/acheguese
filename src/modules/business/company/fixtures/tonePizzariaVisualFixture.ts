import type { PublicBusinessSnapshot, PublicSlugRouteParams } from "@/modules/business/public/types/publicSnapshots";
import {
  isTonePizzariaRouteFixture,
  TONE_PIZZARIA_ROUTE_FIXTURE_SLUG,
} from "@/core/business/fixtures/tonePizzariaRouteFixture";
import type {
  BusinessExtended,
  NearbyBusiness,
  OpenStatus,
  Product,
  RatingBreakdown,
  Review,
} from "../sections/types";

export interface CompanyVisualFixture {
  readonly business: BusinessExtended;
  readonly institutional: PublicBusinessSnapshot["institutional"];
  readonly products: readonly Product[];
  readonly reviews: readonly Review[];
  readonly ratingBreakdown: RatingBreakdown;
  readonly nearbyBusinesses: readonly NearbyBusiness[];
  readonly openStatus: OpenStatus;
}

const openingHours = {
  segunda: { open: "", close: "", closed: true },
  terca: { open: "18:00", close: "23:30" },
  quarta: { open: "18:00", close: "23:30" },
  quinta: { open: "18:00", close: "23:30" },
  sexta: { open: "18:00", close: "00:00" },
  sabado: { open: "18:00", close: "00:00" },
  domingo: { open: "18:00", close: "23:00" },
} satisfies NonNullable<BusinessExtended["horario_funcionamento"]>;

export function resolveTonePizzariaVisualFixture(
  params: Partial<PublicSlugRouteParams>,
  snapshot: PublicBusinessSnapshot,
  baseBusiness: BusinessExtended,
): CompanyVisualFixture | null {
  if (!isTonePizzariaRouteFixture(params)) {
    return null;
  }

  const business: BusinessExtended = {
    ...baseBusiness,
    name: "Toné Pizzaria",
    slug: TONE_PIZZARIA_ROUTE_FIXTURE_SLUG,
    description:
      "Pizzas artesanais feitas com ingredientes selecionados e muito carinho. Forno a lenha, massas de fermentação natural e aquele sabor que virou tradição no Aquarius.",
    category: "restaurante",
    subcategoria: "Pizzaria",
    phone: "(12) 3204-5511",
    whatsapp: "551232045511",
    email: "contato@tonepizzaria.com.br",
    website: "tonepizzaria.com.br",
    business_address: "Rua das Figueiras, 320",
    business_city: "São José dos Campos",
    business_state: "SP",
    location: {
      ...baseBusiness.location,
      name: "Jardim Aquarius",
      full_name: "Jardim Aquarius, São José dos Campos - SP",
    },
    logo_url: "/images/mock-tone-pizzaria/logo.svg",
    banner_url: "/images/mock-tone-pizzaria/banner.svg",
    fotos: ["/images/mock-tone-pizzaria/banner.svg"],
    rating: 4.8,
    total_reviews: 128,
    recommendations_count: 342,
    favorites_count: 342,
    tem_delivery: true,
    aceita_cartao: true,
    aceita_pix: true,
    formas_pagamento: [
      "pix",
      "dinheiro",
      "credito",
      "debito",
      "vale-refeicao",
      "vale-alimentacao",
    ],
    delivery_eta_label: "35-50 min (entrega)",
    price_band_label: "$$ • Medio",
    especialidades: ["Ingredientes selecionados", "Forno a lenha", "Receitas exclusivas"],
    facilidades: ["ar_condicionado"],
    modos_atendimento: ["delivery", "retirada", "consumo_local"],
    instagram: "tonepizzaria",
    facebook: "tonepizzaria",
    is_verified: true,
    is_premium: false,
    created_at: "2018-01-15T12:00:00.000Z",
    horario_funcionamento: openingHours,
  };

  const institutional: PublicBusinessSnapshot["institutional"] = {
    ...snapshot.institutional,
    name: business.name,
    description: business.description,
    category: business.category,
    subcategory: business.subcategoria,
    logoUrl: business.logo_url,
    bannerUrl: business.banner_url,
    photos: ["/images/mock-tone-pizzaria/banner.svg"],
    addressText: "Rua das Figueiras, 320",
    locationText: "Jardim Aquarius, São José dos Campos - SP",
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    website: business.website,
    openStatus: { open: true, todayHours: "18:00 - 23:30" },
    openingHours,
    rating: 4.8,
    reviewCount: 128,
    business,
  };

  const products: Product[] = [
    {
      id: `${business.id}-pizza-margherita`,
      name: "Pizza Margherita",
      description: "Molho artesanal, mussarela, tomate italiano e manjericão fresco.",
      price: 59.9,
      category: "Pizzas artesanais",
      image_url: "/images/mock-tone-pizzaria/product-margherita.svg",
      featured: true,
      active: true,
    },
    {
      id: `${business.id}-pizza-calabresa`,
      name: "Pizza Calabresa",
      description: "Calabresa curada, cebola roxa e toque de provolone.",
      price: 59.9,
      category: "Pizzas artesanais",
      image_url: "/images/mock-tone-pizzaria/product-calabresa.svg",
      active: true,
    },
    {
      id: `${business.id}-pizza-quatro-queijos`,
      name: "Pizza 4 Queijos",
      description: "Mussarela, gorgonzola, parmesão e catupiry cremoso.",
      price: 64.9,
      category: "Pizzas artesanais",
      image_url: "/images/mock-tone-pizzaria/product-quatro-queijos.svg",
      active: true,
    },
    {
      id: `${business.id}-combo-familia`,
      name: "Combo Família",
      description: "Pizza grande + borda especial + refrigerante 2L.",
      price: 99.9,
      category: "Combos",
      image_url: "/images/mock-tone-pizzaria/product-combo.svg",
      active: true,
    },
    {
      id: `${business.id}-pizza-burrata`,
      name: "Pizza Burrata da Casa",
      description: "Molho assado, burrata cremosa e pesto fresco.",
      price: 69.9,
      category: "Pizzas artesanais",
      image_url: "/images/mock-tone-pizzaria/product-margherita.svg",
      active: true,
    },
  ];

  const reviews: Review[] = [
    {
      id: `${business.id}-review-carla`,
      user_name: "Carla Mendes",
      rating: 5,
      comment:
        "Melhor pizza da região. Ingredientes frescos, entrega no horário e atendimento nota 10.",
      created_at: new Date().toISOString(),
      avatar: "/images/mock-tone-pizzaria/avatar-carla.svg",
      isNeighbor: true,
    },
  ];

  const ratingBreakdown: RatingBreakdown = {
    5: 108,
    4: 14,
    3: 4,
    2: 1,
    1: 1,
  };

  const nearbyBusinesses: NearbyBusiness[] = [
    {
      id: `${business.id}-nearby-al-forno`,
      name: "Al Forno Pizzas",
      category: "Pizzaria",
      distance: "0,4 km",
      rating: 4.6,
      imageUrl: "/images/mock-tone-pizzaria/nearby-al-forno.svg",
      locationLabel: "Jardim Aquarius",
    },
    {
      id: `${business.id}-nearby-burger-house`,
      name: "Burger House",
      category: "Hamburgueria",
      distance: "0,6 km",
      rating: 4.7,
      imageUrl: "/images/mock-tone-pizzaria/nearby-burger-house.svg",
      locationLabel: "Aquarius",
    },
    {
      id: `${business.id}-nearby-doce-cantinho`,
      name: "Doce Cantinho",
      category: "Confeitaria",
      distance: "0,7 km",
      rating: 4.9,
      imageUrl: "/images/mock-tone-pizzaria/nearby-doce-cantinho.svg",
      locationLabel: "Colinas",
    },
  ];

  return {
    business,
    institutional,
    products,
    reviews,
    ratingBreakdown,
    nearbyBusinesses,
    openStatus: { open: true, todayHours: "18:00 - 23:30" },
  };
}
