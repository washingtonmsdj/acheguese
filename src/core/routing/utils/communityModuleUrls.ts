import {
  MODULE_SLUGS,
  buildCommunityScopedUrl,
  buildModuleTerritoryUrl,
  type ModuleSlug,
} from "./territoryUrls";
import { buildCommunityPortalUrl } from "@/core/routing/policies";

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
    return buildCommunityScopedUrl(normalizeCommunityBaseUrl(communityBaseUrl), module);
  }

  return buildModuleTerritoryUrl(module, territoryBaseUrl);
}

function normalizeCommunityBaseUrl(communityBaseUrl: string): string {
  const normalizedBase = normalizeRouteBase(communityBaseUrl);
  const parts = normalizedBase.split("/").filter(Boolean);
  if (parts.length === 1 && parts[0] !== MODULE_SLUGS.community) {
    return buildCommunityPortalUrl(parts[0]);
  }

  return normalizedBase;
}
