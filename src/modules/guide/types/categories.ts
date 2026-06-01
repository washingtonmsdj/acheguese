/**
 * Tourist Point Categories & Filter Types
 *
 * Categorias e filtros para experiência item-first de pontos turísticos.
 */

export {
  TouristPointCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/core/guide/tourist-points/types';
import type { TouristPointCategory } from '@/core/guide/tourist-points/types';

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
