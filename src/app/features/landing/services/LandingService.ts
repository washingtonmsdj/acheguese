/**
 * LandingService - Fachada SSOT v2.0
 * 
 * Ponto único de entrada para landing pages nacionais e estaduais.
 * Exporta queries e types organizados.
 * 
 * @example
 * import { getCountryData, getActiveStates, getPlatformStats } from './LandingService';
 * import type { CountryData, StateData, PlatformStats } from './LandingService';
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
} from './landing.queries';

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
} from './types';

// ============================================================
// FACADE UNIFICADA (compatibilidade legada)
// ============================================================
import * as landingQueries from './landing.queries';

/**
 * LandingFacade - Fachada unificada para operações de landing
 * @deprecated Use funções individuais de landing.queries
 */
export const LandingFacade = {
  queries: landingQueries,
} as const;

// Backward-compatible aliases used by public barrels.
export const LandingService = LandingFacade;
export const landingService = LandingFacade;

