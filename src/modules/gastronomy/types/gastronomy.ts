/**
 * Tipos do módulo de Gastronomia
 *
 * Tipos de contrato (GastronomyProfile, inputs) vivem em core/gastronomy/types.ts
 * e são re-exportados aqui para consumo interno do módulo.
 */

import type { Business } from '@/core/business';
import type { Json } from '@/core/supabase';

// Re-exporta tipos canônicos do core (SSOT)
export type {
  PriceRange,
  GastronomyStatus,
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
} from '@/core/gastronomy/types';

// ============================================================================
// GASTRONOMY BUSINESS (Business + GastronomyProfile) — específico do módulo
// ============================================================================

import type { GastronomyProfile } from '@/core/gastronomy/types';

export interface GastronomyBusiness extends Business {
  business_data_id: string;
  gastronomy_profile: GastronomyProfile;
}

// ============================================================================
// FILTERS — específico do módulo
// ============================================================================

import type { PriceRange } from '@/core/gastronomy/types';

export interface GastronomyBusinessFilters {
  cuisine_type?: string;
  price_range?: PriceRange;
  delivery_enabled?: boolean;
  takeout_enabled?: boolean;
  dine_in_enabled?: boolean;
  accepts_reservations?: boolean;
  has_parking?: boolean;
  has_wifi?: boolean;
  has_accessibility?: boolean;
  is_open_now?: boolean;
  search?: string;
  territoryFilter?: import('@/core/location/types').TerritoryFilter;
}

// ============================================================================
// CUISINE TYPE
// ============================================================================

export type { CuisineType } from '../constants/cuisine';

// ============================================================================
// OPENING STATUS
// ============================================================================

export interface OpeningStatus {
  is_open: boolean;
  status_text: string;
  next_change?: {
    time: string;
    action: 'opens' | 'closes';
  };
}

// ============================================================================
// DELIVERY INFO
// ============================================================================

export interface DeliveryInfo {
  enabled: boolean;
  fee?: number;
  time_min?: number;
  time_max?: number;
  minimum_order?: number;
}


// ============================================================================
// GASTRONOMY PROFILE
// ============================================================================

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type GastronomyStatus = 'active' | 'inactive' | 'temporarily_closed';

export interface GastronomyProfile {
  id: string;
  business_id: string;
  cuisine_type: string;
  cuisine_subtypes: string[];
  price_range: PriceRange;
  
  // Modos de atendimento
  delivery_enabled: boolean;
  takeout_enabled: boolean;
  dine_in_enabled: boolean;
  
  // Informações de entrega
  delivery_fee?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  minimum_order?: number;
  
  // Área de atendimento: usar CoverageService (core/coverage)
  // NÃO duplicar SSOT
  
  // Recursos
  accepts_reservations: boolean;
  has_parking: boolean;
  has_wifi: boolean;
  has_accessibility: boolean;
  has_kids_area: boolean;
  has_live_music: boolean;
  
  // Capacidade
  seating_capacity?: number;
  
  // Status
  status: GastronomyStatus;
  
  // Metadados
  metadata: Json;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GASTRONOMY BUSINESS (Business + GastronomyProfile)
// ============================================================================

export interface GastronomyBusiness extends Business {
  business_data_id: string;
  gastronomy_profile: GastronomyProfile;
}

// ============================================================================
// FILTERS
// ============================================================================

export interface GastronomyBusinessFilters {
  cuisine_type?: string;
  price_range?: PriceRange;
  delivery_enabled?: boolean;
  takeout_enabled?: boolean;
  dine_in_enabled?: boolean;
  accepts_reservations?: boolean;
  has_parking?: boolean;
  has_wifi?: boolean;
  has_accessibility?: boolean;
  is_open_now?: boolean;
  search?: string;
  
  // Filtros territoriais (herdados de Business)
  territoryFilter?: import('@/core/location/types').TerritoryFilter;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateGastronomyProfileInput {
  business_id: string;
  cuisine_type: string;
  cuisine_subtypes?: string[];
  price_range: PriceRange;
  
  delivery_enabled?: boolean;
  takeout_enabled?: boolean;
  dine_in_enabled?: boolean;
  
  delivery_fee?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  minimum_order?: number;
  
  // Área de atendimento: usar CoverageService
  // service_area removido - usar core/coverage
  
  accepts_reservations?: boolean;
  has_parking?: boolean;
  has_wifi?: boolean;
  has_accessibility?: boolean;
  has_kids_area?: boolean;
  has_live_music?: boolean;
  
  seating_capacity?: number;
  
  metadata?: Json;
}

export interface UpdateGastronomyProfileInput extends Partial<CreateGastronomyProfileInput> {
  status?: GastronomyStatus;
}

// ============================================================================
// CUISINE TYPE (apenas o tipo - runtime está em constants/cuisine.ts)
// ============================================================================

export type { CuisineType } from '../constants/cuisine';

// ============================================================================
// OPENING STATUS
// ============================================================================

export interface OpeningStatus {
  is_open: boolean;
  status_text: string; // "Aberto agora", "Fechado", "Abre às 18h"
  next_change?: {
    time: string;
    action: 'opens' | 'closes';
  };
}

// ============================================================================
// DELIVERY INFO
// ============================================================================

export interface DeliveryInfo {
  enabled: boolean;
  fee?: number;
  time_min?: number;
  time_max?: number;
  minimum_order?: number;
  // service_area obtido via CoverageService
}

// ============================================================================
// ACTIVITY FEED — Atividades dos Vizinhos
// ============================================================================

/**
 * Tipos de atividade que podem ser compartilhadas
 * 
 * - review: Automático (reviews são públicas)
 * - favorite: Automático (curtidas são públicas)
 * - order: Requer confirmação opt-in
 * - visit: Requer confirmação opt-in (futuro - check-ins)
 */
export type ActivityType = 
  | 'review'      // Avaliou com X★
  | 'favorite'    // Favoritou/Recomendou
  | 'order'       // Fez pedido/delivery
  | 'visit';      // Visitou (futuro - check-in)

/**
 * Atividade de gastronomia para feed social
 */
export interface GastronomyActivity {
  id: string;
  type: ActivityType;
  
  // Usuário que realizou a ação
  user_name: string;
  user_avatar: string | null;
  
  // Estabelecimento relacionado
  business_id: string;
  business_name: string;
  business_slug: string;
  
  // Descrição da ação
  action_label: string;  // "avaliou com 5★", "pediu delivery de", "recomendou"
  emoji: string;         // "⭐", "🛵", "👍", "📍"
  
  // Temporal
  created_at: string;
  time_ago: string;      // "2h atrás", "1 dia", "há 3 dias"
}

/**
 * Filtros para buscar atividades
 */
export interface GastronomyActivityFilters {
  territoryFilter?: import('@/core/location/types').TerritoryFilter;
  limit?: number;
  types?: ActivityType[];
}

