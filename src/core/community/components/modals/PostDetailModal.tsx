import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { PostHeader } from "../PostHeader";
import { PostBadge, PostType } from "../PostBadge";
import { PostContent } from "../PostContent";
import { PostTags } from "../PostTags";
import { PostMetrics } from "../PostMetrics";
import { PollCard } from "../PollCard";
import { usePostInteractions } from "../../hooks/posts/usePostInteractions";
import { Poll } from "@/shared/types/poll";
import {
  getCardBackground,
  INLINE_STYLES,
  SPACING,
} from "../styles/communityDesignSystem";
import { Send } from "lucide-react";
import { logger } from "@/shared/utils/logger";
import { CommentService } from "@/core/comments/services/CommentService";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";

interface Comment {
  id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_liked?: boolean;
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    author_profile_id: string;
    author_name: string;
    author_avatar?: string;
    type: PostType;
    content: string;
    images?: string[];
    poll?: Poll;
    tags: string[];
    city: string;
    neighborhood: string;
    rua: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    is_liked?: boolean;
    is_saved?: boolean;
    is_verified?: boolean;
  };
  comments?: Comment[];
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  canComment?: boolean;
  commentBlockedMessage?: string;
}

export function PostDetailModal({
  isOpen,
  onClose,
  post,
  comments = [],
  onLike,
  onSave,
  onShare,
  onReport,
  onTagClick,
  canComment = true,
  commentBlockedMessage = "Verifique sua residencia para comentar nesta comunidade.",
}: PostDetailModalProps) {
  const { activeProfile } = useSessionContext();
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  const { state, isProcessing } =
    usePostInteractions(post.id, {
      isLiked: post.is_liked || false,
      isSaved: post.is_saved || false,
      likesCount: post.likes_count,
    });

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    if (diffDays < 7) return `há ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
    return date.toLocaleDateString("pt-BR");
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmitting) return;
    if (!canComment) {
      toast.info(commentBlockedMessage);
      return;
    }

    if (!activeProfile?.id) {
      toast.error("Você precisa estar logado para comentar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdComment = await CommentService.createComment({
        post_id: post.id,
        author_profile_id: activeProfile.id,
        content: commentText.trim(),
      });

      if (!createdComment) {
        toast.error("Não foi possível enviar o comentário.");
        return;
      }

      setLocalComments((prev) => [
        ...prev,
        {
          id: createdComment.id,
          author_name:
            (activeProfile.displayName ??
              activeProfile.name ??
              "Usuário")
              .trim(),
          author_avatar:
            activeProfile.avatarUrl ??
            undefined,
          content: createdComment.content,
          created_at: createdComment.created_at,
          likes_count: createdComment.likes_count ?? 0,
        },
      ]);
      setCommentText("");
      toast.success("Comentário enviado.");
    } catch (error) {
      logger.error("Error sending comment:", error);
      toast.error("Erro ao enviar comentário.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] p-0 gap-0 border-0"
        style={getCardBackground("card")}
        aria-describedby="dialog-description"
      >
        <DialogHeader className="p-4 pb-0">
          <DialogTitle style={INLINE_STYLES.textPrimary}>Detalhes do Post</DialogTitle>
          <span id="dialog-description" className="sr-only">Conteúdo do diálogo</span>
        </DialogHeader>
        <DialogDescription className="sr-only">Detalhes completos da publicação</DialogDescription>

        <ScrollArea className="flex-1 px-4">
          <div className={SPACING.sectionGap}>
            <div className="pt-2">
              <PostHeader
                authorName={post.author_name}
                authorAvatar={post.author_avatar}
                city={post.city}
                neighborhood={post.neighborhood}
                timestamp={getRelativeTime(post.created_at)}
              />

              {(post.type as string) === "alerta" && (
                <div className="mt-2">
                  <PostBadge type={post.type} isVerified={post.is_verified} />
                </div>
              )}
            </div>

            <PostContent content={post.content} images={post.images} />

            {post.poll && post.type === "enquete" && (
              <div className="mt-4">
                <PollCard pollId={post.poll.id} poll={post.poll} />
              </div>
            )}

            {post.tags.length > 0 && <PostTags tags={post.tags} onTagClick={onTagClick} />}

            <PostMetrics
              likesCount={state.likesCount}
              commentsCount={post.comments_count}
              isLiked={state.isLiked}
              isSaved={state.isSaved}
              onLike={() => onLike(post.id)}
              onComment={() => {}}
              onSave={() => onSave(post.id)}
              onShare={() => onShare(post.id)}
              onReport={() => onReport(post.id)}
              disabled={isProcessing}
            />

            <div className="space-y-3 pb-4">
              <h3 className="font-bold text-sm" style={INLINE_STYLES.textPrimary}>
                Comentários ({localComments.length})
              </h3>

              {localComments.length === 0 ? (
                <p className="text-sm text-center py-6" style={INLINE_STYLES.textSecondary}>
                  Nenhum comentário ainda. Seja o primeiro!
                </p>
              ) : (
                localComments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                    <div className="flex items-start gap-3">
                      <img
                        src={comment.author_avatar || "/default-avatar.png"}
                        alt={comment.author_name}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm" style={INLINE_STYLES.textPrimary}>
                            {comment.author_name}
                          </span>
                          <span className="text-xs" style={INLINE_STYLES.textMuted}>
                            {getRelativeTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm" style={INLINE_STYLES.textPrimary}>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}>
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 min-h-[80px] resize-none border-white/10"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", color: "#FFFFFF" }}
              disabled={!canComment || isSubmitting}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || !canComment || isSubmitting}
              className="h-[80px] px-4"
              style={{
                background: commentText.trim() && canComment
                  ? "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)"
                  : "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
              }}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
