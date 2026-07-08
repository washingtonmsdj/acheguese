import { MODULE_SLUGS, isCommunityCanonicalSuffixSegment } from "../utils/territoryUrls";

export interface TerritorialSeoPolicy {
  canonicalPath: string;
  robots: string;
}

const PUBLIC_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const COMMUNITY_PORTAL_ROBOTS = "noindex, follow";

const EMBEDDED_COMMUNITY_MODULES = new Set<string>([
  MODULE_SLUGS.business,
  MODULE_SLUGS.services,
  MODULE_SLUGS.classifieds,
  MODULE_SLUGS.gastronomy,
  MODULE_SLUGS.education,
  MODULE_SLUGS.jobs,
  MODULE_SLUGS.events,
  MODULE_SLUGS.map,
  MODULE_SLUGS.mobility,
]);

function isStateSegment(value: string | undefined): boolean {
  return Boolean(value && /^[a-z]{2}$/i.test(value));
}

export function resolveSeoPolicy(pathname: string): TerritorialSeoPolicy {
  const cleanPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const parts = cleanPath.split("/").filter(Boolean);

  if (parts[0] === MODULE_SLUGS.community) {
    if (!isStateSegment(parts[1]) || !parts[2]) {
      return {
        canonicalPath: cleanPath || `/${MODULE_SLUGS.community}`,
        robots: COMMUNITY_PORTAL_ROBOTS,
      };
    }

    const state = parts[1];
    const city = parts[2];
    const firstAfterCity = parts[3];
    const secondAfterCity = parts[4];

    if (!firstAfterCity || isCommunityCanonicalSuffixSegment(firstAfterCity)) {
      return {
        canonicalPath: cleanPath,
        robots: COMMUNITY_PORTAL_ROBOTS,
      };
    }

    if (firstAfterCity === "area") {
      const legacyScopedSlug = parts[4];
      return {
        canonicalPath: legacyScopedSlug
          ? `/${MODULE_SLUGS.community}/${state}/${city}/${legacyScopedSlug}`
          : `/${MODULE_SLUGS.community}/${state}/${city}`,
        robots: COMMUNITY_PORTAL_ROBOTS,
      };
    }

    if (EMBEDDED_COMMUNITY_MODULES.has(firstAfterCity)) {
      return {
        canonicalPath: `/${firstAfterCity}/${state}/${city}`,
        robots: COMMUNITY_PORTAL_ROBOTS,
      };
    }

    if (secondAfterCity && EMBEDDED_COMMUNITY_MODULES.has(secondAfterCity)) {
      return {
        canonicalPath: `/${secondAfterCity}/${state}/${city}/${firstAfterCity}`,
        robots: COMMUNITY_PORTAL_ROBOTS,
      };
    }

    if (secondAfterCity && isCommunityCanonicalSuffixSegment(secondAfterCity)) {
      return {
        canonicalPath: cleanPath,
        robots: COMMUNITY_PORTAL_ROBOTS,
      };
    }

    return {
      canonicalPath: cleanPath,
      robots: COMMUNITY_PORTAL_ROBOTS,
    };
  }

  return {
    canonicalPath: cleanPath,
    robots: PUBLIC_ROBOTS,
  };
}
