/**
 * DEPRECATED: Este arquivo foi dividido em módulos específicos
 *
 * Funções genéricas → @/shared/utils/textUtils
 * Lógica de negócio → @/core/community/utils/communityBusinessLogic
 *
 * Mantido apenas para compatibilidade temporária
 */

// Re-export funções genéricas
export {
  formatRelativeTime,
  sanitizeContent,
  sanitizeUrl,
  validatePostContent,
  validateCommentContent,
  calculateEngagement,
} from "@/shared/utils/textUtils";

// Re-export lógica de negócio
export {
  checkPostRateLimit,
  checkCommentRateLimit,
  createCommentNotification,
  createReplyNotification,
  createLikeNotification,
  createFollowedPostNotifications,
  createMentionNotifications,
} from "@/core/community/utils/communityBusinessLogic";
