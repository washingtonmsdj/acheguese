/**
 * Community Hooks - Barrel Export
 * Reorganizado por responsabilidade
 * 
 * ✅ Geographic Foundation - Integrado com fundação geográfica
 */

// Geographic Foundation hooks
export { useCommunityLocation } from './useCommunityLocation';
export { useCommunityRollout } from './useCommunityRollout';
export { useCommunityUrls } from './useCommunityUrls';

// Ads - delegates to modules/ads
export { useSponsoredAds } from './useSponsoredAds';

// Feed hooks
export { useCommunityFeedSimple as useCommunityFeed } from "./feed/useCommunityFeed";
export { useCommunityFilters as useFeedFilters } from "./feed/useFeedFilters";
export { useUnifiedFeed } from "./feed/useUnifiedFeed";

// Composer hooks
export { useCreatePost } from "./composer/useCreatePost";
export { usePostForm } from "./composer/usePostForm";
export { useUnifiedComposer } from "./composer/useUnifiedComposer";
export { useCreatePostForm } from "./composer/useCreatePostForm";

// Post interaction hooks
export { usePostInteractions } from "./posts/usePostInteractions";
export { usePostCard } from "./posts/usePostCard";
export { useDeletePost } from "./posts/useDeletePost";
export { useUpdatePost } from "./posts/useUpdatePost";

// Comment hooks
export { useComments } from "./useComments";

// Modal hooks
export { useCommunityModals } from "./modals/useCommunityModals";

// Page hooks
export { useComunidadePage } from "./page/useComunidadePage";
