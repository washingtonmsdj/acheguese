/**
 * Business Module - Public API
 *
 * This barrel export exposes only the public API of the business module.
 * Internal implementation details should not be exported.
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 * Validates: Property 6 (Barrel Exports Apenas para API Pública)
 */

// Components
export { ContactLink } from "./components/ContactLink";

// Services
export { BusinessService } from "./services/BusinessService";
export {
  businessManagementService,
  type BusinessSection,
  type BusinessSectionConfig,
  type BusinessEditData,
} from "@/core/business/services/BusinessManagementService";

// Hooks
export { useBusiness } from "@/core/business/hooks/useBusiness";
export { useBusinessById } from "./hooks/useBusinessById";
export { useBusinessEdit } from "./hooks/useBusinessEdit";
export {
  useCanonicalBusinessFavorite,
  useCanonicalBusinessFavorites,
} from "./hooks/useCanonicalBusinessFavorite";
export { useBusinessRecommendation } from "./hooks/useBusinessRecommendation";
export { useBusinessForm } from "./hooks/useBusinessForm";
export { useBusinessFormSteps } from "./hooks/useBusinessFormSteps";
export { useBusinessGallery } from "./hooks/useBusinessGallery";
export { useBusinessImageUpload } from "./hooks/useBusinessImageUpload";
export { useBusinessList } from "./hooks/useBusinessList";
export {
  useBusinessSections,
  useUpdateBusinessSections,
  useBusinessInfo,
  useUpdateBusinessInfo,
  useBusinessStats,
  useUpdateBusinessStatus,
  useUploadBusinessImage,
} from "./hooks/useBusinessManagement";
export { useBusinessMetrics } from "./hooks/useBusinessMetrics";
export { useBusinessNavigation } from "./hooks/useBusinessNavigation";
export { useBusinessProducts } from "./hooks/useBusinessProducts";
export { useBusinessReviews } from "./hooks/useBusinessReviews";
export { useBusinessServices } from "./hooks/useBusinessServices";

// Pages
export { default as CriarEmpresaPage } from "./pages/CriarEmpresaPage";
export { default as EditarEmpresaPage } from "./pages/EditarEmpresaPage";
export { default as EmpresaCatalogoPublicoPage } from "./pages/EmpresaCatalogoPublicoPage";

// Types - canonical business contracts live in core/business.
export type {
  BusinessCategory,
  BusinessMetadata,
  BusinessDataRecord,
  BusinessDataWithProfiles,
  ProductRecord,
  Product,
  ReviewRecord,
  ReviewWithUser,
  Review,
  CreateBusinessInput,
  UpdateBusinessInput,
  Business,
  BusinessStats,
  CreateProductInput,
  BusinessInput,
} from "@/core/business/types";

export type {
  Service,
  GalleryPhoto,
  BizData,
  SortOption,
} from "./types";

// Export BusinessHours and BusinessFilters types with aliases to avoid conflicts with components
export type {
  BusinessHours as BusinessHoursType,
  BusinessFilters as BusinessFiltersType,
} from "@/core/business/types";

export {
  businessSchema,
  createBusinessSchema,
  updateBusinessSchema,
  businessUXSchema,
  type BusinessUXInput,
  getBusinessesSchema,
  type GetBusinessesInput,
} from "@/shared/schemas/business/businessSchemas";
