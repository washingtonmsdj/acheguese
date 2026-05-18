import React, { useCallback, memo } from "react";
import { Card } from "@/shared/components/ui/card";
import { usePostInteractions } from "../../hooks/posts/usePostInteractions";
import { usePostCard } from "../../hooks/posts/usePostCard";
import { PostHeader } from "@/core/community/components/post-card/PostHeader";
import { PostContent } from "@/core/community/components/post-card/PostContent";
import { AlertConfirmation } from "@/core/community/components/post-card/AlertConfirmation";
import { PostActions } from "@/core/community/components/post-card/PostActions";
import {
  getCardClasses,
  getCardBackground,
} from "../styles/communityDesignSystem";
import type { UnifiedPost } from "@/shared/types/posts";

interface UnifiedPostCardProps {
  post: UnifiedPost;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onUpvote?: (postId: string) => void;
  onConfirm?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onSendMessage?: (postId: string, recipientProfileId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
}

const UnifiedPostCardComponent = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onReport,
  onUpvote,
  onConfirm,
  onPostClick,
  onSendMessage,
  onDelete,
  onEdit,
  onTagClick,
}: UnifiedPostCardProps) => {
  // Hook de interações com otimistic updates
  const {
    state,
    isProcessing,
    handleLike: likePost,
    handleSave: savePost,
    handleShare: sharePost,
  } = usePostInteractions(post.id, {
    isLiked: post.is_liked || false,
    isSaved: post.is_saved || false,
    likesCount: post.likes_count,
  });

  // Hook customizado para lógica do card
  const {
    typeConfig,
    postContent,
    postImage,
    formattedLocation,
    upvotesCount,
    handleUpvote: incrementUpvote,
  } = usePostCard({
    postId: post.id,
    postType: post.type,
    tags: post.tags,
    content: post.content,
    description: post.description,
    images: post.images,
    imageUrl: post.image_url,
    location: post.location,
    authorName: post.author_name,
    createdAt: post.created_at,
    upvotes: post.upvotes,
  });

  const TypeIcon = typeConfig?.icon;
  const isOwnPost = currentUserId === post.author_profile_id;
  const showMessageButton = currentUserId && !isOwnPost && onSendMessage;
  const postType = String(post.type);
  const isCivicReport = postType === "civic_report";

  // Handlers
  const handleLike = useCallback(() => {
    likePost();
    onLike?.(post.id);
  }, [likePost, onLike, post.id]);

  const handleUpvote = useCallback(() => {
    incrementUpvote();
    onUpvote?.(post.id);
  }, [incrementUpvote, onUpvote, post.id]);

  const handleSave = useCallback(() => {
    savePost();
    onSave?.(post.id);
  }, [savePost, onSave, post.id]);

  const handleShare = useCallback(() => {
    sharePost();
    onShare?.(post.id);
  }, [sharePost, onShare, post.id]);

  const handleCardClick = useCallback(() => {
    onPostClick?.(post.id);
  }, [onPostClick, post.id]);

  const handleSendMessage = useCallback(() => {
    onSendMessage?.(post.id, post.author_profile_id);
  }, [onSendMessage, post.id, post.author_profile_id]);

  const handleConfirm = useCallback(() => {
    onConfirm?.(post.id);
  }, [onConfirm, post.id]);

  return (
    <Card
      className={`${getCardClasses("default")} hover:-translate-y-0.5 transition-all duration-200`}
      style={getCardBackground("card")}
      role="article"
      aria-label={`Post de ${post.author_name}: ${typeConfig.badge}`}
    >
      <PostHeader
        authorProfileId={post.author_profile_id}
        authorName={post.author_name}
        authorAvatar={post.author_avatar}
        isVerifiedResident={post.is_verified_resident}
        location={formattedLocation}
        createdAt={post.created_at}
        typeIcon={TypeIcon}
        typeBadge={typeConfig.badge}
        typeColor={typeConfig.color}
        typeBgColor={typeConfig.bgColor}
        isOwnPost={isOwnPost}
        onEdit={onEdit ? () => onEdit(post.id) : undefined}
        onDelete={onDelete ? () => onDelete(post.id) : undefined}
        onReport={onReport ? () => onReport(post.id) : undefined}
      />

      <PostContent
        content={postContent}
        image={postImage}
        civicType={post.civic_type}
        status={post.status}
        urgency={post.urgency}
        tags={post.tags}
        isCivicReport={isCivicReport}
        onClick={handleCardClick}
        onTagClick={onTagClick}
      />

      {postType === "alerta" && post.confirmations_count !== undefined && (
        <AlertConfirmation
          confirmationsCount={post.confirmations_count}
          hasUserConfirmed={post.has_user_confirmed || false}
          onConfirm={handleConfirm}
        />
      )}

      <PostActions
        isCivicReport={isCivicReport}
        isLiked={state.isLiked}
        isSaved={state.isSaved}
        likesCount={state.likesCount}
        upvotesCount={upvotesCount}
        commentsCount={post.comments_count}
        isProcessing={isProcessing}
        showMessageButton={!!showMessageButton}
        authorName={post.author_name}
        onLike={handleLike}
        onUpvote={handleUpvote}
        onComment={() => onComment?.(post.id)}
        onSendMessage={handleSendMessage}
        onSave={handleSave}
        onShare={handleShare}
      />
    </Card>
  );
};

// Memoizar componente para evitar re-renders desnecessários
export const UnifiedPostCard = memo(UnifiedPostCardComponent);

// Adicionar displayName para debugging
UnifiedPostCard.displayName = "UnifiedPostCard";
