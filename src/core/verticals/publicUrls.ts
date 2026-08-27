import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import { buildModuleTerritoryEntityUrl } from "@/core/routing/utils/territoryUrls";
import { VERTICAL_KEYS, type VerticalKey } from './config';
import { getRecordValue } from '@/shared/utils/recordLookup';

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
    buildModuleTerritoryEntityUrl(
      APP_MODULE_SLUGS.education,
      ctx.geographic_path,
      ctx.slug || ctx.id,
    ),
};

const VERTICAL_REQUIRES_PROFILE: Record<VerticalKey, boolean> = {
  gastronomy: true,
  education: true,
};

function verticalRequiresProfile(vertical: VerticalKey): boolean {
  switch (vertical) {
    case "gastronomy":
      return VERTICAL_REQUIRES_PROFILE.gastronomy;
    case "education":
      return VERTICAL_REQUIRES_PROFILE.education;
  }
}

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
  const entries = VERTICAL_KEYS.flatMap((vertical) => {
    const hasProfile = getRecordValue(availability.profiles ?? {}, vertical) ?? false;
    if (verticalRequiresProfile(vertical) && !hasProfile) return [];

    return [[vertical, getVerticalPublicUrl(vertical, ctx)] as const];
  });

  return Object.fromEntries(entries);
}

function assertNeverVertical(vertical: never): never {
  throw new Error(`Vertical publico sem builder configurado: ${vertical}`);
}
