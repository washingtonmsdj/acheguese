import React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { PostHeader } from "../PostHeader";
import { PostBadge } from "../PostBadge";
import { PostContent } from "../PostContent";
import { PostTags } from "../PostTags";
import { PostMetrics } from "../PostMetrics";
import { PollCard } from "../PollCard";
import { MentionedProfileCard } from "../MentionedProfileCard";
import { EditHistoryModal } from "../EditHistoryModal";
import { usePostInteractions } from "../../hooks/posts/usePostInteractions";
import { Clock } from "lucide-react";
import {
  getCardClasses,
  getCardBackground,
  SPACING,
} from "../styles/communityDesignSystem";

// ✅ Importar tipos de core/ (tipos compartilhados entre módulos)
import type { CommunityPost } from "@/core/posts/types";
import type { PostType } from "../PostBadge";

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onPostClick?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onSave,
  onShare,
  onReport,
  onDelete,
  onEdit,
  onTagClick,
  onPostClick,
}: PostCardProps) {
  const postAny = post as any;
  const [showEditHistory, setShowEditHistory] = useState(false);
  const { state, isProcessing, handleLike, handleSave, handleShare } =
    usePostInteractions(post.id, {
      isLiked: postAny.is_liked || false,
      isSaved: postAny.is_saved || false,
      likesCount: post.likes_count,
    });
  const isOwnPost = currentUserId === post.author_profile_id;

  const getPostType = (value: string): PostType => {
    switch (value) {
      case "pergunta":
      case "discussao":
      case "recomendacao":
      case "enquete":
      case "achados_e_perdidos":
        return value;
      default:
        return "discussao";
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <Card
      className={`${getCardClasses("default")} hover:-translate-y-0.5`}
      style={getCardBackground("card")}
    >
      <CardHeader className={`${SPACING.cardPadding} pb-3`}>
        <PostHeader
          authorName={postAny.author_name}
          authorAvatar={postAny.author_avatar}
          city={postAny.city || postAny.city}
          neighborhood={postAny.neighborhood || postAny.neighborhood}
          timestamp={getRelativeTime(post.created_at)}
          isVerifiedResident={postAny.is_verified_resident}
          isOwnPost={isOwnPost}
          onDelete={onDelete ? () => onDelete(post.id) : undefined}
          onEdit={onEdit ? () => onEdit(post.id) : undefined}
          onReport={() => onReport(post.id)}
        />
        <PostBadge type={getPostType(post.type)} isVerified={postAny.is_verified} />
      </CardHeader>
      <CardContent
        className={`${SPACING.cardPadding} pt-0 pb-3 cursor-pointer`}
        onClick={() => onPostClick?.(post.id)}
      >
        <PostContent content={post.content} images={post.images} />
        {postAny.is_edited && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowEditHistory(true);
            }}
            className="mt-2 h-auto p-1 text-xs text-gray-500"
          >
            <Clock className="w-3 h-3 mr-1" />
            Editado
          </Button>
        )}
        {post.tags?.length > 0 && (
          <PostTags tags={post.tags} onTagClick={onTagClick} />
        )}
      </CardContent>
      <CardFooter className={`${SPACING.cardPadding} pt-0 flex-col gap-4`}>
        <PostMetrics
          likesCount={state.likesCount}
          commentsCount={post.comments_count}
          confirmationsCount={postAny.confirmations_count}
          showConfirmations={false}
          isLiked={state.isLiked}
          isSaved={state.isSaved}
          onLike={handleLike}
          onComment={() => onComment(post.id)}
          onSave={handleSave}
          onShare={handleShare}
          onReport={() => onReport(post.id)}
          disabled={isProcessing}
        />
      </CardFooter>
    </Card>
  );
}
