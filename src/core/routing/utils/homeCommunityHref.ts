import { LAUNCH_URLS } from "@/config/territory";
import {
  buildCommunityTerritoryUrl,
  hasPublicCityTerritoryPath,
  MODULE_SLUGS,
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

function normalizeCommunityFallbackHref(href: string | null | undefined): string | null {
  if (!href) return null;
  const parts = href.split("/").filter(Boolean);
  if (parts[0] === MODULE_SLUGS.community && parts[1] && parts[2]) {
    return buildCommunityTerritoryUrl(`/${parts[1]}/${parts[2]}`);
  }
  return href;
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
    return buildCommunityTerritoryUrl(input.homeCityPath);
  }

  if (input.homeDistrictPath) {
    return buildCommunityTerritoryUrl(input.homeDistrictPath);
  }

  const currentTerritoryBaseUrl = input.currentTerritoryBaseUrl;
  if (currentTerritoryBaseUrl && hasPublicCityTerritoryPath(currentTerritoryBaseUrl)) {
    return buildCommunityTerritoryUrl(currentTerritoryBaseUrl);
  }

  const lastTerritoryBaseUrl = input.lastTerritoryBaseUrl;
  if (lastTerritoryBaseUrl && hasPublicCityTerritoryPath(lastTerritoryBaseUrl)) {
    return buildCommunityTerritoryUrl(lastTerritoryBaseUrl);
  }

  return normalizeCommunityFallbackHref(input.fallbackHref) ?? LAUNCH_URLS.community;
}
