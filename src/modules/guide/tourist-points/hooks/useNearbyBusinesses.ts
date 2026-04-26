/**
 * useNearbyBusinesses / useNearbyGuides
 *
 * Busca empresas e guias turísticos próximos a um ponto turístico.
 * Ordena por distância Haversine quando coordenadas disponíveis.
 * Retorna apenas dados reais.
 */

import { useQuery } from '@tanstack/react-query';
import { BusinessService } from '@/core/business/services/BusinessService';
import { calculateDistance } from '@/shared/utils/geolocation';
import type { Business } from '@/core/business/types/Business';
import { TOURIST_POINT_NEARBY_LIMITS } from '../constants/nearby';

const BUSINESS_CATEGORIES = ['restaurante', 'lazer', 'servicos'] as const;

export interface NearbyBusiness extends Business {
  distanceMeters?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function withDistance(
  businesses: Business[],
  lat: number | null,
  lng: number | null,
  maxKm: number,
): NearbyBusiness[] {
  if (!lat || !lng) return businesses.slice(0, TOURIST_POINT_NEARBY_LIMITS.MAX_RESULTS);

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
    .slice(0, TOURIST_POINT_NEARBY_LIMITS.MAX_RESULTS);
}

// ── Empresas gerais ───────────────────────────────────────────────────────────

async function fetchNearbyBusinesses(lat: number | null, lng: number | null) {
  const results = await Promise.all(
    BUSINESS_CATEGORIES.map((cat) =>
      BusinessService.getBusinesses({ category: cat, sortBy: 'rating' }),
    ),
  );
  const real = withDistance(results.flat(), lat, lng, TOURIST_POINT_NEARBY_LIMITS.MAX_RADIUS_KM);
  return real;
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

  const real = withDistance(guides, lat, lng, TOURIST_POINT_NEARBY_LIMITS.MAX_RADIUS_KM);
  return real;
}

export function useNearbyGuides(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: ['nearby-guides', lat, lng],
    queryFn: () => fetchNearbyGuides(lat, lng),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
