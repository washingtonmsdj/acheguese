/**
 * 🏢 BUSINESS SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 QUERIES - Operações de leitura
// ============================================================
export {
  getBusinesses,
  getBusinessesList,
  getBusinessProfile,
  getBusinessById,
  getBusinessBySlug,
  checkSlugExists,
  getSimilarSlugs,
  getSlugHistory,
  resolveOldSlug,
  getBusinessesByIds,
  searchBusinessesByName,
  getProducts,
  getProductsPage,
  getServices,
  getSimilarBusinesses,
  getGallery,
} from "./business.queries";

// ============================================================
// 📝 MUTATIONS - Operações de escrita
// ============================================================
export {
  createBusiness,
  updateBusiness,
  updateActiveSections,
  deleteBusiness,
  createProduct,
  incrementViews,
} from "./business.mutations";

// ============================================================
// 🔧 ADMIN - Operações administrativas
// ============================================================
export {
  getBusinessClaims,
  getBusinessClaimDetails,
  getTotalBusinessesCount,
  getPremiumBusinessesCount,
  getBusinessesCreatedInPeriod,
  getBusinessMetrics,
  getActiveCoupons,
  getCouponById,
} from "./business.admin";

// ============================================================
// 🗺️ MAPPERS - Transformação de dados
// ============================================================
export {
  toBusinessReadModel,
  mapBusinessDataToBusiness,
  toBusinessData,
  mapProductRecordToProduct,
  mapReviewRecordToReview,
} from "./business.mappers";

// ============================================================
// 🛟 HELPERS - Funções auxiliares
// ============================================================
export {
  isBusinessMigrated,
  hasPhysicalAddress,
  getFormattedAddress,
  getCoordinates,
  getTerritory,
  getTerritoryName,
  generateBusinessUsername,
} from "./business.helpers";

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export { BusinessFacade, BusinessService } from "./BusinessService";

// ============================================================
// 📦 LEGACY - Alias para compatibilidade
// ============================================================
export { BusinessService as businessService } from "./BusinessService";

// ============================================================
// 🍽️ GASTRONOMY QUERIES - Leitura de dados gastronômicos
// ============================================================
export {
  getGastronomyProfile,
  getGastronomyBusiness,
  getGastronomyBusinessByTerritorySlug,
  getGastronomyBusinessesList,
  getGastronomyBusinesses,
  getGastronomyBusinessesByIds,
  hasGastronomyProfile,
} from "./gastronomy.queries";

// ============================================================
// 🍽️ GASTRONOMY MUTATIONS - Escrita de dados gastronômicos
// ============================================================
export {
  createGastronomyProfile,
  updateGastronomyProfile,
  deleteGastronomyProfile,
  updateOperationalStatus,
  patchGastronomyProfile,
} from "./gastronomy.mutations";

// ============================================================
// 📝 TYPES - Re-exports de tipos
// ============================================================
export type {
  Business,
  BusinessCategory,
  BusinessHours,
} from "../types/Business";

export type {
  BusinessInput,
  CreateBusinessInput,
  UpdateBusinessInput,
  BusinessFilters,
  BusinessStats,
  BusinessDataRecord,
  BusinessDataWithProfiles,
  BusinessMetadata,
  Product,
  ProductRecord,
  CreateProductInput,
} from "../types";

export type {
  PriceRange,
  GastronomyStatus,
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
  GastronomyBusiness,
  GastronomyBusinessFilters,
} from "../types";
