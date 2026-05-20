/**
 * MenuService - SSOT de cardapio com validacao de plano.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/core/infrastructure/supabase';
import { sanitizeString } from '@/shared/utils/sanitization';
import { SubscriptionService } from '@/core/billing/SubscriptionService';
import { EntitlementsService } from '@/core/billing/entitlements';
import { BillingPlanService, type PlanEntitlements } from '@/core/billing/services/BillingPlanService';

const db = supabase as any;

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

function hasImageUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function mapMenuCategory(row: any): MenuCategory {
  return {
    ...row,
    is_active: row.is_active ?? row.is_available ?? true,
  } as MenuCategory;
}

function mapMenuItem(row: any, menuId?: string | null): MenuItem {
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
        };

  return {
    ...row,
    menu_id: row.menu_id ?? menuId ?? row.menu_categories?.menu_id ?? null,
    price: Number(row.price ?? row.base_price ?? 0),
    preparation_time_min: row.preparation_time_min ?? row.preparation_time ?? null,
    stock_quantity: row.stock_quantity ?? null,
    stock_alert_threshold: row.stock_alert_threshold ?? null,
    tags: row.tags ?? (Array.isArray(row.metadata?.tags) ? row.metadata.tags : null),
    nutritional_info: nutritionalInfo,
  } as MenuItem;
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

  if (error || !data?.menu_id) {
    return null;
  }

  return String(data.menu_id);
}

async function resolveItem(itemId: string): Promise<Pick<MenuItem, 'id' | 'menu_id' | 'image_url'> | null> {
  const { data, error } = await db
    .from('menu_items')
    .select('id, image_url, menu_categories(menu_id)')
    .eq('id', itemId)
    .maybeSingle();

  const menuId = data?.menu_categories?.menu_id;
  if (error || !data?.id || !menuId) {
    return null;
  }

  return {
    id: data.id,
    menu_id: String(menuId),
    image_url: data.image_url ?? null,
  };
}

async function getEntitlementsForBusiness(businessId: string): Promise<PlanEntitlements> {
  const subscriptionResult = await SubscriptionService.getByBusinessId(businessId);

  const planTier = (subscriptionResult.data?.plan_tier ?? 'free') as any;
  const dynamicEntitlements = await BillingPlanService.getEntitlements(planTier).catch(() => null);

  if (dynamicEntitlements) {
    return dynamicEntitlements;
  }

  return EntitlementsService.getAll(planTier as any);
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

function requirePlanContext(context: PlanContext | null): ServiceResult<true> {
  if (!context) {
    return { data: null, error: 'Nao foi possivel validar o plano deste menu.' };
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
        return { data: null, error: 'Seu plano nao permite categorias no cardapio.' };
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

      return { data: mapMenuCategory(data), error: null };
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
        return { data: null, error: 'Seu plano nao permite gerenciar categorias.' };
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

      return { data: mapMenuCategory(data), error: null };
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
        return { data: null, error: 'Seu plano nao permite gerenciar categorias.' };
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
        return { data: null, error: 'Seu plano nao permite reordenar categorias.' };
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

      let query = db
    .from('menu_items')
        .select('*')
        .in('category_id', categoryIds);

      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listItems error', error);
        return { data: null, error: error.message };
      }

      return { data: (data ?? []).map((row: any) => mapMenuItem(row, menuId)), error: null };
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

      return { data: mapMenuItem(data), error: null };
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
        return { data: null, error: 'Seu plano nao permite categorias no cardapio.' };
      }

      if (!input.category_id) {
        return { data: null, error: 'Selecione uma categoria para este item.' };
      }

      if (hasImageUrl(input.image_url) && !context!.entitlements.canUseMenuImages) {
        return { data: null, error: 'Seu plano nao permite imagens nos itens.' };
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
          category_id: input.category_id,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : null,
          base_price: input.price,
          image_url: input.image_url || null,
          preparation_time_min: input.preparation_time_min ?? null,
          stock_quantity: input.stock_quantity ?? null,
          stock_alert_threshold: input.stock_alert_threshold ?? null,
          tags: input.tags || null,
          allergens: input.allergens || null,
          nutritional_info: input.nutritional_info || null,
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

      return { data: mapMenuItem(data, input.menu_id), error: null };
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
        return { data: null, error: 'Item nao encontrado.' };
      }

      const context = await getPlanContextByMenuId(item.menu_id);
      const contextCheck = requirePlanContext(context);
      if (contextCheck.error) return { data: null, error: contextCheck.error };

      if (input.category_id !== undefined && input.category_id !== null && !context!.entitlements.canUseMenuCategories) {
        return { data: null, error: 'Seu plano nao permite categorias no cardapio.' };
      }

      if (input.image_url !== undefined) {
        if (hasImageUrl(input.image_url) && !context!.entitlements.canUseMenuImages) {
          return { data: null, error: 'Seu plano nao permite imagens nos itens.' };
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
        return { data: null, error: 'Seu plano nao permite gerenciar disponibilidade.' };
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
      if (input.preparation_time_min !== undefined) updates.preparation_time_min = input.preparation_time_min;
      if (input.stock_quantity !== undefined) updates.stock_quantity = input.stock_quantity;
      if (input.tags !== undefined) updates.tags = input.tags;
      if (input.allergens !== undefined) updates.allergens = input.allergens;
      if (input.nutritional_info !== undefined) updates.nutritional_info = input.nutritional_info;

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

      return { data: mapMenuItem(data), error: null };
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
        return { data: null, error: 'Seu plano nao permite variacoes de item.' };
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
        return { data: null, error: 'Seu plano nao permite adicionais.' };
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
