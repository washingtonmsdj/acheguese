import React, { Suspense, lazy } from "react";
import { AnimatePresence } from "framer-motion";

import type {
  CommunityPost,
  PostType as CommunityPostType,
} from "@/core/posts/types/Post";
import type { Poll } from "@/shared/types/poll";
import type {
  ModalCommentData,
  ModalReportData,
  ModalState,
} from "@/core/community-feed/hooks/useComunidadePage";
import {
  COMMUNITY_REPORT_REASON_OPTIONS,
  ReportReasonDialog,
  type CommunityReportReason,
} from "@/core/moderation";

const CommentsModal = lazy(() =>
  import("@/core/community/components/CommentsModal").then((module) => ({
    default: module.CommentsModal,
  })),
);
const PostDetailModal = lazy(() =>
  import("@/core/community-feed/components/PostDetailModal").then(
    (module) => ({
      default: module.PostDetailModal,
    }),
  ),
);

type DetailPostType =
  | "pergunta"
  | "discussao"
  | "recomendacao"
  | "enquete"
  | "achados"
  | "favor"
  | "desapego"
  | "alerta"
  | "classificado"
  | "civic_report";

interface PostDetailData {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  type: DetailPostType;
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
  postData: CommunityPost | null;
  isLoadingPost: boolean;
  profileId?: string;
  onCloseModal: () => void;
  onClosePostDetail: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport: (postId: string) => void;
  onSubmitReport: (
    reason: CommunityReportReason,
    details?: string,
  ) => Promise<void>;
  onTagClick: (tag: string) => void;
  canComment?: boolean;
  commentBlockedMessage?: string;
}

function isCommentModalData(
  data: ModalState["data"],
): data is ModalCommentData {
  return Boolean(
    data &&
    typeof data === "object" &&
    "postId" in data &&
    "authorProfileId" in data &&
    "authorName" in data,
  );
}

function isReportModalData(data: ModalState["data"]): data is ModalReportData {
  return Boolean(
    data &&
    typeof data === "object" &&
    "targetType" in data &&
    data.targetType === "post" &&
    "targetId" in data,
  );
}

function normalizePostType(type: CommunityPostType): DetailPostType {
  switch (type) {
    case "pergunta":
    case "discussao":
    case "recomendacao":
    case "enquete":
    case "achados":
    case "favor":
    case "desapego":
    case "alerta":
    case "classificado":
    case "civic_report":
      return type;
    case "post":
    case "evento":
      return "discussao";
    default:
      return "discussao";
  }
}

function normalizePostDetailData(post: CommunityPost): PostDetailData {
  const neighborhood =
    typeof post.location === "string"
      ? post.location
      : (post.location?.name ?? "");

  return {
    id: post.id,
    author_profile_id: post.author_profile_id,
    author_name: post.author_name,
    author_avatar: post.author_avatar,
    type: normalizePostType(post.type as CommunityPostType),
    content: post.content,
    images: post.images,
    poll: post.poll as Poll | undefined,
    tags: post.tags,
    city: "",
    neighborhood,
    rua: "",
    created_at: post.created_at,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    is_liked: post.is_liked,
    is_saved: post.is_saved,
    is_verified: post.is_verified,
  };
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
  onSubmitReport,
  onTagClick,
  canComment = true,
  commentBlockedMessage,
}: CommunityModalsProps) {
  const commentData = isCommentModalData(modalState.data)
    ? modalState.data
    : null;
  const reportData = isReportModalData(modalState.data)
    ? modalState.data
    : null;
  const detailPostData = postData ? normalizePostDetailData(postData) : null;

  return (
    <AnimatePresence>
      {modalState.type === "comment" ? (
        <Suspense fallback={null}>
          <CommentsModal
            open={true}
            onOpenChange={onCloseModal}
            postId={commentData?.postId ?? ""}
            postAuthorId={commentData?.authorProfileId ?? ""}
            postAuthorName={commentData?.authorName ?? "Autor"}
            currentUserId={profileId}
            canComment={canComment}
            commentBlockedMessage={commentBlockedMessage}
          />
        </Suspense>
      ) : null}

      {postId && detailPostData && !isLoadingPost ? (
        <Suspense fallback={null}>
          <PostDetailModal
            isOpen={true}
            onClose={onClosePostDetail}
            post={detailPostData}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onReport={onReport}
            onTagClick={onTagClick}
            canComment={canComment}
            commentBlockedMessage={commentBlockedMessage}
          />
        </Suspense>
      ) : null}

      <ReportReasonDialog
        open={modalState.type === "report" && Boolean(reportData)}
        onOpenChange={(open) => {
          if (!open) onCloseModal();
        }}
        contentLabel="publicacao"
        reasonOptions={COMMUNITY_REPORT_REASON_OPTIONS}
        onSubmit={onSubmitReport}
      />
    </AnimatePresence>
  );
}
