/**
 * useComunidadePage - Hook principal da página de comunidade
 * 
 * ✅ SSOT - Usa Services via hooks especializados
 * ✅ Performance - Callbacks memoizados
 * ✅ Type Safety - Interfaces tipadas
 * ✅ Geographic Foundation - Integrado com fundação geográfica
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCommunityFiltersAAA } from "@/modules/community/hooks/useCommunityFiltersAAA";
import { usePostActions } from "@/core/posts/hooks";
import { useSessionContext } from "@/core/session";
import { usePostById } from "@/modules/community/hooks/usePostById";
import { useCommunityLocation } from "@/modules/community/hooks/useCommunityLocation";
import { logger } from "@/shared/utils/logger";

interface ModalState {
  type: "comment" | "post" | "unified" | "report" | "create" | null;
  data: any;
}

export function useComunidadePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { setTagFilter, immediateFilters, setLocationScope } = useCommunityFiltersAAA();
  const { likePost, savePost, sharePost, deletePost, isDeleting } = usePostActions();
  const { activeProfile: profile } = useSessionContext();
  
  // Integração com fundação geográfica
  const communityLocation = useCommunityLocation();

  const postId = searchParams.get("post");
  const { data: postData, isLoading: isLoadingPost } = usePostById(postId);

  const handleOpenCreatePost = useCallback((defaultType?: string) => {
    // Verificar se pode criar conteúdo
    if (!communityLocation.canCreateContent) {
      toast.error("Selecione uma localização para criar posts");
      return;
    }

    setModalState({ type: "create", data: { defaultType: defaultType || "discussao" } });
  }, [communityLocation.canCreateContent]);

  const handleOpenAlertModal = useCallback(() => setAlertModalOpen(true), []);
  const handleCloseAlertModal = useCallback(() => setAlertModalOpen(false), []);

  const handleOpenIssueModal = useCallback(() => setIssueModalOpen(true), []);
  const handleCloseIssueModal = useCallback(() => setIssueModalOpen(false), []);

  const handlePostClick = useCallback(
    (postId: string) => setSearchParams({ post: postId }),
    [setSearchParams],
  );

  const handleClosePostDetail = useCallback(
    () => setSearchParams({}),
    [setSearchParams],
  );

  const handleCommentClick = useCallback(
    (postId: string, authorProfileId?: string, authorName?: string) => {
      setModalState({
        type: "comment",
        data: {
          postId,
          authorProfileId: authorProfileId || "",
          authorName: authorName || "Autor",
        },
      });
    },
    [],
  );

  const handleTagClick = useCallback(
    (tag: string) => setTagFilter(tag),
    [setTagFilter],
  );

  const handleReportPost = useCallback((postId: string) => {
    if (import.meta.env.DEV) logger.info("Report post:", postId);
    toast.info("Funcionalidade de denúncia em desenvolvimento");
  }, []);

  const handleDeletePost = useCallback((postId: string) => {
    setDeletePostId(postId);
  }, []);

  const handleCancelDeletePost = useCallback(() => {
    if (!isDeleting) setDeletePostId(null);
  }, [isDeleting]);

  const handleConfirmDeletePost = useCallback(() => {
    if (!deletePostId) return;

    if (import.meta.env.DEV) logger.info("Delete post:", deletePostId);
    deletePost(deletePostId, {
      onSettled: () => setDeletePostId(null),
    });
  }, [deletePost, deletePostId]);

  const handleEditPost = useCallback((postId: string) => {
    if (import.meta.env.DEV) logger.info("Edit post:", postId);
    toast.info("Funcionalidade de edição em desenvolvimento");
  }, []);

  const handleReportClick = useCallback((reportId: string) => {
    setModalState({ type: "unified", data: { type: "civic_report" as const, reportId } });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ type: null, data: null });
  }, []);

  return {
    profile,
    postId,
    postData,
    isLoadingPost,
    modalState,
    alertModalOpen,
    issueModalOpen,
    immediateFilters,
    likePost,
    savePost,
    sharePost,
    setLocationScope,
    handleOpenCreatePost,
    handleOpenAlertModal,
    handleCloseAlertModal,
    handleOpenIssueModal,
    handleCloseIssueModal,
    handlePostClick,
    handleClosePostDetail,
    handleCommentClick,
    handleTagClick,
    handleReportPost,
    handleDeletePost,
    handleCancelDeletePost,
    handleConfirmDeletePost,
    handleEditPost,
    handleReportClick,
    handleCloseModal,
    deletePostDialogOpen: Boolean(deletePostId),
    isDeletingPost: isDeleting,
    
    // Integração com fundação geográfica
    communityLocation,
  };
}
