import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import { TERRITORIAL_ROUTE_STATIC_SEGMENTS } from "@/core/routing/config/territorialRoutePatterns";
import { isCommunityRouteSuffixSegment } from "@/core/routing/utils/territoryUrls";

type ParsedPublicTerritoryPath = {
  state?: string;
  city?: string;
  territorySlug?: string;
};

const TERRITORIAL_STATIC_SEGMENT_SET = new Set<string>(
  Object.values(TERRITORIAL_ROUTE_STATIC_SEGMENTS),
);

export function isCommunityTerritoryStaticSegment(
  segment: string | undefined,
): boolean {
  return Boolean(
    segment &&
      (TERRITORIAL_STATIC_SEGMENT_SET.has(segment) ||
        isCommunityRouteSuffixSegment(segment)),
  );
}

function isStateSegment(value: string | undefined): boolean {
  return Boolean(value && /^[a-z]{2}$/i.test(value));
}

export function parsePublicTerritoryPath(pathname: string): ParsedPublicTerritoryPath {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return {};

  const offset = isStateSegment(parts[0]) ? 0 : 1;
  const state = parts[offset];
  const city = parts[offset + 1];
  const rawTerritorySlug = parts[offset + 2];
  const territorySlug =
    parts[0] === APP_MODULE_SLUGS.community &&
    isCommunityTerritoryStaticSegment(rawTerritorySlug)
      ? undefined
      : rawTerritorySlug;

  if (!isStateSegment(state) || !city) {
    return {};
  }

  return { state, city, territorySlug };
}
