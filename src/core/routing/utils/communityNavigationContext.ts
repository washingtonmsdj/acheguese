import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  extractCommunityTerritoryBaseUrl,
  geoPathToPublicUrl,
  MODULE_SLUGS,
  normalizePublicTerritoryPath,
} from "@/core/routing/utils/territoryUrls";

type ResolvedCommunityTerritory = Exclude<ResolvedTerritory, null>;

export interface CommunityNavigationTerritorialContext {
  resolved: ResolvedCommunityTerritory;
  baseUrl: string;
  communityBaseUrl: string;
}

export interface CommunityNavigationContext {
  state: string;
  city: string;
  territorySlug: string;
  territoryBasePath: string;
  basePath: string;
  groupId: string | null;
}

export interface CommunityNavigationModuleUrls {
  business: string;
  gastronomy: string;
  education: string;
  services: string;
  classifieds: string;
  events: string;
  jobs: string;
  map: string;
  mobility: string;
}

function normalizeTerritoryBasePath(
  value: string | null | undefined,
): string | null {
  if (!value) return null;

  const normalized = normalizePublicTerritoryPath(value);
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return `/${parts.slice(0, 3).join("/")}`;
}

function getTerritoryBasePathFromResolved(
  resolved: ResolvedCommunityTerritory,
): string | null {
  if (resolved.kind === "location") {
    return normalizeTerritoryBasePath(
      geoPathToPublicUrl(resolved.location.geographic_path),
    );
  }

  const firstMember = resolved.group.members.at(0);
  if (!firstMember?.geographic_path) return null;

  const cityBasePath = normalizeTerritoryBasePath(
    geoPathToPublicUrl(firstMember.geographic_path),
  );
  if (!cityBasePath) return null;

  const cityParts = cityBasePath.split("/").filter(Boolean).slice(0, 2);
  return `/${[...cityParts, resolved.group.slug].join("/")}`;
}

function buildContext(input: {
  territoryBasePath: string;
  resolved?: ResolvedCommunityTerritory | null;
}): CommunityNavigationContext | null {
  const territoryBasePath = normalizeTerritoryBasePath(input.territoryBasePath);
  if (!territoryBasePath) return null;

  const parts = territoryBasePath.split("/").filter(Boolean);
  const [state, city, routeTerritorySlug] = parts;
  if (!state || !city) return null;

  const resolved = input.resolved ?? null;
  const territorySlug =
    resolved?.kind === "group"
      ? resolved.group.slug
      : routeTerritorySlug ?? city;

  return {
    state,
    city,
    territorySlug,
    territoryBasePath,
    basePath: buildCommunityTerritoryUrl(territoryBasePath),
    groupId: resolved?.kind === "group" ? resolved.group.id : null,
  };
}

export function resolveCommunityNavigationContext(input: {
  pathname: string;
  territorialContext?: CommunityNavigationTerritorialContext | null;
}): CommunityNavigationContext | null {
  if (input.territorialContext) {
    const territoryBasePath = getTerritoryBasePathFromResolved(
      input.territorialContext.resolved,
    );
    if (!territoryBasePath) return null;

    return buildContext({
      territoryBasePath,
      resolved: input.territorialContext.resolved,
    });
  }

  const territoryBasePath = extractCommunityTerritoryBaseUrl(input.pathname);
  if (!territoryBasePath) return null;

  return buildContext({ territoryBasePath });
}

export function buildCommunityNavigationModuleUrls(
  context: CommunityNavigationContext,
): CommunityNavigationModuleUrls {
  return {
    business: buildModuleTerritoryUrl(
      MODULE_SLUGS.business,
      context.territoryBasePath,
    ),
    gastronomy: buildModuleTerritoryUrl(
      MODULE_SLUGS.gastronomy,
      context.territoryBasePath,
    ),
    education: buildModuleTerritoryUrl(
      MODULE_SLUGS.education,
      context.territoryBasePath,
    ),
    services: buildModuleTerritoryUrl(
      MODULE_SLUGS.services,
      context.territoryBasePath,
    ),
    classifieds: buildModuleTerritoryUrl(
      MODULE_SLUGS.classifieds,
      context.territoryBasePath,
    ),
    events: buildModuleTerritoryUrl(
      MODULE_SLUGS.events,
      context.territoryBasePath,
    ),
    jobs: buildModuleTerritoryUrl(
      MODULE_SLUGS.jobs,
      context.territoryBasePath,
    ),
    map: buildModuleTerritoryUrl(
      MODULE_SLUGS.map,
      context.territoryBasePath,
    ),
    mobility: buildModuleTerritoryUrl(
      MODULE_SLUGS.mobility,
      context.territoryBasePath,
    ),
  };
}
