/**
 * useNearbyBusinesses / useNearbyGuides
 *
 * Busca empresas e guias turísticos próximos a um ponto turístico.
 * Ordena por distância Haversine quando coordenadas disponíveis.
 * Retorna mock data quando o banco não tem registros.
 */

import { useQuery } from '@tanstack/react-query';
import { BusinessService } from '@/core/business/services/BusinessService';
import { calculateDistance } from '@/shared/utils/geolocation';
import type { Business } from '@/core/business/types/Business';

const BUSINESS_CATEGORIES = ['restaurante', 'lazer', 'servicos'] as const;
const MAX_RESULTS = 6;
const MAX_RADIUS_KM = 5;

export interface NearbyBusiness extends Business {
  distanceMeters?: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_BUSINESSES: NearbyBusiness[] = [
  {
    id: 'mock-biz-1', profile_id: '', name: 'Restaurante Solar da Barra', description: 'Culinária baiana com vista para o mar.',
    category: 'restaurante', location_id: '', tem_delivery: false, aceita_cartao: true, aceita_pix: true,
    rating: 4.6, total_reviews: 312, total_products: 0, is_premium: false, is_verified: true, is_featured: false,
    status: 'active', formas_pagamento: [], especialidades: ['Culinária baiana', 'Frutos do mar'],
    facilidades: [], modos_atendimento: [], slug: '', created_at: '', updated_at: '',
    logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80&q=70',
    distanceMeters: 320,
  },
  {
    id: 'mock-biz-2', profile_id: '', name: 'Pousada Farol Boutique', description: 'Hospedagem charmosa a 200m da praia.',
    category: 'lazer', location_id: '', tem_delivery: false, aceita_cartao: true, aceita_pix: true,
    rating: 4.8, total_reviews: 189, total_products: 0, is_premium: true, is_verified: true, is_featured: false,
    status: 'active', formas_pagamento: [], especialidades: ['Hospedagem', 'Café da manhã'],
    facilidades: [], modos_atendimento: [], slug: '', created_at: '', updated_at: '',
    logo_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80&q=70',
    distanceMeters: 480,
  },
  {
    id: 'mock-biz-3', profile_id: '', name: 'Quiosque Beira Mar', description: 'Drinks e petiscos na orla.',
    category: 'restaurante', location_id: '', tem_delivery: false, aceita_cartao: true, aceita_pix: true,
    rating: 4.3, total_reviews: 97, total_products: 0, is_premium: false, is_verified: false, is_featured: false,
    status: 'active', formas_pagamento: [], especialidades: ['Drinks', 'Petiscos'],
    facilidades: [], modos_atendimento: [], slug: '', created_at: '', updated_at: '',
    logo_url: null,
    distanceMeters: 150,
  },
  {
    id: 'mock-biz-4', profile_id: '', name: 'Loja de Artesanato Bahia', description: 'Souvenirs e artesanato local.',
    category: 'servicos', location_id: '', tem_delivery: false, aceita_cartao: true, aceita_pix: true,
    rating: 4.1, total_reviews: 54, total_products: 0, is_premium: false, is_verified: false, is_featured: false,
    status: 'active', formas_pagamento: [], especialidades: ['Artesanato', 'Souvenirs'],
    facilidades: [], modos_atendimento: [], slug: '', created_at: '', updated_at: '',
    logo_url: null,
    distanceMeters: 600,
  },
];

const MOCK_GUIDES: NearbyBusiness[] = [
  {
    id: 'mock-guide-1', profile_id: '', name: 'Carlos Guia — Salvador Histórica', description: 'Guia turístico credenciado com 10 anos de experiência no centro histórico.',
    category: 'lazer', subcategoria: 'guia turístico', location_id: '', tem_delivery: false, aceita_cartao: true, aceita_pix: true,
    rating: 4.9, total_reviews: 203, total_products: 0, is_premium: true, is_verified: true, is_featured: false,
    status: 'active', formas_pagamento: [], especialidades: ['Guia turístico', 'Centro histórico', 'Pelourinho'],
    facilidades: [], modos_atendimento: [], slug: '', created_at: '', updated_at: '',
    logo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=70',
    distanceMeters: 900,
  },
  {
    id: 'mock-guide-2', profile_id: '', name: 'Bahia Tour Experiences', description: 'Passeios de barco, city tour e trilhas na Chapada.',
    category: 'lazer', subcategoria: 'turismo', location_id: '', tem_delivery: false, aceita_cartao: true, aceita_pix: true,
    rating: 4.7, total_reviews: 145, total_products: 0, is_premium: false, is_verified: true, is_featured: false,
    status: 'active', formas_pagamento: [], especialidades: ['Passeio de barco', 'City tour', 'Trilhas'],
    facilidades: [], modos_atendimento: [], slug: '', created_at: '', updated_at: '',
    logo_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=80&q=70',
    distanceMeters: 1200,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function withDistance(
  businesses: Business[],
  lat: number | null,
  lng: number | null,
  maxKm: number,
): NearbyBusiness[] {
  if (!lat || !lng) return businesses.slice(0, MAX_RESULTS);

  return businesses
    .map((b) => {
      const bLat = b.address?.latitude ?? null;
      const bLng = b.address?.longitude ?? null;
      if (!bLat || !bLng) return { ...b, distanceMeters: undefined };
      return { ...b, distanceMeters: calculateDistance(lat, lng, bLat, bLng) };
    })
    .filter((b) => b.distanceMeters === undefined || b.distanceMeters <= maxKm * 1000)
    .sort((a, b) => {
      if (a.distanceMeters === undefined) return 1;
      if (b.distanceMeters === undefined) return -1;
      return a.distanceMeters - b.distanceMeters;
    })
    .slice(0, MAX_RESULTS);
}

// ── Empresas gerais ───────────────────────────────────────────────────────────

async function fetchNearbyBusinesses(lat: number | null, lng: number | null) {
  const results = await Promise.all(
    BUSINESS_CATEGORIES.map((cat) =>
      BusinessService.getBusinesses({ category: cat, sortBy: 'rating' }),
    ),
  );
  const real = withDistance(results.flat(), lat, lng, MAX_RADIUS_KM);
  return real.length > 0 ? real : MOCK_BUSINESSES;
}

export function useNearbyBusinesses(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['nearby-businesses', lat, lng],
    queryFn: () => fetchNearbyBusinesses(lat, lng),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

// ── Guias turísticos ──────────────────────────────────────────────────────────

async function fetchNearbyGuides(lat: number | null, lng: number | null) {
  const [lazer, servicos] = await Promise.all([
    BusinessService.getBusinesses({ category: 'lazer', sortBy: 'rating' }),
    BusinessService.getBusinesses({ category: 'servicos', sortBy: 'rating' }),
  ]);

  const GUIDE_KEYWORDS = ['guia', 'turismo', 'tour', 'excursão', 'passeio'];
  const guides = [...lazer, ...servicos].filter((b) => {
    const sub = (b.subcategoria ?? '').toLowerCase();
    const specs = (b.especialidades ?? []).join(' ').toLowerCase();
    const name = b.name.toLowerCase();
    const desc = (b.description ?? '').toLowerCase();
    return GUIDE_KEYWORDS.some((kw) =>
      sub.includes(kw) || specs.includes(kw) || name.includes(kw) || desc.includes(kw),
    );
  });

  const real = withDistance(guides, lat, lng, MAX_RADIUS_KM);
  return real.length > 0 ? real : MOCK_GUIDES;
}

export function useNearbyGuides(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['nearby-guides', lat, lng],
    queryFn: () => fetchNearbyGuides(lat, lng),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
