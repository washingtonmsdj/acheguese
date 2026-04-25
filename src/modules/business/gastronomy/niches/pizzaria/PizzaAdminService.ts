import { supabase } from "@/integrations/supabase";
import { BusinessOwnershipService } from "@/core/business/services/BusinessOwnershipService";
import type {
  PizzaCatalog,
  PizzaDough,
  PizzaEdge,
  PizzaFlavor,
  PizzaNicheConfig,
  PizzaPriceRuleType,
  PizzaSize,
} from "./types";

function isMockBusinessId(businessId: string): boolean {
  return businessId.startsWith("mock-");
}

function buildMockPizzaCatalog(businessId: string): PizzaCatalog {
  const now = "2026-01-01T00:00:00.000Z";

  return {
    config: {
      id: `mock-pizza-config-${businessId}`,
      business_id: businessId,
      default_price_rule: "highest_price",
      allow_half_half: true,
      allow_three_flavors: true,
      allow_four_flavors: true,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    sizes: [
      { id: `mock-size-${businessId}-broto`, business_id: businessId, name: "Broto", slug: "broto", slices: 4, diameter_cm: 20, base_price: 10, max_flavors: 1, display_order: 1, is_available: true, created_at: now, updated_at: now },
      { id: `mock-size-${businessId}-media`, business_id: businessId, name: "Média", slug: "media", slices: 6, diameter_cm: 30, base_price: 15, max_flavors: 2, display_order: 2, is_available: true, created_at: now, updated_at: now },
      { id: `mock-size-${businessId}-grande`, business_id: businessId, name: "Grande", slug: "grande", slices: 8, diameter_cm: 35, base_price: 20, max_flavors: 3, display_order: 3, is_available: true, created_at: now, updated_at: now },
      { id: `mock-size-${businessId}-familia`, business_id: businessId, name: "Família", slug: "familia", slices: 12, diameter_cm: 45, base_price: 30, max_flavors: 4, display_order: 4, is_available: true, created_at: now, updated_at: now },
    ],
    flavors: [
      { id: `mock-flavor-${businessId}-calabresa`, business_id: businessId, name: "Calabresa", description: "Calabresa, cebola e orégano.", category: "tradicional", base_price: 40, is_available: true, is_vegetarian: false, is_vegan: false, is_spicy: false, allergens: [], ingredients: ["calabresa", "cebola", "orégano"], display_order: 1, created_at: now, updated_at: now },
      { id: `mock-flavor-${businessId}-portuguesa`, business_id: businessId, name: "Portuguesa", description: "Presunto, ovos, cebola, azeitona e queijo.", category: "tradicional", base_price: 50, is_available: true, is_vegetarian: false, is_vegan: false, is_spicy: false, allergens: ["ovo", "leite"], ingredients: ["presunto", "ovos", "cebola", "azeitona"], display_order: 2, created_at: now, updated_at: now },
      { id: `mock-flavor-${businessId}-frango-catupiry`, business_id: businessId, name: "Frango com Catupiry", description: "Frango desfiado e catupiry.", category: "especial", base_price: 60, is_available: true, is_vegetarian: false, is_vegan: false, is_spicy: false, allergens: ["leite"], ingredients: ["frango", "catupiry"], display_order: 3, created_at: now, updated_at: now },
      { id: `mock-flavor-${businessId}-marguerita`, business_id: businessId, name: "Marguerita", description: "Mozzarella, tomate e manjericão.", category: "vegetariana", base_price: 45, is_available: true, is_vegetarian: true, is_vegan: false, is_spicy: false, allergens: ["leite"], ingredients: ["mozzarella", "tomate", "manjericão"], display_order: 4, created_at: now, updated_at: now },
    ],
    edges: [
      { id: `mock-edge-${businessId}-catupiry`, business_id: businessId, name: "Catupiry", description: "Borda recheada com catupiry.", price: 8, is_available: true, display_order: 1, created_at: now, updated_at: now },
      { id: `mock-edge-${businessId}-cheddar`, business_id: businessId, name: "Cheddar", description: "Borda recheada com cheddar.", price: 8, is_available: true, display_order: 2, created_at: now, updated_at: now },
    ],
    doughs: [
      { id: `mock-dough-${businessId}-tradicional`, business_id: businessId, name: "Tradicional", description: "Massa tradicional.", price_adjustment: 0, is_available: true, display_order: 1, created_at: now, updated_at: now },
      { id: `mock-dough-${businessId}-fina`, business_id: businessId, name: "Fina", description: "Massa fina e crocante.", price_adjustment: 0, is_available: true, display_order: 2, created_at: now, updated_at: now },
      { id: `mock-dough-${businessId}-pan`, business_id: businessId, name: "Pan", description: "Massa pan.", price_adjustment: 5, is_available: true, display_order: 3, created_at: now, updated_at: now },
    ],
  };
}

export interface UpsertPizzaConfigInput {
  default_price_rule?: PizzaPriceRuleType;
  allow_half_half?: boolean;
  allow_three_flavors?: boolean;
  allow_four_flavors?: boolean;
  is_active?: boolean;
}

export interface UpsertPizzaSizeInput {
  id?: string;
  name: string;
  slug: string;
  slices?: number | null;
  diameter_cm?: number | null;
  base_price: number;
  max_flavors: number;
  display_order?: number;
  is_available?: boolean;
}

export interface UpsertPizzaFlavorInput {
  id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  base_price: number;
  is_available?: boolean;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  is_spicy?: boolean;
  allergens?: string[];
  ingredients?: string[];
  display_order?: number;
}

export interface UpsertPizzaEdgeInput {
  id?: string;
  name: string;
  description?: string | null;
  price: number;
  is_available?: boolean;
  display_order?: number;
}

export interface UpsertPizzaDoughInput {
  id?: string;
  name: string;
  description?: string | null;
  price_adjustment: number;
  is_available?: boolean;
  display_order?: number;
}

async function requireOwnership(businessId: string, userId: string): Promise<void> {
  await BusinessOwnershipService.requireOwnership(businessId, userId);
}

async function upsertTable<T>(
  table: string,
  businessId: string,
  input: Record<string, unknown>,
): Promise<T> {
  const payload = {
    ...input,
    business_id: businessId,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? supabase.from(table).update(payload).eq("id", input.id).select().single()
    : supabase.from(table).insert(payload).select().single();

  const { data, error } = await query;
  if (error) throw error;
  return data as T;
}

export class PizzaAdminService {
  static async getCatalog(businessId: string): Promise<PizzaCatalog> {
    if (isMockBusinessId(businessId)) {
      return buildMockPizzaCatalog(businessId);
    }

    const [configResult, sizesResult, flavorsResult, edgesResult, doughsResult] =
      await Promise.all([
        supabase
          .from("pizza_niche_configs")
          .select("*")
          .eq("business_id", businessId)
          .maybeSingle(),
        supabase
          .from("pizza_sizes")
          .select("*")
          .eq("business_id", businessId)
          .order("display_order", { ascending: true }),
        supabase
          .from("pizza_flavors")
          .select("*")
          .eq("business_id", businessId)
          .order("display_order", { ascending: true }),
        supabase
          .from("pizza_edges")
          .select("*")
          .eq("business_id", businessId)
          .order("display_order", { ascending: true }),
        supabase
          .from("pizza_doughs")
          .select("*")
          .eq("business_id", businessId)
          .order("display_order", { ascending: true }),
      ]);

    if (configResult.error) throw configResult.error;
    if (sizesResult.error) throw sizesResult.error;
    if (flavorsResult.error) throw flavorsResult.error;
    if (edgesResult.error) throw edgesResult.error;
    if (doughsResult.error) throw doughsResult.error;

    const config =
      (configResult.data as PizzaNicheConfig | null) ??
      ({
        id: "local-default",
        business_id: businessId,
        default_price_rule: "highest_price",
        allow_half_half: true,
        allow_three_flavors: true,
        allow_four_flavors: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } satisfies PizzaNicheConfig);

    return {
      config,
      sizes: (sizesResult.data ?? []) as PizzaSize[],
      flavors: (flavorsResult.data ?? []) as PizzaFlavor[],
      edges: (edgesResult.data ?? []) as PizzaEdge[],
      doughs: (doughsResult.data ?? []) as PizzaDough[],
    };
  }

  static async upsertConfig(
    businessId: string,
    input: UpsertPizzaConfigInput,
    userId: string,
  ): Promise<PizzaNicheConfig> {
    await requireOwnership(businessId, userId);

    const { data, error } = await supabase
      .from("pizza_niche_configs")
      .upsert(
        {
          business_id: businessId,
          default_price_rule: input.default_price_rule ?? "highest_price",
          allow_half_half: input.allow_half_half ?? true,
          allow_three_flavors: input.allow_three_flavors ?? true,
          allow_four_flavors: input.allow_four_flavors ?? true,
          is_active: input.is_active ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" },
      )
      .select()
      .single();

    if (error) throw error;
    return data as PizzaNicheConfig;
  }

  static async upsertSize(
    businessId: string,
    input: UpsertPizzaSizeInput,
    userId: string,
  ): Promise<PizzaSize> {
    await requireOwnership(businessId, userId);
    return upsertTable<PizzaSize>("pizza_sizes", businessId, input);
  }

  static async upsertFlavor(
    businessId: string,
    input: UpsertPizzaFlavorInput,
    userId: string,
  ): Promise<PizzaFlavor> {
    await requireOwnership(businessId, userId);
    return upsertTable<PizzaFlavor>("pizza_flavors", businessId, input);
  }

  static async upsertEdge(
    businessId: string,
    input: UpsertPizzaEdgeInput,
    userId: string,
  ): Promise<PizzaEdge> {
    await requireOwnership(businessId, userId);
    return upsertTable<PizzaEdge>("pizza_edges", businessId, input);
  }

  static async upsertDough(
    businessId: string,
    input: UpsertPizzaDoughInput,
    userId: string,
  ): Promise<PizzaDough> {
    await requireOwnership(businessId, userId);
    return upsertTable<PizzaDough>("pizza_doughs", businessId, input);
  }

  static async setAvailability(
    table: "pizza_sizes" | "pizza_flavors" | "pizza_edges" | "pizza_doughs",
    id: string,
    isAvailable: boolean,
    businessId: string,
    userId: string,
  ): Promise<void> {
    await requireOwnership(businessId, userId);

    const { error } = await supabase
      .from(table)
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) throw error;
  }
}
