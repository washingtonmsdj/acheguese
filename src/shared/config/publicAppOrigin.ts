const LOCAL_AUTH_PORT = "5175";

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

function getConfiguredPublicOrigin(): string {
  return import.meta.env.VITE_PUBLIC_SITE_URL || "";
}

function isSupportedLocalAuthOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    const loopback =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return loopback && url.protocol === "http:" && url.port === LOCAL_AUTH_PORT;
  } catch {
    return false;
  }
}

function getBrowserOrigin(): string {
  if (typeof window === "undefined" || !window.location?.origin) return "";
  return normalizeOrigin(window.location.origin);
}

export function getPublicAppOrigin(): string {
  const browserOrigin = getBrowserOrigin();

  // O browser é autoritativo apenas nos origins locais que fazem parte do
  // contrato Auth versionado. Vite usa strictPort em 5175 e o Supabase permite
  // exatamente localhost/127.0.0.1 nessa porta, evitando redirectTo para um
  // host ou porta de desenvolvimento que o Auth recusaria.
  if (browserOrigin && isSupportedLocalAuthOrigin(browserOrigin)) {
    return browserOrigin;
  }

  const envOrigin = getConfiguredPublicOrigin();
  if (envOrigin) {
    return normalizeOrigin(envOrigin);
  }

  return browserOrigin;
}

export function buildPublicAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const origin = getPublicAppOrigin();
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}
