import { buildPublicAbsoluteUrl, getPublicAppOrigin } from './publicAppOrigin';

type PublicEnv = Partial<Record<string, string>>;

const publicEnv = ((import.meta as ImportMeta & { env?: PublicEnv }).env ?? {}) as PublicEnv;

export const PLATFORM_BRAND = {
  name: publicEnv.VITE_SITE_NAME?.trim() || "Achegue-se",
  tagline: publicEnv.VITE_SITE_TAGLINE?.trim() || "Super App de Bairro",
  twitterSite: publicEnv.VITE_TWITTER_SITE?.trim() || "@acheguese",
} as const;

export function getPublicSiteOrigin(): string {
  return getPublicAppOrigin();
}

export function buildPublicAssetUrl(path: string): string {
  return buildPublicAbsoluteUrl(path);
}
