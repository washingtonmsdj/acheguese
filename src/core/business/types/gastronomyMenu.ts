/**
 * Gastronomy menu contracts - Core SSOT.
 *
 * Persistence/read-model contracts live here. Cart and checkout presentation
 * state remain module-owned because they depend on the checkout flow.
 */
import type { Json } from '@/integrations/supabase';

export interface Menu {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  available_days?: number[];
  available_start_time?: string;
  available_end_time?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  menu_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  preparation_time?: number;
  calories?: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_lactose_free: boolean;
  is_spicy: boolean;
  spicy_level?: number;
  ingredients?: string[];
  allergens?: string[];
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface MenuItemVariant {
  id: string;
  item_id: string;
  name: string;
  description?: string;
  price_adjustment: number;
  is_default: boolean;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemAddon {
  id: string;
  item_id: string;
  name: string;
  description?: string;
  price: number;
  max_quantity: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemAvailability {
  id: string;
  item_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export type DiscountType = 'percentage' | 'fixed_amount' | 'buy_x_get_y';

export interface MenuPromotion {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  rules: Json;
  applicable_items: string[];
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItemWithRelations extends MenuItem {
  variants?: MenuItemVariant[];
  addons?: MenuItemAddon[];
  availability?: MenuItemAvailability[];
  category?: MenuCategory;
}

export interface MenuWithCategories extends Menu {
  categories: (MenuCategory & {
    items: MenuItemWithRelations[];
  })[];
}

export interface PublicGastronomyFoodItem {
  id: string;
  business_data_id: string;
  business_profile_id: string;
  menu_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  image_url?: string;
  category: string;
  tags: string[];
  business_name: string;
  business_slug: string;
  business_cuisine: string;
  business_rating: number;
  business_neighborhood: string;
  business_geographic_path: string;
  business_latitude?: number;
  business_longitude?: number;
  business_is_open: boolean;
  business_delivery_enabled: boolean;
  business_takeout_enabled: boolean;
  business_delivery_time_min?: number;
  business_delivery_time_max?: number;
  business_delivery_fee?: number;
  is_featured: boolean;
  is_promotion: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  is_gluten_free: boolean;
  orders_count: number;
}

export interface CreateMenuInput {
  business_id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
  available_days?: number[];
  available_start_time?: string;
  available_end_time?: string;
}

export type UpdateMenuInput = Partial<CreateMenuInput>;

export interface CreateMenuCategoryInput {
  menu_id: string;
  name: string;
  description?: string;
  display_order?: number;
  is_available?: boolean;
}

export type UpdateMenuCategoryInput = Partial<CreateMenuCategoryInput>;

export interface CreateMenuItemInput {
  category_id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  preparation_time?: number;
  calories?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_lactose_free?: boolean;
  is_spicy?: boolean;
  spicy_level?: number;
  ingredients?: string[];
  allergens?: string[];
  is_available?: boolean;
  is_featured?: boolean;
  display_order?: number;
  metadata?: Json;
}

export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

export interface CreateMenuItemVariantInput {
  item_id: string;
  name: string;
  description?: string;
  price_adjustment: number;
  is_default?: boolean;
  is_available?: boolean;
  display_order?: number;
}

export type UpdateMenuItemVariantInput = Partial<CreateMenuItemVariantInput>;

export interface CreateMenuItemAddonInput {
  item_id: string;
  name: string;
  description?: string;
  price: number;
  max_quantity?: number;
  is_available?: boolean;
  display_order?: number;
}

export type UpdateMenuItemAddonInput = Partial<CreateMenuItemAddonInput>;

export interface CreateMenuPromotionInput {
  business_id: string;
  title: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  rules?: Json;
  applicable_items?: string[];
  valid_from: string;
  valid_until: string;
  is_active?: boolean;
}

export type UpdateMenuPromotionInput = Partial<CreateMenuPromotionInput>;

export interface MenuItemFilters {
  category_id?: string;
  is_featured?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_gluten_free?: boolean;
  is_lactose_free?: boolean;
  search?: string;
}
