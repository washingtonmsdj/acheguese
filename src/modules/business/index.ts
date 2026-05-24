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
export { BusinessCard } from "./components/BusinessCard";
export { BusinessFilters } from "./components/BusinessFilters";
export { BusinessGrid } from "./components/BusinessGrid";
export { BusinessHeader } from "./components/BusinessHeader";
export { BusinessAbout } from "./components/BusinessAbout";
export { BusinessGallery } from "./components/BusinessGallery";
export { BusinessHours } from "./components/BusinessHours";
export { BusinessProducts } from "./components/BusinessProducts";
export { BusinessReviews } from "./components/BusinessReviews";
export { BusinessServices } from "./components/BusinessServices";
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
export { useBusiness } from "./hooks/useBusiness";
export { useBusinessById } from "./hooks/useBusinessById";
export { useBusinessCreate } from "./hooks/useBusinessCreate";
export { useBusinessEdit } from "./hooks/useBusinessEdit";
export { useBusinessFavorite, useBusinessFavorites } from "./hooks/useBusinessFavorite";
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
export { default as BusinessStandalonePage } from "./pages/BusinessStandalonePage";
export { default as CriarEmpresaPage } from "./pages/CriarEmpresaPage";
export { default as EditarEmpresaPage } from "./pages/EditarEmpresaPage";
export { default as EmpresaCatalogoPublicoPage } from "./pages/EmpresaCatalogoPublicoPage";
export { default as EmpresasPage } from "./pages/EmpresasPage";

// Types - Export all types from types/index.ts (excluding those that conflict with component names)
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
} from "./types";

// Export BusinessHours and BusinessFilters types with aliases to avoid conflicts with components
export type {
  BusinessHours as BusinessHoursType,
  BusinessFilters as BusinessFiltersType,
} from "./types";

// Schemas - Export schemas and their inferred types with explicit names to avoid conflicts
export {
  CreateBusinessSchema,
  UpdateBusinessSchema,
  GetBusinessesSchema,
  type GetBusinessesInput,
} from "./schemas/business.schema";

export {
  businessSchema,
  createBusinessSchema,
  updateBusinessSchema,
  businessUXSchema,
  type BusinessUXInput,
} from "@/shared/schemas/business/businessSchemas";

