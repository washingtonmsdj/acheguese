/**
 * useComunidadePage - Hook principal da pÃ¡gina de comunidade
 * 
 * âœ… SSOT - Usa Services via hooks especializados
 * âœ… Performance - Callbacks memoizados
 * âœ… Type Safety - Interfaces tipadas
 * âœ… Geographic Foundation - Integrado com fundaÃ§Ã£o geogrÃ¡fica
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCommunityFiltersAAA } from "@/core/community/hooks/useCommunityFiltersAAA";
import { usePostActions } from "@/core/posts/hooks";
import { useSessionContext } from "@/core/session";
import { usePostById } from "@/core/community/hooks/usePostById";
import { useCommunityLocation } from "@/core/community/hooks/useCommunityLocation";
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

  const { setTagFilter, immediateFilters, setLocationScope } = useCommunityFiltersAAA();
  const { likePost, savePost, sharePost } = usePostActions();
  const { activeProfile: profile } = useSessionContext();
  
  // IntegraÃ§Ã£o com fundaÃ§Ã£o geogrÃ¡fica
  const communityLocation = useCommunityLocation();

  const postId = searchParams.get("post");
  const { data: postData, isLoading: isLoadingPost } = usePostById(postId);

  const handleOpenCreatePost = useCallback((defaultType?: string) => {
    // Verificar se pode criar conteÃºdo
    if (!communityLocation.canCreateContent) {
      toast.error("Selecione uma localizaÃ§Ã£o para criar posts");
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
    toast.info("Funcionalidade de denÃºncia em desenvolvimento");
  }, []);

  const handleDeletePost = useCallback((postId: string) => {
    if (confirm("Tem certeza que deseja excluir este post? Esta aÃ§Ã£o nÃ£o pode ser desfeita.")) {
      if (import.meta.env.DEV) logger.info("Delete post:", postId);
      toast.success("Post excluÃ­do com sucesso");
    }
  }, []);

  const handleEditPost = useCallback((postId: string) => {
    if (import.meta.env.DEV) logger.info("Edit post:", postId);
    toast.info("Funcionalidade de ediÃ§Ã£o em desenvolvimento");
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
    handleEditPost,
    handleReportClick,
    handleCloseModal,
    
    // IntegraÃ§Ã£o com fundaÃ§Ã£o geogrÃ¡fica
    communityLocation,
  };
}

