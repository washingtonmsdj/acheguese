/**
 * PostService Types - SSOT Territorial
 *
 * Tipos TypeScript para o serviço de posts.
 */

import type { ProfileSummary } from "@/core/profiles/views/ProfileSummary";
import type { PostType } from "./postTypes";

export type { PostType } from "./postTypes";

export interface Post {
  id: string;
  author_profile_id: string;
  type: PostType;
  content: string;
  image_url?: string;
  video_url?: string;
  location_id?: string;
  location?: { id: string; name: string; type?: string; parent_id?: string };
  reach?: "street" | "neighborhood" | "city";
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  content_intent?: string;
  display_format?: string;
  distribution_channels?: string[];
  content_payload?: Record<string, unknown>;
  category?: string;
  hidden?: boolean;

  // Relacionamentos
  profile?: ProfileSummary;
}

export interface FeedParams {
  // Filtro territorial canônico
  location_id?: string;
  location_ids?: string[];
  district_filter?: boolean;
  city_filter?: boolean;
  includeStreetReach?: boolean;

  // Contexto do feed
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
  location_id: string;
  reach?: "street" | "neighborhood" | "city";
  images?: string[];
  tags?: string[];
  content_intent?: string;
  display_format?: string;
  distribution_channels?: string[];
  content_payload?: Record<string, unknown>;
}

export interface UpdatePostData {
  content: string;
}

export interface PostStats {
  likes_count: number;
  comments_count: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

// ============================================================================
// POLL TYPES
// ============================================================================

export interface Poll {
  id: string;
  post_id: string;
  question: string;
  options: PollOption[];
  total_votes: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  position: number;
  votes: number;
  created_at: string;
}

export interface CreatePollData {
  postId: string;
  question: string;
  options: Array<{
    text: string;
    position: number;
  }>;
  expiresInDays: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// ============================================================================
// COMMUNITY POST TYPES (SSOT — sem campos legados)
// ============================================================================

export interface CommunityPost {
  id: string;
  author_profile_id: string;
  type: PostType;
  content: string;
  images?: string[];
  tags?: string[];
  location_id: string;
  location?: { id: string; name: string; type?: string; parent_id?: string };
  reach: "street" | "neighborhood" | "city";
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  // Compatibilidade legada de UI community
  is_liked?: boolean;
  is_saved?: boolean;
  author_name?: string;
  author_avatar?: string;
  city?: string;
  neighborhood?: string;
  is_verified_resident?: boolean;
  is_verified?: boolean;
  is_edited?: boolean;
  confirmations_count?: number;
}

export interface EditHistory {
  id: string;
  post_id: string;
  previous_content: string;
  edited_at: string;
  edited_by?: string;
}

export interface CreateCommunityPostData {
  author_profile_id: string;
  type: PostType;
  content: string;
  location_id: string;
  reach: "street" | "neighborhood" | "city";
  images?: string[];
  tags?: string[];
}

export class PostError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "PostError";
    this.code = code;
    this.status = status;
  }
}
