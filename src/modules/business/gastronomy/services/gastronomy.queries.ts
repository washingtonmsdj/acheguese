/**
 * Compatibility exports for Gastronomy read queries.
 *
 * The implementation lives in core/business so module hooks, menu queries and
 * cross-module consumers use the same read contract.
 */
export {
  getGastronomyProfile,
  getGastronomyBusiness,
  getGastronomyBusinessByTerritorySlug,
  getGastronomyBusinessesList,
  getGastronomyBusinesses,
  getGastronomyBusinessesByIds,
  hasGastronomyProfile,
} from "@/core/business/services/gastronomy.queries";

export type {
  PaginatedGastronomyBusinesses,
  TerritorySlugParams,
} from "@/core/business/types";
