/**
 * Business services exports.
 */

// Gastronomy queries
export {
  getGastronomyProfile,
  getGastronomyBusiness,
  getGastronomyBusinessByTerritorySlug,
  getGastronomyBusinessesList,
  getGastronomyBusinesses,
  getGastronomyBusinessesByIds,
  hasGastronomyProfile,
} from "./gastronomy.queries";

// Canonical Gastronomy profile writer/facade
export {
  GastronomyProfileService,
  type ServiceResult as GastronomyProfileServiceResult,
} from "./GastronomyProfileService";

// Compatibility mutation API; delegates to GastronomyProfileService.
export {
  createGastronomyProfile,
  updateGastronomyProfile,
  deleteGastronomyProfile,
  updateOperationalStatus,
  patchGastronomyProfile,
} from "./gastronomy.mutations";

// Types
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

export { BusinessReviewService } from "./BusinessReviewService";
export type {
  BusinessReviewCreateInput,
  BusinessReviewResponseInput,
  BusinessReviewUpdateInput,
} from "./BusinessReviewService";

export type {
  PriceRange,
  GastronomyStatus,
  GastronomyProfile,
  CreateGastronomyProfileInput,
  UpdateGastronomyProfileInput,
  GastronomyBusiness,
  GastronomyBusinessFilters,
} from "../types";
