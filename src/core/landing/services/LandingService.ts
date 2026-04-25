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
  CountryData,
  StateData,
  CityData,
  TerritorialGroupData,
  PlatformStats,
  VerifiedBusiness,
} from "./types";

import * as landingQueries from "./landing.queries";

export const LandingFacade = {
  queries: landingQueries,
} as const;
