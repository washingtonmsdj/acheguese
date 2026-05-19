/**
 * Tourist Points Types - SSOT
 * 
 * Tipos canônicos para pontos turísticos.
 * Escalável para qualquer cidade do Brasil.
 */

export const TouristPointCategory = {
  HISTORICO: 'historico',
  NATURAL: 'natural',
  RELIGIOSO: 'religioso',
  CULTURAL: 'cultural',
  GASTRONOMICO: 'gastronomico',
  PRAIA: 'praia',
  PARQUE: 'parque',
  MIRANTE: 'mirante',
  MUSEU: 'museu',
  MONUMENTO: 'monumento',
  ARQUITETONICO: 'arquitetonico',
  ESPORTIVO: 'esportivo',
  ENTRETENIMENTO: 'entretenimento',
  COMPRAS: 'compras',
  PRACA: 'praca',
  TRILHA: 'trilha',
  IGREJA: 'igreja',
  MERCADO: 'mercado',
  CENTRO_CULTURAL: 'centro-cultural',
  AR_LIVRE: 'ar-livre',
  OUTRO: 'outro',
} as const;

export type TouristPointCategory = typeof TouristPointCategory[keyof typeof TouristPointCategory];

export const CATEGORY_LABELS: Record<TouristPointCategory, string> = {
  historico: 'Histórico',
  natural: 'Natural',
  religioso: 'Religioso',
  cultural: 'Cultural',
  gastronomico: 'Gastronômico',
  praia: 'Praia',
  parque: 'Parque',
  mirante: 'Mirante',
  museu: 'Museu',
  monumento: 'Monumento',
  arquitetonico: 'Arquitetônico',
  esportivo: 'Esportivo',
  entretenimento: 'Entretenimento',
  compras: 'Compras',
  praca: 'Praca',
  trilha: 'Trilha',
  igreja: 'Igreja',
  mercado: 'Mercado',
  'centro-cultural': 'Centro Cultural',
  'ar-livre': 'Ar Livre',
  outro: 'Outro',
};

export const CATEGORY_ICONS: Record<TouristPointCategory, string> = {
  historico: '🏛️',
  natural: '🌿',
  religioso: '⛪',
  cultural: '🎭',
  gastronomico: '🍽️',
  praia: '🏖️',
  parque: '🌳',
  mirante: '🏔️',
  museu: '🏛️',
  monumento: '🗿',
  arquitetonico: '🏗️',
  esportivo: '⚽',
  entretenimento: '🎡',
  compras: '🛍️',
  praca: '🏛️',
  trilha: '🥾',
  igreja: '⛪',
  mercado: '🛒',
  'centro-cultural': '🎭',
  'ar-livre': '🌳',
  outro: '📍',
};

export const TouristPointStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_REVIEW: 'pending_review',
} as const;

export type TouristPointStatus = typeof TouristPointStatus[keyof typeof TouristPointStatus];

/** Tipo de preço do ponto turístico */
export const PriceType = {
  FREE: 'free',
  PAID: 'paid',
  RANGE: 'range',
  CONSULT: 'consult',
} as const;

export type PriceType = typeof PriceType[keyof typeof PriceType];

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  free: 'Gratuito',
  paid: 'Pago',
  range: 'Faixa de preco',
  consult: 'Consultar',
};
export const PRICE_TYPE = PriceType;
export const TOURIST_POINT_STATUS = TouristPointStatus;
export const TOURIST_POINT_STATUS_LABELS: Record<TouristPointStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
  active: 'Ativo',
  inactive: 'Inativo',
  pending_review: 'Em revisao',
};

export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Nível de acessibilidade */
export const AccessibilityLevel = {
  FULL: 'total',
  PARTIAL: 'parcial',
  NONE: 'nenhuma',
  UNKNOWN: 'desconhecido',
} as const;

export type AccessibilityLevel = typeof AccessibilityLevel[keyof typeof AccessibilityLevel];

