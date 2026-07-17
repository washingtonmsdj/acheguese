/**
 * CommentService - SSOT de comentarios.
 *
 * Entrada publica unica para consultas e escritas de comentarios. A logica
 * permanece isolada em comments.queries e comments.mutations.
 */

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

export {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  CommentError,
} from "./comments.mutations";

export type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
} from "../types";

import * as CommentsQueries from "./comments.queries";
import * as CommentsMutations from "./comments.mutations";

export const CommentService = {
  getCommentsByPost: CommentsQueries.getCommentsByPost,
  getCommentById: CommentsQueries.getCommentById,
  getCommentsCount: CommentsQueries.getCommentsCount,
  getCommentCountByAuthor: CommentsQueries.getCommentCountByAuthor,
  getCommentsByAuthor: CommentsQueries.getCommentsByAuthor,
  getTotalCommentsCount: CommentsQueries.getTotalCommentsCount,
  getRecentComments: CommentsQueries.getRecentComments,
  getCommentsCreatedInPeriod: CommentsQueries.getCommentsCreatedInPeriod,

  createComment: CommentsMutations.createComment,
  updateComment: CommentsMutations.updateComment,
  deleteComment: CommentsMutations.deleteComment,
  likeComment: CommentsMutations.likeComment,
  unlikeComment: CommentsMutations.unlikeComment,
} as const;
