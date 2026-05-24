/**
 * Comments services - SSOT exports.
 */

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

export {
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  CommentError,
} from "./comments.mutations";

export { CommentService } from "./CommentService";

export type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
} from "../types";
