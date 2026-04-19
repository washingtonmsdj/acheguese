/**
 * 🏆 BUSINESS SERVICE - FACHADA SSOT
 *
 * ✅ Ponto único de entrada para operações de empresas
 * ✅ Mantém compatibilidade com código existente
 * ✅ Delega para módulos especializados por responsabilidade
 *
 * REFATORAÇÃO v5.0.0:
 * - Mappers → business.mappers.ts
 * - Queries → business.queries.ts
 * - Mutations → business.mutations.ts
 * - Admin → business.admin.ts
 * - Legacy → business.legacy.ts
 * - Helpers → business.helpers.ts
 *
 * ⚠️ NÃO adicionar lógica diretamente neste arquivo.
 * Use os módulos especializados acima.
 */

// Re-exports de mappers
export {
  toBusinessReadModel,
  mapBusinessDataToBusiness,
  toBusinessData,
  mapProductRecordToProduct,
  mapReviewRecordToReview,
} from "./business.mappers";

// Re-exports de queries (alias via BusinessService)
export {
  getBusinesses,
  getBusinessesList,
  getBusinessProfile,
  getBusinessById,
  getBusinessDataIdByProfileId,
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

// Re-exports de mutations (alias via BusinessService)
export {
  createBusiness,
  updateBusiness,
  updateActiveSections,
  deleteBusiness,
  createProduct,
  incrementViews,
} from "./business.mutations";

// Re-exports de admin
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

// Re-exports de legacy
export {
  searchBusinessesLegacy,
  getRecentBusinessesLegacy,
} from "./business.legacy";

// Re-exports de helpers
export {
  isBusinessMigrated,
  hasPhysicalAddress,
  getFormattedAddress,
  getCoordinates,
  getTerritory,
  getTerritoryName,
  generateBusinessUsername,
} from "./business.helpers";

// Re-exports de validators
export {
  isValidBusinessId,
  isValidBusinessIdArray,
  isValidCoordinates,
  isValidSlug,
  isValidBusinessCategory,
  isValidEmail,
  isValidPageParam,
  isValidPageSize,
  isValidRating,
  sanitizeSearchQuery,
} from "./validators";

// Re-exports de types
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
  Review,
  ReviewRecord,
  ReviewWithUser,
} from "../types";

// ============================================================
// 🏛️ SSOT v2.0 - FACADE
// ============================================================
import { logger } from '@/shared/utils/logger';
import * as BusinessMappers from "./business.mappers";
import * as BusinessQueries from "./business.queries";
import * as BusinessMutations from "./business.mutations";
import * as BusinessAdmin from "./business.admin";
import * as BusinessLegacy from "./business.legacy";
import * as BusinessHelpers from "./business.helpers";
import type { BusinessStats } from "../types";
import { ReviewsService } from "@/core/reviews/services/ReviewsService";
/**
 * 🏢 BusinessFacade - Interface SSOT unificada v2.0
 *
 * Uso: BusinessFacade.queries.getBusinessById(id)
 *      BusinessFacade.mutations.createBusiness(data)
 *      BusinessFacade.admin.getBusinessMetrics()
 */
export const BusinessFacade = {
  queries: BusinessQueries,
  mutations: BusinessMutations,
  admin: BusinessAdmin,
  mappers: BusinessMappers,
  helpers: BusinessHelpers,
  legacy: BusinessLegacy,
} as const;

/**
 * @deprecated Use BusinessFacade ou os exports diretos dos módulos.
 * BusinessService como classe estática mantido para compatibilidade.
 */
export class BusinessService {
  // ===== MAPPERS =====
  static toBusinessReadModel = BusinessMappers.toBusinessReadModel;
  static mapBusinessDataToBusiness = BusinessMappers.mapBusinessDataToBusiness;

  // ===== QUERIES =====
  static getBusinesses = BusinessQueries.getBusinesses;
  static getBusinessesList = BusinessQueries.getBusinessesList;
  static getBusinessProfile = BusinessQueries.getBusinessProfile;
  static getBusinessById = BusinessQueries.getBusinessById;
  static getBusinessDataIdByProfileId = BusinessQueries.getBusinessDataIdByProfileId;
  static getBusinessBySlug = BusinessQueries.getBusinessBySlug;
  static checkSlugExists = BusinessQueries.checkSlugExists;
  static getSimilarSlugs = BusinessQueries.getSimilarSlugs;
  static getSlugHistory = BusinessQueries.getSlugHistory;
  static resolveOldSlug = BusinessQueries.resolveOldSlug;
  static getBusinessesByIds = BusinessQueries.getBusinessesByIds;
  static searchBusinessesByName = BusinessQueries.searchBusinessesByName;
  static getProducts = BusinessQueries.getProducts;
  static getProductsPage = BusinessQueries.getProductsPage;
  static getServices = BusinessQueries.getServices;
  static getSimilarBusinesses = BusinessQueries.getSimilarBusinesses;
  static getGallery = BusinessQueries.getGallery;

