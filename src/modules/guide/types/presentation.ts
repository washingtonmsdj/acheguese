import { CATEGORY_ICONS, type TouristPoint, type TouristPointCategory } from '@/modules/guide/tourist-points/types';
import type { LucideIcon } from 'lucide-react';

export interface TouristPointCategoryShortcut {
  id: string;
  label: string;
  icon: LucideIcon;
  categoryFilter: TouristPointCategory;
  image: string;
}

export const TOURIST_CATEGORY_SHORTCUTS: TouristPointCategoryShortcut[] = [
  {
    id: 'cat-praia',
    label: 'Praias',
    icon: CATEGORY_ICONS.praia,
    categoryFilter: 'praia',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-historico',
    label: 'Historico',
    icon: CATEGORY_ICONS.historico,
    categoryFilter: 'historico',
    image: 'https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-museu',
    label: 'Museus',
    icon: CATEGORY_ICONS.museu,
    categoryFilter: 'museu',
    image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop',
  },
  {
    id: 'cat-parque',
    label: 'Parques',
    icon: CATEGORY_ICONS.parque,
    categoryFilter: 'parque',
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop',
  },
];

export type TouristPointDisplay = Omit<TouristPoint, 'category'> & {
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
};

function resolveCategory(value: unknown): TouristPointCategory {
  if (
    value === 'praia' ||
    value === 'parque' ||
    value === 'mirante' ||
    value === 'museu' ||
    value === 'historico' ||
    value === 'natural' ||
    value === 'religioso' ||
    value === 'cultural' ||
    value === 'gastronomico' ||
    value === 'monumento' ||
    value === 'arquitetonico' ||
    value === 'esportivo' ||
    value === 'entretenimento' ||
    value === 'compras' ||
    value === 'outro'
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

