import { APP_MODULE_SLUGS, getAppModuleSlugFromPath } from "@/shared/config/moduleSlugs";

export interface TerritorialSeoPolicy {
  canonicalPath: string;
  robots: string;
}

const PUBLIC_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const COMMUNITY_ROBOTS = "noindex, follow";

function normalizePathname(pathname: string): string {
  const clean = pathname.split(/[?#]/, 1)[0] ?? "/";
  if (clean === "/") return "/";
  return clean.replace(/\/+$/, "") || "/";
}

/**
 * SEO follows the same territory-first routing contract as the runtime.
 *
 * Public territory/module/entity pages are self-canonical. Community is a
 * social module and remains noindex while paused / resident-oriented. Retired
 * module-first URLs are not canonicalized here: they are outside the active
 * route graph and must fall through to 404.
 */
export function resolveSeoPolicy(pathname: string): TerritorialSeoPolicy {
  const canonicalPath = normalizePathname(pathname);
  const moduleSlug = getAppModuleSlugFromPath(canonicalPath);

  return {
    canonicalPath,
    robots:
      moduleSlug === APP_MODULE_SLUGS.community
        ? COMMUNITY_ROBOTS
        : PUBLIC_ROBOTS,
  };
}
