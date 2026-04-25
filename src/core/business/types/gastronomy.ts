/**
 * 🍽️ GASTRONOMY TYPES - Core SSOT
 *
 * Tipos base para operações de gastronomia no core
 * Essenciais para queries/mutations de dados
 *
 * @version 3.0.0 - Core SSOT
 */

import type { Business } from './Business';
import type { TerritoryFilter } from '@/core/location/types';
import type { Json } from '@/integrations/supabase';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type GastronomyStatus = 'active' | 'inactive' | 'temporarily_closed';

export interface GastronomyProfile {
  id: string;
  business_id: string;
  /** Nicho gastronômico especializado (SSOT: modules/business/gastronomy/niches) */
  niche_key?: string;
  cuisine_type: string;
  cuisine_subtypes: string[];
  price_range: PriceRange;
  delivery_enabled: boolean;
  takeout_enabled: boolean;
  dine_in_enabled: boolean;
  delivery_fee?: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  minimum_order?: number;
  accepts_reservations: boolean;
  has_parking: boolean;
  has_wifi: boolean;
  has_accessibility: boolean;
  has_kids_area: boolean;
  has_live_music: boolean;
  seating_capacity?: number;
  status: GastronomyStatus;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface CreateGastronomyProfileInput {
  business_id: string;
  /** Nicho gastronômico especializado (SSOT: modules/business/gastronomy/niches) */
  niche_key?: string;
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

export interface GastronomyBusiness extends Business {
  business_data_id: string;
  gastronomy_profile: GastronomyProfile;
}

export interface GastronomyBusinessFilters {
  niche_key?: string;
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
  territoryFilter?: TerritoryFilter;
}

export interface TerritorySlugParams {
  state: string;
  city: string;
  district: string;
  slug: string;
}

export interface PaginatedGastronomyBusinesses {
  businesses: GastronomyBusiness[];
  nextPage: number | null;
  totalCount: number;
}
