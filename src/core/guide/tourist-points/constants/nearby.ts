import type { BusinessCategory } from "@/shared/taxonomy/businessCategories";

export const TOURIST_POINT_NEARBY_LIMITS = {
  MAX_RESULTS: 6,
  MAX_RADIUS_KM: 5,
} as const;

export const TOURIST_POINT_NEARBY_BUSINESS_CATEGORIES = [
  "restaurante",
  "lazer",
  "servicos",
] as const satisfies readonly BusinessCategory[];

export const TOURIST_POINT_GUIDE_CATEGORIES = [
  "lazer",
  "servicos",
] as const satisfies readonly BusinessCategory[];

export const TOURIST_POINT_GUIDE_KEYWORDS = [
  "guia",
  "turismo",
  "tour",
  "excursão",
  "passeio",
] as const;
