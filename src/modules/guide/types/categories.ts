/**
 * Tourist Point Categories & Filter Types
 *
 * Categorias e filtros para experiência item-first de pontos turísticos.
 */

export const TOURIST_POINT_CATEGORY = {
  BEACH: 'praia',
  SQUARE: 'praca',
  PARK: 'parque',
  TRAIL: 'trilha',
  VIEWPOINT: 'mirante',
  MUSEUM: 'museu',
  CULTURAL_CENTER: 'centro-cultural',
  HISTORIC: 'historico',
  CHURCH: 'igreja',
  MONUMENT: 'monumento',
  MARKET: 'mercado',
  OUTDOOR: 'ar-livre',
} as const;

export type TouristPointCategory = typeof TOURIST_POINT_CATEGORY[keyof typeof TOURIST_POINT_CATEGORY];

export const CATEGORY_LABELS: Record<TouristPointCategory, string> = {
  praia: 'Praia',
  praca: 'Praça',
  parque: 'Parque',
  trilha: 'Trilha',
  mirante: 'Mirante',
  museu: 'Museu',
  'centro-cultural': 'Centro Cultural',
  historico: 'Histórico',
  igreja: 'Igreja',
  monumento: 'Monumento',
  mercado: 'Mercado',
  'ar-livre': 'Ao Ar Livre',
};

export const CATEGORY_ICONS: Record<TouristPointCategory, string> = {
  praia: '🏖️',
  praca: '🌳',
  parque: '🌿',
  trilha: '🥾',
  mirante: '🏔️',
  museu: '🏛️',
  'centro-cultural': '🎭',
  historico: '🏰',
  igreja: '⛪',
  monumento: '🗿',
  mercado: '🛍️',
  'ar-livre': '☀️',
};

// ── Quick Filters ────────────────────────────────────────────────────────────

export interface TouristPointQuickFilters {
  category?: TouristPointCategory;
  is_free?: boolean;
  is_accessible?: boolean;
  is_family_friendly?: boolean;
  is_open_now?: boolean;
  search?: string;
  sort_by?: TouristPointSortKey;
}

export type TouristPointSortKey =
  | 'relevance'
  | 'rating'
  | 'newest'
  | 'name_asc';

export const SORT_OPTIONS: { key: TouristPointSortKey; label: string }[] = [
  { key: 'relevance', label: 'Relevância' },
  { key: 'rating', label: 'Mais avaliados' },
  { key: 'newest', label: 'Mais recentes' },
  { key: 'name_asc', label: 'A-Z' },
];
