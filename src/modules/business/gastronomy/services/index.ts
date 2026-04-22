/**
 * Centralized exports for gastronomy services (module SSOT).
 */

// Facade
export {
  GastronomyFacade,
  default as gastronomyService,
  GastronomyService,
} from './GastronomyService';

// Canonical services
export { MenuService } from './MenuService';
export { MenuService as menuService } from './MenuService';
export { GastronomyProfileService } from './GastronomyProfileService';
export { gastronomyMapService } from './GastronomyMapService';
export { GastronomyUrlService } from './GastronomyUrlService';

// Runtime queries
export {
  fetchGastronomyQuickMetrics,
  getBusinessCategoryByBusinessDataId,
  fetchSimilarGastronomyBusinesses,
  type GastronomyQuickMetrics,
  type SimilarGastronomyBusiness,
} from './gastronomy-runtime.queries';

// Granular queries/mutations
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

export {
  createGastronomyProfile,
  updateGastronomyProfile,
  deleteGastronomyProfile,
  updateOperationalStatus,
  patchGastronomyProfile,
} from './gastronomy.mutations';

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

export {
  isGastronomyBusinessOpen,
  isDeliveryAvailable,
  isTakeoutAvailable,
  acceptsReservations,
  calculateItemPrice,
  calculateDeliveryFee,
  calculateEstimatedDeliveryTime,
  calculateMinimumOrderValue,
  formatDeliveryTime,
  formatDeliveryFee,
  formatPrice,
  formatCuisineType,
  formatPriceRange,
  filterItemsByDiet,
  filterFeaturedItems,
  searchItems,
  sortItemsByDisplayOrder,
  sortCategoriesByDisplayOrder,
  sortBusinessesByRating,
  sortBusinessesByDistance,
  validateOrderTime,
  validateMinimumOrder,
  validateItemAvailability,
} from './gastronomy.helpers';


