/**
 * useComunidadePage - Hook principal da página de comunidade
 * 
 * âœ… SSOT - Usa Services via hooks especializados
 * âœ… Performance - Callbacks memoizados
 * âœ… Type Safety - Interfaces tipadas
 * Geographic Foundation - Integrado com fundação geográfica
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCommunityFiltersAAA } from "@/core/community/hooks/useCommunityFiltersAAA";
import { usePostActions } from "@/core/posts/hooks";
import { useSessionContext } from "@/core/session";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { usePostById } from "@/core/community/hooks/usePostById";
import { useCommunityLocation } from "@/core/community/hooks/useCommunityLocation";
import { postService } from "@/core/posts/services";
import { logger } from "@/shared/utils/logger";
import type { PostType } from "@/core/posts/types/Post";

interface ModalState {
  type: "comment" | "post" | "unified" | "report" | "create" | null;
  data:
    | null
    | { defaultType: string }
    | { post: string }
    | { postId: string; authorProfileId: string; authorName: string }
    | { type: "civic_report"; reportId: string }
    | {
        editPostId: string;
        initialContent: string;
        initialType: PostType;
        initialReach: "street" | "neighborhood" | "city";
      };
}

interface CommunityActorProfile {
  id: string;
  user_id: string;
  userId: string;
  display_name: string;
  displayName: string;
  city: string | null;
  neighborhood: string | null;
  location_id: string | null;
  locationId: string | null;
  verified: boolean;
  profile_type: string | null;
}

function toCommunityActorProfile(input: unknown): CommunityActorProfile | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;

  const id = typeof record.id === "string" ? record.id : null;
  const userId =
    (typeof record.user_id === "string" && record.user_id) ||
    (typeof record.userId === "string" && record.userId) ||
    null;
  if (!id || !userId) return null;

  const displayName =
    (typeof record.display_name === "string" && record.display_name) ||
    (typeof record.displayName === "string" && record.displayName) ||
    (typeof record.name === "string" && record.name) ||
    "Usuario";

  const city =
    (typeof record.city === "string" && record.city) ||
    null;
  const neighborhood =
    (typeof record.neighborhood === "string" && record.neighborhood) ||
    null;
  const locationId =
    (typeof record.locationId === "string" ? record.locationId : null) ??
    (typeof record.location_id === "string" ? record.location_id : null);
  const verified = typeof record.verified === "boolean" ? record.verified : false;
  const profileType =
    (typeof record.profile_type === "string" && record.profile_type) ||
    (typeof record.profileType === "string" && record.profileType) ||
    null;

  return {
    id,
    user_id: userId,
    userId,
    display_name: displayName,
    displayName,
    city,
    neighborhood,
    location_id: locationId,
    locationId,
    verified,
    profile_type: profileType,
  };
}

export function useComunidadePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { setTagFilter, immediateFilters, setLocationScope } = useCommunityFiltersAAA();
  const { likePost, savePost, sharePost, reportPost, deletePost, isDeleting } = usePostActions();
  const { activeProfile: sessionProfile } = useSessionContext();
  const { effectiveProfile } = useMultiProfileContext();
  const profile = toCommunityActorProfile(effectiveProfile ?? sessionProfile);
  
  // Integração com fundação geográfica
  const communityLocation = useCommunityLocation();

  const postId = searchParams.get("post");
  const { data: postData, isLoading: isLoadingPost } = usePostById(postId);

  const handleOpenCreatePost = useCallback((defaultType?: string) => {
    const hasProfileLocation = Boolean(profile?.locationId ?? profile?.location_id);
    const canCreatePost = communityLocation.canCreateContent || hasProfileLocation;

    // Verificar se pode criar conteúdo
    if (!canCreatePost) {
      toast.error("Selecione uma localizacao no filtro ou atualize seu bairro no perfil");
      return;
    }

    setModalState({ type: "create", data: { defaultType: defaultType || "discussao" } });
  }, [communityLocation.canCreateContent, profile?.location_id, profile?.locationId]);

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
    reportPost({
      postId,
      reason: "inappropriate_content",
      description: "Denuncia enviada pelo fluxo da comunidade",
    });
  }, [reportPost]);

  const handleDeletePost = useCallback((postId: string) => {
    setDeletePostId(postId);
  }, []);

  const handleCancelDeletePost = useCallback(() => {
    if (!isDeleting) setDeletePostId(null);
  }, [isDeleting]);

  const handleConfirmDeletePost = useCallback(() => {
    if (!deletePostId) return;
    deletePost(deletePostId, {
      onSettled: () => setDeletePostId(null),
    });
  }, [deletePost, deletePostId]);

  const handleEditPost = useCallback(async (postId: string) => {
    try {
      const post = await postService.getPostById(postId);
      if (!post) {
        toast.error("Post nao encontrado");
        return;
      }

      setModalState({
        type: "create",
        data: {
          editPostId: postId,
          initialContent: post.content ?? "",
          initialType: (post.type as PostType) ?? "discussao",
          initialReach: (post.reach as "street" | "neighborhood" | "city") ?? "neighborhood",
        },
      });
    } catch (error) {
      logger.error("Error opening edit post modal", error as Error, { postId });
      toast.error("Nao foi possivel abrir edicao do post");
    }
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
