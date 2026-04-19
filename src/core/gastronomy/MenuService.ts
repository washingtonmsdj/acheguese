/**
 * MenuService — SSOT canônico do sistema de cardápio
 *
 * Centraliza toda a lógica de negócio do cardápio gastronômico.
 * Hooks e componentes NÃO acessam Supabase diretamente — consomem este service.
 *
 * Responsabilidades:
 * - CRUD de categorias
 * - CRUD de itens
 * - CRUD de variações
 * - CRUD de adicionais
 * - CRUD de combos
 * - Gestão de disponibilidade
 * - Ordenação
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import { sanitizeString } from '@/shared/utils/sanitization';

export const __MENU_SERVICE_FACADE_HINT__ = "compatibility facade";

// ── Tipos ─────────────────────────────────────────────────────────────────

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
  nutritional_info: Record<string, any> | null;
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

// ── Service ───────────────────────────────────────────────────────────────

export const MenuService = {
  
  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORIAS
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Lista categorias de um menu
   */
  async listCategories(menuId: string): Promise<ServiceResult<MenuCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_categories')
        .select('*')
        .eq('menu_id', menuId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listCategories error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuCategory[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria uma categoria
   */
  async createCategory(input: {
    menu_id: string;
    name: string;
    description?: string;
    display_order?: number;
  }): Promise<ServiceResult<MenuCategory>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_categories')
        .insert({
          menu_id: input.menu_id,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : null,
          display_order: input.display_order ?? 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] createCategory error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuCategory, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza uma categoria
   */
  async updateCategory(
    categoryId: string,
    input: Partial<Pick<MenuCategory, 'name' | 'description' | 'display_order' | 'is_active'>>
  ): Promise<ServiceResult<MenuCategory>> {
    try {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (input.name !== undefined) updates.name = sanitizeString(input.name);
      if (input.description !== undefined) updates.description = input.description ? sanitizeString(input.description) : null;
      if (input.display_order !== undefined) updates.display_order = input.display_order;
      if (input.is_active !== undefined) updates.is_active = input.is_active;

      const { data, error } = await supabase
        .from('gastronomy_menu_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] updateCategory error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuCategory, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Deleta uma categoria
   */
  async deleteCategory(categoryId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('gastronomy_menu_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        logger.error('[MenuService] deleteCategory error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Reordena categorias
   */
  async reorderCategories(updates: Array<{ id: string; display_order: number }>): Promise<ServiceResult<boolean>> {
    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('gastronomy_menu_categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);

        if (error) {
          logger.error('[MenuService] reorderCategories error', error);
          return { data: null, error: error.message };
        }
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ITENS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista itens de um menu (opcionalmente filtrado por categoria)
   */
  async listItems(menuId: string, categoryId?: string): Promise<ServiceResult<MenuItem[]>> {
    try {
      let query = supabase
        .from('gastronomy_menu_items')
        .select('*')
        .eq('menu_id', menuId);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listItems error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItem[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca um item por ID
   */
  async getItem(itemId: string): Promise<ServiceResult<MenuItem>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) {
        logger.error('[MenuService] getItem error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItem, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria um item
   */
  async createItem(input: {
    menu_id: string;
    category_id?: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    preparation_time_min?: number;
    tags?: string[];
    allergens?: string[];
  }): Promise<ServiceResult<MenuItem>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_items')
        .insert({
          menu_id: input.menu_id,
          category_id: input.category_id || null,
          name: sanitizeString(input.name),
          description: input.description ? sanitizeString(input.description) : null,
          price: input.price,
          image_url: input.image_url || null,
          preparation_time_min: input.preparation_time_min || null,
          tags: input.tags || null,
          allergens: input.allergens || null,
          is_available: true,
          is_featured: false,
          display_order: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] createItem error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItem, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza um item
   */
  async updateItem(
    itemId: string,
    input: Partial<Omit<MenuItem, 'id' | 'menu_id' | 'created_at' | 'updated_at'>>
  ): Promise<ServiceResult<MenuItem>> {
    try {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (input.name !== undefined) updates.name = sanitizeString(input.name);
      if (input.description !== undefined) updates.description = input.description ? sanitizeString(input.description) : null;
      if (input.price !== undefined) updates.price = input.price;
      if (input.image_url !== undefined) updates.image_url = input.image_url;
      if (input.category_id !== undefined) updates.category_id = input.category_id;
      if (input.display_order !== undefined) updates.display_order = input.display_order;
      if (input.is_available !== undefined) updates.is_available = input.is_available;
      if (input.is_featured !== undefined) updates.is_featured = input.is_featured;
      if (input.preparation_time_min !== undefined) updates.preparation_time_min = input.preparation_time_min;
      if (input.stock_quantity !== undefined) updates.stock_quantity = input.stock_quantity;
      if (input.tags !== undefined) updates.tags = input.tags;
      if (input.allergens !== undefined) updates.allergens = input.allergens;

      const { data, error } = await supabase
        .from('gastronomy_menu_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        logger.error('[MenuService] updateItem error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItem, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Deleta um item
   */
  async deleteItem(itemId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('gastronomy_menu_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        logger.error('[MenuService] deleteItem error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Alterna disponibilidade de um item
   */
  async toggleItemAvailability(itemId: string, isAvailable: boolean): Promise<ServiceResult<MenuItem>> {
    return this.updateItem(itemId, { is_available: isAvailable });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VARIAÇÕES
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista variações de um item
   */
  async listVariations(itemId: string): Promise<ServiceResult<MenuItemVariation[]>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_item_variations')
        .select('*')
        .eq('item_id', itemId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listVariations error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItemVariation[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria uma variação
   */
  async createVariation(input: {
    item_id: string;
    name: string;
    description?: string;
    price_adjustment: number;
  }): Promise<ServiceResult<MenuItemVariation>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_item_variations')
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
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Deleta uma variação
   */
  async deleteVariation(variationId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('gastronomy_menu_item_variations')
        .delete()
        .eq('id', variationId);

      if (error) {
        logger.error('[MenuService] deleteVariation error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADICIONAIS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lista adicionais de um item
   */
  async listAddons(itemId: string): Promise<ServiceResult<MenuItemAddon[]>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_item_addons')
        .select('*')
        .eq('item_id', itemId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('[MenuService] listAddons error', error);
        return { data: null, error: error.message };
      }

      return { data: data as MenuItemAddon[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria um adicional
   */
  async createAddon(input: {
    item_id: string;
    name: string;
    description?: string;
    price: number;
    max_quantity?: number;
  }): Promise<ServiceResult<MenuItemAddon>> {
    try {
      const { data, error } = await supabase
        .from('gastronomy_menu_item_addons')
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
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Deleta um adicional
   */
  async deleteAddon(addonId: string): Promise<ServiceResult<boolean>> {
    try {
      const { error } = await supabase
        .from('gastronomy_menu_item_addons')
        .delete()
        .eq('id', addonId);

      if (error) {
        logger.error('[MenuService] deleteAddon error', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};
