import {
  buildTonePizzariaFixtureGeographicPath,
  isTonePizzariaRouteFixture,
  TONE_PIZZARIA_ROUTE_FIXTURE_ID,
  TONE_PIZZARIA_ROUTE_FIXTURE_SLUG,
} from "@/core/business/fixtures/tonePizzariaRouteFixture";
import type { Business } from "@/core/business/types";
import { buildBusinessPublicUrlFromSegments } from "@/core/business/utils/businessPublicUrls";
import type {
  PublicBusinessSnapshot,
  PublicSlugRouteParams,
} from "../types/publicSnapshots";

const openingHours = {
  segunda: { open: "", close: "", closed: true },
  terca: { open: "18:00", close: "23:30" },
  quarta: { open: "18:00", close: "23:30" },
  quinta: { open: "18:00", close: "23:30" },
  sexta: { open: "18:00", close: "00:00" },
  sabado: { open: "18:00", close: "00:00" },
  domingo: { open: "18:00", close: "23:00" },
} satisfies NonNullable<Business["horario_funcionamento"]>;

function resolveFixtureDistrict(params: PublicSlugRouteParams): string {
  return params.district ?? "complexo-do-nordeste-de-amaralina";
}

function buildCanonicalUrl(params: PublicSlugRouteParams): string {
  return buildBusinessPublicUrlFromSegments({
    state: params.state,
    city: params.city,
    district: resolveFixtureDistrict(params),
    slug: TONE_PIZZARIA_ROUTE_FIXTURE_SLUG,
  });
}

function buildFixtureBusiness(params: PublicSlugRouteParams): Business {
  return {
    id: TONE_PIZZARIA_ROUTE_FIXTURE_ID,
    business_data_id: TONE_PIZZARIA_ROUTE_FIXTURE_ID,
    profile_id: TONE_PIZZARIA_ROUTE_FIXTURE_ID,
    name: "Ton\u00e9 Pizzaria",
    description:
      "Pizzas artesanais feitas com ingredientes selecionados e muito carinho. Forno a lenha, massas de fermentacao natural e aquele sabor que virou tradicao no Aquarius.",
    category: "restaurante",
    subcategoria: "Pizzaria",
    phone: "(12) 3204-5511",
    whatsapp: "551232045511",
    email: "contato@tonepizzaria.com.br",
    website: "tonepizzaria.com.br",
    location_id: "dev-jardim-aquarius",
    address_id: "dev-tone-pizzaria-address",
    business_address: "Rua das Figueiras, 320",
    business_city: "S\u00e3o Jos\u00e9 dos Campos",
    business_state: "SP",
    business_zip: "12246-010",
    business_role: "standalone",
    is_headquarters: true,
    address: {
      street: "Rua das Figueiras",
      number: "320",
      postal_code: "12246-010",
      latitude: -23.2077,
      longitude: -45.9025,
    },
    location: {
      name: "Jardim Aquarius",
      full_name: "Jardim Aquarius, S\u00e3o Jos\u00e9 dos Campos - SP",
      geographic_path: buildTonePizzariaFixtureGeographicPath({
        state: params.state,
        city: params.city,
        district: resolveFixtureDistrict(params),
        slug: params.slug,
      }),
      canonical_lat: -23.2077,
      canonical_lng: -45.9025,
    },
    geographic_path: buildTonePizzariaFixtureGeographicPath({
      state: params.state,
      city: params.city,
      district: resolveFixtureDistrict(params),
      slug: params.slug,
    }),
    horario_funcionamento: openingHours,
    tem_delivery: true,
    aceita_cartao: true,
    aceita_pix: true,
    logo_url: "/images/mock-tone-pizzaria/logo.svg",
    banner_url: "/images/mock-tone-pizzaria/banner.svg",
    fotos: ["/images/mock-tone-pizzaria/banner.svg"],
    status: "active",
    rating: 4.8,
    total_reviews: 128,
    favorites_count: 342,
    recommendations_count: 118,
    total_products: 5,
    is_premium: false,
    is_verified: true,
    can_post_vagas: false,
    is_featured: true,
    slug: TONE_PIZZARIA_ROUTE_FIXTURE_SLUG,
    formas_pagamento: [
      "pix",
      "dinheiro",
      "credito",
      "debito",
      "vale-refeicao",
      "vale-alimentacao",
    ],
    especialidades: ["Ingredientes selecionados", "Forno a lenha", "Receitas exclusivas"],
    facilidades: ["ar_condicionado"],
    modos_atendimento: ["delivery", "retirada", "consumo_local"],
    instagram: "tonepizzaria",
    facebook: "tonepizzaria",
    created_at: "2018-01-15T12:00:00.000Z",
    updated_at: "2026-01-01T12:00:00.000Z",
  };
}

export function createTonePizzariaPublicSnapshotFixture(
  params: PublicSlugRouteParams,
): PublicBusinessSnapshot | null {
  if (!isTonePizzariaRouteFixture(params)) {
    return null;
  }

  const canonical = buildCanonicalUrl(params);
  const business = buildFixtureBusiness(params);

  return {
    identity: {
      profileId: TONE_PIZZARIA_ROUTE_FIXTURE_ID,
      businessId: TONE_PIZZARIA_ROUTE_FIXTURE_ID,
      slug: TONE_PIZZARIA_ROUTE_FIXTURE_SLUG,
      displayName: business.name,
      canonicalBusinessUrl: canonical,
    },
    institutional: {
      name: business.name,
      description: business.description,
      category: business.category,
      subcategory: business.subcategoria,
      logoUrl: business.logo_url,
      bannerUrl: business.banner_url,
      photos: business.fotos ?? [],
      addressText: "Rua das Figueiras, 320",
      locationText: "Jardim Aquarius, S\u00e3o Jos\u00e9 dos Campos - SP",
      phone: business.phone,
      whatsapp: business.whatsapp,
      email: business.email,
      website: business.website,
      openStatus: { open: true, todayHours: "18:00 - 23:30" },
      openingHours,
      rating: 4.8,
      reviewCount: 128,
      business,
    },
    verticals: {
      activeVerticals: [],
      primaryVertical: null,
      canonicalVerticalUrl: null,
      verticalPublicUrls: {},
    },
    gastronomyPreview: [],
    seo: {
      title: `${business.name} | Achegue-se`,
      description: business.description,
      canonical,
      robots: "index, follow",
      schemaType: "LocalBusiness",
      hasLocalBusinessSchema: true,
      hasRestaurantSchema: false,
    },
  };
}
