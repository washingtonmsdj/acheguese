/**
 * Compatibility facade for guide URLs.
 *
 * The SSOT lives in core/guide/tourist-points so core and module surfaces use
 * the same canonical route builder without depending on business verticals.
 */

export {
  TOURIST_POINTS_SLUG,
  buildTouristPointDetailUrl,
  useTouristPointPublicUrls as useGuideUrls,
} from '@/core/guide/tourist-points/routes/useTouristPointPublicUrls';
export type {
  TouristPointPublicUrls as GuideUrls,
} from '@/core/guide/tourist-points/routes/useTouristPointPublicUrls';
