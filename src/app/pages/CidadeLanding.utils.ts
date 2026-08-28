import { APP_MODULE_SLUGS, buildAppModulePath } from "@/shared/config/moduleSlugs";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import {
  formatRelativeTime as formatLandingRelativeTime,
  withQueryParams as mergeQueryParams,
} from "@/core/landing/utils/landingPresentation";
import { getPublicPostPreview } from "@/core/posts/utils/publicPostContent";
import { buildCommunityScopedUrl } from "@/core/routing/utils/territoryUrls";

export function withQueryParams(path: string, params: Record<string, string>): string {
  return mergeQueryParams(path, params);
}

export function getBusinessPublicUrl(
  business: {
    id: string;
    slug?: string | null;
    is_premium?: boolean | null;
    geographic_path?: string | null;
  },
  fallback: string,
): string {
  if (!business.slug || !business.geographic_path) return fallback;

  try {
    return BusinessUrlService.getCanonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: Boolean(business.is_premium),
      geographic_path: business.geographic_path,
    });
  } catch {
    return fallback;
  }
}

export function getTextPreview(value: string | null | undefined, maxLength: number): string {
  return getPublicPostPreview(
    value,
    maxLength,
    "Publicação da comunidade local.",
  );
}

export function formatRelativeTime(value: string | null | undefined): string {
  return formatLandingRelativeTime(value);
}

export type CityModuleUrls = {
  home: string;
  community: string;
  feed: string;
  business: string;
  gastronomy: string;
  services: string;
  classifieds: string;
  map: string;
  search: string;
  publish: string;
  touristPoints: string;
};

export function buildCityModuleUrls({
  cityPath,
  communityBaseUrl,
  communityScoped,
}: {
  cityPath: string;
  communityBaseUrl: string;
  communityScoped: boolean;
}): CityModuleUrls {
  const publicTouristPoints = buildAppModulePath(
    APP_MODULE_SLUGS.touristPoints,
    cityPath,
  );

  if (communityScoped) {
    return {
      home: communityBaseUrl,
      community: communityBaseUrl,
      feed: communityBaseUrl,
      business: buildCommunityScopedUrl(
        communityBaseUrl,
        APP_MODULE_SLUGS.business,
      ),
      gastronomy: buildCommunityScopedUrl(
        communityBaseUrl,
        APP_MODULE_SLUGS.gastronomy,
      ),
      services: buildCommunityScopedUrl(
        communityBaseUrl,
        APP_MODULE_SLUGS.services,
      ),
      classifieds: buildCommunityScopedUrl(
        communityBaseUrl,
        APP_MODULE_SLUGS.classifieds,
      ),
      map: buildCommunityScopedUrl(communityBaseUrl, APP_MODULE_SLUGS.map),
      search: buildAppModulePath(APP_MODULE_SLUGS.search, cityPath),
      publish: withQueryParams(communityBaseUrl, { action: "publicar" }),
      touristPoints: publicTouristPoints,
    };
  }

  return {
    home: cityPath,
    community: communityBaseUrl,
    feed: communityBaseUrl,
    business: buildAppModulePath(APP_MODULE_SLUGS.business, cityPath),
    gastronomy: buildAppModulePath(APP_MODULE_SLUGS.gastronomy, cityPath),
    services: buildAppModulePath(APP_MODULE_SLUGS.services, cityPath),
    classifieds: buildAppModulePath(APP_MODULE_SLUGS.classifieds, cityPath),
    map: buildAppModulePath(APP_MODULE_SLUGS.map, cityPath),
    search: buildAppModulePath(APP_MODULE_SLUGS.search, cityPath),
    publish: withQueryParams(communityBaseUrl, { action: "publicar" }),
    touristPoints: publicTouristPoints,
  };
}
