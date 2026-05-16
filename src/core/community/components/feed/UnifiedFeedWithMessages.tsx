import React from "react";
import { UnifiedPostCard } from "../UnifiedPostCard";
import { DirectMessageModal } from "../DirectMessageModal";
import { useUnifiedFeed } from "../../hooks/feed/useUnifiedFeed";
import { useMessageModal } from "../../hooks/useMessageModal";
import type { UnifiedPost } from "@/shared/types/posts";
import type { TerritorialFeedChannel } from "../../hooks/feed/territorialFeedEngine";

interface UnifiedFeedWithMessagesProps {
  posts?: UnifiedPost[];
  civicReports?: UnifiedPost[];
  communityPosts?: UnifiedPost[];
  feedPosts?: UnifiedPost[];
  currentUserId?: string;
  sortCriteria?: "recent" | "popular" | "nearby" | "most_commented";
  filterType?:
    | "all"
    | "civic_report"
    | "discussao"
    | "alerta"
    | "recomendacao"
    | "enquete"
    | TerritorialFeedChannel;
  userLocation?: { neighborhood?: string; city?: string };
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onUpvote?: (postId: string) => void;
  onConfirm?: (postId: string) => void;
  onPostClick?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onTagClick?: (tag: string) => void;
}

type DirectMessagePostType =
  | "civic_report"
  | "discussao"
  | "alerta"
  | "recomendacao"
  | "enquete"
  | "pergunta"
  | "achados"
  | "favor"
  | "evento"
  | "desapego";

function toDirectMessagePostType(type: UnifiedPost["type"]): DirectMessagePostType {
  const allowed: DirectMessagePostType[] = [
    "civic_report",
    "discussao",
    "alerta",
    "recomendacao",
    "enquete",
    "pergunta",
    "achados",
    "favor",
    "evento",
    "desapego",
  ];
  return allowed.includes(type as DirectMessagePostType)
    ? (type as DirectMessagePostType)
    : "recomendacao";
}

const UnifiedFeedWithMessages = React.forwardRef<
  HTMLDivElement,
  UnifiedFeedWithMessagesProps
>(
  (
    {
      posts = [],
      civicReports = [],
      communityPosts = [],
      feedPosts = [],
      currentUserId,
      sortCriteria = "recent",
      filterType = "all",
      userLocation,
      onLike,
      onComment,
      onShare,
      onSave,
      onReport,
      onUpvote,
      onConfirm,
      onPostClick,
      onDelete,
      onEdit,
      onTagClick,
    },
    ref,
  ) => {
    const { sortedPosts } = useUnifiedFeed({
      posts,
      civicReports,
      communityPosts,
      feedPosts,
      sortCriteria,
      filterType,
      userLocation,
    });

    const {
      isOpen,
      selectedPost,
      recipientProfile,
      handleOpen,
      handleClose,
      handleSend,
      handleReport,
    } = useMessageModal(currentUserId);

    const handleLike = (postId: string) => {
      const post = sortedPosts.find((p) => p.id === postId);
      if (post?.type === "civic_report") {
        onUpvote?.(postId);
      } else {
        onLike?.(postId);
      }
    };

    const handleSendMessage = (postId: string, recipientProfileId: string) => {
      handleOpen(postId, recipientProfileId, sortedPosts);
    };

    return (
      <>
        <div className="space-y-5">
          {sortedPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-gray-400">
              <p className="text-sm font-semibold text-white/75">Nenhuma postagem encontrada</p>
              <p className="mt-1 text-xs text-white/45">Mude o filtro ou seja a primeira pessoa a publicar neste fluxo.</p>
            </div>
          ) : (
            sortedPosts.map((post) => (
              <UnifiedPostCard
                key={`${post.type}-${post.id}`}
                post={post}
                currentUserId={currentUserId}
                onLike={handleLike}
                onComment={onComment}
                onShare={onShare}
                onSave={onSave}
                onReport={onReport}
                onUpvote={onUpvote}
                onConfirm={onConfirm}
                onPostClick={onPostClick}
                onSendMessage={handleSendMessage}
                onDelete={onDelete}
                onEdit={onEdit}
                onTagClick={onTagClick}
              />
            ))
          )}
        </div>

        {selectedPost && recipientProfile && (
          <DirectMessageModal
            isOpen={isOpen}
            onClose={handleClose}
            postContext={{
              id: selectedPost.id,
              title:
                selectedPost.content.substring(0, 50) +
                (selectedPost.content.length > 50 ? "..." : ""),
              imageUrl: selectedPost.images?.[0] || selectedPost.image_url,
              type: toDirectMessagePostType(selectedPost.type),
            }}
            recipientProfile={recipientProfile}
            currentUserId={currentUserId || ""}
            onSendMessage={handleSend}
            onReportConversation={handleReport}
          />
        )}
      </>
    );
  },
);
UnifiedFeedWithMessages.displayName = "UnifiedFeedWithMessages";

export { UnifiedFeedWithMessages };
