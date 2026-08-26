import type { CartItemAddon, MenuItemWithRelations } from "../../types/menu";
import type { PizzaPriceRuleType } from "@/core/business/niches/pizzaria/types";

export type {
  PizzaPriceRuleType,
  PizzaNicheConfig,
  PizzaSize,
  PizzaFlavor,
  PizzaEdge,
  PizzaDough,
  PizzaCatalog,
} from "@/core/business/niches/pizzaria/types";

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
