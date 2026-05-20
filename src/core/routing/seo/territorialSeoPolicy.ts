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
    "educacao",
    MODULE_SLUGS.jobs,
    MODULE_SLUGS.events,
    MODULE_SLUGS.map,
    MODULE_SLUGS.mobility,
  ]);

  if (parts[0] === MODULE_SLUGS.community && parts[1] && parts[2]) {
    const part3 = parts[3];
    const isGroup = part3 === "area" && Boolean(parts[4]);
    const isCityEmbeddedModule = Boolean(part3 && embeddedCommunityModules.has(part3));
    const isDistrictEmbeddedModule = Boolean(
      !isGroup && parts[4] && embeddedCommunityModules.has(parts[4]),
    );

    if (isGroup) {
      const embeddedModule = parts[5];
      if (embeddedModule && embeddedCommunityModules.has(embeddedModule)) {
        const territoryParts = parts.slice(1, 5);
        return {
          canonicalPath: `/${embeddedModule}/${territoryParts.join("/")}`,
          robots: "noindex, follow",
        };
      }
      const suffix = parts.length > 5 ? `/${parts.slice(5).join("/")}` : "";
      return {
        canonicalPath: `/${MODULE_SLUGS.community}/${parts[1]}/${parts[2]}/${parts[4]}${suffix}`,
        robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      };
    } else if (isCityEmbeddedModule) {
      return {
        canonicalPath: `/${part3}/${parts.slice(1, 3).join("/")}`,
        robots: "noindex, follow",
      };
    } else if (isDistrictEmbeddedModule) {
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
