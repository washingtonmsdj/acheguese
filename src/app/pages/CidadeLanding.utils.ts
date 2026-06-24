import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";

export function withQueryParams(path: string, params: Record<string, string>): string {
  const [pathWithoutHash, hash = ""] = path.split("#", 2);
  const [basePath, currentQuery = ""] = pathWithoutHash.split("?", 2);
  const query = new URLSearchParams(currentQuery);

  Object.entries(params).forEach(([key, value]) => {
    query.set(key, value);
  });

  const queryString = query.toString();
  return `${basePath}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
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
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!normalized) return "Publicação da comunidade local.";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1).trim()}...` : normalized;
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return "agora";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "agora";

  const diffMs = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;

  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(timestamp));
}
