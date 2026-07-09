/**
 * BusinessService - fachada SSOT de empresas.
 *
 * Ponto unico de entrada para operacoes de empresa.
 * Nao adicionar logica diretamente neste arquivo; use os modulos especializados.
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
  isBusinessCommunityLinkEligibleByDataId,
  getBusinessBySlug,
  checkSlugExists,
  getSimilarSlugs,
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
  updateBusinessClaimStatus,
} from "./business.admin";

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
import * as BusinessMappers from "./business.mappers";
import * as BusinessQueries from "./business.queries";
import * as BusinessMutations from "./business.mutations";
import * as BusinessAdmin from "./business.admin";
import * as BusinessHelpers from "./business.helpers";
import type { BusinessStats } from "../types";
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
} as const;

/**
 * Fachada estatica para consumo dos modulos de empresa.
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
  static isCommunityLinkEligibleByDataId =
    BusinessQueries.isBusinessCommunityLinkEligibleByDataId;
  static getBusinessBySlug = BusinessQueries.getBusinessBySlug;
  static checkSlugExists = BusinessQueries.checkSlugExists;
  static getSimilarSlugs = BusinessQueries.getSimilarSlugs;
  static getBusinessesByIds = BusinessQueries.getBusinessesByIds;
  static searchBusinessesByName = BusinessQueries.searchBusinessesByName;
  static getProducts = BusinessQueries.getProducts;
  static getProductsPage = BusinessQueries.getProductsPage;
  static getServices = BusinessQueries.getServices;
  static getSimilarBusinesses = BusinessQueries.getSimilarBusinesses;
  static getGallery = BusinessQueries.getGallery;
  static async getRecentBusinesses(limit = 10): Promise<Array<{ id: string; name: string; created_at: string }>> {
    const { businesses } = await BusinessQueries.getBusinessesList({
      pageParam: 0,
      pageSize: limit,
      sortBy: "created_at",
    });

    return businesses.map((business) => ({
      id: business.id,
      name: business.name,
      created_at: business.created_at ?? "",
    }));
  }

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
  static updateBusinessClaimStatus = BusinessAdmin.updateBusinessClaimStatus;

  // ===== HELPERS =====
  static isBusinessMigrated = BusinessHelpers.isBusinessMigrated;
  static hasPhysicalAddress = BusinessHelpers.hasPhysicalAddress;
  static getFormattedAddress = BusinessHelpers.getFormattedAddress;
  static getCoordinates = BusinessHelpers.getCoordinates;
  static getTerritory = BusinessHelpers.getTerritory;
  static getTerritoryName = BusinessHelpers.getTerritoryName;

  static async getStats(): Promise<BusinessStats> {
    return {
      total: await BusinessAdmin.getTotalBusinessesCount(),
      active: 0,
      premium: await BusinessAdmin.getPremiumBusinessesCount(),
      by_category: {},
    };
  }
}
