/**
 * Business services exports.
 */


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
