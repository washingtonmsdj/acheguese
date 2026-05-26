/**
 * LandingService - Exports canônicos SSOT.
 *
 * Ponto unico de entrada para landing pages nacionais e estaduais.
 * Exporta queries e types organizados.
 */

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
} from "./landing.queries";

export type {
  ActiveTerritoriesWithLanding,
  CountryData,
  StateData,
  CityData,
  TerritorialGroupData,
  PlatformStats,
  NationalBusiness,
  NationalClassified,
  NationalService,
  NationalStats,
  VerifiedBusiness,
} from "./types";
