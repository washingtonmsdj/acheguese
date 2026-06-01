import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { CommunityPublicAliasTerritoryResolution } from "@/core/routing/services/CommunityPublicAliasTerritoryResolver";
import { normalizeCommunityPublicAliasCandidate } from "@/core/routing/services/CommunityPublicAliasService";
import {
  buildCommunityAliasUrl,
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
  extractCommunityTerritoryBaseUrl,
  geoPathToPublicUrl,
  MODULE_SLUGS,
  normalizePublicTerritoryPath,
  type ModuleSlug,
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
  usesEmbeddedCommunityModules: boolean;
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

export function getCommunityAliasCandidateFromPath(pathname: string): string | null {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  return firstSegment ? normalizeCommunityPublicAliasCandidate(firstSegment) : null;
}

function normalizeTerritoryBasePath(value: string | null | undefined): string | null {
  if (!value) return null;

  const normalized = normalizePublicTerritoryPath(value);
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  return `/${parts.slice(0, 3).join("/")}`;
}

function getTerritoryBasePathFromResolved(resolved: ResolvedCommunityTerritory): string | null {
  if (resolved.kind === "location") {
    return normalizeTerritoryBasePath(geoPathToPublicUrl(resolved.location.geographic_path));
  }

  const firstMember = resolved.group.members.at(0);
  if (!firstMember?.geographic_path) return null;

  const cityBasePath = normalizeTerritoryBasePath(geoPathToPublicUrl(firstMember.geographic_path));
  return cityBasePath ? `${cityBasePath}/${resolved.group.slug}` : null;
}

function buildContext(input: {
  territoryBasePath: string;
  communityBasePath: string;
  resolved?: ResolvedCommunityTerritory | null;
  usesEmbeddedCommunityModules: boolean;
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
    basePath: input.communityBasePath,
    groupId: resolved?.kind === "group" ? resolved.group.id : null,
    usesEmbeddedCommunityModules: input.usesEmbeddedCommunityModules,
  };
}

export function resolveCommunityNavigationContext(input: {
  pathname: string;
  territorialContext?: CommunityNavigationTerritorialContext | null;
  aliasResolution?: Extract<
    CommunityPublicAliasTerritoryResolution,
    { status: "resolved" }
  > | null;
}): CommunityNavigationContext | null {
  if (input.aliasResolution) {
    return buildContext({
      territoryBasePath: input.aliasResolution.publicTerritoryPath,
      communityBasePath: buildCommunityAliasUrl(input.aliasResolution.alias),
      resolved: input.aliasResolution.resolved,
      usesEmbeddedCommunityModules: true,
    });
  }

  if (input.territorialContext) {
    const territoryBasePath = getTerritoryBasePathFromResolved(input.territorialContext.resolved);
    if (!territoryBasePath) return null;

    return buildContext({
      territoryBasePath,
      communityBasePath: input.territorialContext.communityBaseUrl,
      resolved: input.territorialContext.resolved,
      usesEmbeddedCommunityModules:
        input.territorialContext.communityBaseUrl === input.territorialContext.baseUrl,
    });
  }

  const legacyTerritoryBasePath = extractCommunityTerritoryBaseUrl(input.pathname);
  if (!legacyTerritoryBasePath) return null;

  return buildContext({
    territoryBasePath: legacyTerritoryBasePath,
    communityBasePath: buildCommunityTerritoryUrl(legacyTerritoryBasePath),
    usesEmbeddedCommunityModules: false,
  });
}

function buildScopedCommunityModuleUrl(
  context: CommunityNavigationContext,
  module: ModuleSlug,
): string {
  if (context.usesEmbeddedCommunityModules) {
    return `${context.basePath}/${module}`;
  }

  return buildModuleTerritoryUrl(module, context.territoryBasePath);
}

export function buildCommunityNavigationModuleUrls(
  context: CommunityNavigationContext,
): CommunityNavigationModuleUrls {
  return {
    business: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.business),
    gastronomy: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.gastronomy),
    education: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.education),
    services: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.services),
    classifieds: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.classifieds),
    events: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.events),
    jobs: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.jobs),
    map: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.map),
    mobility: buildScopedCommunityModuleUrl(context, MODULE_SLUGS.mobility),
  };
}
