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

export interface PizzaCatalog {
  config: PizzaNicheConfig;
  sizes: PizzaSize[];
  flavors: PizzaFlavor[];
  edges: PizzaEdge[];
  doughs: PizzaDough[];
}
