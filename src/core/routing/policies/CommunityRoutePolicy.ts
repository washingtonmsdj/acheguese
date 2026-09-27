import { buildCommunityTerritoryUrl } from "@/core/routing/utils/territoryUrls";

/**
 * Builds the Community module URL inside an already resolved public territory.
 *
 * Community is never a public alias namespace. The territory owns the URL and
 * Community is one sibling module under that territory.
 */
export function buildCommunityPortalUrl(
  territoryBaseUrl: string,
  suffix = "",
): string {
  return buildCommunityTerritoryUrl(territoryBaseUrl, suffix);
}
