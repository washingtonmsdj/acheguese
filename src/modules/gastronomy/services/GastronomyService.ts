/**
 * 🍽️ GASTRONOMY SERVICE FACADE - SSOT Unified Export
 *
 * Fachada que re-exporta todos os módulos de gastronomia.
 * Mantém estabilidade com código migracao.
 *
 * @version 2.0.0 - Refatorado para SSOT
 */

// ============================================================
// EXPORTS DOS NOVOS MÓDULOS SSOT
// ============================================================

// Queries de Gastronomia
export {
  // Perfis gastronômicos
  getGastronomyProfile,
  getGastronomyBusiness,
  getGastronomyBusinessByTerritorySlug,
  getGastronomyBusinessesList,
  getGastronomyBusinesses,
  getGastronomyBusinessesByIds,
  hasGastronomyProfile,
  // Types
  type PaginatedGastronomyBusinesses,
  type TerritorySlugParams,
} from './gastronomy.queries';

// Mutations de Gastronomia
export {
  createGastronomyProfile,
  updateGastronomyProfile,
  deleteGastronomyProfile,
  updateOperationalStatus,
  patchGastronomyProfile,
} from './gastronomy.mutations';

// Queries de Menu
export {
  // Menus
  getMenu,
  getMenusByBusiness,
  getMenuWithCategories,
  // Categorias
  getMenuCategories,
  getMenuCategory,
  // Itens
  getMenuItemsByCategory,
  getMenuItem,
  getFeaturedMenuItems,
  // Relações
  getMenuItemVariants,
  getMenuItemAddons,
  // Promoções
  getActiveMenuPromotions,
  // Catálogo público
  getPublicMenuCatalog,
  getPublicFoodItems,
} from './menu.queries';

// Queries de Activity Feed
export { ActivityQueryService } from './activity.queries';

// Mutations de Menu
export {
  // Menus
  createMenu,
  updateMenu,
  deleteMenu,
  // Categorias
  createCategory,
  updateCategory,
  deleteCategory,
  // Itens
  createItem,
  updateItem,
  deleteItem,
  // Variantes
  createVariant,
  updateVariant,
  deleteVariant,
  // Adicionais
  createAddon,
  updateAddon,
  deleteAddon,
  // Promoções
  createPromotion,
  updatePromotion,
  deletePromotion,
  // Reordenação
  reorderMenuItems,
  reorderMenuCategories,
} from './menu.mutations';

// Helpers de Gastronomia
export {
  // Validações
  isGastronomyBusinessOpen,
  isDeliveryAvailable,
  isTakeoutAvailable,
  acceptsReservations,
  // Cálculos
  calculateItemPrice,
  calculateDeliveryFee,
  calculateEstimatedDeliveryTime,
  calculateMinimumOrderValue,
  // Formatação
  formatDeliveryTime,
  formatDeliveryFee,
  formatPrice,
  formatCuisineType,
  formatPriceRange,
  // Filtros
  filterItemsByDiet,
  filterFeaturedItems,
  searchItems,
  // Ordenação
  sortItemsByDisplayOrder,
  sortCategoriesByDisplayOrder,
  sortBusinessesByRating,
  sortBusinessesByDistance,
  // Validações de pedido
  validateOrderTime,
  validateMinimumOrder,
  validateItemAvailability,
} from './gastronomy.helpers';

// ============================================================
// API de classe mantida para estabilidade de contrato
// ============================================================

import {
  createGastronomyProfile,
  updateGastronomyProfile,
  deleteGastronomyProfile,
  updateOperationalStatus,
} from './gastronomy.mutations';

/**
 * Use as funcoes individuais de gastronomy.mutations.ts em novas implementacoes.
 * Classe mantida para estabilidade de contrato.
 */
export class GastronomyService {
  static async createGastronomyProfile(
    input: import('../types').CreateGastronomyProfileInput,
    userId: string,
  ): Promise<import('../types').GastronomyProfile> {
    return createGastronomyProfile(input, userId);
  }

  static async updateGastronomyProfile(
    businessId: string,
    input: import('../types').UpdateGastronomyProfileInput,
    userId: string,
  ): Promise<import('../types').GastronomyProfile> {
    return updateGastronomyProfile(businessId, input, userId);
  }

  static async deleteGastronomyProfile(businessId: string, userId: string): Promise<void> {
    return deleteGastronomyProfile(businessId, userId);
  }

  static async updateOperationalStatus(
    businessId: string,
    status: 'active' | 'inactive' | 'temporarily_closed',
    userId: string,
  ): Promise<void> {
    return updateOperationalStatus(businessId, status, userId);
  }
}

// ============================================================
// FACADE UNIFICADA (Recomendado para novos usos)
// ============================================================

import * as GastronomyQueries from './gastronomy.queries';
import * as GastronomyMutations from './gastronomy.mutations';
import * as MenuQueries from './menu.queries';
import * as MenuMutations from './menu.mutations';
import * as GastronomyHelpers from './gastronomy.helpers';

/**
 * GastronomyFacade - SSOT unificado para todas as operações gastronômicas
 *
 * Use esta facade para acesso consistente a todas as funcionalidades.
 * Organizado em: queries (read), mutations (write), helpers (pure).
 *
 * @example
 * ```typescript
 * import { GastronomyFacade } from '@/modules/gastronomy/services/GastronomyService';
 *
 * // Queries
 * const profile = await GastronomyFacade.queries.getGastronomyProfile(businessId);
 *
 * // Mutations
 * const updated = await GastronomyFacade.mutations.updateGastronomyProfile(businessId, input, userId);
 *
 * // Helpers
 * const isOpen = GastronomyFacade.helpers.isGastronomyBusinessOpen(business);
 * ```
 */
export const GastronomyFacade = {
  queries: {
    // Gastronomia
    ...GastronomyQueries,
    // Menu
    ...MenuQueries,
  },
  mutations: {
    // Gastronomia
    ...GastronomyMutations,
    // Menu
    ...MenuMutations,
  },
  helpers: {
    ...GastronomyHelpers,
  },
} as const;

// Export default para import simplificado
export default GastronomyFacade;


