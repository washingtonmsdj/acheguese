import { PostCard as CorePostCard } from "@/core/community/components/PostCard";
import type { CommunityPost } from "@/core/posts/types";

export type FeedPost = CommunityPost & {
  category?: string;
  hidden?: boolean;
};

interface PostCardProps {
  post: FeedPost;
  index?: number;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onReport: (postId: string) => void;
  isLoggedIn?: boolean;
}

export function PostCard({ post, onLike, onComment, onReport, isLoggedIn }: PostCardProps) {
  return (
    <CorePostCard
      post={post}
      currentUserId={isLoggedIn ? post.author_profile_id : undefined}
      onLike={onLike}
      onComment={onComment}
      onSave={() => undefined}
      onShare={() => undefined}
      onReport={onReport}
    />
  );
}
