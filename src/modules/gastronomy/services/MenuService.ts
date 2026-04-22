/**
 * 🍽️ MENU SERVICE FACADE - SSOT Unified Export
 *
 * Fachada que re-exporta todos os módulos de cardápio.
 * Mantém estabilidade com código migracao.
 *
 * @version 2.0.0 - Refatorado para SSOT
 */

// ============================================================
// EXPORTS DOS NOVOS MÓDULOS SSOT
// ============================================================

// Queries de Menu
export {
  getMenu,
  getMenusByBusiness,
  getMenuWithCategories,
  getMenuCategories,
  getMenuCategory,
  getMenuItemsByCategory,
  getMenuItem,
  getFeaturedMenuItems,
  getMenuItemVariants,
  getMenuItemAddons,
  getActiveMenuPromotions,
  getMenuUsageStats,
  getPublicMenuCatalog,
  getPublicFoodItems,
} from './menu.queries';

// Mutations de Menu
export {
  createMenu,
  updateMenu,
  deleteMenu,
  createCategory,
  updateCategory,
  deleteCategory,
  createItem,
  updateItem,
  deleteItem,
  createVariant,
  updateVariant,
  deleteVariant,
  createAddon,
  updateAddon,
  deleteAddon,
  createPromotion,
  updatePromotion,
  deletePromotion,
  reorderMenuItems,
  reorderMenuCategories,
} from './menu.mutations';

// ============================================================
// API de classe mantida para estabilidade de contrato
// ============================================================

import {
  createMenu,
  updateMenu,
  deleteMenu,
  createCategory,
  updateCategory,
  createItem,
  updateItem,
  createVariant,
  createAddon,
  createPromotion,
} from './menu.mutations';

/**
 * Use as funcoes individuais de menu.mutations.ts em novas implementacoes.
 * Classe mantida para estabilidade de contrato.
 */
export class MenuService {
  static async createMenu(
    input: import('../types').CreateMenuInput,
    userId: string,
  ): Promise<import('../types').Menu> {
    return createMenu(input, userId);
  }

  static async updateMenu(
    menuId: string,
    input: import('../types').UpdateMenuInput,
    userId: string,
  ): Promise<import('../types').Menu> {
    return updateMenu(menuId, input, userId);
  }

  static async deleteMenu(menuId: string, userId: string): Promise<void> {
    return deleteMenu(menuId, userId);
  }

  static async createCategory(
    input: import('../types').CreateMenuCategoryInput,
    userId: string,
  ): Promise<import('../types').MenuCategory> {
    return createCategory(input, userId);
  }

  static async updateCategory(
    categoryId: string,
    input: import('../types').UpdateMenuCategoryInput,
    userId: string,
  ): Promise<import('../types').MenuCategory> {
    return updateCategory(categoryId, input, userId);
  }

  static async createItem(
    input: import('../types').CreateMenuItemInput,
    userId: string,
  ): Promise<import('../types').MenuItem> {
    return createItem(input, userId);
  }

  static async updateItem(
    itemId: string,
    input: import('../types').UpdateMenuItemInput,
    userId: string,
  ): Promise<import('../types').MenuItem> {
    return updateItem(itemId, input, userId);
  }

  static async createVariant(
    input: import('../types').CreateMenuItemVariantInput,
    userId: string,
  ): Promise<import('../types').MenuItemVariant> {
    return createVariant(input, userId);
  }

  static async createAddon(
    input: import('../types').CreateMenuItemAddonInput,
    userId: string,
  ): Promise<import('../types').MenuItemAddon> {
    return createAddon(input, userId);
  }

  static async createPromotion(
    input: import('../types').CreateMenuPromotionInput,
    userId: string,
  ): Promise<import('../types').MenuPromotion> {
    return createPromotion(input, userId);
  }
}

// ============================================================
// FACADE UNIFICADA PARA CARDÁPIO
// ============================================================

import * as MenuQueries from './menu.queries';
import * as MenuMutations from './menu.mutations';

/**
 * MenuFacade - SSOT unificado para operações de cardápio
 *
 * Use esta facade para acesso consistente a todas as funcionalidades.
 *
 * @example
 * ```typescript
 * import { MenuFacade } from '@/modules/gastronomy/services/MenuService';
 *
 * const menu = await MenuFacade.queries.getMenu(menuId);
 * const category = await MenuFacade.mutations.createCategory(input, userId);
 * ```
 */
export const MenuFacade = {
  queries: {
    ...MenuQueries,
  },
  mutations: {
    ...MenuMutations,
  },
} as const;

// Export default para import simplificado
export default MenuFacade;

