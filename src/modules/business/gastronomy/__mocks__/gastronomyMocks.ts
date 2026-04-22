/**
 * DEV ONLY
 * Mock fixtures for local development of Gastronomy.
 *
 * This file is intentionally not imported by public runtime pages/services.
 * Shape is aligned with current SSOT (business_data_id + canonical geographic_path).
 */

import type { GastronomyBusiness, GastronomyProfile } from '../types';

import catRestaurantes from '@/assets/gastronomy/cat-restaurantes.jpg';
import catLanchonetes from '@/assets/gastronomy/cat-lanchonetes.jpg';
import catPizzarias from '@/assets/gastronomy/cat-pizzarias.jpg';
import catHamburgueria from '@/assets/gastronomy/cat-hamburgueria.jpg';
import catAcai from '@/assets/gastronomy/cat-acai.jpg';
import catCafes from '@/assets/gastronomy/cat-cafes.jpg';
import catBares from '@/assets/gastronomy/cat-bares.jpg';
import catMarmitas from '@/assets/gastronomy/cat-marmitas.jpg';
import catSushi from '@/assets/gastronomy/cat-sushi.jpg';

function toCanonicalGeoPath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  if (withSlash.startsWith('/br/')) return withSlash;
  return `/br${withSlash}`;
}

function createMockGastronomyBusiness(params: {
  business_data_id: string;
  profile_id: string;
  name: string;
  slug: string;
  description: string;
  banner_url: string;
  location_id: string;
  location_name: string;
  location_full_name: string;
  geographic_path: string;
  cuisine_type: string;
  price_range: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  total_reviews: number;
  is_premium?: boolean;
  is_featured?: boolean;
  delivery_enabled?: boolean;
  takeout_enabled?: boolean;
  dine_in_enabled?: boolean;
  delivery_fee?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  minimum_order?: number;
  accepts_reservations?: boolean;
  has_parking?: boolean;
  has_wifi?: boolean;
  has_accessibility?: boolean;
}): GastronomyBusiness {
  const geoPath = toCanonicalGeoPath(params.geographic_path);

  return {
    id: params.business_data_id,
    business_data_id: params.business_data_id,
    profile_id: params.profile_id,
    name: params.name,
    description: params.description,
    category: 'restaurante',
    location_id: params.location_id,
    location: {
      name: params.location_name,
      full_name: params.location_full_name,
      geographic_path: geoPath,
    },
    geographic_path: geoPath,
    tem_delivery: params.delivery_enabled ?? true,
    aceita_cartao: true,
    aceita_pix: true,
    status: 'active',
    rating: params.rating,
    total_reviews: params.total_reviews,
    total_products: 0,
    is_premium: params.is_premium ?? false,
    is_featured: params.is_featured ?? false,
    is_verified: true,
    slug: params.slug,
    formas_pagamento: ['pix', 'cartao'],
    especialidades: [],
    facilidades: [],
    modos_atendimento: ['delivery', 'local'],
    address: {
      latitude: -12.9814,
      longitude: -38.4514,
    },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    banner_url: params.banner_url,
    gastronomy_profile: {
      id: `gp-${params.business_data_id}`,
      business_id: params.business_data_id,
      cuisine_type: params.cuisine_type,
      cuisine_subtypes: [],
      price_range: params.price_range,
      delivery_enabled: params.delivery_enabled ?? true,
      takeout_enabled: params.takeout_enabled ?? true,
      dine_in_enabled: params.dine_in_enabled ?? true,
      delivery_fee: params.delivery_fee,
      delivery_time_min: params.delivery_time_min,
      delivery_time_max: params.delivery_time_max,
      minimum_order: params.minimum_order,
      accepts_reservations: params.accepts_reservations ?? false,
      has_parking: params.has_parking ?? false,
      has_wifi: params.has_wifi ?? false,
      has_accessibility: params.has_accessibility ?? false,
      has_kids_area: false,
      has_live_music: false,
      status: 'active',
      metadata: {},
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  };
}

export const MOCK_GASTRONOMY_BUSINESSES: GastronomyBusiness[] = [
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-cantina',
    profile_id: 'mock-profile-cantina',
    name: 'Cantina da Nonna',
    slug: 'cantina-da-nonna',
    description: 'Cozinha italiana com massas artesanais e molhos da casa.',
    banner_url: catRestaurantes,
    location_id: 'loc-pituba',
    location_name: 'Pituba',
    location_full_name: 'Pituba, Salvador',
    geographic_path: '/ba/salvador/pituba',
    cuisine_type: 'italiana',
    price_range: '$$$',
    rating: 4.8,
    total_reviews: 342,
    is_premium: true,
    is_featured: true,
    delivery_fee: 7.99,
    delivery_time_min: 35,
    delivery_time_max: 55,
    minimum_order: 30,
    accepts_reservations: true,
    has_parking: true,
    has_wifi: true,
  }),
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-burger',
    profile_id: 'mock-profile-burger',
    name: 'Burger House',
    slug: 'burger-house',
    description: 'Hamburgueres artesanais com blend proprio.',
    banner_url: catHamburgueria,
    location_id: 'loc-barra',
    location_name: 'Barra',
    location_full_name: 'Barra, Salvador',
    geographic_path: '/ba/salvador/barra',
    cuisine_type: 'hamburgueria',
    price_range: '$$',
    rating: 4.6,
    total_reviews: 528,
    is_premium: true,
    is_featured: true,
    delivery_fee: 5.99,
    delivery_time_min: 20,
    delivery_time_max: 35,
  }),
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-sushi',
    profile_id: 'mock-profile-sushi',
    name: 'Sushi Kento',
    slug: 'sushi-kento',
    description: 'Culinaria japonesa com peixes frescos.',
    banner_url: catSushi,
    location_id: 'loc-itaigara',
    location_name: 'Itaigara',
    location_full_name: 'Itaigara, Salvador',
    geographic_path: '/ba/salvador/itaigara',
    cuisine_type: 'japonesa',
    price_range: '$$$$',
    rating: 4.9,
    total_reviews: 215,
    is_premium: true,
    is_featured: true,
    delivery_fee: 12.99,
    delivery_time_min: 45,
    delivery_time_max: 70,
    accepts_reservations: true,
    has_parking: true,
    has_wifi: true,
    has_accessibility: true,
  }),
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-pizza',
    profile_id: 'mock-profile-pizza',
    name: 'Pizza do Forno',
    slug: 'pizza-do-forno',
    description: 'Pizzas artesanais assadas em forno a lenha.',
    banner_url: catPizzarias,
    location_id: 'loc-rio-vermelho',
    location_name: 'Rio Vermelho',
    location_full_name: 'Rio Vermelho, Salvador',
    geographic_path: '/ba/salvador/rio-vermelho',
    cuisine_type: 'pizzaria',
    price_range: '$$',
    rating: 4.4,
    total_reviews: 189,
    delivery_fee: 4.99,
    delivery_time_min: 30,
    delivery_time_max: 50,
  }),
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-acai',
    profile_id: 'mock-profile-acai',
    name: 'Acai da Terra',
    slug: 'acai-da-terra',
    description: 'Acai com frutas frescas e toppings variados.',
    banner_url: catAcai,
    location_id: 'loc-ondina',
    location_name: 'Ondina',
    location_full_name: 'Ondina, Salvador',
    geographic_path: '/ba/salvador/ondina',
    cuisine_type: 'sorveteria',
    price_range: '$',
    rating: 4.7,
    total_reviews: 412,
    is_featured: true,
    delivery_fee: 3.99,
    delivery_time_min: 15,
    delivery_time_max: 30,
    dine_in_enabled: false,
  }),
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-cafe',
    profile_id: 'mock-profile-cafe',
    name: 'Cafe e Brisa',
    slug: 'cafe-brisa',
    description: 'Cafeteria artesanal com doces da casa.',
    banner_url: catCafes,
    location_id: 'loc-graza',
    location_name: 'Graca',
    location_full_name: 'Graca, Salvador',
    geographic_path: '/ba/salvador/graca',
    cuisine_type: 'cafeteria',
    price_range: '$$',
    rating: 4.3,
    total_reviews: 156,
    is_featured: true,
    delivery_fee: 4.99,
    delivery_time_min: 25,
    delivery_time_max: 40,
    has_wifi: true,
  }),
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-bar',
    profile_id: 'mock-profile-bar',
    name: 'Bar do Pelo',
    slug: 'bar-do-pelo',
    description: 'Petiscos, drinks e musica ao vivo no centro historico.',
    banner_url: catBares,
    location_id: 'loc-pelo',
    location_name: 'Pelourinho',
    location_full_name: 'Pelourinho, Salvador',
    geographic_path: '/ba/salvador/pelourinho',
    cuisine_type: 'bar',
    price_range: '$$',
    rating: 4.3,
    total_reviews: 267,
    delivery_enabled: false,
    takeout_enabled: false,
    dine_in_enabled: true,
    accepts_reservations: true,
  }),
  createMockGastronomyBusiness({
    business_data_id: 'mock-biz-marmita',
    profile_id: 'mock-profile-marmita',
    name: 'Marmitex da Vovo',
    slug: 'marmitex-da-vovo',
    description: 'Comida caseira diaria em porcoes executivas.',
    banner_url: catMarmitas,
    location_id: 'loc-brotas',
    location_name: 'Brotas',
    location_full_name: 'Brotas, Salvador',
    geographic_path: '/ba/salvador/brotas',
    cuisine_type: 'regional',
    price_range: '$',
    rating: 4.6,
    total_reviews: 580,
    is_featured: true,
    delivery_fee: 2.99,
    delivery_time_min: 20,
    delivery_time_max: 35,
    minimum_order: 15,
  }),
];
