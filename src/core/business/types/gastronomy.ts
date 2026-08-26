/**
 * Gastronomy types - Core SSOT.
 *
 * Shared contracts for Gastronomy persistence/read models. Product/UI-only
 * contracts may extend these in the module, but must not redefine them.
 */

import type { Business } from './Business';
import type { TerritoryFilter } from '@/core/location/types';
import type { Json } from '@/integrations/supabase';
import type { GastronomyProfileStatus } from '@/core/business/constants/gastronomyProfileStatus';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';
export type GastronomyStatus = GastronomyProfileStatus;

export interface GastronomyProfile {
  id: string;
  business_id: string;
  /** Opaque specialized niche key resolved by the vertical/niche layer. */
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

export interface OpeningStatus {
  is_open: boolean;
  status_text: string;
  next_change?: {
    time: string;
    action: 'opens' | 'closes';
  };
}

export interface DeliveryInfo {
  enabled: boolean;
  fee?: number;
  time_min?: number;
  time_max?: number;
  minimum_order?: number;
}

export type ActivityType = 'review' | 'favorite' | 'order' | 'visit';

export interface GastronomyActivity {
  id: string;
  type: ActivityType;
  user_name: string;
  user_avatar: string | null;
  business_id: string;
  business_name: string;
  business_slug: string;
  action_label: string;
  created_at: string;
  time_ago: string;
}

export interface GastronomyActivityFilters {
  territoryFilter?: TerritoryFilter;
  limit?: number;
  types?: ActivityType[];
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
