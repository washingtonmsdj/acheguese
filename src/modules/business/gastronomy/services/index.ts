/**
 * Centralized exports for gastronomy services (module SSOT).
 */

// Read-side facade
export { GastronomyFacade, type GastronomyFacadeContract } from './GastronomyService';

// Canonical services
export { MenuService } from '@/core/business/services/MenuService';
export { MenuService as menuService } from '@/core/business/services/MenuService';
export { GastronomyProfileService } from '@/core/business/services/GastronomyProfileService';
export { GastronomyUrlService } from './GastronomyUrlService';
export { OrderTrustService } from './OrderTrustService';

// Runtime queries
export {
  fetchGastronomyQuickMetrics,
  getBusinessCategoryByBusinessDataId,
  fetchSimilarGastronomyBusinesses,
  type GastronomyQuickMetrics,
  type SimilarGastronomyBusiness,
} from '@/core/business/services/gastronomy-runtime.queries';

// Granular queries/mutations
export {
  getGastronomyProfile,
  getGastronomyBusiness,
  getGastronomyBusinessByTerritorySlug,
  getGastronomyBusinessesList,
  getGastronomyBusinesses,
  getGastronomyBusinessesByIds,
  hasGastronomyProfile,
} from '@/core/business/services/gastronomy.queries';
export type {
  PaginatedGastronomyBusinesses,
  TerritorySlugParams,
} from '@/core/business/types';

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
} from '@/core/business/services/menu.queries';