  // ===== MUTATIONS =====
  static createBusiness = BusinessMutations.createBusiness;
  static updateBusiness = BusinessMutations.updateBusiness;
  static updateActiveSections = BusinessMutations.updateActiveSections;
  static deleteBusiness = BusinessMutations.deleteBusiness;
  static createProduct = BusinessMutations.createProduct;
  static incrementViews = BusinessMutations.incrementViews;

  // ===== ADMIN =====
  static getBusinessClaims = BusinessAdmin.getBusinessClaims;
  static getBusinessClaimDetails = BusinessAdmin.getBusinessClaimDetails;
  static getTotalBusinessesCount = BusinessAdmin.getTotalBusinessesCount;
  static getPremiumBusinessesCount = BusinessAdmin.getPremiumBusinessesCount;
  static getBusinessesCreatedInPeriod = BusinessAdmin.getBusinessesCreatedInPeriod;
  static getBusinessMetrics = BusinessAdmin.getBusinessMetrics;
  static getActiveCoupons = BusinessAdmin.getActiveCoupons;
  static getCouponById = BusinessAdmin.getCouponById;

  // ===== LEGACY =====
  static searchBusinessesLegacy = BusinessLegacy.searchBusinessesLegacy;
  static getRecentBusinessesLegacy = BusinessLegacy.getRecentBusinessesLegacy;

  // ===== HELPERS =====
  static isBusinessMigrated = BusinessHelpers.isBusinessMigrated;
  static hasPhysicalAddress = BusinessHelpers.hasPhysicalAddress;
  static getFormattedAddress = BusinessHelpers.getFormattedAddress;
  static getCoordinates = BusinessHelpers.getCoordinates;
  static getTerritory = BusinessHelpers.getTerritory;
  static getTerritoryName = BusinessHelpers.getTerritoryName;

  // ===== WRAPPERS DEPRECATED (mantidos para compatibilidade) =====
  
  /**
   * @deprecated Use FavoritesService diretamente
   */
  static async toggleFavorite(businessId: string, profileId: string): Promise<boolean> {
    const { FavoritesService } = await import("@/core/favorites/services/FavoritesService");
    return FavoritesService.toggleBusinessFavorite(businessId, profileId);
  }

  /**
   * @deprecated Use FavoritesService diretamente
   */
  static async getFavorites(profileId: string): Promise<string[]> {
    const { FavoritesService } = await import("@/core/favorites/services/FavoritesService");
    return FavoritesService.getUserBusinessFavorites(profileId);
  }

  /**
   * @deprecated Use ReviewsService diretamente
   */
  static async getStats(): Promise<BusinessStats> {
    return {
      total: await BusinessAdmin.getTotalBusinessesCount(),
      active: 0,
      premium: await BusinessAdmin.getPremiumBusinessesCount(),
      by_category: {},
    };
  }

  /**
   * @deprecated Use ReviewsService diretamente
   */
  static async getMyReview(businessId: string, userId: string) {
    const { profileService } = await import("@/core/profiles/services/ProfileService");
    const activeProfile = await profileService.getProfileContext(userId);
    if (!activeProfile) return null;

    return ReviewsService.getReviewByReviewer(businessId, activeProfile.id, "business");
  }

  /**
   * @deprecated Use ReviewsService diretamente
   */
  static async submitReview(
    businessId: string,
    userId: string,
    rating: number,
    comment?: string,
  ): Promise<void> {
    const { profileService } = await import("@/core/profiles/services/ProfileService");
    const activeProfile = await profileService.getProfileContext(userId);
    if (!activeProfile) {
      throw new Error("Perfil ativo não encontrado");
    }

    await ReviewsService.upsertReview(
      {
        reviewed_profile_id: businessId,
        reviewer_profile_id: activeProfile.id,
        rating,
        comment,
      },
      "business",
    );
  }

  /**
   * @deprecated Cache removido - usar React Query invalidation
   */
  static clearCache(): void {
    logger.warn("BusinessService.clearCache() foi removido. Use React Query invalidation.");
  }
}
