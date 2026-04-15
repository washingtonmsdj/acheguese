/**
 * Guide Module — Tourism Types
 *
 * Contratos de domínio para a vertical tourism do módulo guide.
 * Tipagem forte, zero any, sem campos legados.
 */

// ── Price ────────────────────────────────────────────────────────────────────

export const PRICE_TYPE = {
  FREE:    'free',
  PAID:    'paid',
  RANGE:   'range',
  CONSULT: 'consult',
} as const;

export type PriceType = typeof PRICE_TYPE[keyof typeof PRICE_TYPE];

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  free:    'Gratuito',
  paid:    'Pago',
  range:   'Faixa de preço',
  consult: 'Consultar',
};

// ── Status ───────────────────────────────────────────────────────────────────

export const TOURIST_POINT_STATUS = {
  DRAFT:     'draft',
  PUBLISHED: 'published',
  ARCHIVED:  'archived',
} as const;

export type TouristPointStatus = typeof TOURIST_POINT_STATUS[keyof typeof TOURIST_POINT_STATUS];

export const TOURIST_POINT_STATUS_LABELS: Record<TouristPointStatus, string> = {
  draft:     'Rascunho',
  published: 'Publicado',
  archived:  'Arquivado',
};

// ── Domain entity ────────────────────────────────────────────────────────────

export interface TouristPoint {
  id: string;
  location_id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  address_text: string | null;
  price_type: PriceType;
  price_text: string | null;
  opening_hours: string | null;
  accessibility_notes: string | null;
  official_url: string | null;
  is_featured: boolean;
  status: TouristPointStatus;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;

  /** Relação carregada via join com locations */
  location?: {
    id: string;
    name: string;
    full_name: string;
    geographic_path: string;
    type: string;
  } | null;

  /** Mídia associada (via tourist_point_media) */
  media?: TouristPointMedia[];
}

// ── Media ────────────────────────────────────────────────────────────────────

export interface TouristPointMedia {
  id: string;
  tourist_point_id: string;
  url: string;
  alt_text: string | null;
  is_cover: boolean;
  display_order: number;
  created_at: string;
}

// ── Input types ──────────────────────────────────────────────────────────────

export interface CreateTouristPointInput {
  location_id: string;
  slug?: string;
  title: string;
  summary: string;
  description: string;
  address_text?: string | null;
  price_type: PriceType;
  price_text?: string | null;
  opening_hours?: string | null;
  accessibility_notes?: string | null;
  official_url?: string | null;
  is_featured?: boolean;
  status?: TouristPointStatus;
}

export type UpdateTouristPointInput = Partial<CreateTouristPointInput> & {
  updated_by?: string | null;
};

// ── Query filters ────────────────────────────────────────────────────────────

export interface TouristPointQueryFilters {
  /** IDs de location para filtro territorial (location ou grupo) */
  location_ids: string[];
  status?: TouristPointStatus;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

// ── Slug generation ──────────────────────────────────────────────────────────

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Re-export categories
export * from './categories';
