import React, { Suspense, lazy } from "react";
import { AnimatePresence } from "framer-motion";
import { logger } from "@/shared/utils/logger";
import type { PostType } from "@/shared/constants/postTypeConfig";
import type { Poll } from "@/shared/types/poll";

const CommentsModal = lazy(() =>
  import("@/modules/community/components/CommentsModal").then((m) => ({
    default: m.CommentsModal,
  })),
);
const PostDetailModal = lazy(() =>
  import("@/modules/community/components/modals/PostDetailModal").then((m) => ({
    default: m.PostDetailModal,
  })),
);
const UnifiedDetailModal = lazy(() =>
  import("@/modules/community/components/UnifiedDetailModal").then((m) => ({
    default: m.UnifiedDetailModal,
  })),
);

interface ModalCommentData {
  postId?: string;
  authorProfileId?: string;
  authorName?: string;
}

interface ModalState {
  type: "comment" | "post" | "unified" | "report" | "create" | null;
  data: ModalCommentData | string | null;
}

interface PostDetailData {
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
}

interface CommunityModalsProps {
  modalState: ModalState;
  postId: string | null;
  postData: PostDetailData | null;
  isLoadingPost: boolean;
  profileId?: string;
  onCloseModal: () => void;
  onClosePostDetail: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
  onTagClick: (tag: string) => void;
}

export function CommunityModals({
  modalState,
  postId,
  postData,
  isLoadingPost,
  profileId,
  onCloseModal,
  onClosePostDetail,
  onLike,
  onSave,
  onShare,
  onReport,
  onTagClick,
}: CommunityModalsProps) {
  return (
    <AnimatePresence>
      {modalState.type === "comment" && (
        <Suspense fallback={null}>
          <CommentsModal
            open={true}
            onOpenChange={onCloseModal}
            postId={
              typeof modalState.data === "string"
                ? modalState.data
                : modalState.data?.postId || ""
            }
            postAuthorId={
              typeof modalState.data === "string"
                ? ""
                : modalState.data?.authorProfileId || ""
            }
            postAuthorName={
              typeof modalState.data === "string"
                ? "Autor"
                : modalState.data?.authorName || "Autor"
            }
            currentUserId={profileId}
          />
        </Suspense>
      )}

      {postId && postData && !isLoadingPost && (
        <Suspense fallback={null}>
          <PostDetailModal
            isOpen={true}
            onClose={onClosePostDetail}
            post={postData}
            comments={[]}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onReport={onReport}
            onTagClick={onTagClick}
          />
        </Suspense>
      )}

      {modalState.type === "unified" && (
        <Suspense fallback={null}>
          <UnifiedDetailModal
            isOpen={true}
            onClose={onCloseModal}
            content={modalState.data}
            comments={[]}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onReport={onReport}
            onUpvote={(id) => logger.info("Upvote:", { action: id })}
            onTagClick={onTagClick}
          />
        </Suspense>
      )}
    </AnimatePresence>
  );
}
