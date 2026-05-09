import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePostInteractions } from "../posts/usePostInteractions";
import { useCivicReportById } from "../useCivicReports";
import { logger } from "@/shared/utils/logger";
import { useSessionContext } from "@/core/session";
import { CivicReportService } from "@/core/community/services/CivicReportService";
import { commentService } from "@/core/comments/services/CommentService";

interface CommunityPost {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  type: string;
  content: string;
  images?: string[];
  poll?: any;
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

type UnifiedContent =
  | { type: "post"; date: CommunityPost; data?: CommunityPost }
  | { type: "civic_report"; reportId: string };

export const useUnifiedDetailModal = (content: UnifiedContent) => {
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const isPost = content.type === "post";
  const civicReportId =
    content.type === "civic_report" ? content.reportId : null;
  const postData = isPost
    ? (((content as any).data || (content as any).date) as CommunityPost)
    : null;

  const { data: civicReportData, isLoading: isLoadingReport } =
    useCivicReportById(civicReportId);

  const { state, isProcessing, handleLike, handleSave, handleShare } =
    usePostInteractions(postData?.id || "", {
      isLiked: postData?.is_liked || false,
      isSaved: postData?.is_saved || false,
      likesCount: postData?.likes_count || 0,
    });

  const id = postData?.id || civicReportData?.id || "";
  const authorName =
    postData?.author_name ||
    (civicReportData as any)?.profile?.name ||
    "Usuario";
  const authorAvatar =
    postData?.author_avatar || (civicReportData as any)?.profile?.avatar_url;
  const createdAt = postData?.created_at || civicReportData?.created_at || "";
  const description =
    postData?.content || (civicReportData as any)?.description || "";
  const location = postData
    ? `${postData.neighborhood}, ${postData.city}`
    : (civicReportData as any)?.location || "";

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !activeProfile?.id) return;

    try {
      if (isPost && postData?.id) {
        await commentService.createComment({
          post_id: postData.id,
          author_profile_id: activeProfile.id,
          content: commentText.trim(),
        });
      } else if (civicReportId) {
        await CivicReportService.createComment(
          civicReportId,
          activeProfile.id,
          commentText.trim(),
        );
        await queryClient.invalidateQueries({
          queryKey: ["civic-report", civicReportId],
        });
      }

      setCommentText("");
    } catch (error) {
      logger.error("Error submitting unified comment:", error);
    }
  };

  const handleUpvoteReport = async () => {
    if (!civicReportId) return;

    try {
      await CivicReportService.upvoteReport(civicReportId);
      await queryClient.invalidateQueries({
        queryKey: ["civic-report", civicReportId],
      });
    } catch (error) {
      logger.error("Error upvoting civic report:", error);
    }
  };

  return {
    commentText,
    setCommentText,
    isPost,
    isLoadingReport,
    id,
    authorName,
    authorAvatar,
    createdAt,
    description,
    location,
    civicReportData,
    state,
    isProcessing,
    handleLike,
    handleSave,
    handleShare,
    handleUpvoteReport,
    handleSubmitComment,
  };
};
