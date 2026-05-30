function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

function getConfiguredPublicOrigin(): string {
  return import.meta.env.VITE_PUBLIC_SITE_URL || "";
}

export function getPublicAppOrigin(): string {
  const envOrigin = getConfiguredPublicOrigin();
  if (envOrigin) {
    return normalizeOrigin(envOrigin);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeOrigin(window.location.origin);
  }

  return "";
}

export function buildPublicAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = getPublicAppOrigin();
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}
