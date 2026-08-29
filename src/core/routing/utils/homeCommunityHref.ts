import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { buildCommunityPortalUrl } from "@/core/routing/policies";
import {
  buildCommunityTerritoryUrl,
  hasPublicCityTerritoryPath,
  isCommunityCanonicalSuffixSegment,
  MODULE_SLUGS,
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
  communityUrlsByTerritoryBaseUrl?: Record<string, string | null | undefined>;
}

function isActiveGroup(status: unknown): boolean {
  return String(status).toLowerCase() === "active";
}

function normalizeTerritoryBaseKey(path: string): string {
  return normalizePublicTerritoryPath(path).replace(/\/+$/, "");
}

function resolveCommunityUrlForTerritory(
  territoryBaseUrl: string,
  input: Pick<HomeCommunityHrefInput, "communityUrlsByTerritoryBaseUrl">,
): string {
  const key = normalizeTerritoryBaseKey(territoryBaseUrl);
  const mappedUrl = findCommunityUrlForTerritoryKey(
    input.communityUrlsByTerritoryBaseUrl,
    key,
  );
  return normalizeCommunityPortalHref(mappedUrl) ?? buildCommunityTerritoryUrl(key);
}

function findCommunityUrlForTerritoryKey(
  urlsByTerritoryBaseUrl: Record<string, string | null | undefined> | undefined,
  key: string,
): string | null | undefined {
  if (!urlsByTerritoryBaseUrl) return undefined;

  for (const [territoryBaseUrl, communityUrl] of Object.entries(urlsByTerritoryBaseUrl)) {
    if (territoryBaseUrl === key) {
      return communityUrl;
    }
  }

  return undefined;
}

function isShortCommunityBaseHref(href: string | null | undefined): href is string {
  if (!href || !href.startsWith("/") || /[?#]/.test(href)) return false;
  const parts = href.split("/").filter(Boolean);
  return parts.length === 1 && parts[0] !== MODULE_SLUGS.community;
}

function normalizeCommunityPortalHref(href: string | null | undefined): string | null | undefined {
  if (isShortCommunityBaseHref(href)) {
    const [alias] = href.split("/").filter(Boolean);
    return buildCommunityPortalUrl(alias);
  }

  return href;
}

function normalizeCommunityFallbackHref(
  href: string | null | undefined,
  input: Pick<HomeCommunityHrefInput, "communityUrlsByTerritoryBaseUrl">,
): string | null {
  if (!href) return null;
  const parts = href.split("/").filter(Boolean);
  if (parts[0] === MODULE_SLUGS.community && parts[1] && parts[2]) {
    const territoryParts = [parts[1], parts[2]];
    if (parts[3] && !isCommunityCanonicalSuffixSegment(parts[3])) {
      territoryParts.push(parts[3]);
    }
    return resolveCommunityUrlForTerritory(`/${territoryParts.join("/")}`, input);
  }
  return normalizeCommunityPortalHref(href) ?? null;
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
    return resolveCommunityUrlForTerritory(
      `${input.homeCityPath}/${activeGroup.slug}`,
      input,
    );
  }

  if (input.homeDistrictPath) {
    return resolveCommunityUrlForTerritory(input.homeDistrictPath, input);
  }

  if (input.homeCityPath) {
    return resolveCommunityUrlForTerritory(input.homeCityPath, input);
  }

  const currentTerritoryBaseUrl = input.currentTerritoryBaseUrl;
  if (currentTerritoryBaseUrl && hasPublicCityTerritoryPath(currentTerritoryBaseUrl)) {
    return resolveCommunityUrlForTerritory(currentTerritoryBaseUrl, input);
  }

  const lastTerritoryBaseUrl = input.lastTerritoryBaseUrl;
  if (isShortCommunityBaseHref(lastTerritoryBaseUrl)) {
    return normalizeCommunityPortalHref(lastTerritoryBaseUrl) ?? LAUNCH_URLS.community;
  }

  if (lastTerritoryBaseUrl && hasPublicCityTerritoryPath(lastTerritoryBaseUrl)) {
    return resolveCommunityUrlForTerritory(lastTerritoryBaseUrl, input);
  }

  return normalizeCommunityFallbackHref(input.fallbackHref, input) ?? LAUNCH_URLS.community;
}
