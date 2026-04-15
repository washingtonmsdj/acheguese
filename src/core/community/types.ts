/**
 * Community Types
 * 
 * CommunityPost moved to core/posts/types/Post.ts for SSOT
 */

// Re-export from core/posts for backward compatibility
export type { CommunityPost } from "@/core/posts/types/Post";

export interface CommunityStats {
  total_posts: number;
  total_comments: number;
  total_likes: number;
  active_users: number;
}
