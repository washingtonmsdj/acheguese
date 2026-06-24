import {
  buildCommunityScopedUrl,
  buildModuleTerritoryUrl,
  type ModuleSlug,
} from "./territoryUrls";

function normalizeRouteBase(value: string): string {
  const normalized = value.trim().replace(/\/+$/g, "");
  return normalized || "/";
}

export function shouldUseCommunityScopedModuleUrls({
  pathname,
  territoryBaseUrl,
  communityBaseUrl,
}: {
  pathname: string;
  territoryBaseUrl: string;
  communityBaseUrl?: string | null;
}): boolean {
  if (!communityBaseUrl) return false;

  const normalizedCommunityBase = normalizeRouteBase(communityBaseUrl);
  const normalizedTerritoryBase = normalizeRouteBase(territoryBaseUrl);
  const normalizedPathname = normalizeRouteBase(pathname);

  if (normalizedCommunityBase === normalizedTerritoryBase) return true;
  return (
    normalizedPathname === normalizedCommunityBase ||
    normalizedPathname.startsWith(`${normalizedCommunityBase}/`)
  );
}

export function buildContextualModuleUrl({
  module,
  territoryBaseUrl,
  communityBaseUrl,
  useCommunityScopedModules,
}: {
  module: ModuleSlug;
  territoryBaseUrl: string;
  communityBaseUrl?: string | null;
  useCommunityScopedModules?: boolean;
}): string {
  if (communityBaseUrl && useCommunityScopedModules) {
    return buildCommunityScopedUrl(communityBaseUrl, module);
  }

  return buildModuleTerritoryUrl(module, territoryBaseUrl);
}
