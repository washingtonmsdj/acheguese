/**
 * 🍽️ MENU MUTATIONS - SSOT Write Model para Cardápios
 *
 * Todas as operações de escrita para menus, categorias e itens.
 *
 * @version 2.0.0 - Extraído de MenuService
 */

import { supabase } from '@/integrations/supabase';
import { BusinessOwnershipService } from '@/core/business/services/BusinessOwnershipService';
import { sanitizeString } from '@/shared/utils/sanitization';
import type {
  Menu,
  MenuCategory,
  MenuItem,
  MenuItemVariant,
  MenuItemAddon,
  MenuPromotion,
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
} from '../types';

// ============================================================
// TIPOS PARA RELAÇÕES ANINHADAS DO SUPABASE
// ============================================================

interface ItemWithNestedBusinessId {
  menu_categories: {
    menu_id: string;
    menus: { business_id: string };
  };
}

// ============================================================
// HELPERS DE EXTRAÇÃO DE BUSINESS_ID
// ============================================================

function extractBusinessIdFromCategory(data: unknown): string | null {
  const categoryData = data as ItemWithNestedBusinessId | undefined;
  return categoryData?.menu_categories?.menus?.business_id ?? null;
}

function extractBusinessIdFromItem(data: unknown): string | null {
  const itemData = data as { menu_items?: ItemWithNestedBusinessId } | undefined;
  return itemData?.menu_items?.menu_categories?.menus?.business_id ?? null;
}

// ============================================================
// MUTATIONS - MENUS
// ============================================================

/**
 * Criar menu
 */
