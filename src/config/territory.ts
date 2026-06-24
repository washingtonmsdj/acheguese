import { APP_MODULE_SLUGS, buildAppModulePath } from "@/config/moduleSlugs";

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
export const LAUNCH_COMMUNITY_PUBLIC_PATH = launchCommunitySlug
  ? `/${launchCommunitySlug}`
  : LAUNCH_COMMUNITY_TERRITORY_PATH;

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
  community: buildAppModulePath(APP_MODULE_SLUGS.community, LAUNCH_COMMUNITY_PUBLIC_PATH),
  business: buildAppModulePath(APP_MODULE_SLUGS.business, LAUNCH_CITY_PATH),
  services: buildAppModulePath(APP_MODULE_SLUGS.services, LAUNCH_CITY_PATH),
  classifieds: buildAppModulePath(APP_MODULE_SLUGS.classifieds, LAUNCH_CITY_PATH),
  gastronomy: buildAppModulePath(APP_MODULE_SLUGS.gastronomy, LAUNCH_CITY_PATH),
  education: buildAppModulePath(APP_MODULE_SLUGS.education, LAUNCH_CITY_PATH),
  events: buildAppModulePath(APP_MODULE_SLUGS.events, LAUNCH_CITY_PATH),
  jobs: buildAppModulePath(APP_MODULE_SLUGS.jobs, LAUNCH_CITY_PATH),
  map: buildAppModulePath(APP_MODULE_SLUGS.map, LAUNCH_CITY_PATH),
  search: buildAppModulePath(APP_MODULE_SLUGS.search, LAUNCH_CITY_PATH),
  touristPoints: buildAppModulePath(APP_MODULE_SLUGS.touristPoints, LAUNCH_CITY_PATH),
} as const;
