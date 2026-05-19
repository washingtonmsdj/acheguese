/**
 * POSTS SERVICE FACADE - SSOT v2.0
 *
 * Unified public facade for post operations.
 * Re-exports queries, mutations and poll operations from focused modules.
 */

// ============================================================
// QUERIES - Read operations
// ============================================================
export {
  getPostById,
  getFeed,
  getPostsByProfile,
  getPostsByType,
  getPostsByCategory,
  getPostStats,
  getPostsCountByAuthor,
  getPostsCountByAuthorToday,
  getPostsLikesReceivedByAuthor,
  getTotalPostsCount,
  getRecentPosts,
  getPostsCreatedInPeriod,
  getPostsWithImages,
  getActiveAlerts,
  getSavedPosts,
  getPostsCountByProfile,
  getPostsCountByUser,
  getPostActivityByAuthor,
  validatePostOwnership,
  canUserCreatePost,
  canUserEditPost,
  canUserDeletePost,
  getPostUserInteractions,
  getPostMentions,
  getFollowedPostUserIds,
  getPostBasicInfo,
  getPostAuthorId,
  getTopPosts,
  getPopularTags,
} from "./posts.queries";

// ============================================================
// MUTATIONS - Write operations
// ============================================================
export {
  createPost,
  updatePost,
  deletePost,
  deletePostByAuthor,
  incrementSharesCount,
  incrementUserReputation,
  toggleFollowPost,
  createLikeNotification,
  removePost,
  hidePost,
  confirmAlert,
} from "./posts.mutations";

// ============================================================
// POLLS
// ============================================================
export { getPollById, getPollByPostId } from "./polls.queries";
export { createPoll, updatePollVoteCounts, votePoll } from "./polls.mutations";
export type { Poll, CreatePollData } from "./polls.mutations";

// ============================================================
// UNIFIED FACADE
// ============================================================
import * as queries from "./posts.queries";
import * as mutations from "./posts.mutations";
import * as pollMutations from "./polls.mutations";
import * as pollQueries from "./polls.queries";

export const PostsFacade = {
  queries,
  mutations,
  polls: {
    ...pollMutations,
    queries: pollQueries,
  },
} as const;

export { PostService, postService } from "./PostServiceLegacy";
