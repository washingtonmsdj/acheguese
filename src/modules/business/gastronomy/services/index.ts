/**
 * Centralized exports for gastronomy services (module SSOT).
 */

// Read-side facade
export { GastronomyFacade, type GastronomyFacadeContract } from './GastronomyService';

// Canonical services
export { MenuService } from './MenuService';
export { MenuService as menuService } from './MenuService';
export { GastronomyProfileService } from './GastronomyProfileService';
export { GastronomyUrlService } from './GastronomyUrlService';
export { OrderTrustService } from './OrderTrustService';

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
  getPublicFoodCatalog,
} from './menu.queries';

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


