/**
 * useComunidadePage - Hook principal da página de comunidade
 * 
 * SSOT - Usa services via hooks especializados
 * Performance - Callbacks memoizados
 * Type safety - Interfaces tipadas
 * Geographic Foundation - Integrado com fundação geográfica
 */

import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCommunityFiltersAAA } from "@/core/community/hooks/useCommunityFiltersAAA";
import { usePostActions } from "@/core/posts/hooks";
import { useSessionContext } from "@/core/session";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { usePostById } from "@/core/community/hooks/usePostById";
import { useCommunityLocation } from "@/core/community/hooks/useCommunityLocation";
import { postService } from "@/core/posts/services";
import { jobPublicRoutes } from "@/core/verticals/jobs/routes/jobPublicRoutes";
import { extractOpportunityPayload } from "@/core/work-opportunities/utils/opportunityPayload";
import { workOpportunitiesService } from "@/core/work-opportunities/services/WorkOpportunitiesService";
import { workOpportunityTelemetryService } from "@/core/work-opportunities/services/WorkOpportunityTelemetryService";
import { logger } from "@/shared/utils/logger";
import type { PostType } from "@/core/posts/types/Post";
import type { UnifiedPost } from "@/shared/types/posts";

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
    "Usuário";

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
  const navigate = useNavigate();
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
  const communityLocation = useCommunityLocation() as any;

  const postId = searchParams.get("post");
  const { data: postData, isLoading: isLoadingPost } = usePostById(postId);

  const handleOpenCreatePost = useCallback((defaultType?: string) => {
    const hasProfileLocation = Boolean(profile?.locationId ?? profile?.location_id);
    const canCreatePost = Boolean(communityLocation.canCreateContent) || hasProfileLocation;

    // Verificar se pode criar conteúdo
    if (!canCreatePost) {
      toast.error("Selecione uma localização no filtro ou atualize seu bairro no perfil");
      return;
    }

    setModalState({ type: "create", data: { defaultType: defaultType || "discussao" } });
  }, [communityLocation, profile?.location_id, profile?.locationId]);

  const handleOpenAlertModal = useCallback(() => setAlertModalOpen(true), []);
  const handleCloseAlertModal = useCallback(() => setAlertModalOpen(false), []);

  const handleOpenIssueModal = useCallback(() => setIssueModalOpen(true), []);
  const handleCloseIssueModal = useCallback(() => setIssueModalOpen(false), []);

  const handlePostClick = useCallback(
    async (postId: string, post?: UnifiedPost) => {
      try {
        const vagaPayloadRoot =
          post?.content_payload && typeof post.content_payload === "object"
            ? (post.content_payload as Record<string, unknown>)
            : null;
        const vagaPayload =
          vagaPayloadRoot && typeof vagaPayloadRoot.vaga === "object"
            ? (vagaPayloadRoot.vaga as Record<string, unknown>)
            : null;
        const vagaTargetUrl =
          (vagaPayload && typeof vagaPayload.target_url === "string" && vagaPayload.target_url) ||
          null;
        const vagaId =
          (vagaPayload && typeof vagaPayload.id === "string" && vagaPayload.id) ||
          null;

        if (post?.content_intent === "vaga" || vagaPayload) {
          if (vagaTargetUrl) {
            navigate(vagaTargetUrl);
            return;
          }
          if (vagaId) {
            navigate(jobPublicRoutes.home());
            return;
          }
        }

        const opportunityPayload = extractOpportunityPayload(post?.content_payload);
        if (opportunityPayload?.id) {
          void workOpportunityTelemetryService.trackOpportunityClick({
            opportunityId: opportunityPayload.id,
            professionalId: opportunityPayload.professional_id,
            territoryLocationId: opportunityPayload.territory_location_id,
            source: "feed",
            actorProfileId: profile?.id,
            actorUserId: profile?.user_id ?? profile?.userId ?? null,
            metadata: {
              click_path: "feed_card_payload",
              post_id: postId,
            },
          });
          void workOpportunityTelemetryService.trackOpportunityOpen({
            opportunityId: opportunityPayload.id,
            professionalId: opportunityPayload.professional_id,
            territoryLocationId: opportunityPayload.territory_location_id,
            source: "feed",
            actorProfileId: profile?.id,
            actorUserId: profile?.user_id ?? profile?.userId ?? null,
            metadata: {
              open_path: "feed_card_payload",
              post_id: postId,
            },
          });
          navigate(`/oportunidades/${opportunityPayload.id}?source=feed`);
          return;
        }

        if (post?.content_intent === "oportunidade" || post?.display_format === "opportunity_card") {
          const opportunity = await workOpportunitiesService.getOpportunityByPostId(postId);
          if (opportunity?.id) {
            void workOpportunityTelemetryService.trackOpportunityClick({
              opportunityId: opportunity.id,
              professionalId: opportunity.professional_id ?? null,
              territoryLocationId: opportunity.territory_location_id,
              source: "feed",
              actorProfileId: profile?.id,
              actorUserId: profile?.user_id ?? profile?.userId ?? null,
              metadata: {
                click_path: "feed_card_post_lookup",
                post_id: postId,
              },
            });
            void workOpportunityTelemetryService.trackOpportunityOpen({
              opportunityId: opportunity.id,
              professionalId: opportunity.professional_id ?? null,
              territoryLocationId: opportunity.territory_location_id,
              source: "feed",
              actorProfileId: profile?.id,
              actorUserId: profile?.user_id ?? profile?.userId ?? null,
              metadata: {
                open_path: "feed_card_post_lookup",
                post_id: postId,
              },
            });
            navigate(`/oportunidades/${opportunity.id}?source=feed`);
            return;
          }
        }
      } catch (error) {
        logger.warn("Falha ao resolver detalhe de oportunidade pelo feed", error as Error);
      }

      setSearchParams({ post: postId });
    },
    [navigate, profile?.id, profile?.userId, profile?.user_id, setSearchParams],
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
      description: "Denúncia enviada pelo fluxo da comunidade",
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
          initialReach: (post.reach as "street" | "neighborhood" | "city") ?? "neighborhood",
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
    handleCloseModal,
    deletePostDialogOpen: Boolean(deletePostId),
    isDeletingPost: isDeleting,
    
    // Integração com fundação geográfica
    communityLocation,
  };
}
