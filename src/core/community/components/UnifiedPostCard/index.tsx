import React from "react";

import { useState, useMemo, useCallback, memo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/ui/card";
import { usePostInteractions } from "@/core/posts/hooks/usePostInteractions";
import {
  POST_TYPE_CONFIG,
  type PostType,
} from "@/shared/constants/postTypeConfig";
import { type CivicProblemType } from "@/shared/constants/civicProblemTypes";
import {
  type PostStatus,
  type PostUrgency,
} from "@/shared/constants/statusConfig";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import {
  SPACING,
} from "../styles/communityDesignSystem";
import { PostHeader } from "./PostHeader";
import { PostBadges } from "./PostBadges";
import { PostContent } from "./PostContent";
import { AlertConfirmation } from "./AlertConfirmation";
import { PostActions } from "./PostActions";
import { COMMUNITY_POST_CARD_COPY } from "@/core/community/utils/communityCopy";
import { logger } from "@/shared/utils/logger";

import { UnifiedPost } from "@/shared/types/posts";

interface UnifiedPostCardProps {
  post: UnifiedPost;
  currentUserId?: string;

  // Acoes principais
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onReport?: (postId: string) => void;

  // Acoes especificas
  onUpvote?: (postId: string) => void;
  onConfirm?: (postId: string) => void;
  onPostClick?: (postId: string, post: UnifiedPost) => void;

  // Sistema de mensagens
  onSendMessage?: (postId: string, recipientProfileId: string) => void;

  // Compatibilidade
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
}

/**
 * Card unificado para exibicao de posts da comunidade.
 * Suporta multiplos tipos: civic_report, discussao, alerta, recomendacao, etc.
 */
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
  // Hook de interacoes com optimistic updates e Supabase
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

  const [upvotesCount, setUpvotesCount] = useState(post.upvotes || 0);

  // Memoizar tipo efetivo do post
  const effectiveType = useMemo((): PostType => {
    if (post.type !== "discussao" || !post.tags) {
      return post.type;
    }

    const newTypeTags: PostType[] = ["achados", "favor", "evento", "desapego"];
    const foundNewType = post.tags.find((tag) =>
      newTypeTags.includes(tag as PostType),
    );

    return (foundNewType as PostType) || post.type;
  }, [post.type, post.tags]);

  // Memoizar configuração do tipo
  const typeConfig = useMemo(
    () =>
      Object.entries(POST_TYPE_CONFIG).find(([key]) => key === effectiveType)?.[1] ??
      POST_TYPE_CONFIG["discussao"],
    [effectiveType],
  );

  const isOwnPost = currentUserId === post.author_profile_id;
  const showMessageButton = currentUserId && !isOwnPost && onSendMessage;

  // Memoizar conteudo do post
  const postContent = useMemo(
    () => post.content || post.description || "",
    [post.content, post.description],
  );

  // Memoizar image do post
  const postImage = useMemo(() => {
    if (post.images && post.images.length > 0) {
      return post.images[0];
    }
    return post.image_url;
  }, [post.images, post.image_url]);

  // Memoizar localizacao formatada.
  // SSOT: prioriza location.name do JOIN e usa fallback unico padronizado.
  const formattedLocation = useMemo(() => {
    if (post.location && typeof post.location === "object" && "name" in post.location) {
      return post.location.name;
    }
    if (post.location && typeof post.location === "string") {
      return post.location;
    }
    return COMMUNITY_POST_CARD_COPY.locationFallback;
  }, [post.location]);

  // Memoizar tempo relativo
  const relativeTime = useMemo(
    () =>
      formatDistanceToNow(new Date(post.created_at), {
        addSuffix: true,
        locale: ptBR,
      }),
    [post.created_at],
  );

  // Memoizar iniciais do autor
  const authorInitials = useMemo(() => {
    if (!post.author_name) return "U";
    return post.author_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [post.author_name]);

  // Handlers com optimistic updates
  const handleLike = useCallback(() => {
    if (import.meta.env.DEV) {
      logger.info("[UnifiedPostCard] Like action", { postId: post.id });
    }
    if (onLike) {
      onLike(post.id);
      return;
    }

    likePost();
  }, [likePost, onLike, post.id]);

  const handleUpvote = useCallback(() => {
    const newCount = upvotesCount + 1;
    setUpvotesCount(newCount);
    onUpvote?.(post.id);
  }, [upvotesCount, onUpvote, post.id]);

  const handleSave = useCallback(() => {
    if (import.meta.env.DEV) {
      logger.info("[UnifiedPostCard] Save action", { postId: post.id });
    }
    if (onSave) {
      onSave(post.id);
      return;
    }

    savePost();
  }, [savePost, onSave, post.id]);

  const handleShare = useCallback(() => {
    if (import.meta.env.DEV) {
      logger.info("[UnifiedPostCard] Share action", { postId: post.id });
    }
    if (onShare) {
      onShare(post.id);
      return;
    }

    sharePost();
  }, [sharePost, onShare, post.id]);

  const handleCardClick = useCallback(() => {
    onPostClick?.(post.id, post);
  }, [onPostClick, post]);

  const handleSendMessage = useCallback(() => {
    onSendMessage?.(post.id, post.author_profile_id);
  }, [onSendMessage, post.id, post.author_profile_id]);

  const handleComment = useCallback(() => {
    onComment?.(post.id);
  }, [onComment, post.id]);

  const handleConfirm = useCallback(() => {
    onConfirm?.(post.id);
  }, [onConfirm, post.id]);

  const handleEdit = useCallback(() => {
    onEdit?.(post.id);
  }, [onEdit, post.id]);

  const handleDelete = useCallback(() => {
    onDelete?.(post.id);
  }, [onDelete, post.id]);

  const handleReport = useCallback(() => {
    onReport?.(post.id);
  }, [onReport, post.id]);

  return (
    <Card
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#10191d] shadow-xl shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20"
      role="article"
      aria-label={`Post de ${post.author_name}: ${typeConfig.badge}`}
    >
      <CardHeader className={`${SPACING.cardPadding} pb-3`}>
        <PostHeader
          authorProfileId={post.author_profile_id}
          authorName={post.author_name}
          authorAvatar={post.author_avatar}
          authorInitials={authorInitials}
          isVerifiedResident={post.is_verified_resident}
          location={formattedLocation}
          relativeTime={relativeTime}
          createdAt={post.created_at}
          isOwnPost={isOwnPost}
          onEdit={onEdit ? handleEdit : undefined}
          onDelete={onDelete ? handleDelete : undefined}
          onReport={onReport ? handleReport : undefined}
        />

        <PostBadges postType={effectiveType} />

        {/* Badge de reach: metadado de visibilidade */}
        {post.reach && (
          <div className="mt-1" data-testid="reach-badge">
            <span
              className="inline-flex items-center text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(156,163,175,0.15)", color: "#9CA3AF" }}
              aria-label={`${COMMUNITY_POST_CARD_COPY.reachVisibilityPrefix} ${post.reach}`}
            >
              {post.reach === "street" && COMMUNITY_POST_CARD_COPY.reachStreetLabel}
              {post.reach === "neighborhood" && COMMUNITY_POST_CARD_COPY.reachNeighborhoodLabel}
              {post.reach === "city" && COMMUNITY_POST_CARD_COPY.reachCityLabel}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent
        className={`${SPACING.cardPadding} pt-0 pb-3 cursor-pointer`}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={COMMUNITY_POST_CARD_COPY.openPostDetailsAriaLabel}
      >
        <PostContent
          postType={post.type}
          content={postContent}
          image={postImage}
          civicType={post.civic_type as CivicProblemType | undefined}
          status={post.status as PostStatus | undefined}
          urgency={post.urgency as PostUrgency | undefined}
          contentIntent={post.content_intent}
          displayFormat={post.display_format}
          contentPayload={post.content_payload}
          tags={post.tags}
          onTagClick={onTagClick}
        />
      </CardContent>

      <CardFooter className={`${SPACING.cardPadding} pt-0`}>
        {/* Secao de confirmacoes para alertas */}
        {(post.type as string) === "alerta" && post.confirmations_count !== undefined && (
          <AlertConfirmation
            confirmationsCount={post.confirmations_count}
            hasUserConfirmed={post.has_user_confirmed}
            onConfirm={handleConfirm}
          />
        )}

        <PostActions
          postType={post.type}
          postId={post.id}
          authorName={post.author_name}
          isLiked={state.isLiked}
          isSaved={state.isSaved}
          isProcessing={isProcessing}
          likesCount={state.likesCount}
          upvotesCount={upvotesCount}
          commentsCount={post.comments_count}
          showMessageButton={!!showMessageButton}
          onLike={handleLike}
          onUpvote={handleUpvote}
          onComment={handleComment}
          onSendMessage={showMessageButton ? handleSendMessage : undefined}
          onSave={handleSave}
          onShare={handleShare}
        />
      </CardFooter>
    </Card>
  );
};

// Memoizar componente para evitar re-renders desnecessários
export const UnifiedPostCard = memo(UnifiedPostCardComponent);

// Adicionar displayName para debugging
UnifiedPostCard.displayName = "UnifiedPostCard";

// Exportar subcomponentes para uso individual se necessário
export { PostHeader, PostBadges, PostContent, AlertConfirmation, PostActions };
