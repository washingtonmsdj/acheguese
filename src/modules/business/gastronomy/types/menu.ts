/**
 * Gastronomy menu compatibility surface.
 *
 * Menu persistence/read-model contracts are owned by core/business. Cart and
 * checkout state remain module-owned because they belong to the UI flow.
 */
import type { Json } from '@/integrations/supabase';
import type { GastronomyFulfillmentMode } from '../checkout/checkoutRules';

export type {
  Menu,
  MenuCategory,
  MenuItem,
  MenuItemVariant,
  MenuItemAddon,
  MenuItemAvailability,
  DiscountType,
  MenuPromotion,
  MenuItemWithRelations,
  MenuWithCategories,
  PublicGastronomyFoodItem,
  CreateMenuInput,
  UpdateMenuInput,
  CreateMenuCategoryInput,
  UpdateMenuCategoryInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  CreateMenuItemVariantInput,
  UpdateMenuItemVariantInput,
  CreateMenuItemAddonInput,
  UpdateMenuItemAddonInput,
  CreateMenuPromotionInput,
  UpdateMenuPromotionInput,
  MenuItemFilters,
} from '@/core/business/types/gastronomyMenu';

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

export interface StructuredCartItem {
  kind: 'pizza';
  snapshot: Json;
  price_breakdown: Json;
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
  structured_item?: StructuredCartItem;
  subtotal: number;
}

export interface Cart {
  business_id: string;
  fulfillment_mode?: GastronomyFulfillmentMode;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}
