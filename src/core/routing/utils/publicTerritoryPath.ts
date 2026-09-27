import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import { TERRITORIAL_ROUTE_STATIC_SEGMENTS } from "@/core/routing/config/territorialRoutePatterns";
import { isCommunityRouteSuffixSegment } from "@/core/routing/utils/territoryUrls";

type ParsedPublicTerritoryPath = {
  state?: string;
  city?: string;
  territorySlug?: string;
};

const TERRITORIAL_MODULE_SEGMENT_SET = new Set<string>(
  Object.values(APP_MODULE_SLUGS),
);

const CITY_LEVEL_STATIC_SEGMENT_SET = new Set<string>([
  TERRITORIAL_ROUTE_STATIC_SEGMENTS.searchAlias,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS.communication,
]);

export function isCommunityTerritoryStaticSegment(
  segment: string | undefined,
): boolean {
  return Boolean(
    segment &&
      (TERRITORIAL_MODULE_SEGMENT_SET.has(segment) ||
        isCommunityRouteSuffixSegment(segment)),
  );
}

function isStateSegment(value: string | undefined): boolean {
  return Boolean(value && /^[a-z]{2}$/i.test(value));
}

export function parsePublicTerritoryPath(
  pathname: string,
): ParsedPublicTerritoryPath {
  const parts = pathname.split("/").filter(Boolean);
  if (!isStateSegment(parts[0]) || !parts[1]) return {};

  const state = parts[0];
  const city = parts[1];
  const third = parts[2];

  if (
    !third ||
    TERRITORIAL_MODULE_SEGMENT_SET.has(third) ||
    CITY_LEVEL_STATIC_SEGMENT_SET.has(third)
  ) {
    return { state, city, territorySlug: undefined };
  }

  return { state, city, territorySlug: third };
}
