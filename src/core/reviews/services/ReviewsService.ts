/**
 * ⭐ REVIEWS SERVICE - FACHADA SSOT v2.0
 *
 * ✅ Ponto único de entrada para operações de reviews
 * ✅ Mantém compatibilidade com código existente
 * ✅ Delega para módulos especializados por responsabilidade
 *
 * REFATORAÇÃO v2.0.0:
 * - Queries → reviews.queries.ts
 * - Mutations → reviews.mutations.ts
 * - Types → ../types.ts (SSOT)
 *
 * ⚠️ NÃO adicionar lógica diretamente neste arquivo.
 * Use os módulos especializados acima.
 */

// Re-exports de queries
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

// Re-exports de mutations
export {
  addReview,
  updateReview,
  removeReview,
  upsertReview,
} from "./reviews.mutations";

// Re-exports de types (centralizados em ../types.ts)
export type {
  Review,
  ReviewWithProfiles,
  CreateReviewData,
  ReviewStats,
  ReviewType,
} from "../types";

// ============================================================================
// 🏛️ SSOT v2.0 - FACADE
// ============================================================================

import * as ReviewsQueries from "./reviews.queries";
import * as ReviewsMutations from "./reviews.mutations";
import type { Review, CreateReviewData, ReviewStats, ReviewType } from "../types";

/**
 * ⭐ ReviewsFacade - Interface SSOT unificada v2.0
 *
 * Uso: ReviewsFacade.queries.getReviewById(id)
 *      ReviewsFacade.mutations.addReview(data)
 */
export const ReviewsFacade = {
  queries: ReviewsQueries,
  mutations: ReviewsMutations,
} as const;

/**
 * @deprecated Use ReviewsFacade ou os exports diretos dos módulos reviews.queries e reviews.mutations
 * ReviewsService como classe estática mantido para compatibilidade.
 */
export class ReviewsService {
  // ===== QUERIES =====
  static hasReviewed = ReviewsQueries.hasReviewed;
  static getReviewByReviewer = ReviewsQueries.getReviewByReviewer;
  static getReviewById = ReviewsQueries.getReviewById;
  static getReviewsForProfile = ReviewsQueries.getReviewsForProfile;
  static getReviewsByReviewer = ReviewsQueries.getReviewsByReviewer;
  static getReviewStats = ReviewsQueries.getReviewStats;
  static getReviewCount = ReviewsQueries.getReviewCount;
  static getAllReviews = ReviewsQueries.getAllReviews;

  // ===== MUTATIONS =====
  static addReview = ReviewsMutations.addReview;
  static updateReview = ReviewsMutations.updateReview;
  static removeReview = ReviewsMutations.removeReview;
  static upsertReview = ReviewsMutations.upsertReview;
}
