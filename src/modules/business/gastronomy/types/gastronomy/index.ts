import type { Business } from '@/core/business';
import type { TerritoryFilter } from '@/core/location/types';
import type { Json } from '@/core/infrastructure/supabase';
import type { GastronomyProfileStatus } from '@/core/business/constants';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type GastronomyStatus = GastronomyProfileStatus;

export interface GastronomyProfile {
  id: string;
  business_id: string;
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
  emoji: string;
  created_at: string;
  time_ago: string;
}

export interface GastronomyActivityFilters {
  territoryFilter?: TerritoryFilter;
  limit?: number;
  types?: ActivityType[];
}

export type { CuisineType } from '../../constants/cuisine';

