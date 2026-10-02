export type LaunchEnvironment = Partial<Record<string, string>>;

export interface ResolvedLaunchTerritoryEnvironment {
  country: string;
  state: string;
  city: string;
  cityName: string;
  communitySlug: string;
  communityName: string;
  cityPath: string;
  communityPath: string;
}

export function resolveLaunchTerritoryEnvironment(
  env: LaunchEnvironment,
): ResolvedLaunchTerritoryEnvironment {
  const country = env.VITE_LAUNCH_COUNTRY?.trim().toLowerCase() || "br";
  const state = env.VITE_LAUNCH_STATE?.trim().toLowerCase() || "";
  const city = env.VITE_LAUNCH_CITY?.trim().toLowerCase() || "";
  const cityName = env.VITE_LAUNCH_CITY_NAME?.trim() || "Território inicial";
  const communitySlug = env.VITE_LAUNCH_COMMUNITY_SLUG?.trim() || "";
  const communityName =
    env.VITE_LAUNCH_COMMUNITY_NAME?.trim() || cityName;

  const cityPath = state && city ? `/${state}/${city}` : "/brasil";
  const communityPath = communitySlug
    ? `${cityPath}/${communitySlug}`
    : cityPath;

  return {
    country,
    state,
    city,
    cityName,
    communitySlug,
    communityName,
    cityPath,
    communityPath,
  };
}
