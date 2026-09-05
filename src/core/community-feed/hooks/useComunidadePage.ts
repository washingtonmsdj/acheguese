/**
 * useComunidadePage - Hook principal da página de comunidade
 *
 * SSOT - Usa services via hooks especializados
 * Performance - Callbacks memoizados
 * Type safety - Interfaces tipadas
 * Geographic Foundation - Integrado com fundação geográfica
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCommunityFilters } from "@/core/community-feed/hooks/useFeedFilters";
import { usePostActions } from "@/core/posts/hooks";
import { useModeration } from "@/core/community/hooks/useModeration";
import { useSessionContext } from "@/core/session";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { usePostById } from "@/core/community/hooks/usePostById";
import { useCommunityLocation } from "@/core/community/hooks/useCommunityLocation";
import { postService } from "@/core/posts/services";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { logger } from "@/shared/utils/logger";
import type { PostType } from "@/core/posts/types/Post";
import type { UnifiedPost } from "@/shared/types/posts";
import type { CommunityReportReason } from "@/core/moderation";

export interface ModalCommentData {
  postId: string;
  authorProfileId: string;
  authorName: string;
}

export type CreatePostModalData =
  | { defaultType: PostType }
  | {
      editPostId: string;
      initialContent: string;
      initialType: PostType;
      initialReach: "street" | "neighborhood" | "city";
    };

export interface ModalReportData {
  targetType: "post";
  targetId: string;
}

export interface ModalState {
  type: "comment" | "post" | "report" | "create" | null;
  data:
    | null
    | CreatePostModalData
    | { post: string }
    | ModalCommentData
    | ModalReportData;
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

interface CommunityActorProfileInput {
  id?: string | null;
  user_id?: string | null;
  userId?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  name?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  location_id?: string | null;
  locationId?: string | null;
  verified?: boolean;
  profile_type?: string | null;
  profileType?: string | null;
}

interface CommunityOpportunityPayload {
  vaga?: Record<string, unknown>;
}

function toCommunityActorProfile(input: unknown): CommunityActorProfile | null {
  if (!input || typeof input !== "object") return null;
  const record = input as CommunityActorProfileInput;

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
    "Usuário";

  const city = (typeof record.city === "string" && record.city) || null;
  const neighborhood =
    (typeof record.neighborhood === "string" && record.neighborhood) || null;
  const locationId =
    (typeof record.locationId === "string" ? record.locationId : null) ??
    (typeof record.location_id === "string" ? record.location_id : null);
  const verified =
    typeof record.verified === "boolean" ? record.verified : false;
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
  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    data: null,
  });
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const { setTagFilter, immediateFilters, setLocationScope } =
    useCommunityFilters();
  const { likePost, savePost, sharePost, deletePost, isDeleting } =
    usePostActions();
  const { reportPostAsync } = useModeration();
  const { activeProfile: sessionProfile } = useSessionContext();
  const { effectiveProfile } = useMultiProfileContext();
  const profile = toCommunityActorProfile(effectiveProfile ?? sessionProfile);

  // Integração com fundação geográfica
  const communityLocation = useCommunityLocation();

  const postId = searchParams.get("post");
  const { data: postData, isLoading: isLoadingPost } = usePostById(postId);
  const openPostDetail = useCallback(
    (nextPostId: string) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.set("post", nextPostId);
        return next;
      });
    },
    [setSearchParams],
  );

  const handleOpenCreatePost = useCallback(
    (defaultType?: PostType) => {
      const hasProfileLocation = Boolean(profile?.locationId);
      const canCreatePost =
        communityLocation.hasActiveLocation || hasProfileLocation;

      // Verificar se pode criar conteúdo
      if (!canCreatePost) {
        toast.error(
          "Selecione uma localização no filtro ou atualize seu bairro no perfil",
        );
        return;
      }

      setModalState({
        type: "create",
        data: { defaultType: defaultType ?? "discussao" },
      });
    },
    [communityLocation, profile?.locationId],
  );

  const handlePostClick = useCallback(
    async (postId: string, post?: UnifiedPost) => {
      try {
        const vagaPayloadRoot =
          post?.content_payload && typeof post.content_payload === "object"
            ? (post.content_payload as CommunityOpportunityPayload)
            : null;
        const vagaPayload =
          vagaPayloadRoot && typeof vagaPayloadRoot.vaga === "object"
            ? vagaPayloadRoot.vaga
            : null;
        if (post?.content_intent === "vaga" || vagaPayload) {
          openPostDetail(postId);
          return;
        }

        const mayContainOpportunity =
          post?.content_intent === "oportunidade" ||
          post?.display_format === "opportunity_card" ||
          Boolean(post?.content_payload);
        if (mayContainOpportunity && !isLaunchSurfaceEnabled("jobs")) {
          openPostDetail(postId);
          return;
        }
      } catch (error) {
        logger.warn(
          "Falha ao resolver detalhe de oportunidade pelo feed",
          error as Error,
        );
      }

      openPostDetail(postId);
    },
    [openPostDetail],
  );

  const handleClosePostDetail = useCallback(
    () =>
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete("post");
        return next;
      }),
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
    setModalState({
      type: "report",
      data: { targetType: "post", targetId: postId },
    });
  }, []);

  const handleSubmitPostReport = useCallback(
    async (reason: CommunityReportReason, description?: string) => {
      if (
        modalState.type !== "report" ||
        !modalState.data ||
        !("targetType" in modalState.data) ||
        modalState.data.targetType !== "post"
      ) {
        return;
      }

      await reportPostAsync({
        postId: modalState.data.targetId,
        reason,
        description,
      });
    },
    [modalState, reportPostAsync],
  );

  const handleDeletePost = useCallback((postId: string) => {
    setDeletePostId(postId);
  }, []);

  const handleCancelDeletePost = useCallback(() => {
    if (!isDeleting) setDeletePostId(null);
  }, [isDeleting]);

  const handleConfirmDeletePost = useCallback(() => {
    if (!deletePostId) return;
    deletePost(deletePostId);
    setDeletePostId(null);
  }, [deletePost, deletePostId]);

  const handleEditPost = useCallback(async (postId: string) => {
    try {
      const post = await postService.getPostById(postId);
      if (!post) {
        toast.error("Post não encontrado");
        return;
      }

      setModalState({
        type: "create",
        data: {
          editPostId: postId,
          initialContent: post.content ?? "",
          initialType: (post.type as PostType) ?? "discussao",
          initialReach:
            (post.reach as "street" | "neighborhood" | "city") ??
            "neighborhood",
        },
      });
    } catch (error) {
      logger.error("Error opening edit post modal", error as Error, { postId });
      toast.error("Não foi possível abrir edição do post");
    }
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
    immediateFilters,
    likePost,
    savePost,
    sharePost,
    setLocationScope,
    handleOpenCreatePost,
    handlePostClick,
    handleClosePostDetail,
    handleCommentClick,
    handleTagClick,
    handleReportPost,
    handleSubmitPostReport,
    handleDeletePost,
    handleCancelDeletePost,
    handleConfirmDeletePost,
    handleEditPost,
    handleCloseModal,
    deletePostDialogOpen: Boolean(deletePostId),
    isDeletingPost: isDeleting,

    // Integração com fundação geográfica
    communityLocation,
  };
}
