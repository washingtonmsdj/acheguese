import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";

/**
 * ✅ SSOT COMPLIANT - Hook useCommunityModals migrado
 * Usa useAppUrls para navegação (sem hardcoded URLs)
 */

type SelectedContent = { type: "civic_report"; reportId: string } | null;

export function useCommunityModals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const appUrls = useAppUrls();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<SelectedContent>(null);

  const postId = searchParams.get("post");
  const isPostDetailOpen = !!postId;

  const handleOpenCreatePost = useCallback(
    (navigate: (path: string) => void) => {
      navigate(appUrls.community.newPost);
    },
    [appUrls],
  );

  const handlePostClick = useCallback(
    (postId: string) => {
      setSearchParams({ post: postId });
    },
    [setSearchParams],
  );

  const handleClosePostDetail = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handleCommentClick = useCallback((postId: string) => {
    setCommentPostId(postId);
  }, []);

  const handleReportClick = useCallback((reportId: string) => {
    setSelectedContent({
      type: "civic_report" as const,
      reportId: reportId,
    });
  }, []);

  const handleCloseUnifiedModal = useCallback(() => {
    setSelectedContent(null);
  }, []);

  const closeAllModals = useCallback(() => {
    setIsSearchOpen(false);
    setIsQuickReportOpen(false);
    setCommentPostId(null);
    setSelectedContent(null);
    if (isPostDetailOpen) handleClosePostDetail();
  }, [isPostDetailOpen, handleClosePostDetail]);

  return {
    // State
    isSearchOpen,
    isQuickReportOpen,
    commentPostId,
    selectedContent,
    postId,
    isPostDetailOpen,

    // Setters
    setIsSearchOpen,
    setIsQuickReportOpen,
    setCommentPostId,

    // Handlers
    handleOpenCreatePost,
    handlePostClick,
    handleClosePostDetail,
    handleCommentClick,
    handleReportClick,
    handleCloseUnifiedModal,
    closeAllModals,
  };
}
