import { LAUNCH_URLS } from "@/config/territory";
import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";

export interface HomeCommunityGroupCandidate {
  slug: string;
  name: string;
  status: unknown;
}

export interface HomeCommunityHrefInput {
  groups: HomeCommunityGroupCandidate[];
  homeCityPath?: string | null;
  homeDistrictPath?: string | null;
  currentTerritoryBaseUrl?: string | null;
  lastTerritoryBaseUrl?: string | null;
  fallbackHref?: string;
}

function hasTerritorySlug(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.split("/").filter(Boolean).length >= 3;
}

function isActiveGroup(status: unknown): boolean {
  return String(status).toLowerCase() === "active";
}

function extractGroupSlugFromLastTerritory(
  lastTerritoryBaseUrl: string | null | undefined,
  homeCityPath: string | null | undefined,
): string | null {
  if (!lastTerritoryBaseUrl || !homeCityPath) return null;

  const normalizedBase = lastTerritoryBaseUrl.replace(/\/+$/, "");
  const normalizedCity = homeCityPath.replace(/\/+$/, "");
  const prefix = `${normalizedCity}/`;
  if (!normalizedBase.startsWith(prefix)) return null;

  const candidate = normalizedBase.slice(prefix.length).split("/")[0] ?? "";
  return candidate.trim() || null;
}

export function resolveHomeCommunityHref(input: HomeCommunityHrefInput): string {
  const activeGroups = input.groups
    .filter((group) => isActiveGroup(group.status))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const preferredGroupSlug = extractGroupSlugFromLastTerritory(
    input.lastTerritoryBaseUrl,
    input.homeCityPath,
  );
  const preferredGroup = preferredGroupSlug
    ? activeGroups.find((group) => group.slug === preferredGroupSlug)
    : null;
  const activeGroup = preferredGroup ?? activeGroups[0];

  if (activeGroup && input.homeCityPath) {
    return buildCommunityTerritoryUrl(`${input.homeCityPath}/${activeGroup.slug}`);
  }

  if (input.homeDistrictPath) {
    return buildCommunityTerritoryUrl(input.homeDistrictPath);
  }

  if (hasTerritorySlug(input.currentTerritoryBaseUrl)) {
    return buildCommunityTerritoryUrl(input.currentTerritoryBaseUrl);
  }

  if (hasTerritorySlug(input.lastTerritoryBaseUrl)) {
    return buildCommunityTerritoryUrl(input.lastTerritoryBaseUrl);
  }

  return input.fallbackHref ?? LAUNCH_URLS.community;
}
