function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

export function getPublicAppOrigin(): string {
  const envOrigin =
    import.meta.env.VITE_PUBLIC_APP_ORIGIN ||
    import.meta.env.VITE_SITE_ORIGIN ||
    import.meta.env.VITE_SITE_URL ||
    "";

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
