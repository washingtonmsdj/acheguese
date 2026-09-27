import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import { buildModuleTerritoryUrl } from "@/core/routing/utils/territoryUrls";

type PublicEnv = Partial<Record<string, string>>;

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

const launchCountry = publicEnv.VITE_LAUNCH_COUNTRY?.trim().toLowerCase() || "br";
const launchState = publicEnv.VITE_LAUNCH_STATE?.trim().toLowerCase() || "";
const launchCity = publicEnv.VITE_LAUNCH_CITY?.trim().toLowerCase() || "";
const launchName = publicEnv.VITE_LAUNCH_CITY_NAME?.trim() || "Território inicial";
const launchCommunitySlug = publicEnv.VITE_LAUNCH_COMMUNITY_SLUG?.trim() || "";
const launchCommunityName =
  publicEnv.VITE_LAUNCH_COMMUNITY_NAME?.trim() || launchName;

export const LAUNCH_CITY_PATH = launchState && launchCity ? `/${launchState}/${launchCity}` : "/brasil";
export const LAUNCH_COMMUNITY_TERRITORY_PATH = launchCommunitySlug
  ? `${LAUNCH_CITY_PATH}/${launchCommunitySlug}`
  : LAUNCH_CITY_PATH;
export const TERRITORY_CONFIG = {
  launch: {
    country: launchCountry,
    state: launchState,
    city: launchCity,
    name: launchName,
    community: {
      scope: launchCommunitySlug ? "territory" : "city",
      slug: launchCommunitySlug || null,
      name: launchCommunityName,
      path: LAUNCH_COMMUNITY_TERRITORY_PATH,
    },
  },
  defaultCountry: "br",
} as const;

export const LAUNCH_URLS = {
  territory: LAUNCH_COMMUNITY_TERRITORY_PATH,
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
