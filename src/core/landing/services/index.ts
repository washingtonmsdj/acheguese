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
export { HomeCommunityRankingService } from "./HomeCommunityRankingService";
export { HomeDiscoveryService } from "./HomeDiscoveryService";
export {
  buildNeighborhoodStreamItems,
  getNeighborhoodStreamMoreConfig,
  type NeighborhoodStreamUrls,
} from "./NeighborhoodStreamModelService";

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
  NeighborhoodCommunityTab,
  NeighborhoodCommunityTabId,
  NeighborhoodStreamGroups,
  NeighborhoodStreamItem,
  NeighborhoodStreamMoreConfig,
  NeighborhoodStreamTone,
} from "@/core/landing/types";

export type {
  FeaturedBusiness,
  FeaturedClassified,
  FeaturedService,
  TerritoryStats,
} from "./LandingFeaturedService";
export type {
  HomeCommunityActivity,
  HomeCommunityCard,
  HomeDiscoveryOptions,
  HomeDiscoveryResult,
  HomeImageKey,
  HomeSponsoredItem,
  HomeStatCard,
  HomeStatId,
} from "./HomeDiscoveryService";
