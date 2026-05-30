import { MODULE_SLUGS, isCommunityCanonicalSuffixSegment } from "../utils/territoryUrls";

export interface TerritorialSeoPolicy {
  canonicalPath: string;
  robots: string;
}

export function resolveSeoPolicy(pathname: string): TerritorialSeoPolicy {
  const cleanPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const parts = cleanPath.split("/").filter(Boolean);
  const embeddedCommunityModules = new Set<string>([
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

  if (parts[0] === MODULE_SLUGS.community && parts[1] && parts[2]) {
    const state = parts[1];
    const city = parts[2];
    const firstAfterCity = parts[3];
    const secondAfterCity = parts[4];

    if (!firstAfterCity || isCommunityCanonicalSuffixSegment(firstAfterCity)) {
      return {
        canonicalPath: cleanPath,
        robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      };
    }

    if (firstAfterCity === "area") {
      return {
        canonicalPath: `/${MODULE_SLUGS.community}/${state}/${city}`,
        robots: "noindex, follow",
      };
    }

    if (embeddedCommunityModules.has(firstAfterCity)) {
      return {
        canonicalPath: `/${firstAfterCity}/${state}/${city}`,
        robots: "noindex, follow",
      };
    }

    if (secondAfterCity && embeddedCommunityModules.has(secondAfterCity)) {
      return {
        canonicalPath: `/${secondAfterCity}/${state}/${city}`,
        robots: "noindex, follow",
      };
    }

    if (secondAfterCity && isCommunityCanonicalSuffixSegment(secondAfterCity)) {
      return {
        canonicalPath: `/${MODULE_SLUGS.community}/${state}/${city}/${parts.slice(4).join("/")}`,
        robots: "noindex, follow",
      };
    }

    return {
      canonicalPath: `/${MODULE_SLUGS.community}/${state}/${city}`,
      robots: "noindex, follow",
    };
  }

  return {
    canonicalPath: cleanPath,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}
