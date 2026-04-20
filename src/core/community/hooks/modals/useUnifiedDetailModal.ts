import { useState } from "react";
import { usePostInteractions } from "../posts/usePostInteractions";
import { useCivicReportById } from "../useCivicReports";
import { logger } from "@/shared/utils/logger";

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
  const [commentText, setCommentText] = useState("");

  const isPost = content.type === "post";
  const civicReportId =
    content.type === "civic_report" ? content.reportId : null;
  const postData = isPost
    ? (((content as any).data || (content as any).date) as CommunityPost)
    : null;

  // Hooks para civic reports
  const { data: civicReportData, isLoading: isLoadingReport } =
    useCivicReportById(civicReportId);

  // Hook de interações para posts
  const { state, isProcessing, handleLike, handleSave, handleShare } =
    usePostInteractions(postData?.id || "", {
      isLiked: postData?.is_liked || false,
      isSaved: postData?.is_saved || false,
      likesCount: postData?.likes_count || 0,
    });

  // Dados unificados
  const id = postData?.id || civicReportData?.id || "";
  const authorName =
    postData?.author_name ||
    (civicReportData as any)?.profile?.name ||
    "Usuário";
  const authorAvatar =
    postData?.author_avatar || (civicReportData as any)?.profile?.avatar_url;
  const createdAt = postData?.created_at || civicReportData?.created_at || "";
  const description =
    postData?.content || (civicReportData as any)?.description || "";
  const location = postData
    ? `${postData.neighborhood}, ${postData.city}`
    : (civicReportData as any)?.location || "";
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    if (isPost) {
      if (import.meta.env.DEV) {
        logger.info("Comentário para post:", id);
      }
      setCommentText("");
    } else if (civicReportId) {
      // TODO: Implementar criação de comentário para civic report
      if (import.meta.env.DEV) {
        logger.info("Comentário para civic report:", civicReportId);
      }
      setCommentText("");
    }
  };

  const handleUpvoteReport = () => {
    if (civicReportId) {
      // TODO: Implementar upvote para civic report
      if (import.meta.env.DEV) {
        logger.info("Upvote para civic report:", civicReportId);
      }
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
