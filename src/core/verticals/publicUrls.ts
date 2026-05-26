import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import {
  MODULE_SLUGS,
  normalizePublicTerritoryPath,
} from "@/core/routing/utils/territoryUrls";
import type { VerticalKey } from './config';

export interface BusinessVerticalRouteContext {
  id: string;
  slug: string;
  geographic_path: string;
  is_premium?: boolean;
}

export interface VerticalAvailability {
  profiles?: Partial<Record<VerticalKey, boolean>>;
}

type VerticalUrlBuilder = (ctx: BusinessVerticalRouteContext) => string;

const VERTICAL_URL_BUILDERS: Record<VerticalKey, VerticalUrlBuilder> = {
  gastronomy: (ctx) =>
    GastronomyUrlService.getCanonicalUrl({
      id: ctx.id,
      slug: ctx.slug,
      geographic_path: ctx.geographic_path,
      is_premium: ctx.is_premium,
    }),
  education: (ctx) =>
    `/${MODULE_SLUGS.education}${normalizePublicTerritoryPath(ctx.geographic_path)}/${ctx.slug || ctx.id}`,
};

const VERTICAL_REQUIRES_PROFILE: Record<VerticalKey, boolean> = {
  gastronomy: true,
  education: true,
};

export function getVerticalPublicUrl(
  vertical: VerticalKey,
  ctx: BusinessVerticalRouteContext,
): string {
  switch (vertical) {
    case "gastronomy":
      return VERTICAL_URL_BUILDERS.gastronomy(ctx);
    case "education":
      return VERTICAL_URL_BUILDERS.education(ctx);
    default:
      return assertNeverVertical(vertical);
  }
}

export function getAvailableVerticalPublicUrls(
  ctx: BusinessVerticalRouteContext,
  availability: VerticalAvailability = {},
): Partial<Record<VerticalKey, string>> {
  const urls: Partial<Record<VerticalKey, string>> = {};

  for (const vertical of Object.keys(VERTICAL_URL_BUILDERS) as VerticalKey[]) {
    const hasProfile = availability.profiles?.[vertical] ?? false;
    const requiresProfile = VERTICAL_REQUIRES_PROFILE[vertical];
    if (!requiresProfile || hasProfile) {
      urls[vertical] = getVerticalPublicUrl(vertical, ctx);
    }
  }

  return urls;
}

function assertNeverVertical(vertical: never): never {
  throw new Error(`Vertical publico sem builder configurado: ${vertical}`);
}
