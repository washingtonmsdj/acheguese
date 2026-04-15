/**
 * Schema de validação para Posts - SSOT
 *
 * Re-exporta schemas consolidados de modules/community
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

// Re-export from consolidated schemas
export {
  createPostSchema as CreatePostSchema,
  updatePostSchema as UpdatePostSchema,
  feedFiltersSchema as GetPostsSchema,
} from "@/modules/community/schemas/postSchemas";

export type {
  CreatePostInput,
  UpdatePostInput,
  FeedFilters as GetPostsInput,
} from "@/modules/community/schemas/postSchemas";
