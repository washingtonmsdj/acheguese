/**
 * ReviewsService - SSOT de avaliacoes.
 *
 * Entrada publica unica para consultas e escritas de reviews. A logica
 * permanece isolada em reviews.queries e reviews.mutations.
 */

export {
  hasReviewed,
  getReviewByReviewer,
  getReviewById,
  getReviewsForProfile,
  getReviewsByReviewer,
  getReviewStats,
  getReviewCount,
  getAllReviews,
} from "./reviews.queries";

export {
  addReview,
  updateReview,
  removeReview,
  upsertReview,
} from "./reviews.mutations";

export type {
  Review,
  CreateReviewData,
  ReviewStats,
  ReviewType,
} from "../types";

import * as ReviewsQueries from "./reviews.queries";
import * as ReviewsMutations from "./reviews.mutations";

export class ReviewsService {
  static hasReviewed = ReviewsQueries.hasReviewed;
  static getReviewByReviewer = ReviewsQueries.getReviewByReviewer;
  static getReviewById = ReviewsQueries.getReviewById;
  static getReviewsForProfile = ReviewsQueries.getReviewsForProfile;
  static getReviewsByReviewer = ReviewsQueries.getReviewsByReviewer;
  static getReviewStats = ReviewsQueries.getReviewStats;
  static getReviewCount = ReviewsQueries.getReviewCount;
  static getAllReviews = ReviewsQueries.getAllReviews;

  static addReview = ReviewsMutations.addReview;
  static updateReview = ReviewsMutations.updateReview;
  static removeReview = ReviewsMutations.removeReview;
  static upsertReview = ReviewsMutations.upsertReview;
}
