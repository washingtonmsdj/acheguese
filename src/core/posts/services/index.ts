/**
 * Posts services barrel.
 *
 * SSOT para todos os servicos de posts.
 * Organizado em queries, mutations, polls e helpers.
 *
 * @version 2.0.0 - Refatoracao SSOT
 */

// ============================================================
// FACADE PRINCIPAL
// ============================================================
export { PostsFacade } from "./PostService";

// ============================================================
// QUERIES - Operacoes de leitura
// ============================================================
export {
  getPostById,
  getFeed,
  searchPublicPosts,
  getPostsByProfile,
  getPostsByType,
  getPostStats,
  getPostsCountByAuthor,
  getPostsCountByAuthorToday,
  getPostsLikesReceivedByAuthor,
  getTotalPostsCount,
  getRecentPosts,
  getPostBasicInfo,
  getPostAuthorId,
  getTopPosts,
  getPopularTags,
} from "./posts.queries";

// ============================================================
// MUTATIONS - Operacoes de escrita
// ============================================================
export {
  createPost,
  updatePost,
  deletePost,
  deletePostByAuthor,
  incrementSharesCount,
  incrementUserReputation,
} from "./posts.mutations";

// ============================================================
// POLLS QUERIES
// ============================================================
export {
  getPollById,
  getPollByPostId,
} from "./polls.queries";

// ============================================================
// POLLS MUTATIONS
// ============================================================
export {
  createPoll,
  updatePollVoteCounts,
  votePoll,
} from "./polls.mutations";

// ============================================================
// RUNTIME SERVICE
// ============================================================
export { PostService } from "./PostService";
export { postService } from "./PostService";
export { postService as feedService } from "./PostService";
