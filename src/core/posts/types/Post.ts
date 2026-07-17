/**
 * Post Types - Core Domain Types
 *
 * Tipos compartilhados para posts em toda a aplicação.
 * Usados por: community, profile, feed, etc.
 *
 * @module core/posts/types
 */

export interface EditHistory {
  id: string;
  previous_content: string;
  previous_images?: string[];
  edited_at: string;
  editor_name: string;
}

export interface PollOptionBasic {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

export interface PollBasic {
  id?: string;
  question: string;
  options: PollOptionBasic[];
  total_votes: number;
  expires_at?: string;
  user_voted?: boolean;
  user_vote_option_id?: string;
}

/**
 * Post da comunidade — tipo principal para representar posts sociais.
 */
export interface CommunityPost {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  author_reputation?: number;
  is_verified_resident?: boolean;
  type: string;
  content: string;
  images?: string[];
  poll?: PollBasic;
  tags: string[];
  location_id?: string;
  location?: { id: string; name: string; type?: string; parent_id?: string };
  reach?: "street" | "neighborhood" | "city";
  created_at: string;
  likes_count: number;
  comments_count: number;
  confirmations_count?: number;
  is_verified?: boolean;
  is_liked?: boolean;
  is_saved?: boolean;
  has_user_confirmed?: boolean;
  is_edited?: boolean;
  edit_history?: EditHistory[];
  event_date?: string;
  price?: number;
  contact_info?: string;
  category?: string;
  hidden?: boolean;
}

export type { PostType } from "../postTypes";
