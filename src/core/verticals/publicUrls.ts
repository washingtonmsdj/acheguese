import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
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
};

const VERTICAL_REQUIRES_PROFILE: Record<VerticalKey, boolean> = {
  gastronomy: true,
};

export function getVerticalPublicUrl(
  vertical: VerticalKey,
  ctx: BusinessVerticalRouteContext,
): string {
  switch (vertical) {
    case "gastronomy":
      return VERTICAL_URL_BUILDERS.gastronomy(ctx);
    default:
      return VERTICAL_URL_BUILDERS.gastronomy(ctx);
  }
}

export function getAvailableVerticalPublicUrls(
  ctx: BusinessVerticalRouteContext,
  availability: VerticalAvailability = {},
): Partial<Record<VerticalKey, string>> {
  const urls: Partial<Record<VerticalKey, string>> = {};

  const hasGastronomyProfile = availability.profiles?.gastronomy ?? false;
  const requiresGastronomyProfile = VERTICAL_REQUIRES_PROFILE.gastronomy;
  if (!requiresGastronomyProfile || hasGastronomyProfile) {
    urls.gastronomy = getVerticalPublicUrl("gastronomy", ctx);
  }

  return urls;
}
