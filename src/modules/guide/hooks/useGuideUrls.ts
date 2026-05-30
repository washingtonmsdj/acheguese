/**
 * Compatibility facade for guide URLs.
 *
 * The SSOT lives in core/verticals/guide so core surfaces such as maps can use
 * the same canonical route builder without importing the module layer.
 */

export {
  TOURIST_POINTS_SLUG,
  buildTouristPointDetailUrl,
  useTouristPointPublicUrls as useGuideUrls,
} from '@/core/verticals/guide/routes/useTouristPointPublicUrls';
export type {
  TouristPointPublicUrls as GuideUrls,
} from '@/core/verticals/guide/routes/useTouristPointPublicUrls';
