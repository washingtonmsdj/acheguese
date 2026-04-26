import type { TouristPoint } from './index';
import type { TouristPointCategory } from './categories';

export interface TouristPointCategoryShortcut {
  id: string;
  label: string;
  emoji: string;
  categoryFilter: TouristPointCategory;
  image: string;
}

export const TOURIST_CATEGORY_SHORTCUTS: TouristPointCategoryShortcut[] = [
  {
    id: 'cat-praia',
    label: 'Praias',
    emoji: '🏖️',
    categoryFilter: 'praia',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-historico',
    label: 'Historico',
    emoji: '🏰',
    categoryFilter: 'historico',
    image: 'https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-museu',
    label: 'Museus',
    emoji: '🏛️',
    categoryFilter: 'museu',
    image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-parque',
    label: 'Parques',
    emoji: '🌿',
    categoryFilter: 'parque',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
  },
];

export interface TouristPointDisplay extends TouristPoint {
  category: TouristPointCategory;
  rating: number;
  review_count: number;
  is_free: boolean;
  is_accessible: boolean;
  is_family_friendly: boolean;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  tips: string | null;
  how_to_get_there: string | null;
}

function resolveCategory(value: unknown): TouristPointCategory {
  if (
    value === 'praia' ||
    value === 'praca' ||
    value === 'parque' ||
    value === 'trilha' ||
    value === 'mirante' ||
    value === 'museu' ||
    value === 'centro-cultural' ||
    value === 'historico' ||
    value === 'igreja' ||
    value === 'monumento' ||
    value === 'mercado' ||
    value === 'ar-livre'
  ) {
    return value;
  }
  return 'historico';
}

export function toTouristPointDisplay(point: TouristPoint): TouristPointDisplay {
  const priceType = String(point.price_type ?? '').toLowerCase();
  return {
    ...point,
    category: resolveCategory((point as TouristPoint & { category?: unknown }).category),
    rating: Number((point as TouristPoint & { rating?: number }).rating ?? 0),
    review_count: Number((point as TouristPoint & { total_reviews?: number }).total_reviews ?? 0),
    is_free: priceType === 'free' || priceType === 'gratuito',
    is_accessible: Boolean((point as TouristPoint & { accessibility?: boolean }).accessibility),
    is_family_friendly: Boolean((point as TouristPoint & { has_guide?: boolean }).has_guide),
    neighborhood: point.location?.name ?? point.address_text ?? '',
    latitude: point.address?.latitude ?? point.latitude ?? null,
    longitude: point.address?.longitude ?? point.longitude ?? null,
    tips: null,
    how_to_get_there: null,
  };
}
