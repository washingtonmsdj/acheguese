/**
 * ⭐ REVIEWS SERVICES - SSOT v2.0 Exports
 *
 * @version 2.0.0 - Refatoração SSOT
 */

// ============================================================
// 🎯 QUERIES - Operações de leitura
// ============================================================
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

// ============================================================
// 📝 MUTATIONS - Operações de escrita
// ============================================================
export {
  addReview,
  updateReview,
  removeReview,
  upsertReview,
} from "./reviews.mutations";

// ============================================================
// 🏛️ FACADE - Interface unificada SSOT v2.0
// ============================================================
export { ReviewsFacade, ReviewsService } from "./ReviewsService";

// ============================================================
// 📦 LEGACY - Alias para compatibilidade
// ============================================================
export { ReviewsService as reviewsService } from "./ReviewsService";
