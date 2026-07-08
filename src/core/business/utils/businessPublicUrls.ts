import { APP_MODULE_SLUGS } from '@/config/moduleSlugs';
import {
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrl,
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
  district: ':bairro',
} as const;

export const BUSINESS_PUBLIC_URL_PREVIEW_SLUG = 'seu-link';

export interface BusinessPublicTerritorySegments {
  readonly state: string;
  readonly city: string;
  readonly district?: string;
}

export interface BusinessPublicUrlSegments extends Required<BusinessPublicTerritorySegments> {
  readonly slug: string;
}

function cleanPathSegment(value: string, label: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, '');
  if (!segment || /[/?#]/.test(segment)) {
    throw new Error(`${label} deve ser um unico segmento de URL.`);
  }
  return segment;
}

function buildTerritoryPathFromSegments({
  state,
  city,
  district,
}: BusinessPublicTerritorySegments): string {
  const segments = [state, city, district]
    .filter((segment): segment is string => Boolean(segment))
    .map((segment) => cleanPathSegment(segment, 'segmento territorial'));

  return `/${segments.join('/')}`;
}

export function buildBusinessPublicUrlFromTerritory(
  territoryBaseUrl: string,
  slug: string,
): string {
  return buildModuleTerritoryEntityUrl(
    APP_MODULE_SLUGS.business,
    territoryBaseUrl,
    cleanPathSegment(slug, 'slug publico da empresa'),
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
  return `/${BUSINESS_PREMIUM_ROUTE_SEGMENT}/${cleanPathSegment(slug, 'slug premium da empresa')}`;
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
    .map((segment) => cleanPathSegment(segment, 'segmento da rota premium'))
    .join('/');

  return `${base}/${suffix}`;
}
