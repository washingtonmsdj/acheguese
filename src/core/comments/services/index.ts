/**
 * 💬 COMMENTS SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 QUERIES - Operações de leitura
// ============================================================
export {
  getCommentsByPost,
  getCommentById,
  getCommentsCount,
  getCommentCountByAuthor,
  getCommentsByAuthor,
  getTotalCommentsCount,
  getRecentComments,
  getCommentsCreatedInPeriod,
} from "./comments.queries";

// ============================================================
// 📝 MUTATIONS - Operações de escrita
// ============================================================
export {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  CommentError,
} from "./comments.mutations";

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export { CommentsFacade, CommentService, commentService } from "./CommentService";

// ============================================================
// 📦 LEGACY - Re-exports de types
// ============================================================
export type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
} from "../types";
