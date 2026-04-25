/**
 * LandingService - Fachada SSOT v2.0
 * 
 * Ponto único de entrada para landing pages nacionais e estaduais.
 * Exporta queries e types organizados.
 * 
 * @example
 * import { getCountryData, getActiveStates, getPlatformStats } from '@/app/features/landing/services/LandingService';
 * import type { CountryData, StateData, PlatformStats } from '@/app/features/landing/services/LandingService';
 */

// ============================================================
// QUERIES - Operações de Leitura
// ============================================================
export {
  getCountryData,
  getActiveStates,
  getStateData,
  getActiveCitiesByState,
  getActiveCities,
  getTerritorialGroups,
  getPlatformStats,
  getVerifiedBusinesses,
  checkAdminRole,
  getNationalBusinesses,
  getNationalServices,
  getNationalClassifieds,
  getNationalStats,
  getActiveTerritoriesWithLanding,
} from '@/core/landing/services/landing.queries';

// ============================================================
// TYPES
// ============================================================
export type {
  CountryData,
  StateData,
  CityData,
  TerritorialGroupData,
  PlatformStats,
  VerifiedBusiness,
} from '@/core/landing/services/types';

// ============================================================
// FACADE UNIFICADA (compatibilidade legada)
// ============================================================
import * as landingQueries from '@/core/landing/services/landing.queries';

/**
 * LandingFacade - Fachada unificada para operações de landing
 * @deprecated Use funções individuais de landing.queries
 */
export const LandingFacade = {
  queries: landingQueries,
} as const;

