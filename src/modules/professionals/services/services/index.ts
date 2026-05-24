/**
 * 🛠️ SERVICES MODULE - SSOT Exports
 *
 * Este módulo é um wrapper para o core Professional.
 * Delega todas as operações para ProfessionalFacade.
 *
 */

// ============================================================
// 🏛️ FACADE - Interface unificada
// ============================================================
export { ServicesService } from "./ServicesService";

// ============================================================
// 🌍 GEOGRAPHIC FOUNDATION INTEGRATION
// ============================================================
export {
  servicesLocationService,
  ServicesLocationService,
} from "./ServicesLocationService";
export {
  servicesCoverageService,
  ServicesCoverageService,
} from "./ServicesCoverageService";
export {
  servicesRolloutService,
  ServicesRolloutService,
} from "./ServicesRolloutService";
