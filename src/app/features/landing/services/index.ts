/**
 * Landing Services - Barrel export
 */

import * as LandingService from './LandingService';

export { LandingService };
export const landingService = LandingService;

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
} from './LandingService';

export type {
  CountryData,
  StateData,
  CityData,
  TerritorialGroupData,
  PlatformStats,
  VerifiedBusiness,
} from './LandingService';
