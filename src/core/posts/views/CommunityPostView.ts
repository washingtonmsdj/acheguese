import type { PostType } from "../postTypes";

export interface CommunityPollOptionView {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

export interface CommunityPollView {
  id?: string;
  question: string;
  options: CommunityPollOptionView[];
  total_votes: number;
  expires_at?: string;
  user_voted?: boolean;
  user_vote_option_id?: string;
}

/**
 * Read-model used by the Community post detail surface.
 *
 * Persistence fields stay owned by Post/PostService. Viewer-specific interaction
 * state and author presentation data are composed at the read boundary.
 */
export interface CommunityPostView {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  type: PostType;
  content: string;
  images?: string[];
  poll?: CommunityPollView;
  tags: string[];
  location_id?: string;
  location?: { id: string; name: string; type?: string; parent_id?: string };
  created_at: string;
  likes_count: number;
  comments_count: number;
  confirmations_count?: number;
  is_verified?: boolean;
  is_liked?: boolean;
  is_saved?: boolean;
  has_user_confirmed?: boolean;
  is_edited?: boolean;
}
