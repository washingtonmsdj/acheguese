/**
 * 📦 POSTS SERVICES - Barrel Export
 *
 * SSOT para todos os serviços de posts.
 * Organizado em queries, mutations, polls e helpers.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 FACADE PRINCIPAL (Recomendado)
// ============================================================
export { PostsFacade } from "./PostService";

// ============================================================
// 📦 QUERIES - Operações de Leitura (SSOT)
// ============================================================
export {
  // Busca de posts
  getPostById,
  getFeed,
  getPostsByProfile,
  getPostsByType,
  // Estatísticas
  getPostStats,
  getPostsCountByAuthor,
  getPostsCountByAuthorToday,
  getPostsLikesReceivedByAuthor,
  getTotalPostsCount,
  getRecentPosts,
  // Auxiliares
  getPostBasicInfo,
  getPostAuthorId,
  // Trending
  getTopPosts,
  getPopularTags,
} from "./posts.queries";

// ============================================================
// ✏️ MUTATIONS - Operações de Escrita (SSOT)
// ============================================================
export {
  // CRUD
  createPost,
  updatePost,
  deletePost,
  deletePostByAuthor,
  // Engagement
  incrementSharesCount,
  incrementUserReputation,
} from "./posts.mutations";

// ============================================================
// 🗳️ POLLS QUERIES - Enquetes (SSOT)
// ============================================================
export {
  getPollById,
  getPollByPostId,
} from "./polls.queries";

// ============================================================
// 🗳️ POLLS MUTATIONS - Enquetes (SSOT)
// ============================================================
export {
  createPoll,
  updatePollVoteCounts,
  votePoll,
} from "./polls.mutations";

// ============================================================
// 🔧 LEGACY - PostService original (mantido para compatibilidade)
// ============================================================
export { PostService } from "./PostService";
export { postService } from "./PostService";
export { postService as feedService } from "./PostService";
