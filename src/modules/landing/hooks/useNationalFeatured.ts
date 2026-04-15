/**
 * Compatibility facade for landing module hook.
 * Canonical hook lives in core/landing/useNationalFeatured.
 */

export {
  useNationalFeatured,
} from "@/core/landing/useNationalFeatured";

export type {
  NationalBusiness,
  NationalService,
  NationalClassified,
  NationalStats,
  ActiveTerritory,
  ActiveGroup,
} from "@/core/landing/useNationalFeatured";
