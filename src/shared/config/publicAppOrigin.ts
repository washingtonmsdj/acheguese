function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

function getConfiguredPublicOrigin(): string {
  return import.meta.env.VITE_PUBLIC_SITE_URL || "";
}

export function getPublicAppOrigin(): string {
  // In development, the browser origin is authoritative. This keeps OAuth,
  // password recovery and local absolute URLs on the port that is actually
  // serving the app, even when the shared .env still carries another port.
  if (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.location?.origin
  ) {
    return normalizeOrigin(window.location.origin);
  }

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
