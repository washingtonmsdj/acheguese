/**
 * 🍽️ Exports Centralizados dos Services de Gastronomia - SSOT
 *
 * @version 2.0.0 - Refatorado para SSOT
 */

// ============================================================
// FACADES UNIFICADAS (RECOMENDADO)
// ============================================================
export {
  // GastronomyFacade - Acesso unificado a queries, mutations e helpers
  GastronomyFacade,
  default as gastronomyService,
  // Exports legados (compatibilidade)
  GastronomyService,
} from './GastronomyService';

// MenuFacade - Acesso unificado a operações de cardápio
export {
  MenuFacade,
  default as menuService,
  // Exports legados (compatibilidade)
  MenuService,
} from './MenuService';

// ============================================================
// MÓDULOS SSOT ESPECÍFICOS (Para uso granular)
// ============================================================

// Queries de Gastronomia
export {
  getGastronomyProfile,
  getGastronomyBusiness,
  getGastronomyBusinessByTerritorySlug,
  getGastronomyBusinessesList,
  getGastronomyBusinesses,
  getGastronomyBusinessesByIds,
  hasGastronomyProfile,
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
  getPublicMenuCatalog,
  getPublicFoodItems,
  getPublicFoodCatalog,
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
// SERVICES AUXILIARES
// ============================================================
export { GastronomyUrlService } from './GastronomyUrlService';
