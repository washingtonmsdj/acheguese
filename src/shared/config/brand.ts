type PublicEnv = Partial<Record<string, string>>;

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export const PLATFORM_BRAND = {
  name: publicEnv.VITE_SITE_NAME?.trim() || "Achegue-se",
  tagline: publicEnv.VITE_SITE_TAGLINE?.trim() || "Super App de Bairro",
  defaultOrigin: "https://acheguese.com.br",
  twitterSite: publicEnv.VITE_TWITTER_SITE?.trim() || "@acheguese",
} as const;

export function getPublicSiteOrigin(): string {
  const configured = publicEnv.VITE_PUBLIC_SITE_URL?.trim();
  if (configured) return normalizeOrigin(configured);

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeOrigin(window.location.origin);
  }

  return PLATFORM_BRAND.defaultOrigin;
}

export function buildPublicAssetUrl(path: string): string {
  return new URL(path, `${getPublicSiteOrigin()}/`).href;
}
