import React from "react";
import { UnifiedPostCard } from "../UnifiedPostCard";
import { DirectMessageModal } from "../DirectMessageModal";
import { useUnifiedFeed } from "../../hooks/feed/useUnifiedFeed";
import { useMessageModal } from "../../hooks/useMessageModal";
import type { UnifiedPost } from "@/shared/types/posts";

interface UnifiedFeedWithMessagesProps {
  posts?: UnifiedPost[];
  civicReports?: UnifiedPost[];
  communityPosts?: UnifiedPost[];
  feedPosts?: UnifiedPost[];
  currentUserId?: string;
  sortCriteria?: "recent" | "popular" | "nearby";
  filterType?:
    | "all"
    | "civic_report"
    | "discussao"
    | "alerta"
    | "recomendacao"
    | "enquete";
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
        <div className="space-y-4">
          {sortedPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhuma postagem encontrada</p>
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
