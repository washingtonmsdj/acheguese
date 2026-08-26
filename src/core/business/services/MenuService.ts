/**
 * MenuService - SSOT de cardapio com validacao de plano.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { sanitizeString } from '@/shared/utils/sanitization';
import { SubscriptionService } from '@/core/billing/SubscriptionService';
import { EntitlementsService } from '@/core/billing/entitlements';
import { BillingPlanService, type PlanEntitlements } from '@/core/billing/services/BillingPlanService';
import { PlanTier } from '@/core/billing/types';
import { isMediaAssetReference, resolveMediaAssetSource } from '@/core/media';

type QueryResult<T> = Promise<{ data: T; error: { code?: string; message?: string } | null; count?: number | null }>;

interface QueryBuilder<TRow> {
  select(
    columns?: string,
    options?: { count?: "exact" | "planned" | "estimated"; head?: boolean },
  ): QueryBuilder<TRow>;
  insert(values: unknown): QueryBuilder<TRow>;
  update(values: unknown): QueryBuilder<TRow>;
  delete(): QueryBuilder<TRow>;
  eq(column: string, value: unknown): QueryBuilder<TRow>;
  in(column: string, values: readonly unknown[]): QueryBuilder<TRow>;
  not(column: string, operator: string, value: unknown): QueryBuilder<TRow>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<TRow>;
  maybeSingle(): QueryResult<TRow | null>;
  single(): QueryResult<TRow>;
  then<
    TResult1 = { data: TRow[]; error: { code?: string; message?: string } | null; count?: number | null },
    TResult2 = never,
  >(
    onfulfilled?:
      | ((value: { data: TRow[]; error: { code?: string; message?: string } | null; count?: number | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

interface MenuDbClient {
  from<TRow>(table: string): QueryBuilder<TRow>;
}

const db = supabase as unknown as MenuDbClient;

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export interface MenuCategory {
  id: string;
  menu_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  menu_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  image_reference: string | null;
  display_order: number;
  is_available: boolean;
  is_featured: boolean;
  preparation_time_min: number | null;
  stock_quantity: number | null;
  stock_alert_threshold: number | null;
  tags: string[] | null;
  allergens: string[] | null;
  nutritional_info: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItemVariation {
  id: string;
  item_id: string;
  name: string;
  description: string | null;
  price_adjustment: number;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

export interface MenuItemAddon {
  id: string;
  item_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  max_quantity: number;
  display_order: number;
  created_at: string;
}

export interface MenuCombo {
  id: string;
  menu_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuComboItem {
  id: string;
  combo_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
}

interface PlanContext {
  businessId: string;
  entitlements: PlanEntitlements;
}

type LooseRow = Record<string, unknown>;

function asRecord(value: unknown): LooseRow {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as LooseRow;
}

function hasImageUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getMenuItemNutritionInfo(value: unknown): LooseRow {
  return asRecord(value);
}

function buildMenuItemMetadata(params: {
  currentMetadata?: LooseRow;
  tags?: string[] | null;
  stockQuantity?: number | null;
  stockAlertThreshold?: number | null;
  nutritionalInfo?: LooseRow;
  preserveExisting?: boolean;
}): LooseRow {
  const {
    currentMetadata = {},
    tags,
    stockQuantity,
    stockAlertThreshold,
    nutritionalInfo = {},
    preserveExisting = false,
  } = params;

  const nextMetadata: LooseRow = preserveExisting ? { ...currentMetadata } : {};

  if (tags !== undefined) {
    nextMetadata.tags = tags;
  } else if (!preserveExisting && Array.isArray(currentMetadata.tags)) {
    nextMetadata.tags = currentMetadata.tags;
  }

  if (stockQuantity !== undefined) {
    nextMetadata.stock_quantity = stockQuantity;
  } else if (!preserveExisting && currentMetadata.stock_quantity !== undefined) {
    nextMetadata.stock_quantity = currentMetadata.stock_quantity;
  }

  if (stockAlertThreshold !== undefined) {
    nextMetadata.stock_alert_threshold = stockAlertThreshold;
  } else if (!preserveExisting && currentMetadata.stock_alert_threshold !== undefined) {
    nextMetadata.stock_alert_threshold = currentMetadata.stock_alert_threshold;
  }

  if (nutritionalInfo.pizza_visual !== undefined) {
    nextMetadata.pizza_visual = nutritionalInfo.pizza_visual;
  } else if (!preserveExisting && currentMetadata.pizza_visual !== undefined) {
    nextMetadata.pizza_visual = currentMetadata.pizza_visual;
  }

  return nextMetadata;
}

function mapMenuCategory(row: LooseRow): MenuCategory {
  return {
    id: String(row.id ?? ''),
    menu_id: String(row.menu_id ?? ''),
    name: String(row.name ?? ''),
    description: typeof row.description === 'string' ? row.description : null,
    display_order: typeof row.display_order === 'number' ? row.display_order : 0,
    is_active:
      typeof row.is_active === 'boolean'
        ? row.is_active
        : typeof row.is_available === 'boolean'
          ? row.is_available
          : true,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

function mapMenuItem(row: LooseRow, menuId?: string | null): MenuItem {
  const nestedCategory = asRecord(row.menu_categories);
  const metadata = asRecord(row.metadata);
  const nutritionalInfo =
    row.nutritional_info && typeof row.nutritional_info === 'object'
      ? row.nutritional_info
      : {
          calories: row.calories ?? undefined,
          is_vegetarian: row.is_vegetarian ?? false,
          is_vegan: row.is_vegan ?? false,
          is_gluten_free: row.is_gluten_free ?? false,
          is_lactose_free: row.is_lactose_free ?? false,
          is_spicy: row.is_spicy ?? false,
          spicy_level: row.spicy_level ?? undefined,
          ingredients: row.ingredients ?? [],
          pizza_visual: metadata.pizza_visual,
        };

  const rawImage = typeof row.image_url === 'string' ? row.image_url : null;
  const imageReference = isMediaAssetReference(rawImage) ? rawImage : null;

  return {
    id: String(row.id ?? ''),
    menu_id: String(row.menu_id ?? menuId ?? nestedCategory.menu_id ?? ''),
    category_id: typeof row.category_id === 'string' ? row.category_id : null,
    name: String(row.name ?? ''),
    description: typeof row.description === 'string' ? row.description : null,
    price: Number(row.price ?? row.base_price ?? 0),
    image_url: resolveMediaAssetSource(rawImage),
    image_reference: imageReference,
    display_order: typeof row.display_order === 'number' ? row.display_order : 0,
    is_available: typeof row.is_available === 'boolean' ? row.is_available : true,
    is_featured: typeof row.is_featured === 'boolean' ? row.is_featured : false,
    preparation_time_min:
      typeof row.preparation_time_min === 'number'
        ? row.preparation_time_min
        : typeof row.preparation_time === 'number'
          ? row.preparation_time
          : null,
    stock_quantity:
      typeof row.stock_quantity === 'number'
        ? row.stock_quantity
        : typeof metadata.stock_quantity === 'number'
          ? metadata.stock_quantity
          : null,
    stock_alert_threshold:
      typeof row.stock_alert_threshold === 'number'
        ? row.stock_alert_threshold
        : typeof metadata.stock_alert_threshold === 'number'
          ? metadata.stock_alert_threshold
          : null,
    tags: Array.isArray(row.tags)
      ? (row.tags as string[])
      : Array.isArray(metadata.tags)
        ? (metadata.tags as string[])
        : null,
    allergens: Array.isArray(row.allergens) ? (row.allergens as string[]) : null,
    nutritional_info: asRecord(nutritionalInfo),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  };
}

async function listCategoryIds(menuId: string): Promise<string[]> {
  const { data, error } = await db
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menuId);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row: { id: string }) => row.id);
}

async function resolveBusinessIdFromMenu(menuId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('menus')
    .select('business_id')
    .eq('id', menuId)
    .maybeSingle();

  if (!error && data?.business_id) {
    return String(data.business_id);
  }

  return null;
}

async function resolveMenuIdFromCategory(categoryId: string): Promise<string | null> {
  const { data, error } = await db
    .from('menu_categories')
    .select('menu_id')
    .eq('id', categoryId)
    .maybeSingle();

  const row = asRecord(data);
  if (error || !row.menu_id) {
    return null;
  }

  return String(row.menu_id);
}

async function resolveItem(itemId: string): Promise<Pick<MenuItem, 'id' | 'menu_id' | 'image_url'> | null> {
  const { data, error } = await db
    .from('menu_items')
    .select('id, image_url, menu_categories(menu_id)')
    .eq('id', itemId)
    .maybeSingle();

  const row = asRecord(data);
  const nestedCategory = asRecord(row.menu_categories);
  const menuId = nestedCategory.menu_id;
  if (error || !row.id || !menuId) {
    return null;
  }

  return {
    id: String(row.id),
    menu_id: String(menuId),
    image_url: typeof row.image_url === 'string' ? row.image_url : null,
  };
}

async function getEntitlementsForBusiness(businessId: string): Promise<PlanEntitlements> {
  const subscriptionResult = await SubscriptionService.getByBusinessId(businessId);

  const planTier = Object.values(PlanTier).includes(subscriptionResult.data?.plan_tier as PlanTier)
    ? (subscriptionResult.data?.plan_tier as PlanTier)
    : PlanTier.FREE;
  const dynamicEntitlements = await BillingPlanService.getEntitlements(planTier).catch(() => null);

  if (dynamicEntitlements) {
    return dynamicEntitlements;
  }

  return EntitlementsService.getAll(planTier);
}

async function getPlanContextByMenuId(menuId: string): Promise<PlanContext | null> {
  const businessId = await resolveBusinessIdFromMenu(menuId);
  if (!businessId) return null;

  const entitlements = await getEntitlementsForBusiness(businessId);
  return { businessId, entitlements };
}

async function getPlanContextByCategoryId(categoryId: string): Promise<PlanContext | null> {
  const menuId = await resolveMenuIdFromCategory(categoryId);
  if (!menuId) return null;
  return getPlanContextByMenuId(menuId);
}

async function getPlanContextByItemId(itemId: string): Promise<PlanContext | null> {
  const item = await resolveItem(itemId);
  if (!item) return null;
  return getPlanContextByMenuId(item.menu_id);
}

async function countMenuCategories(menuId: string): Promise<number> {
  const { count } = await db
    .from('menu_categories')
    .select('*', { count: 'exact', head: true })
    .eq('menu_id', menuId);
  return count || 0;
}

async function countMenuItems(menuId: string): Promise<number> {
  const categoryIds = await listCategoryIds(menuId);
  if (categoryIds.length === 0) return 0;

  const { count } = await db
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .in('category_id', categoryIds);
  return count || 0;
}

async function countMenuItemsWithImage(menuId: string): Promise<number> {
  const categoryIds = await listCategoryIds(menuId);
  if (categoryIds.length === 0) return 0;

  const { count } = await db
    .from('menu_items')
    .select('*', { count: 'exact', head: true })
    .in('category_id', categoryIds)
    .not('image_url', 'is', null);
  return count || 0;
}

async function resolveFallbackCategoryId(menuId: string): Promise<string | null> {
  const { data, error } = await db
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menuId)
    .order('display_order', { ascending: true })
    .maybeSingle();

  const row = asRecord(data);
  if (error || !row.id) {
    return null;
  }

  return String(row.id);
}

function requirePlanContext(context: PlanContext | null): ServiceResult<true> {
  if (!context) {
    return { data: null, error: 'Não foi possível validar o plano deste menu.' };
  }
  return { data: true, error: null };
}

export const MenuService = {
  async listCategories(menuId: string): Promise<ServiceResult<MenuCategory[]>> {
    try {
      const { data, error } = await db
    .from('menu_categories')
        .select('*')
        .eq('menu_id', menuId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listCategories error', error);
        return { data: null, error: error.message };
      }

      return { data: (data ?? []).map(mapMenuCategory), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async createCategory(input: {
    menu_id: string;
    name: string;
    description?: string;
    display_order?: number;
  }): Promise<ServiceResult<MenuCategory>> {
    try {
      const context = await getPlanContextByMenuId(input.menu_id);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (!context!.entitlements.canUseMenuCategories) {
        return { data: null, error: 'Seu plano não permite categorias no cardápio.' };
      }

      if (context!.entitlements.maxCategories !== null) {
        const current = await countMenuCategories(input.menu_id);
        if (current >= context!.entitlements.maxCategories) {
          return {
            data: null,
            error: `Limite de categorias atingido (${context!.entitlements.maxCategories}).`,
          };
        }
      }

      const { data, error } = await db
    .from('menu_categories')
        .insert({
          menu_id: input.menu_id,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : null,
          display_order: input.display_order ?? 0,
          is_available: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] createCategory error', error);
        return { data: null, error: error.message };
      }

      return { data: mapMenuCategory(asRecord(data)), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async updateCategory(
    categoryId: string,
    input: Partial<Pick<MenuCategory, 'name' | 'description' | 'display_order' | 'is_active'>>
  ): Promise<ServiceResult<MenuCategory>> {
    try {
      const context = await getPlanContextByCategoryId(categoryId);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (!context!.entitlements.canUseMenuCategories) {
        return { data: null, error: 'Seu plano não permite gerenciar categorias.' };
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (input.name !== undefined) updates.name = sanitizeString(input.name);
      if (input.description !== undefined) updates.description = input.description ? sanitizeString(input.description) : null;
      if (input.display_order !== undefined) updates.display_order = input.display_order;
      if (input.is_active !== undefined) updates.is_available = input.is_active;

      const { data, error } = await db
    .from('menu_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] updateCategory error', error);
        return { data: null, error: error.message };
      }

      return { data: mapMenuCategory(asRecord(data)), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async deleteCategory(categoryId: string): Promise<ServiceResult<boolean>> {
    try {
      const context = await getPlanContextByCategoryId(categoryId);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (!context!.entitlements.canUseMenuCategories) {
        return { data: null, error: 'Seu plano não permite gerenciar categorias.' };
      }

      const { error } = await db
    .from('menu_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        logger.error('[MenuService] deleteCategory error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async reorderCategories(updates: Array<{ id: string; display_order: number }>): Promise<ServiceResult<boolean>> {
    try {
      if (updates.length === 0) return { data: true, error: null };

      const context = await getPlanContextByCategoryId(updates[0].id);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (!context!.entitlements.canUseMenuCategories) {
        return { data: null, error: 'Seu plano não permite reordenar categorias.' };
      }

      for (const update of updates) {
        const { error } = await db
    .from('menu_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) {
          logger.error('[MenuService] reorderCategories error', error);
          return { data: null, error: error.message };
        }
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async listItems(menuId: string, categoryId?: string): Promise<ServiceResult<MenuItem[]>> {
    try {
      const categoryIds = categoryId ? [categoryId] : await listCategoryIds(menuId);
      if (categoryIds.length === 0) {
        return { data: [], error: null };
      }

      const query = db
    .from('menu_items')
        .select('*')
        .in('category_id', categoryIds);

      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listItems error', error);
        return { data: null, error: error.message };
      }

      return { data: (data ?? []).map((row) => mapMenuItem(asRecord(row), menuId)), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async getItem(itemId: string): Promise<ServiceResult<MenuItem>> {
    try {
      const { data, error } = await db
    .from('menu_items')
        .select('*, menu_categories(menu_id)')
        .eq('id', itemId)
        .single();

      if (error) {
        logger.error('[MenuService] getItem error', error);
        return { data: null, error: error.message };
      }

      return { data: mapMenuItem(asRecord(data)), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async createItem(input: {
    menu_id: string;
    category_id?: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    preparation_time_min?: number;
    stock_quantity?: number;
    stock_alert_threshold?: number;
    is_available?: boolean;
    tags?: string[];
    allergens?: string[];
    nutritional_info?: Record<string, unknown>;
  }): Promise<ServiceResult<MenuItem>> {
    try {
      const context = await getPlanContextByMenuId(input.menu_id);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };
      let categoryId = input.category_id;
      const nutritionalInfo = getMenuItemNutritionInfo(input.nutritional_info);

      if (context!.entitlements.maxMenuItems !== null) {
        const current = await countMenuItems(input.menu_id);
        if (current >= context!.entitlements.maxMenuItems) {
          return {
            data: null,
            error: `Limite de itens atingido (${context!.entitlements.maxMenuItems}).`,
          };
        }
      }

      if (input.category_id && !context!.entitlements.canUseMenuCategories) {
        return { data: null, error: 'Seu plano não permite categorias no cardápio.' };
      }

      if (!categoryId && !context!.entitlements.canUseMenuCategories) {
        categoryId = await resolveFallbackCategoryId(input.menu_id) ?? undefined;
      }

      if (!categoryId) {
        return { data: null, error: 'Selecione uma categoria para este item.' };
      }

      if (hasImageUrl(input.image_url) && !context!.entitlements.canUseMenuImages) {
        return { data: null, error: 'Seu plano não permite imagens nos itens.' };
      }

      if (hasImageUrl(input.image_url) && context!.entitlements.maxImages !== null) {
        const currentImages = await countMenuItemsWithImage(input.menu_id);
        if (currentImages >= context!.entitlements.maxImages) {
          return {
            data: null,
            error: `Limite de imagens atingido (${context!.entitlements.maxImages}).`,
          };
        }
      }

      const { data, error } = await db
    .from('menu_items')
        .insert({
          category_id: categoryId,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : null,
          base_price: input.price,
          image_url: input.image_url || null,
          preparation_time: input.preparation_time_min ?? null,
          calories: isFiniteNumber(nutritionalInfo.calories) ? nutritionalInfo.calories : null,
          is_vegetarian: nutritionalInfo.is_vegetarian === true,
          is_vegan: nutritionalInfo.is_vegan === true,
          is_gluten_free: nutritionalInfo.is_gluten_free === true,
          is_lactose_free: nutritionalInfo.is_lactose_free === true,
          is_spicy: nutritionalInfo.is_spicy === true,
          spicy_level: isFiniteNumber(nutritionalInfo.spicy_level)
            ? nutritionalInfo.spicy_level
            : null,
          ingredients: Array.isArray(nutritionalInfo.ingredients)
            ? nutritionalInfo.ingredients
            : null,
          allergens: input.allergens || null,
          metadata: buildMenuItemMetadata({
            tags: input.tags ?? null,
            stockQuantity: input.stock_quantity ?? null,
            stockAlertThreshold: input.stock_alert_threshold ?? null,
            nutritionalInfo,
          }),
          is_available: input.is_available ?? true,
          is_featured: false,
          display_order: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] createItem error', error);
        return { data: null, error: error.message };
      }

      return { data: mapMenuItem(asRecord(data), input.menu_id), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async updateItem(
    itemId: string,
    input: Partial<Omit<MenuItem, 'id' | 'menu_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResult<MenuItem>> {
    try {
      const item = await resolveItem(itemId);
      if (!item) {
        return { data: null, error: 'Item não encontrado.' };
      }

      const currentItemResult = await this.getItem(itemId);
      if (currentItemResult.error || !currentItemResult.data) {
        return { data: null, error: currentItemResult.error ?? 'Item não encontrado.' };
      }
      const currentItem = currentItemResult.data;
      const nutritionalInfo = getMenuItemNutritionInfo(input.nutritional_info);

      const context = await getPlanContextByMenuId(item.menu_id);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (input.category_id !== undefined && input.category_id !== null && !context!.entitlements.canUseMenuCategories) {
        return { data: null, error: 'Seu plano não permite categorias no cardápio.' };
      }

      if (input.image_url !== undefined) {
        if (hasImageUrl(input.image_url) && !context!.entitlements.canUseMenuImages) {
          return { data: null, error: 'Seu plano não permite imagens nos itens.' };
        }

        const willHaveImage = hasImageUrl(input.image_url);
        const hadImage = hasImageUrl(item.image_url);

        if (willHaveImage && !hadImage && context!.entitlements.maxImages !== null) {
          const currentImages = await countMenuItemsWithImage(item.menu_id);
          if (currentImages >= context!.entitlements.maxImages) {
            return {
              data: null,
              error: `Limite de imagens atingido (${context!.entitlements.maxImages}).`,
            };
          }
        }
      }

      if (input.is_available !== undefined && !context!.entitlements.canManageAvailability) {
        return { data: null, error: 'Seu plano não permite gerenciar disponibilidade.' };
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (input.name !== undefined) updates.name = sanitizeString(input.name);
      if (input.description !== undefined) updates.description = input.description ? sanitizeString(input.description) : null;
      if (input.price !== undefined) updates.base_price = input.price;
      if (input.image_url !== undefined) updates.image_url = input.image_url;
      if (input.category_id !== undefined) updates.category_id = input.category_id;
      if (input.display_order !== undefined) updates.display_order = input.display_order;
      if (input.is_available !== undefined) updates.is_available = input.is_available;
      if (input.is_featured !== undefined) updates.is_featured = input.is_featured;
      if (input.preparation_time_min !== undefined) updates.preparation_time = input.preparation_time_min;
      if (nutritionalInfo.calories !== undefined) updates.calories = nutritionalInfo.calories;
      if (nutritionalInfo.is_vegetarian !== undefined) updates.is_vegetarian = nutritionalInfo.is_vegetarian === true;
      if (nutritionalInfo.is_vegan !== undefined) updates.is_vegan = nutritionalInfo.is_vegan === true;
      if (nutritionalInfo.is_gluten_free !== undefined) updates.is_gluten_free = nutritionalInfo.is_gluten_free === true;
      if (nutritionalInfo.is_lactose_free !== undefined) updates.is_lactose_free = nutritionalInfo.is_lactose_free === true;
      if (nutritionalInfo.is_spicy !== undefined) updates.is_spicy = nutritionalInfo.is_spicy === true;
      if (nutritionalInfo.spicy_level !== undefined) updates.spicy_level = nutritionalInfo.spicy_level;
      if (nutritionalInfo.ingredients !== undefined) {
        updates.ingredients = Array.isArray(nutritionalInfo.ingredients)
          ? nutritionalInfo.ingredients
          : null;
      }
      if (input.allergens !== undefined) updates.allergens = input.allergens;
      if (
        input.tags !== undefined ||
        input.stock_quantity !== undefined ||
        input.stock_alert_threshold !== undefined ||
        input.nutritional_info !== undefined
      ) {
        updates.metadata = buildMenuItemMetadata({
          currentMetadata: {
            tags: currentItem.tags,
            stock_quantity: currentItem.stock_quantity,
            stock_alert_threshold: currentItem.stock_alert_threshold,
            pizza_visual: currentItem.nutritional_info?.pizza_visual,
          },
          tags: input.tags,
          stockQuantity: input.stock_quantity,
          stockAlertThreshold: input.stock_alert_threshold,
          nutritionalInfo,
          preserveExisting: true,
        });
      }

      const { data, error } = await db
    .from('menu_items')
        .update(updates)
        .eq('id', itemId)
        .select('*, menu_categories(menu_id)')
        .single();

      if (error) {
        logger.error('[MenuService] updateItem error', error);
        return { data: null, error: error.message };
      }

      return { data: mapMenuItem(asRecord(data)), error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async deleteItem(itemId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await db
    .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        logger.error('[MenuService] deleteItem error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<ServiceResult<MenuItem>> {
    return this.updateItem(itemId, { is_available: isAvailable });
  },

  async listVariations(itemId: string): Promise<ServiceResult<MenuItemVariation[]>> {
    try {
      const { data, error } = await db
    .from('menu_item_variants')
        .select('*')
        .eq('item_id', itemId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listVariations error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItemVariation[], error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async createVariation(input: {
    item_id: string;
    name: string;
    description?: string;
    price_adjustment: number;
  }): Promise<ServiceResult<MenuItemVariation>> {
    try {
      const context = await getPlanContextByItemId(input.item_id);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (!context!.entitlements.canUseMenuVariations) {
        return { data: null, error: 'Seu plano não permite variações de item.' };
      }

      const { data, error } = await db
    .from('menu_item_variants')
        .insert({
          item_id: input.item_id,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : null,
          price_adjustment: input.price_adjustment,
          is_available: true,
          display_order: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] createVariation error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItemVariation, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async deleteVariation(variationId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await db
    .from('menu_item_variants')
        .delete()
        .eq('id', variationId);

      if (error) {
        logger.error('[MenuService] deleteVariation error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async listAddons(itemId: string): Promise<ServiceResult<MenuItemAddon[]>> {
    try {
      const { data, error } = await db
    .from('menu_item_addons')
        .select('*')
        .eq('item_id', itemId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listAddons error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItemAddon[], error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async createAddon(input: {
    item_id: string;
    name: string;
    description?: string;
    price: number;
    max_quantity?: number;
  }): Promise<ServiceResult<MenuItemAddon>> {
    try {
      const context = await getPlanContextByItemId(input.item_id);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (!context!.entitlements.canUseMenuAddons) {
        return { data: null, error: 'Seu plano não permite adicionais.' };
      }

      const { data, error } = await db
    .from('menu_item_addons')
        .insert({
          item_id: input.item_id,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : null,
          price: input.price,
          max_quantity: input.max_quantity ?? 1,
          is_available: true,
          display_order: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] createAddon error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItemAddon, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async deleteAddon(addonId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await db
    .from('menu_item_addons')
        .delete()
        .eq('id', addonId);

      if (error) {
        logger.error('[MenuService] deleteAddon error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
