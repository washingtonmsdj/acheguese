/**
 * 🏆 CLASSIFIEDS MODULE - Barrel Export
 *
 * Public API for the classifieds module
 */

// Pages (Public Routes)
export { default as ClassificadosPage } from "./pages/ClassificadosPage";
export { default as ClassificadosLandingPage } from "./pages/ClassificadosLandingPage";
export { default as ClassificadoDetailPage } from "./pages/ClassificadoDetailPage";
export { default as NovoClassificadoPage } from "./pages/NovoClassificadoPage";

// Hooks
export { useClassificados } from "./hooks/useClassificados";
export { useClassificadosPage } from "./hooks/useClassificadosPage";
export { useClassificadoDetail } from "./hooks/useClassificadoDetail";
export { useNovoClassificado } from "./hooks/useNovoClassificado";
export { useVendedores } from "./hooks/useVendedores";
export { useSellerAds } from "./hooks/useSellerAds";

// Geographic Foundation Hooks
export { useClassifiedsLocation } from "./hooks/useClassifiedsLocation";
export { useClassifiedsRollout } from "./hooks/useClassifiedsRollout";

// Services
export {
  classifiedService,
  default as ClassifiedService,
} from "./services/ClassifiedService";

// Geographic Foundation Services
export { classifiedsLocationService, ClassifiedsLocationService } from "./services/ClassifiedsLocationService";
export { classifiedsRolloutService, ClassifiedsRolloutService } from "./services/ClassifiedsRolloutService";

// Types
export type {
  Classified,
  ClassifiedWithSeller,
  CreateClassifiedInput,
  UpdateClassifiedInput,
  SellerRating,
  ClassifiedFilters,
} from "./types/classified";

export type { ClassificadoWithVendedor } from "./hooks/useClassificados";
export type { ClassificadosFilters, ViewMode } from "./hooks/useClassificadosPage";
export type { VendedorWithAds } from "./hooks/useVendedores";

// Mock Data
export { MOCK_CLASSIFIEDS } from "./data/mock-classifieds";
