function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

function getConfiguredPublicOrigin(): string {
  return import.meta.env.VITE_PUBLIC_SITE_URL || "";
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
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

  // O origin realmente aberto no navegador é autoritativo em desenvolvimento e
  // em loopback. Isso mantém OAuth, recuperação e confirmações na porta local
  // ativa (incluindo localhost:5175), mesmo em preview de um build de produção.
  if (browserOrigin && (import.meta.env.DEV || isLoopbackOrigin(browserOrigin))) {
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
