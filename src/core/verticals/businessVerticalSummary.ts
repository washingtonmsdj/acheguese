import { VERTICAL_CONFIGS, type VerticalKey } from './config';
import {
  getAvailableVerticalPublicUrls,
  type BusinessVerticalRouteContext,
  type VerticalAvailability,
} from './publicUrls';

export interface BusinessVerticalSummary {
  readonly activeVerticals: readonly VerticalKey[];
  readonly primaryVertical: VerticalKey | null;
  readonly canonicalVerticalUrl: string | null;
  readonly verticalPublicUrls: Partial<Record<VerticalKey, string>>;
}

const PRIMARY_VERTICAL_ORDER: readonly VerticalKey[] = ['gastronomy'];

export function buildBusinessVerticalSummary(
  ctx: BusinessVerticalRouteContext | null,
  availability: VerticalAvailability = {},
): BusinessVerticalSummary {
  if (!ctx) {
    return {
      activeVerticals: [],
      primaryVertical: null,
      canonicalVerticalUrl: null,
      verticalPublicUrls: {},
    };
  }

  const verticalPublicUrls = getAvailableVerticalPublicUrls(ctx, availability);
  const activeVerticals = PRIMARY_VERTICAL_ORDER.filter((vertical) =>
    Boolean(verticalPublicUrls[vertical]),
  );
  const primaryVertical = activeVerticals[0] ?? null;

  return {
    activeVerticals,
    primaryVertical,
    canonicalVerticalUrl: primaryVertical
      ? verticalPublicUrls[primaryVertical] ?? null
      : null,
    verticalPublicUrls,
  };
}

export function getVerticalLabel(vertical: VerticalKey): string {
  return VERTICAL_CONFIGS[vertical].label;
}
