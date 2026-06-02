import * as LandingService from "./LandingService";

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
} from "./LandingService";

export { LandingFeaturedService } from "./LandingFeaturedService";

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
} from "./LandingService";

export type {
  FeaturedBusiness,
  FeaturedClassified,
  FeaturedService,
  TerritoryStats,
} from "./LandingFeaturedService";
