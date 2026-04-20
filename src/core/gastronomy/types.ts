/**
 * core/gastronomy/types.ts — Tipos canônicos do vertical Gastronomia
 *
 * Vivem no core para que o GastronomyProfileService possa importá-los
 * sem depender de modules/gastronomy.
 *
 * O módulo modules/gastronomy re-exporta daqui via types/gastronomy.ts.
 */

import type { Json } from '@/integrations/supabase';
import type { Business } from '@/core/business';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type GastronomyStatus = 'active' | 'inactive' | 'temporarily_closed';

export interface GastronomyProfile {
  id: string;
  business_id: string;
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

export interface CartItemVariant {
  variant_id: string;
  name: string;
  price_adjustment: number;
}

export interface CartItemAddon {
  addon_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  line_id?: string;
  item_id: string;
  name: string;
  base_price: number;
  quantity: number;
  variant?: CartItemVariant;
  addons: CartItemAddon[];
  special_instructions?: string;
  subtotal: number;
}

export interface Cart {
  business_id: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}
