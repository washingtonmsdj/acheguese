import { LAUNCH_URLS } from '@/core/routing/config/territory';
import type { SearchDocument } from '@/core/search';
import { formatBrlNoCents } from '@/shared/utils/currency';

export type HomeDiscoveryDocumentTone = 'blue' | 'cyan' | 'pink';

const homeDiscoveryFallbackRoutes: Partial<Record<SearchDocument['type'], string>> = {
  business: LAUNCH_URLS.business,
  professional: LAUNCH_URLS.services,
  classified: LAUNCH_URLS.classifieds,
  event: LAUNCH_URLS.events,
  opportunity: LAUNCH_URLS.jobs,
};

const homeDiscoveryDocumentTones: Record<SearchDocument['type'], HomeDiscoveryDocumentTone> = {
  business: 'cyan',
  community: 'cyan',
  classified: 'pink',
  professional: 'blue',
  opportunity: 'blue',
  event: 'blue',
  post: 'blue',
  coupon: 'blue',
};

export function withQueryParams(path: string, params: Record<string, string>): string {
  const [pathWithoutHash, hash = ''] = path.split('#', 2);
  const [basePath, currentQuery = ''] = pathWithoutHash.split('?', 2);
  const query = new URLSearchParams(currentQuery);

  Object.entries(params).forEach(([key, value]) => {
    query.set(key, value);
  });

  const queryString = query.toString();
  return `${basePath}${queryString ? `?${queryString}` : ''}${hash ? `#${hash}` : ''}`;
}

export function formatCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}

export function formatPrice(price: number): string {
  return formatBrlNoCents(price);
}

export function getHomeDiscoveryDocumentHref(document: SearchDocument, fallbackHref: string): string {
  return document.url ?? homeDiscoveryFallbackRoutes[document.type] ?? fallbackHref;
}

export function getHomeDiscoveryDocumentTone(document: SearchDocument): HomeDiscoveryDocumentTone {
  return homeDiscoveryDocumentTones[document.type];
}

export function getHomeDiscoveryDocumentMeta(document: SearchDocument): string {
  return [document.subtitle, document.territoryLabel].filter(Boolean).join(' - ');
}

export function getHomeDiscoveryDocumentRating(document: SearchDocument): string | null {
  const rating = document.metadata?.rating;
  if (typeof rating !== 'number' || rating <= 0) return null;
  return rating.toFixed(1).replace('.', ',');
}
