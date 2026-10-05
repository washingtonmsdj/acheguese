import { APP_MODULE_SLUGS } from '@/shared/config/moduleSlugs';
import {
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrl,
  cleanPublicRouteSegment,
} from '@/core/routing/utils/territoryUrls';

export const BUSINESS_PREMIUM_ROUTE_SEGMENT = 'p';

export const BUSINESS_PREMIUM_ROUTE_CHILD_SEGMENTS = {
  menu: 'cardapio',
  cart: 'carrinho',
  checkout: 'checkout',
  product: 'produto',
} as const;

export const BUSINESS_PUBLIC_URL_PREVIEW_TERRITORY = {
  state: ':uf',
  city: ':cidade',
  territorySlug: ':territorio',
} as const;

export const BUSINESS_PUBLIC_URL_PREVIEW_SLUG = 'seu-link';

export interface BusinessPublicTerritorySegments {
  readonly state: string;
  readonly city: string;
  readonly territorySlug?: string;
}

export interface BusinessPublicUrlSegments extends Required<BusinessPublicTerritorySegments> {
  readonly slug: string;
}

function buildTerritoryPathFromSegments({
  state,
  city,
  territorySlug,
}: BusinessPublicTerritorySegments): string {
  const segments = [state, city, territorySlug]
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => cleanPublicRouteSegment(segment, 'segmento territorial'));

  return `/${segments.join('/')}`;
}

export function buildBusinessPublicUrlFromTerritory(
  territoryBaseUrl: string,
  slug: string,
): string {
  return buildModuleTerritoryEntityUrl(
    APP_MODULE_SLUGS.business,
    territoryBaseUrl,
    slug,
  );
}

export function buildBusinessPublicUrlFromSegments(parts: BusinessPublicUrlSegments): string {
  return buildBusinessPublicUrlFromTerritory(buildTerritoryPathFromSegments(parts), parts.slug);
}

export function buildBusinessPublicListingUrl(parts: BusinessPublicTerritorySegments): string {
  return buildModuleTerritoryUrl(APP_MODULE_SLUGS.business, buildTerritoryPathFromSegments(parts));
}

export function buildBusinessCityListingUrl(state: string, city: string): string {
  return buildBusinessPublicListingUrl({ state, city });
}

export function buildBusinessPublicUrlPreview(slug: string): string {
  if (!slug) return '';
  return buildBusinessPublicUrlFromSegments({
    ...BUSINESS_PUBLIC_URL_PREVIEW_TERRITORY,
    slug,
  });
}

export function buildBusinessPremiumUrl(slug: string): string {
  return `/${BUSINESS_PREMIUM_ROUTE_SEGMENT}/${cleanPublicRouteSegment(
    slug,
    'slug premium da empresa',
  )}`;
}

export function buildBusinessPremiumUrlPreview(slug: string): string {
  return slug ? buildBusinessPremiumUrl(slug) : '';
}

export function buildBusinessPremiumRoute(
  premiumSlug: string,
  suffixSegments: readonly string[] = [],
): string {
  const base = buildBusinessPremiumUrl(premiumSlug);
  if (!suffixSegments.length) return base;

  const suffix = suffixSegments
    .map((segment) => cleanPublicRouteSegment(segment, 'segmento da rota premium'))
    .join('/');

  return `${base}/${suffix}`;
}