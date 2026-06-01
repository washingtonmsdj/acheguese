import {
  Building2,
  Church,
  Dumbbell,
  FerrisWheel,
  Footprints,
  Landmark,
  Leaf,
  MapPin,
  Mountain,
  ShoppingBag,
  Store,
  Theater,
  Trees,
  Utensils,
  Waves,
  type LucideIcon,
} from 'lucide-react';

/**
 * Tourist points types - SSOT.
 *
 * Canonical public/admin contract for tourist points in any Brazilian city.
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
  praca: 'Praça',
  trilha: 'Trilha',
  igreja: 'Igreja',
  mercado: 'Mercado',
  'centro-cultural': 'Centro cultural',
  'ar-livre': 'Ar livre',
  outro: 'Outro',
};

export const CATEGORY_ICONS: Record<TouristPointCategory, LucideIcon> = {
  historico: Landmark,
  natural: Leaf,
  religioso: Church,
  cultural: Theater,
  gastronomico: Utensils,
  praia: Waves,
  parque: Trees,
  mirante: Mountain,
  museu: Landmark,
  monumento: Landmark,
  arquitetonico: Building2,
  esportivo: Dumbbell,
  entretenimento: FerrisWheel,
  compras: ShoppingBag,
  praca: Landmark,
  trilha: Footprints,
  igreja: Church,
  mercado: Store,
  'centro-cultural': Theater,
  'ar-livre': Trees,
  outro: MapPin,
};

export const CATEGORY_MARKER_ABBR: Record<TouristPointCategory, string> = {
  historico: 'H',
  natural: 'N',
  religioso: 'R',
  cultural: 'C',
  gastronomico: 'G',
  praia: 'P',
  parque: 'PQ',
  mirante: 'M',
  museu: 'MU',
  monumento: 'MO',
  arquitetonico: 'A',
  esportivo: 'E',
  entretenimento: 'EN',
  compras: 'CO',
  praca: 'PR',
  trilha: 'T',
  igreja: 'I',
  mercado: 'ME',
  'centro-cultural': 'CC',
  'ar-livre': 'AR',
  outro: '?',
};

export const TouristPointStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type TouristPointStatus = typeof TouristPointStatus[keyof typeof TouristPointStatus];

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
  range: 'Faixa de preço',
  consult: 'Consultar',
};

export const PRICE_TYPE = PriceType;
export const TOURIST_POINT_STATUS = TouristPointStatus;

export const TOURIST_POINT_STATUS_LABELS: Record<TouristPointStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};

export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  location_id: string | null;
  address_id: string | null;
  location?: {
    name: string;
    full_name: string;
    geographic_path: string | null;
  } | null;
  address?: {
    street: string | null;
    number: string | null;
    complement: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  neighborhood: string | null;
  address_text: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  gallery_urls: string[];
  visiting_hours: string | null;
  entry_fee: string | null;
  price_type: PriceType;
  price_text: string | null;
  website: string | null;
  phone: string | null;
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
  location_id?: string;
  address_id?: string;
  neighborhood?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  gallery_urls?: string[];
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
  location_id?: string;
  state?: string;
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
