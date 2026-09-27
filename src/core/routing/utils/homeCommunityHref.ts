import { LAUNCH_URLS } from "@/core/routing/config/territory";
import {
  buildCommunityTerritoryUrl,
  extractCommunityTerritoryBaseUrl,
  hasPublicCityTerritoryPath,
  normalizePublicTerritoryPath,
} from "@/core/routing/utils/territoryUrls";

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

function isActiveGroup(status: unknown): boolean {
  return String(status).toLowerCase() === "active";
}

function canonicalCommunityUrl(territoryBaseUrl: string): string {
  return buildCommunityTerritoryUrl(
    normalizePublicTerritoryPath(territoryBaseUrl).replace(/\/+$/, ""),
  );
}

function extractGroupSlugFromLastTerritory(
  lastTerritoryBaseUrl: string | null | undefined,
  homeCityPath: string | null | undefined,
): string | null {
  if (!lastTerritoryBaseUrl || !homeCityPath) return null;

  const normalizedBase = normalizePublicTerritoryPath(
    lastTerritoryBaseUrl,
  ).replace(/\/+$/, "");
  const normalizedCity = normalizePublicTerritoryPath(homeCityPath).replace(
    /\/+$/,
    "",
  );
  const prefix = `${normalizedCity}/`;
  if (!normalizedBase.startsWith(prefix)) return null;

  const candidate = normalizedBase.slice(prefix.length).split("/")[0] ?? "";
  return candidate.trim() || null;
}

function normalizeFallbackHref(
  href: string | null | undefined,
): string | null {
  if (!href) return null;

  const territoryBase = extractCommunityTerritoryBaseUrl(href);
  if (territoryBase) return canonicalCommunityUrl(territoryBase);

  if (hasPublicCityTerritoryPath(href)) {
    return canonicalCommunityUrl(href);
  }

  return null;
}

export function resolveHomeCommunityHref(
  input: HomeCommunityHrefInput,
): string {
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
    return canonicalCommunityUrl(
      `${input.homeCityPath}/${activeGroup.slug}`,
    );
  }

  if (input.homeDistrictPath) {
    return canonicalCommunityUrl(input.homeDistrictPath);
  }

  if (input.homeCityPath) {
    return canonicalCommunityUrl(input.homeCityPath);
  }

  if (
    input.currentTerritoryBaseUrl &&
    hasPublicCityTerritoryPath(input.currentTerritoryBaseUrl)
  ) {
    return canonicalCommunityUrl(input.currentTerritoryBaseUrl);
  }

  if (
    input.lastTerritoryBaseUrl &&
    hasPublicCityTerritoryPath(input.lastTerritoryBaseUrl)
  ) {
    return canonicalCommunityUrl(input.lastTerritoryBaseUrl);
  }

  return normalizeFallbackHref(input.fallbackHref) ?? LAUNCH_URLS.community;
}
