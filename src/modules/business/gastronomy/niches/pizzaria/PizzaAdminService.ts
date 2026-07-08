import { supabase } from "@/integrations/supabase";
import { BusinessOwnershipService } from "@/core/business/services/BusinessOwnershipService";
import { resolveGastronomyBusinessId } from "../../services/resolveGastronomyBusinessId";
import type {
  PizzaCatalog,
  PizzaDough,
  PizzaEdge,
  PizzaFlavor,
  PizzaNicheConfig,
  PizzaPriceRuleType,
  PizzaSize,
} from "./types";

type QueryError = { code?: string; message?: string } | null;
type QueryResult<T> = Promise<{ data: T; error: QueryError }>;

interface QueryBuilder<TRow> {
  select(columns?: string): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  update(values: unknown): QueryBuilder<TRow>;
  upsert(values: unknown, options?: { onConflict?: string }): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  single(): QueryResult<TRow>;
  then<TResult1 = { data: TRow[]; error: QueryError }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: TRow[]; error: QueryError }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface PizzaDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const pizzaDb = supabase as unknown as PizzaDbClient;

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

export interface PizzaMenuItemConfig {
  id: string;
  business_id: string;
  menu_item_id: string;
  is_buildable: boolean;
  default_size_id?: string | null;
  default_edge_id?: string | null;
  default_dough_id?: string | null;
}

async function requireOwnership(businessId: string, userId: string): Promise<void> {
  const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);
  await BusinessOwnershipService.requireOwnership(resolvedBusinessId, userId);
}

async function upsertTable<T>(
  table: "pizza_sizes" | "pizza_flavors" | "pizza_edges" | "pizza_doughs",
  businessId: string,
  input: Record<string, unknown>,
): Promise<T> {
  const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);
  const payload = {
    ...input,
    business_id: resolvedBusinessId,
    updated_at: new Date().toISOString(),
  };
  const inputId = typeof input.id === "string" ? input.id : null;

  const query = inputId
    ? pizzaDb.from<T>(table).update(payload).eq("id", inputId).select().single()
    : pizzaDb.from<T>(table).insert(payload).select().single();

  const { data, error } = await query;
  if (error) throw error;
  return data as T;
}

export class PizzaAdminService {
  static async getMenuItemConfig(
    businessId: string,
    menuItemId: string,
  ): Promise<PizzaMenuItemConfig | null> {
    const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);
    const { data, error } = await supabase
      .from("pizza_menu_items")
      .select("*")
      .eq("business_id", resolvedBusinessId)
      .eq("menu_item_id", menuItemId)
      .maybeSingle();

    if (error) throw error;
    return (data as PizzaMenuItemConfig | null) ?? null;
  }

  static async getCatalog(businessId: string): Promise<PizzaCatalog> {
    const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);
    const [configResult, sizesResult, flavorsResult, edgesResult, doughsResult] =
      await Promise.all([
        supabase
          .from("pizza_niche_configs")
          .select("*")
          .eq("business_id", resolvedBusinessId)
          .maybeSingle(),
        supabase
          .from("pizza_sizes")
          .select("*")
          .eq("business_id", resolvedBusinessId)
          .order("display_order", { ascending: true }),
        supabase
          .from("pizza_flavors")
          .select("*")
          .eq("business_id", resolvedBusinessId)
          .order("display_order", { ascending: true }),
        supabase
          .from("pizza_edges")
          .select("*")
          .eq("business_id", resolvedBusinessId)
          .order("display_order", { ascending: true }),
        supabase
          .from("pizza_doughs")
          .select("*")
          .eq("business_id", resolvedBusinessId)
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
        business_id: resolvedBusinessId,
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
    const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);

    const { data, error } = await supabase
      .from("pizza_niche_configs")
      .upsert(
        {
          business_id: resolvedBusinessId,
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
    return upsertTable<PizzaSize>("pizza_sizes", businessId, input as unknown as Record<string, unknown>);
  }

  static async upsertFlavor(
    businessId: string,
    input: UpsertPizzaFlavorInput,
    userId: string,
  ): Promise<PizzaFlavor> {
    await requireOwnership(businessId, userId);
    return upsertTable<PizzaFlavor>("pizza_flavors", businessId, input as unknown as Record<string, unknown>);
  }

  static async upsertEdge(
    businessId: string,
    input: UpsertPizzaEdgeInput,
    userId: string,
  ): Promise<PizzaEdge> {
    await requireOwnership(businessId, userId);
    return upsertTable<PizzaEdge>("pizza_edges", businessId, input as unknown as Record<string, unknown>);
  }

  static async upsertDough(
    businessId: string,
    input: UpsertPizzaDoughInput,
    userId: string,
  ): Promise<PizzaDough> {
    await requireOwnership(businessId, userId);
    return upsertTable<PizzaDough>("pizza_doughs", businessId, input as unknown as Record<string, unknown>);
  }

  static async setAvailability(
    table: "pizza_sizes" | "pizza_flavors" | "pizza_edges" | "pizza_doughs",
    id: string,
    isAvailable: boolean,
    businessId: string,
    userId: string,
  ): Promise<void> {
    await requireOwnership(businessId, userId);
    const resolvedBusinessId = await resolveGastronomyBusinessId(businessId);

    const { error } = await supabase
      .from(table)
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("business_id", resolvedBusinessId);

    if (error) throw error;
  }
}

