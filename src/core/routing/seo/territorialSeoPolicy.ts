import { MODULE_SLUGS } from "../utils/territoryUrls";
import { isReservedSlug } from "../reservedSlugs";

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
    const part3 = parts[3];
    const isInvalidCommunityTerritory = !part3 || part3 === "area" || isReservedSlug(part3);
    const isDistrictEmbeddedModule = Boolean(
      !isInvalidCommunityTerritory && parts[4] && embeddedCommunityModules.has(parts[4]),
    );

    if (isInvalidCommunityTerritory) {
      return {
        canonicalPath: cleanPath,
        robots: "noindex, follow",
      };
    }

    if (isDistrictEmbeddedModule) {
      const embeddedModule = parts[4];
      return {
        canonicalPath: `/${embeddedModule}/${parts.slice(1, 4).join("/")}`,
        robots: "noindex, follow",
      };
    }
  }

  return {
    canonicalPath: cleanPath,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}
