import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import type { Poll } from "@/shared/types/poll";

import { usePostInteractions } from "../../hooks/posts/usePostInteractions";
import { PollCard } from "../PollCard";
import { PostBadge, type PostType } from "../PostBadge";
import { PostContent } from "../PostContent";
import { PostHeader } from "../PostHeader";
import { PostMetrics } from "../PostMetrics";
import { PostTags } from "../PostTags";
import { PostCommentsPanel } from "../comments/PostCommentsPanel";
import {
  getCardBackground,
  INLINE_STYLES,
  SPACING,
} from "../styles/communityDesignSystem";

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
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  canComment?: boolean;
  commentBlockedMessage?: string;
}

function formatRelativeTime(dateString: string): string {
  const elapsed = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60_000));
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / 86_400_000);

  if (minutes < 1) return "agora";
  if (minutes < 60) return `ha ${minutes} min`;
  if (hours < 24) return `ha ${hours} h`;
  if (days < 7) return `ha ${days} d`;
  return new Date(dateString).toLocaleDateString("pt-BR");
}

export function PostDetailModal({
  isOpen,
  onClose,
  post,
  onLike,
  onSave,
  onShare,
  onReport,
  onTagClick,
  canComment = true,
  commentBlockedMessage = "Verifique sua residencia para comentar nesta comunidade.",
}: PostDetailModalProps) {
  const { state, isProcessing } = usePostInteractions(post.id, {
    isLiked: post.is_liked || false,
    isSaved: post.is_saved || false,
    likesCount: post.likes_count,
  });

  const focusComments = () => {
    document
      .querySelector("[data-post-comments-panel='true']")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[90dvh] max-w-2xl gap-0 overflow-hidden border-0 p-0"
        style={getCardBackground("card")}
      >
        <DialogHeader className="border-b border-white/10 p-4">
          <DialogTitle style={INLINE_STYLES.textPrimary}>
            Detalhes da publicacao
          </DialogTitle>
          <DialogDescription className="sr-only">
            Publicacao completa e comentarios da comunidade
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className={SPACING.sectionGap}>
            <div className="pt-3">
              <PostHeader
                authorName={post.author_name}
                authorAvatar={post.author_avatar}
                city={post.city}
                neighborhood={post.neighborhood}
                timestamp={formatRelativeTime(post.created_at)}
              />
              {(post.type as string) === "alerta" ? (
                <div className="mt-2">
                  <PostBadge type={post.type} isVerified={post.is_verified} />
                </div>
              ) : null}
            </div>

            <PostContent content={post.content} images={post.images} />

            {post.poll && post.type === "enquete" ? (
              <PollCard pollId={post.poll.id} poll={post.poll} />
            ) : null}

            {post.tags.length > 0 ? (
              <PostTags tags={post.tags} onTagClick={onTagClick} />
            ) : null}

            <PostMetrics
              likesCount={state.likesCount}
              commentsCount={post.comments_count}
              isLiked={state.isLiked}
              isSaved={state.isSaved}
              onLike={() => onLike(post.id)}
              onComment={focusComments}
              onSave={() => onSave(post.id)}
              onShare={() => onShare(post.id)}
              onReport={() => onReport(post.id)}
              disabled={isProcessing}
            />

            <PostCommentsPanel
              postId={post.id}
              postAuthorId={post.author_profile_id}
              canComment={canComment}
              commentBlockedMessage={commentBlockedMessage}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
