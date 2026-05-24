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
  community: `/comunidade${LAUNCH_COMMUNITY_TERRITORY_PATH}`,
  business: `/empresas${LAUNCH_CITY_PATH}`,
  services: `/servicos${LAUNCH_CITY_PATH}`,
  classifieds: `/classificados${LAUNCH_CITY_PATH}`,
  gastronomy: `/gastronomia${LAUNCH_CITY_PATH}`,
  education: `/educacao${LAUNCH_CITY_PATH}`,
  events: `/eventos${LAUNCH_COMMUNITY_TERRITORY_PATH}`,
  jobs: `/vagas${LAUNCH_CITY_PATH}`,
} as const;
