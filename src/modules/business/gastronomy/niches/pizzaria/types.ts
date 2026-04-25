import type { CartItemAddon, MenuItemWithRelations } from "../../types/menu";

export type PizzaPriceRuleType =
  | "highest_price"
  | "average_price"
  | "weighted_average"
  | "fixed_base_plus_flavors";

export interface PizzaNicheConfig {
  id: string;
  business_id: string;
  default_price_rule: PizzaPriceRuleType;
  allow_half_half: boolean;
  allow_three_flavors: boolean;
  allow_four_flavors: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PizzaSize {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  slices?: number | null;
  diameter_cm?: number | null;
  base_price: number;
  max_flavors: number;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface PizzaFlavor {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  base_price: number;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  allergens: string[];
  ingredients: string[];
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PizzaEdge {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  price: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PizzaDough {
  id: string;
  business_id: string;
  name: string;
  description?: string | null;
  price_adjustment: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PizzaFlavorSelection {
  flavor_id: string;
  fraction: number;
}

export interface PizzaBuildSelection {
  item: MenuItemWithRelations;
  business_id: string;
  size_id: string;
  flavors: PizzaFlavorSelection[];
  edge_id?: string | null;
  dough_id?: string | null;
  addon_quantities?: Record<string, number>;
  quantity?: number;
  price_rule?: PizzaPriceRuleType;
}

export interface PizzaCatalog {
  config: PizzaNicheConfig;
  sizes: PizzaSize[];
  flavors: PizzaFlavor[];
  edges: PizzaEdge[];
  doughs: PizzaDough[];
}

export interface PizzaFlavorSnapshot {
  flavor_id: string;
  name: string;
  fraction: number;
  unit_price_at_purchase: number;
}

export interface PizzaSizeSnapshot {
  size_id: string;
  name: string;
  base_price: number;
  max_flavors: number;
  slices?: number | null;
  diameter_cm?: number | null;
}

export interface PizzaEdgeSnapshot {
  edge_id: string;
  name: string;
  price: number;
}

export interface PizzaDoughSnapshot {
  dough_id: string;
  name: string;
  price_adjustment: number;
}

export interface PizzaOrderItemSnapshot {
  item_id: string;
  item_name: string;
  niche_key: "pizza";
  size: PizzaSizeSnapshot;
  flavors: PizzaFlavorSnapshot[];
  flavor_count: number;
  price_rule: PizzaPriceRuleType;
  flavor_unit_price: number;
  edge: PizzaEdgeSnapshot | null;
  dough: PizzaDoughSnapshot | null;
  addons: CartItemAddon[];
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface PizzaPriceBreakdown {
  size_price: number;
  flavor_price: number;
  dough_price: number;
  edge_price: number;
  addons_total: number;
  unit_price: number;
  line_total: number;
}

export interface PizzaValidationResult {
  is_valid: boolean;
  errors: string[];
}
