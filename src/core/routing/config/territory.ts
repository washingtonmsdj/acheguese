import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import { buildModuleTerritoryUrl } from "@/core/routing/utils/territoryUrls";
import {
  resolveLaunchTerritoryEnvironment,
  type LaunchEnvironment,
} from "@/core/routing/config/territoryEnvironment";

const publicEnv = (
  (import.meta as ImportMeta & { env?: LaunchEnvironment }).env ?? {}
) as LaunchEnvironment;

const launchEnvironment = resolveLaunchTerritoryEnvironment(publicEnv);

export const LAUNCH_CITY_PATH = launchEnvironment.cityPath;
export const LAUNCH_COMMUNITY_TERRITORY_PATH =
  launchEnvironment.communityPath;

export const TERRITORY_CONFIG = {
  launch: {
    country: launchEnvironment.country,
    state: launchEnvironment.state,
    city: launchEnvironment.city,
    name: launchEnvironment.cityName,
    community: {
      scope: launchEnvironment.communitySlug ? "territory" : "city",
      slug: launchEnvironment.communitySlug || null,
      name: launchEnvironment.communityName,
      path: LAUNCH_COMMUNITY_TERRITORY_PATH,
    },
  },
  defaultCountry: "br",
} as const;

export const LAUNCH_URLS = {
  portal: LAUNCH_COMMUNITY_TERRITORY_PATH,
  community: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.community,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  business: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.business,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  services: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.services,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  classifieds: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.classifieds,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  gastronomy: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.gastronomy,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  education: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.education,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  events: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.events,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  jobs: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.jobs,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  map: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.map,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  nearby: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.nearby,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  search: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.search,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
  touristPoints: buildModuleTerritoryUrl(
    APP_MODULE_SLUGS.touristPoints,
    LAUNCH_COMMUNITY_TERRITORY_PATH,
  ),
} as const;
