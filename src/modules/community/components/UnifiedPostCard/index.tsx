import React from "react";

import { useState, useMemo, useCallback, memo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/shared/components/ui/card";
import { usePostInteractions } from "../../hooks/posts/usePostInteractions";
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
import { ptBR } from "date-fns/locale";
import {
  getCardClasses,
  getCardBackground,
  SPACING,
} from "../styles/communityDesignSystem";
// Sub-componentes
import { PostHeader } from "./PostHeader";
import { PostBadges } from "./PostBadges";
import { PostContent } from "./PostContent";
import { AlertConfirmation } from "./AlertConfirmation";
import { PostActions } from "./PostActions";
import { logger } from "@/shared/utils/logger";

import { UnifiedPost } from "@/shared/types/posts";

interface UnifiedPostCardProps {
  post: UnifiedPost;
  currentUserId?: string;

  // Ações princicountry
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onReport?: (postId: string) => void;

  // Ações específicas
  onUpvote?: (postId: string) => void;
  onConfirm?: (postId: string) => void;
  onPostClick?: (postId: string) => void;

  // Sistema de mensagens
  onSendMessage?: (postId: string, recipientProfileId: string) => void;

  // API pública estável
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
}

/**
 * Card unificado para exibição de posts da comunidade
 * Suporta múltiplos tipos: civic_report, discussao, alerta, recomendacao, etc.
 *
 * @component
 * @example
 * ```tsx
 * <UnifiedPostCard
 *   post={post}
 *   currentUserId={user.id}
 *   onLike={handleLike}
 *   onComment={handleComment}
 * />
 * ```
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
  // Hook de interações com otimistic updates e Supabase
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

  // Memoizar conteúdo do post
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

  // Memoizar localização formatada
  // ✅ SSOT: usa location.name do JOIN — sem fallback em campos legados
  const formattedLocation = useMemo(() => {
    if (post.location && typeof post.location === 'object' && 'name' in post.location) {
      return post.location.name;
    }
    if (post.location && typeof post.location === 'string') {
      return post.location;
    }
    return "Localização não informada";
  }, [post.location]);

  // Memoizar tempo relactive
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

  // Handlers com otimistic updates
  const handleLike = useCallback(() => {
    if (import.meta.env.DEV) {
      logger.info("[UnifiedPostCard] Like action", { postId: post.id });
    }
    likePost();
    onLike?.(post.id);
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
    savePost();
    onSave?.(post.id);
  }, [savePost, onSave, post.id]);

  const handleShare = useCallback(() => {
    if (import.meta.env.DEV) {
      logger.info("[UnifiedPostCard] Share action", { postId: post.id });
    }
    sharePost();
    onShare?.(post.id);
  }, [sharePost, onShare, post.id]);

  const handleCardClick = useCallback(() => {
    onPostClick?.(post.id);
  }, [onPostClick, post.id]);

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
      className={`${getCardClasses("default")} hover:-translate-y-0.5 transition-all duration-200`}
      style={getCardBackground("card")}
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

        {/* ✅ SPRINT 2 FASE 5: Badge de reach — metadado de visibilidade */}
        {post.reach && (
          <div className="mt-1" data-testid="reach-badge">
            <span
              className="inline-flex items-center text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(156,163,175,0.15)', color: '#9CA3AF' }}
              aria-label={`Visibilidade: ${post.reach}`}
            >
              {post.reach === 'street' && '🏠 Minha rua'}
              {post.reach === 'neighborhood' && '📍 Meu bairro'}
              {post.reach === 'city' && '🏙️ Cidade'}
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
        aria-label="Abrir detalhes do post"
      >
        <PostContent
          postType={post.type}
          content={postContent}
          image={postImage}
          civicType={post.civic_type}
          status={post.status}
          urgency={post.urgency}
          tags={post.tags}
          onTagClick={onTagClick}
        />
      </CardContent>

      <CardFooter className={`${SPACING.cardPadding} pt-0`}>
        {/* Seção de Confirmações (para alertas) */}
        {String(post.type) === "alerta" && post.confirmations_count !== undefined && (
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

// Exportar sub-componentes para uso individual se necessário
export { PostHeader, PostBadges, PostContent, AlertConfirmation, PostActions };
