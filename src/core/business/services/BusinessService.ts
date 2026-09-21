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
  getBusinessesList,
  getBusinessProfile,
  getBusinessById,
  getBusinessDataIdByProfileId,
  isBusinessCommunityLinkEligibleByDataId,
  getBusinessBySlug,
  checkSlugExists,
  getSlugsByPrefix,
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
  getBusinessInstitutionScopeAdminModel,
  grantBusinessInstitutionScope,
  revokeBusinessInstitutionScope,
} from "./business.admin";

export type {
  InstitutionAuthorityKind,
  GrantBusinessInstitutionScopeInput,
  BusinessInstitutionAuthorityOption,
  BusinessInstitutionSchoolOption,
  BusinessInstitutionScopeRecord,
  BusinessInstitutionScopeAdminModel,
} from "./business.admin";

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

import * as BusinessMappers from "./business.mappers";
import * as BusinessQueries from "./business.queries";
import * as BusinessMutations from "./business.mutations";
import * as BusinessAdmin from "./business.admin";
import type { Business, BusinessFilters } from "../types";

const PUBLIC_BUSINESS_COMPAT_PAGE_SIZE = 100;

/**
 * Lista publica bounded para consumidores ainda nao migrados para paginacao.
 *
 * Novos fluxos devem usar getBusinessesList, busca espacial ou read model
 * especializado. Esta fachada nunca materializa o catalogo inteiro em memoria:
 * consulta somente a primeira pagina da view publica canonica.
 */
export async function getBusinesses(
  filters: BusinessFilters = {},
): Promise<Business[]> {
  const { businesses } = await BusinessQueries.getBusinessesList({
    pageParam: 0,
    pageSize: PUBLIC_BUSINESS_COMPAT_PAGE_SIZE,
    category: filters.category,
    searchQuery: filters.search,
    sortBy: filters.sortBy === "distancia" ? undefined : filters.sortBy,
    filter: filters.territoryFilter,
  });

  const wantedNeighborhood = filters.neighborhood
    ?.trim()
    .toLocaleLowerCase("pt-BR");

  return businesses.filter((business) => {
    if (filters.hasDelivery && !business.tem_delivery) {
      return false;
    }

    if (wantedNeighborhood) {
      const locationName =
        business.location?.name?.trim().toLocaleLowerCase("pt-BR") ?? "";
      const cityName =
        business.business_city?.trim().toLocaleLowerCase("pt-BR") ?? "";

      if (
        locationName !== wantedNeighborhood &&
        !locationName.includes(wantedNeighborhood) &&
        cityName !== wantedNeighborhood
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Fachada estatica para consumo dos modulos de empresa.
 */
export class BusinessService {
  // ===== MAPPERS =====
  static toBusinessReadModel = BusinessMappers.toBusinessReadModel;
  static mapBusinessDataToBusiness = BusinessMappers.mapBusinessDataToBusiness;

  // ===== QUERIES =====
  static getBusinesses = getBusinesses;
  static getBusinessesList = BusinessQueries.getBusinessesList;
  static getLaunchVisibleBusinessProfileIds =
    BusinessQueries.getLaunchVisibleBusinessProfileIds;
  static getBusinessProfile = BusinessQueries.getBusinessProfile;
  static getBusinessById = BusinessQueries.getBusinessById;
  static getBusinessDataIdByProfileId =
    BusinessQueries.getBusinessDataIdByProfileId;
  static isCommunityLinkEligibleByDataId =
    BusinessQueries.isBusinessCommunityLinkEligibleByDataId;
  static getBusinessBySlug = BusinessQueries.getBusinessBySlug;
  static checkSlugExists = BusinessQueries.checkSlugExists;
  static getSlugsByPrefix = BusinessQueries.getSlugsByPrefix;
  static getBusinessesByIds = BusinessQueries.getBusinessesByIds;
  static searchBusinessesByName = BusinessQueries.searchBusinessesByName;
  static getProducts = BusinessQueries.getProducts;
  static getProductsPage = BusinessQueries.getProductsPage;
  static getServices = BusinessQueries.getServices;
  static getSimilarBusinesses = BusinessQueries.getSimilarBusinesses;
  static getGallery = BusinessQueries.getGallery;
  static async getRecentBusinesses(
    limit = 10,
  ): Promise<Array<{ id: string; name: string; created_at: string }>> {
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
  static deleteBusiness = BusinessMutations.deleteBusiness;
  static createProduct = BusinessMutations.createProduct;
  static incrementViews = BusinessMutations.incrementViews;

  // ===== ADMIN =====
  static getBusinessClaims = BusinessAdmin.getBusinessClaims;
  static getBusinessClaimDetails = BusinessAdmin.getBusinessClaimDetails;
  static getTotalBusinessesCount = BusinessAdmin.getTotalBusinessesCount;
  static getPremiumBusinessesCount = BusinessAdmin.getPremiumBusinessesCount;
  static getBusinessesCreatedInPeriod =
    BusinessAdmin.getBusinessesCreatedInPeriod;
  static getBusinessMetrics = BusinessAdmin.getBusinessMetrics;
  static getActiveCoupons = BusinessAdmin.getActiveCoupons;
  static getCouponById = BusinessAdmin.getCouponById;
  static updateBusinessClaimStatus = BusinessAdmin.updateBusinessClaimStatus;
  static getBusinessInstitutionScopeAdminModel =
    BusinessAdmin.getBusinessInstitutionScopeAdminModel;
  static grantBusinessInstitutionScope =
    BusinessAdmin.grantBusinessInstitutionScope;
  static revokeBusinessInstitutionScope =
    BusinessAdmin.revokeBusinessInstitutionScope;

}