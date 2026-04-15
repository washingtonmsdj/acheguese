import React, { Suspense, lazy } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

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

interface ModalState {
  type: "comment" | "post" | "unified" | "report" | "create" | null;
  data: any;
}

interface CommunityModalsProps {
  modalState: ModalState;
  postId: string | null;
  postData: any;
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
            postId={modalState.data?.postId || modalState.data}
            postAuthorId={modalState.data?.authorProfileId || ""}
            postAuthorName={modalState.data?.authorName || "Autor"}
            currentUserId={profileId}
          />
        </Suspense>
      )}

      {postId && postData && !isLoadingPost && (
        <Suspense fallback={null}>
          <PostDetailModal
            isOpen={true}
            onClose={onClosePostDetail}
            post={postData as any}
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
