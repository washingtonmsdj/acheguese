/**
 * Community Module - Barrel Export
 *
 * Exports only public API (components, services, hooks, types)
 * Internal implementation details are not exported
 * Reorganizado por responsabilidade
 */

// ============================================================================
// Components - Main UI Components
// ============================================================================

// Feed components
export { CommunityFeed } from "./components/feed/CommunityFeed";
export { UnifiedFeedWithMessages } from "./components/feed/UnifiedFeedWithMessages";
export { CategoryFilters } from "./components/feed/CategoryFilters";

// Card components
export { PostCard } from "./components/cards/PostCard";
export { UnifiedPostCard } from "./components/cards/UnifiedPostCard";
export { PostCardSkeleton } from "./components/PostCardSkeleton";

// Composer components
export { CreatePostModal } from "./components/composer/CreatePostModal";
export { UnifiedComposer } from "./components/composer/UnifiedComposer";
export { CreatePostButton } from "./components/CreatePostButton";

// Modal components
export { PostDetailModal } from "./components/modals/PostDetailModal";
export { UnifiedDetailModal } from "./components/UnifiedDetailModal";
export { CommentsModal } from "./components/CommentsModal";

// Widgets
export { CommunityLeftSidebar } from "./components/CommunityLeftSidebar";
export { CommunityRightSidebar } from "./components/CommunityRightSidebar";
export { CommunityProfileCard } from "./components/CommunityProfileCard";
export { GamificationWidget } from "./components/GamificationWidget";
export { Leaderboard } from "./components/Leaderboard";
export { BadgeDisplay, BadgeGrid } from "./components/BadgeDisplay";
export { UserLevelBadge } from "./components/UserLevelBadge";
export { VerifiedResidentBadge } from "../../shared/components/badges/VerifiedResidentBadge";
export { InfiniteScrollTrigger } from "../../shared/components/ui/InfiniteScrollTrigger";

// ============================================================================
// Hooks - Custom React Hooks (Reorganizados)
// ============================================================================

// Feed hooks
export { useCommunityFeedSimple as useCommunityFeed } from "./hooks/feed/useCommunityFeed";
export { useCommunityFilters as useFeedFilters } from "./hooks/feed/useFeedFilters";
export { useUnifiedFeed } from "./hooks/feed/useUnifiedFeed";

// Composer hooks
export { useCreatePost } from "./hooks/composer/useCreatePost";
export { usePostForm } from "./hooks/composer/usePostForm";
export { useCreatePoll } from "./hooks/composer/useCreatePoll";
export { useUnifiedComposer } from "./hooks/composer/useUnifiedComposer";

// Post interaction hooks
export { usePostInteractions } from "./hooks/posts/usePostInteractions";
export { usePostCard } from "./hooks/posts/usePostCard";

// Modal hooks
export { useCommunityModals } from "./hooks/modals/useCommunityModals";
export { useUnifiedDetailModal } from "./hooks/modals/useUnifiedDetailModal";

// Page hooks
export { useComunidadePage } from "./hooks/page/useComunidadePage";

// Legacy hooks (manter por compatibilidade)
export {
  useCommunityProfile,
  useCommunityStats,
  useCommunityBadges,
  useCommunityLeaderboard,
  useRecordInteraction,
  useUpdateCommunityProfile,
  useAwardBadge,
} from "./hooks/useCommunity";
export { usePostById } from "./hooks/usePostById";
export { useComments } from "./hooks/useComments";
export { useCommentActions } from "./hooks/useCommentActions";
export { useDirectMessages } from "./hooks/useDirectMessages";
export { useNotifications } from "./hooks/useNotifications";
export { useSearch } from "./hooks/useSearch";

// ============================================================================
// Pages - Route Components
// ============================================================================

export { default as ComunidadePage } from "./pages/ComunidadePage";

// ============================================================================
// Types - Public Type Definitions
// ============================================================================

export type * from "./types";

// ============================================================================
// Schemas - Validation Schemas (Consolidados)
// ============================================================================

export {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  feedFiltersSchema,
} from "./schemas/postSchemas";
