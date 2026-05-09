import { MODULE_SLUGS } from "../utils/territoryUrls";

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
    MODULE_SLUGS.jobs,
    MODULE_SLUGS.events,
    MODULE_SLUGS.map,
    MODULE_SLUGS.mobility,
  ]);

  if (parts[0] === MODULE_SLUGS.community && parts[1] && parts[2]) {
    const isGroup = parts[3] === "area";
    const moduleIndex = isGroup ? 5 : 4;
    const embeddedModule = parts[moduleIndex];

    if (embeddedModule && embeddedCommunityModules.has(embeddedModule)) {
      const territoryParts = isGroup ? parts.slice(1, 5) : parts.slice(1, 4);

      return {
        canonicalPath: `/${embeddedModule}/${territoryParts.join("/")}`,
        robots: "noindex, follow",
      };
    }
  }

  return {
    canonicalPath: cleanPath,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  };
}
