import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { LAUNCH_URLS } from '@/config/territory';
import { getPublicPostPreview } from '@/core/posts/utils/publicPostContent';
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

export function getBusinessPublicUrl(
  business: { id: string; slug?: string | null; is_premium?: boolean | null; geographic_path?: string | null },
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
  return getPublicPostPreview(value, maxLength, 'Publicação da comunidade local.');
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return 'agora';
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'agora';

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;

  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(timestamp));
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
