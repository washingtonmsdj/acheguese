/**
 * 💬 COMMENTS SERVICE - FACHADA SSOT v2.0
 *
 * ✅ Ponto único de entrada para operações de comentários
 * ✅ Mantém compatibilidade com código existente
 * ✅ Delega para módulos especializados por responsabilidade
 *
 * REFATORAÇÃO v2.0.0:
 * - Queries → comments.queries.ts
 * - Mutations → comments.mutations.ts
 * - Types → ../types.ts (SSOT)
 *
 * ⚠️ NÃO adicionar lógica diretamente neste arquivo.
 * Use os módulos especializados acima.
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 📦 QUERIES - Operações de leitura
// ============================================================
export {
  getCommentsByPost,
  getCommentById,
  getAllComments,
  getCommentsCount,
  getCommentCountByAuthor,
  getCommentsByAuthor,
  getTotalCommentsCount,
  getRecentComments,
  getCommentsCreatedInPeriod,
} from "./comments.queries";

// ============================================================
// ✏️ MUTATIONS - Operações de escrita
// ============================================================
export {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  CommentError,
} from "./comments.mutations";

// Re-exports de types
export type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
} from "../types";

// ============================================================================
// 🏛️ SSOT v2.0 - FACADE
// ============================================================================

import * as CommentsQueries from "./comments.queries";
import * as CommentsMutations from "./comments.mutations";

/**
 * 💬 CommentsFacade - Interface SSOT unificada v2.0
 *
 * Uso: CommentsFacade.queries.getCommentsByPost(postId)
 *      CommentsFacade.mutations.createComment(data)
 *      CommentsFacade.mutations.likeComment(commentId, userId)
 */
export const CommentsFacade = {
  queries: CommentsQueries,
  mutations: CommentsMutations,
} as const;

/**
 * @deprecated Use CommentsFacade ou os exports diretos dos módulos comments.queries e comments.mutations
 * CommentService como classe mantido para compatibilidade.
 */
export class CommentServiceClass {
  // ===== QUERIES =====
  getCommentsByPost = CommentsQueries.getCommentsByPost;
  getCommentById = CommentsQueries.getCommentById;
  getCommentsCount = CommentsQueries.getCommentsCount;
  getCommentCountByAuthor = CommentsQueries.getCommentCountByAuthor;
  getCommentsByAuthor = CommentsQueries.getCommentsByAuthor;
  getTotalCommentsCount = CommentsQueries.getTotalCommentsCount;
  getRecentComments = CommentsQueries.getRecentComments;
  getCommentsCreatedInPeriod = CommentsQueries.getCommentsCreatedInPeriod;

  // ===== MUTATIONS =====
  createComment = CommentsMutations.createComment;
  updateComment = CommentsMutations.updateComment;
  deleteComment = CommentsMutations.deleteComment;
  likeComment = CommentsMutations.likeComment;
  unlikeComment = CommentsMutations.unlikeComment;
}

// Singleton instance (legado)
export const CommentService = new CommentServiceClass();
export const commentService = CommentService;
