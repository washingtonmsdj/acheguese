/**
 * Community Hooks - Barrel Export
 * Reorganizado por responsabilidade
 * 
 * ✅ Geographic Foundation - Integrado com fundação geográfica
 */

// Geographic Foundation hooks
export { useCommunityLocation } from './useCommunityLocation';
export { useCommunityRollout } from './useCommunityRollout';
export { useCommunityUrls } from "@/core/routing/hooks/useCommunityUrls";

// Feed hooks
export { useCommunityFeedSimple as useCommunityFeed } from "@/core/community-feed/hooks/useCommunityFeed";
export { useCommunityFilters as useFeedFilters } from "@/core/community-feed/hooks/useFeedFilters";
export { useUnifiedFeed } from "@/core/community-feed/hooks/useUnifiedFeed";

// Composer hooks
export { useCreatePost } from "./composer/useCreatePost";
export { useCreatePostForm } from "@/core/community-feed/hooks/useCreatePostForm";

// Post interaction hooks
export { usePostInteractions } from "./posts/usePostInteractions";
export { usePostCard } from "./posts/usePostCard";

// Comment hooks
export { useComments } from "./useComments";

// Modal hooks
export { useCommunityModals } from "./modals/useCommunityModals";

// Page hooks
export { useComunidadePage } from "@/core/community-feed/hooks/useComunidadePage";
