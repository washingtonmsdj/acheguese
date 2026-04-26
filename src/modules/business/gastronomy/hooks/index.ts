/**
 * Exports centralizados dos hooks de Gastronomia
 */

export { useMenu, useMenusByBusiness, useFeaturedItems, useActivePromotions } from './useMenu';
export { useMenuCategories } from './useMenuCategories';
export { useMenuItems, useMenuItem } from './useMenuItems';
export { useGastronomyMenuId } from './useGastronomyMenuId';
export { useMenuVariations } from './useMenuVariations';
export { useMenuAddons } from './useMenuAddons';
export { useBusinessHours } from './useBusinessHours';
export { useBusinessStatus } from './useBusinessStatus';
export { useBusinessExceptions } from './useBusinessExceptions';
export { useOperationConfig } from './useOperationConfig';
export { useDeliveryAreas } from './useDeliveryAreas';
export { useDeliveryNeighborhoods } from './useDeliveryNeighborhoods';
export { useDeliveryEligibility } from './useDeliveryEligibility';
export { useDeliverySummary } from './useDeliverySummary';
export { useDeliveryDestination } from './useDeliveryDestination';
export { useOrders } from './useOrders';
export { useOrderDetails } from './useOrderDetails';
export { useOrderStats } from './useOrderStats';
export { useOrderTracking } from './useOrderTracking';
export { useSubscriptionManagement } from './useSubscriptionManagement';
export { useGastronomyCart } from './useGastronomyCart';
export { useGastronomyCheckout } from './useGastronomyCheckout';
export { useGastronomyStatus } from './useGastronomyStatus';
export { useGastronomySetup } from './useGastronomySetup';
export { useGastronomyProfile } from './useGastronomyProfile';
export { useGastronomyPreview } from './useGastronomyPreview';
export { useGastronomyDetail } from './useGastronomyDetail';
export { useGastronomyList } from './useGastronomyList';
export { useGastronomyFoodCatalog } from './useGastronomyFoodCatalog';
export { useGastronomyOpeningStatus } from './useGastronomyOpeningStatus';
export { useGastronomyBusinessSort } from './useGastronomyBusinessSort';
export type { BusinessSortKey } from './useGastronomyBusinessSort';
export { useGastronomySimilar } from './useGastronomySimilar';
export { useGastronomyFavoritersCount } from './useGastronomyFavoriters';
export {
  useUserFavorites,
  useIsFavorited,
  useBusinessFavoritesCount,
  useToggleFavorite,
  useAddFavorite,
  useRemoveFavorite,
  useUpdateFavoritePreferences,
  useFavoritesByTags,
  useFavoritesManager,
} from './useFavorites';
export {
  useBusinessReviews,
  useBusinessReviewStats,
  useCanUserReview,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
  useAddBusinessResponse,
  useReportReview,
  useVoteReview,
  useUserReviewVote,
  useReviewsManager,
} from './useGastronomyReviews';
export {
  useAnalyticsMetrics,
  useDailyMetrics,
  useRecentEvents,
  useTrackEvent,
  useTrackPageView,
  useTrackQRScan,
  useTrackClick,
} from './useAnalytics';
export {
  useGastronomyActivity,
  useUserActivity,
  useBusinessActivity,
} from './useGastronomyActivity';