export const ACCESSIBILITY_LABELS: Record<AccessibilityLevel, string> = {
  total: 'Totalmente acessível',
  parcial: 'Parcialmente acessível',
  nenhuma: 'Não acessível',
  desconhecido: 'Não informado',
};

export interface TouristPoint {
  id: string;
  title?: string;
  summary?: string;
  opening_hours?: string | null;
  media?: TouristPointMedia[];
  accessibility_notes?: string | null;
  official_url?: string | null;
  updated_by?: string | null;
  name: string;
  slug: string;
  description: string;
  short_description: string | null;
  category: TouristPointCategory;
  tags: string[];
  state: string;
  city: string;

  // ── Canônico SSOT (mesmo padrão de business_data) ──────────────────
  /** Território principal obrigatório — bairro/cidade (FK locations) */
  location_id: string | null;
  /** Endereço físico detalhado opcional (FK addresses) */
  address_id: string | null;
  /** Relação carregada via join com locations */
  location?: {
    name: string;
    full_name: string;
    geographic_path: string | null;
  } | null;
  /** Relação carregada via join com addresses */
  address?: {
    street: string | null;
    number: string | null;
    complement: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;

  // ── Legado (mantido para compatibilidade com mock data) ────────────
  /** @deprecated Use location.name */
  neighborhood: string | null;
  /** @deprecated Use address fields */
  address_text: string | null;
  /** @deprecated Use address.latitude */
  latitude: number | null;
  /** @deprecated Use address.longitude */
  longitude: number | null;

  photo_url: string | null;
  gallery_urls: string[];
  icon_emoji: string;
  visiting_hours: string | null;
  /** @deprecated Use price_type + price_text */
  entry_fee: string | null;
  price_type: PriceType;
  price_text: string | null;
  website: string | null;
  phone: string | null;
  /** @deprecated Use accessibility_level */
  accessibility: boolean;
  accessibility_level: AccessibilityLevel;
  accessibility_description: string | null;
  has_parking: boolean;
  has_restaurant: boolean;
  has_guide: boolean;
  is_featured: boolean;
  display_order: number;
  rating: number;
  total_reviews: number;
  status: TouristPointStatus;
  published_at?: string | null;
  observations: string | null;
  nearby_point_ids: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTouristPointInput {
  title?: string;
  summary?: string;
  opening_hours?: string;
  accessibility_notes?: string;
  official_url?: string;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  category?: TouristPointCategory;
  tags?: string[];
  state?: string;
  city?: string;
  // Canônico
  location_id?: string;
  address_id?: string;
  // Legado (aceito na criação para compatibilidade)
  neighborhood?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  gallery_urls?: string[];
  icon_emoji?: string;
  visiting_hours?: string;
  entry_fee?: string;
  price_type?: PriceType;
  price_text?: string;
  website?: string;
  phone?: string;
  accessibility?: boolean;
  accessibility_level?: AccessibilityLevel;
  accessibility_description?: string;
  has_parking?: boolean;
  has_restaurant?: boolean;
  has_guide?: boolean;
  is_featured?: boolean;
  display_order?: number;
  observations?: string;
  nearby_point_ids?: string[];
}

export type UpdateTouristPointInput = Partial<CreateTouristPointInput> & {
  status?: TouristPointStatus;
};

export interface TouristPointFilters {
  /** SSOT: Filtro por location_id (bairro/cidade) */
  location_id?: string;
  /** @deprecated Use location_id - mantido para compatibilidade */
  state?: string;
  /** @deprecated Use location_id - mantido para compatibilidade */
  city?: string;
  category?: TouristPointCategory;
  is_featured?: boolean;
  search?: string;
  status?: TouristPointStatus;
  limit?: number;
  offset?: number;
}

export interface TouristPointMedia {
  id: string;
  tourist_point_id?: string;
  url: string;
  alt_text: string | null;
  is_cover: boolean;
  display_order: number;
  created_at?: string;
}

export type TouristPointQueryFilters = TouristPointFilters & {
  location_ids?: string[];
};

