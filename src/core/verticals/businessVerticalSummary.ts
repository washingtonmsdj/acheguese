import { getVerticalConfig, type VerticalKey } from './config';
import {
  getAvailableVerticalPublicUrls,
  type BusinessVerticalRouteContext,
  type VerticalAvailability,
} from './publicUrls';
import { getRecordValue } from '@/shared/utils/recordLookup';

export interface BusinessVerticalSummary {
  readonly activeVerticals: readonly VerticalKey[];
  readonly primaryVertical: VerticalKey | null;
  readonly canonicalVerticalUrl: string | null;
  readonly verticalPublicUrls: Partial<Record<VerticalKey, string>>;
}

const PRIMARY_VERTICAL_ORDER: readonly VerticalKey[] = ['gastronomy', 'education'];

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
    Boolean(getRecordValue(verticalPublicUrls, vertical)),
  );
  const primaryVertical = activeVerticals[0] ?? null;

  return {
    activeVerticals,
    primaryVertical,
    canonicalVerticalUrl: primaryVertical
      ? getRecordValue(verticalPublicUrls, primaryVertical) ?? null
      : null,
    verticalPublicUrls,
  };
}

export function getVerticalLabel(vertical: VerticalKey): string {
  return getVerticalConfig(vertical).label;
}
