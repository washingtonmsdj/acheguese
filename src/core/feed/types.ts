/**
 * Feed Service Types
 *
 * Tipos TypeScript para o serviço de feed
 */

import type {
  Post as CanonicalPost,
  PostType as CanonicalPostType,
} from "@/core/posts/types";
import type { ProfileSummary } from "@/core/profiles/views/ProfileSummary";

export type PostType = CanonicalPostType;

export type FeedContext = "all" | "my_posts" | "saved";

export interface Post {
  id: string;
  author_profile_id: string; // ✅ SSOT: Usa author_profile_id (não profile_id)
  type: PostType;
  content: string;
  image_url?: string;
  video_url?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;

  // Relacionamentos
  profile?: ProfileSummary;
}

export interface FeedParams {
  // Filtros de localização (legado — usar location_id / location_ids)
  city?: string;
  neighborhood?: string;
  street?: string;

  // Filtro territorial canônico (Etapa 5)
  /** location_id único — scope: 'location' */
  location_id?: string;
  /** location_ids para grupo — scope: 'group' */
  location_ids?: string[];
  /** Aplica filtro estrito por district */
  district_filter?: boolean;
  /** Aplica filtro por cidade */
  city_filter?: boolean;

  // Contexto do feed
  context?: FeedContext;

  // Paginação
  cursor?: string;
  limit?: number;
}

export interface FeedResult {
  posts: Post[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CreatePostData {
  type: PostType;
  content: string;
  image_url?: string;
  video_url?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
}

export interface UpdatePostData {
  content?: string;
  image_url?: string;
  video_url?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
}

export class FeedError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "FeedError";
    this.code = code;
    this.status = status;
  }
}