export async function createMenu(input: CreateMenuInput, userId: string): Promise<Menu> {
  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(input.business_id, userId);

  const { data, error } = await supabase
    .from('menus')
    .insert({
      business_id: input.business_id,
      name: sanitizeString(input.name),
      description: input.description ? sanitizeString(input.description) : null,
      is_active: input.is_active ?? true,
      display_order: input.display_order ?? 0,
      available_days: input.available_days,
      available_start_time: input.available_start_time,
      available_end_time: input.available_end_time,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Menu;
}

/**
 * Atualizar menu
 */
export async function updateMenu(
  menuId: string,
  input: UpdateMenuInput,
  userId: string,
): Promise<Menu> {
  // Buscar business_id do menu
  const { data: menu } = await supabase
    .from('menus')
    .select('business_id')
    .eq('id', menuId)
    .single();

  if (!menu) {
    throw new Error('Menu não encontrado');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(menu.business_id, userId);

  const { data, error } = await supabase
    .from('menus')
    .update({
      ...input,
      name: input.name ? sanitizeString(input.name) : undefined,
      description: input.description ? sanitizeString(input.description) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', menuId)
    .select()
    .single();

  if (error) throw error;
  return data as Menu;
}

/**
 * Deletar menu (soft delete)
 */
export async function deleteMenu(menuId: string, userId: string): Promise<void> {
  const { data: menu } = await supabase
    .from('menus')
    .select('business_id')
    .eq('id', menuId)
    .single();

  if (!menu) {
    throw new Error('Menu não encontrado');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(menu.business_id, userId);

  const { error } = await supabase
    .from('menus')
    .update({ is_active: false })
    .eq('id', menuId);

  if (error) throw error;
}

// ============================================================
// MUTATIONS - CATEGORIAS
// ============================================================

/**
 * Criar categoria
 */
export async function createCategory(
  input: CreateMenuCategoryInput,
  userId: string,
): Promise<MenuCategory> {
  const { data: menu } = await supabase
    .from('menus')
    .select('business_id')
    .eq('id', input.menu_id)
    .single();

  if (!menu) {
    throw new Error('Menu não encontrado');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(menu.business_id, userId);

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({
      menu_id: input.menu_id,
      name: sanitizeString(input.name),
      description: input.description ? sanitizeString(input.description) : null,
      display_order: input.display_order ?? 0,
      is_available: input.is_available ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MenuCategory;
}

/**
 * Atualizar categoria
 */
export async function updateCategory(
  categoryId: string,
  input: UpdateMenuCategoryInput,
  userId: string,
): Promise<MenuCategory> {
  const { data: category } = await supabase
    .from('menu_categories')
    .select('menu_id, menus(business_id)')
    .eq('id', categoryId)
    .single();

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  const businessId = extractBusinessIdFromCategory(category);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário da categoria');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { data, error } = await supabase
    .from('menu_categories')
    .update({
      ...input,
      name: input.name ? sanitizeString(input.name) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;
  return data as MenuCategory;
}

/**
 * Deletar categoria (soft delete)
 */
export async function deleteCategory(categoryId: string, userId: string): Promise<void> {
  const { data: category } = await supabase
    .from('menu_categories')
    .select('menu_id, menus(business_id)')
    .eq('id', categoryId)
    .single();

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  const businessId = extractBusinessIdFromCategory(category);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário da categoria');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { error } = await supabase
    .from('menu_categories')
    .update({ is_available: false })
    .eq('id', categoryId);

  if (error) throw error;
}

// ============================================================
// MUTATIONS - ITENS
// ============================================================

/**
 * Criar item
 */
export async function createItem(input: CreateMenuItemInput, userId: string): Promise<MenuItem> {
  const { data: category } = await supabase
    .from('menu_categories')
    .select('menu_id, menus(business_id)')
    .eq('id', input.category_id)
    .single();

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  const businessId = extractBusinessIdFromCategory(category);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário da categoria');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      category_id: input.category_id,
      name: sanitizeString(input.name),
      description: input.description ? sanitizeString(input.description) : null,
      base_price: input.base_price,
      image_url: input.image_url,
      preparation_time: input.preparation_time,
      calories: input.calories,
      is_vegetarian: input.is_vegetarian ?? false,
      is_vegan: input.is_vegan ?? false,
      is_gluten_free: input.is_gluten_free ?? false,
      is_lactose_free: input.is_lactose_free ?? false,
      is_spicy: input.is_spicy ?? false,
      spicy_level: input.spicy_level,
      ingredients: input.ingredients,
      allergens: input.allergens,
      is_available: input.is_available ?? true,
      is_featured: input.is_featured ?? false,
      display_order: input.display_order ?? 0,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) throw error;
  return data as MenuItem;
}

/**
 * Atualizar item
 */
export async function updateItem(
  itemId: string,
  input: UpdateMenuItemInput,
  userId: string,
): Promise<MenuItem> {
  const { data: item } = await supabase
    .from('menu_items')
    .select('category_id, menu_categories(menu_id, menus(business_id))')
    .eq('id', itemId)
    .single();

  if (!item) {
    throw new Error('Item não encontrado');
  }

  const businessId = extractBusinessIdFromItem(item);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário do item');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { data, error } = await supabase
    .from('menu_items')
    .update({
      ...input,
      name: input.name ? sanitizeString(input.name) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as MenuItem;
}

/**
 * Deletar item (soft delete)
 */
export async function deleteItem(itemId: string, userId: string): Promise<void> {
  const { data: item } = await supabase
    .from('menu_items')
    .select('category_id, menu_categories(menu_id, menus(business_id))')
    .eq('id', itemId)
    .single();

  if (!item) {
    throw new Error('Item não encontrado');
  }

  const businessId = extractBusinessIdFromItem(item);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário do item');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: false })
    .eq('id', itemId);

  if (error) throw error;
}

// ============================================================
// MUTATIONS - VARIANTES
// ============================================================

/**
 * Criar variante
 */
export async function createVariant(
  input: CreateMenuItemVariantInput,
  userId: string,
): Promise<MenuItemVariant> {
  const { data: item } = await supabase
    .from('menu_items')
    .select('category_id, menu_categories(menu_id, menus(business_id))')
    .eq('id', input.item_id)
    .single();

  if (!item) {
    throw new Error('Item não encontrado');
  }

  const businessId = extractBusinessIdFromItem(item);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário do item');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { data, error } = await supabase
    .from('menu_item_variants')
    .insert({
      item_id: input.item_id,
      name: sanitizeString(input.name),
      price_adjustment: input.price_adjustment ?? 0,
      is_available: input.is_available ?? true,
      display_order: input.display_order ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MenuItemVariant;
}

/**
 * Atualizar variante
 */
export async function updateVariant(
  variantId: string,
  input: UpdateMenuItemVariantInput,
  userId: string,
): Promise<MenuItemVariant> {
  const { data: variant } = await supabase
    .from('menu_item_variants')
    .select('item_id, menu_items(category_id, menu_categories(menu_id, menus(business_id)))')
    .eq('id', variantId)
    .single();

  if (!variant) {
    throw new Error('Variante não encontrada');
  }

  const businessId = extractBusinessIdFromItem(variant);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário da variante');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { data, error } = await supabase
    .from('menu_item_variants')
    .update({
      ...input,
      name: input.name ? sanitizeString(input.name) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', variantId)
    .select()
    .single();

  if (error) throw error;
  return data as MenuItemVariant;
}

/**
 * Deletar variante
 */
export async function deleteVariant(variantId: string, userId: string): Promise<void> {
  const { data: variant } = await supabase
    .from('menu_item_variants')
    .select('item_id, menu_items(category_id, menu_categories(menu_id, menus(business_id)))')
    .eq('id', variantId)
    .single();

  if (!variant) {
    throw new Error('Variante não encontrada');
  }

  const businessId = extractBusinessIdFromItem(variant);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário da variante');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { error } = await supabase.from('menu_item_variants').delete().eq('id', variantId);

  if (error) throw error;
}

// ============================================================
// MUTATIONS - ADICIONAIS
// ============================================================

/**
 * Criar adicional
 */
export async function createAddon(
  input: CreateMenuItemAddonInput,
  userId: string,
): Promise<MenuItemAddon> {
  const { data: item } = await supabase
    .from('menu_items')
    .select('category_id, menu_categories(menu_id, menus(business_id))')
    .eq('id', input.item_id)
    .single();

  if (!item) {
    throw new Error('Item não encontrado');
  }

  const businessId = extractBusinessIdFromItem(item);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário do item');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { data, error } = await supabase
    .from('menu_item_addons')
    .insert({
      item_id: input.item_id,
      name: sanitizeString(input.name),
      price: input.price,
      is_available: input.is_available ?? true,
      display_order: input.display_order ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MenuItemAddon;
}

/**
 * Atualizar adicional
 */
export async function updateAddon(
  addonId: string,
  input: UpdateMenuItemAddonInput,
  userId: string,
): Promise<MenuItemAddon> {
  const { data: addon } = await supabase
    .from('menu_item_addons')
    .select('item_id, menu_items(category_id, menu_categories(menu_id, menus(business_id)))')
    .eq('id', addonId)
    .single();

  if (!addon) {
    throw new Error('Adicional não encontrado');
  }

  const businessId = extractBusinessIdFromItem(addon);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário do adicional');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { data, error } = await supabase
    .from('menu_item_addons')
    .update({
      ...input,
      name: input.name ? sanitizeString(input.name) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', addonId)
    .select()
    .single();

  if (error) throw error;
  return data as MenuItemAddon;
}

/**
 * Deletar adicional
 */
export async function deleteAddon(addonId: string, userId: string): Promise<void> {
  const { data: addon } = await supabase
    .from('menu_item_addons')
    .select('item_id, menu_items(category_id, menu_categories(menu_id, menus(business_id)))')
    .eq('id', addonId)
    .single();

  if (!addon) {
    throw new Error('Adicional não encontrado');
  }

  const businessId = extractBusinessIdFromItem(addon);
  if (!businessId) {
    throw new Error('Não foi possível identificar o negócio proprietário do adicional');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(businessId, userId);

  const { error } = await supabase.from('menu_item_addons').delete().eq('id', addonId);

  if (error) throw error;
}

// ============================================================
// MUTATIONS - PROMOÇÕES
// ============================================================

/**
 * Criar promoção
 */
export async function createPromotion(
  input: CreateMenuPromotionInput,
  userId: string,
): Promise<MenuPromotion> {
  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(input.business_id, userId);

  const { data, error } = await supabase
    .from('menu_promotions')
    .insert({
      business_id: input.business_id,
      title: sanitizeString(input.title),
      description: input.description ? sanitizeString(input.description) : null,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      rules: input.rules ?? {},
      applicable_items: input.applicable_items ?? [],
      valid_from: input.valid_from,
      valid_until: input.valid_until,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MenuPromotion;
}

/**
 * Atualizar promoção
 */
export async function updatePromotion(
  promotionId: string,
  input: UpdateMenuPromotionInput,
  userId: string,
): Promise<MenuPromotion> {
  // menu_promotions.business_id é a FK direta — sem join necessário
  const { data: promotion } = await supabase
    .from('menu_promotions')
    .select('business_id')
    .eq('id', promotionId)
    .single();

  if (!promotion) {
    throw new Error('Promoção não encontrada');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(promotion.business_id, userId);

  const { data, error } = await supabase
    .from('menu_promotions')
    .update({
      title: input.title ? sanitizeString(input.title) : undefined,
      description: input.description ? sanitizeString(input.description) : undefined,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      rules: input.rules,
      applicable_items: input.applicable_items,
      valid_from: input.valid_from,
      valid_until: input.valid_until,
      is_active: input.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', promotionId)
    .select()
    .single();

  if (error) throw error;
  return data as MenuPromotion;
}

/**
 * Deletar promoção
 */
export async function deletePromotion(promotionId: string, userId: string): Promise<void> {
  const { data: promotion } = await supabase
    .from('menu_promotions')
    .select('business_id')
    .eq('id', promotionId)
    .single();

  if (!promotion) {
    throw new Error('Promoção não encontrada');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(promotion.business_id, userId);

  const { error } = await supabase.from('menu_promotions').delete().eq('id', promotionId);

  if (error) throw error;
}

// ============================================================
// MUTATIONS EM LOTE
// ============================================================

/**
 * Reordenar itens de uma categoria
 */
export async function reorderMenuItems(
  categoryId: string,
  itemOrders: { itemId: string; displayOrder: number }[],
  userId: string,
): Promise<void> {
  const { data: category } = await supabase
    .from('menu_categories')
    .select('menu_id, menus(business_id)')
    .eq('id', categoryId)
    .single();

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  const reorderBusinessId = extractBusinessIdFromCategory(category);
  if (!reorderBusinessId) {
    throw new Error('Não foi possível identificar o negócio proprietário da categoria');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(reorderBusinessId, userId);

  // Atualizar ordem de cada item
  const updates = itemOrders.map(({ itemId, displayOrder }) =>
    supabase
      .from('menu_items')
      .update({ display_order: displayOrder })
      .eq('id', itemId)
      .eq('category_id', categoryId),
  );

  await Promise.all(updates);
}

/**
 * Reordenar categorias de um menu
 */
export async function reorderMenuCategories(
  menuId: string,
  categoryOrders: { categoryId: string; displayOrder: number }[],
  userId: string,
): Promise<void> {
  const { data: menu } = await supabase
    .from('menus')
    .select('business_id')
    .eq('id', menuId)
    .single();

  if (!menu) {
    throw new Error('Menu não encontrado');
  }

  // Verificar ownership via BusinessOwnershipService (SSOT)
  await BusinessOwnershipService.requireOwnership(menu.business_id, userId);

  // Atualizar ordem de cada categoria
  const updates = categoryOrders.map(({ categoryId, displayOrder }) =>
    supabase.from('menu_categories').update({ display_order: displayOrder }).eq('id', categoryId),
  );

  await Promise.all(updates);
}


