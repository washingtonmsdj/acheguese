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
  getPlatformStats,
  getVerifiedBusinesses,
  checkAdminRole,
  getNationalBusinesses,
  getNationalServices,
  getNationalClassifieds,
  getNationalStats,
} from "./landing.queries";

export {
  getTerritorialGroups,
  getActiveTerritoriesWithLanding,
} from "./territorialLanding.queries";

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
