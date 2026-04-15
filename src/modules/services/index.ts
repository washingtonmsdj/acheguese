/**
 * Services Module - Public API
 *
 * This module handles professional services listings and management.
 *
 * Validates: Requirements 8.1, 8.2, 8.3
 * Validates: Property 6 (Barrel Exports Apenas para API Pública)
 */

// ============================================================================
// Components - Main UI Components
// ============================================================================

export { ServiceCardEnhanced ../../../.archive/ServiceCard.oldviceCardEnhanced";
export { ServiceCardEnhanced as ServiceCard } from "./components/ServiceCardEnhanced"; // Alias para compatibilidade
export { ServiceCategories } from "./components/ServiceCategories";
export { ServicesList } from "./components/ServicesList";
export { TopRatedSection } from "./components/TopRatedSection";

// ============================================================================
// Hooks - Custom React Hooks
// ============================================================================

export { useServicos } from "./hooks/useServicos";
export { useTopRatedProfessionals } from "./hooks/useTopRatedProfessionals";

// Geographic Foundation Hooks
export { useServicesLocation } from "./hooks/useServicesLocation";
export { useServicesCoverage } from "./hooks/useServicesCoverage";
export { useServicesRollout } from "./hooks/useServicesRollout";

// ============================================================================
// Services - Business Logic
// ============================================================================

export { ServicesService } from "./services/ServicesService";

// Geographic Foundation Services
export { servicesLocationService, ServicesLocationService } from "./services/ServicesLocationService";
export { servicesCoverageService, ServicesCoverageService } from "./services/ServicesCoverageService";
export { servicesRolloutService, ServicesRolloutService } from "./services/ServicesRolloutService";

// ============================================================================
// Pages - Route Components
// ============================================================================

export { default as ServicosLandingPage } from "./pages/ServicosLandingPage";
export { default as CadastrarServicoPage } from "./pages/CadastrarServicoPage";
export { default as EditarServicoPage } from "./pages/EditarServicoPage";
export { default as ProfissionalDetailPage } from "./pages/ProfissionalDetailPage";

// ============================================================================
// Types - Public Type Definitions
// ============================================================================

export type { ProfessionalItem } from "./hooks/useServicos";
