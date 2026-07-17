/**
 * Canonical bounds for Community First read models.
 *
 * These values constrain browser-driven pagination and batch reads. Changes
 * require reviewing the matching database indexes and server-side contracts.
 */
export const COMMUNITY_RUNTIME_LIMITS = {
  SOCIAL_PAGE_SIZE: 100,
  SOCIAL_PAGE_OFFSET_MAX: 10_000,
  POST_ID_BATCH_SIZE: 500,
  LOST_FOUND_DEFAULT_PAGE_SIZE: 20,
  LOST_FOUND_PAGE_SIZE_MAX: 50,
  LOST_FOUND_COMMENTS_MAX: 100,
  MODERATION_QUEUE_PAGE_SIZE: 50,
  MODERATION_QUEUE_OFFSET_MAX: 10_000,
} as const;
