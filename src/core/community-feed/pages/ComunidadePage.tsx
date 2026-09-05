/**
 * ComunidadePage - PÃ¡gina principal da comunidade
 *
 * SSOT - Usa Services via hooks
 * Arquitetura modular - Componentes isolados
 * Performance - Lazy loading e memoizaÃ§Ã£o
 * Acessibilidade - ARIA labels e roles
 */

import React, { lazy, Suspense, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
import { useAppUrls } from "@/core/routing/hooks";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { residenceService } from "@/core/residence/services/ResidenceService";
import {
  CommunityPortalGate,
  useCommunityAccess,
  type CommunityAction,
} from "@/core/community-experience/access";
import {
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
  type CommunityDiscoveryTab,
} from "@/core/community/utils/communityFeedTab";
import {
  useComunidadePage,
  type CreatePostModalData,
} from "@/core/community/hooks/page/useComunidadePage";
import { CommunityFeed } from "@/core/community-feed/components/CommunityFeed";
import { LocationScopeCards } from "@/core/community/components/page/LocationScopeCards";
import { CommunityFloatingButtons } from "@/core/community/components/page/CommunityFloatingButtons";
import { CommunityModals } from "@/core/community/components/page/CommunityModals";
import { CommunityOverviewSurface } from "@/core/community/components/page/CommunityOverviewSurface";
import {
  isCommunityOverviewView,
  isCommunitySocialView,
  type CommunityOverviewView,
} from "@/core/community/components/page/communityOverviewNavigation";
import { CreatePostModal } from "@/core/community-feed/components/CreatePostModal";
import { VerificationBanner } from "@/core/verification";
import { COMMUNITY_PAGE_COPY } from "@/core/community/utils/communityCopy";
import { resolveCommunityFeedTerritoryFilter } from "@/core/community/utils/resolveCommunityFeedTerritoryFilter";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";
import type { TerritorialFeedChannel } from "@/core/community-feed/hooks/territorialFeedEngine";
import { withQueryParams } from "@/core/landing/utils/landingPresentation";
import { usePersistedCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
import { isPersistedCommunityId } from "@/core/community-experience/types";
import { resolveCommunitySurfaceState } from "@/core/community-experience/policies/CommunitySurfacePolicy";
import { CommunityAvailabilityState } from "@/core/community/components/page/CommunityAvailabilityState";
import { TerritoryTopbar } from "@/shared/components/territory-vivo/TerritoryTopbar";
import { useUnifiedNotifications } from "@/core/notifications/useUnifiedNotifications";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import {
  MODULE_SLUGS,
  buildCommunityTerritoryUrl,
  buildModuleTerritoryUrl,
} from "@/core/routing/utils/territoryUrls";
import { SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG } from "@/core/community/config/communityLaunch";

const GruposPage = lazy(() => import("@/core/community-groups/pages/GruposPage"));

interface ComunidadePageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

function getBlockedCommunityActionMessage(action: CommunityAction): string {
  switch (action) {
    case "comment":
      return "Comentar exige participacao ativa nesta comunidade.";
    case "react":
      return "Interagir no feed exige participacao ativa nesta comunidade.";
    case "save":
      return "Salvar publicacoes exige participacao ativa nesta comunidade.";
    case "send_message":
      return "Enviar mensagem exige participacao ativa nesta comunidade.";
    case "create_issue":
      return "Registrar problema local exige participacao ativa e residencia verificada neste territorio.";
    case "create_alert":
      return "Criar alerta exige participacao ativa e residencia verificada neste territorio.";
    case "create_post":
      return "Publicar na comunidade exige participacao ativa nesta comunidade.";
    case "join_group":
    case "create_group":
      return "Participar de grupos exige participacao ativa nesta comunidade.";
    case "report":
      return "Denunciar exige login e perfil ativo.";
    default:
      return "Esta acao exige acesso comunitario valido.";
  }
}

export default function ComunidadePage({
  resolved,
  activeMemberIds,
}: ComunidadePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeView: CommunityOverviewView | null = location.pathname.endsWith(
    "/grupos",
  )
    ? "groups"
    : location.pathname.endsWith("/feed")
      ? "feed"
      : null;
  const requestedTab =
    (searchParams.get("tab") as CommunityDiscoveryTab | null) ?? null;
  const requestedSection = searchParams.get("section");
  const requestedViewValue = searchParams.get("view");
  const requestedView = isCommunityOverviewView(requestedViewValue)
    ? requestedViewValue
    : null;
  const routeActiveView: CommunityOverviewView = requestedView
    ? requestedView
    : requestedSection === "discussions"
      ? "discussions"
      : (routeView ?? (requestedTab === "grupos" ? "groups" : "feed"));
  const activeView = routeActiveView;
  const feedHeaderFilter: TerritorialFeedChannel =
    resolveCommunityFeedChannelFromTab(requestedTab);
  const [showBanner, setShowBanner] = React.useState(true);
  const appUrls = useAppUrls(resolved); // SSOT URLs com contexto territorial
  const territorialContext = useTerritorialContextOptional();
  const { unreadCount } = useUnifiedNotifications();
  const moduleTerritory = useModuleTerritoryFilter({
    routeResolved: resolved,
    activeMemberIds,
  });
  const territoryFilter = moduleTerritory.territoryFilter;

  // SSOT: guarda de acesso por UUID canÃ´nico, nÃ£o por string de perfil
  const {
    homeDistrict,
    homeCity,
    loading: territoryLoading,
  } = useUserTerritory();
  const communityAccess = useCommunityAccess({
    resolved: resolved ?? null,
    activeMemberIds,
  });
  const communityProfileQuery = usePersistedCommunityProfile(resolved ?? null);
  const linkedCommunityId = isPersistedCommunityId(
    communityProfileQuery.data?.id,
  )
    ? communityProfileQuery.data.id
    : communityAccess.communityId;
  const setView = useCallback(
    (view: CommunityOverviewView) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete("section");
        if (view === "feed") {
          next.delete("view");
        } else {
          next.set("view", view);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const handleFeedHeaderFilterChange = useCallback(
    (filter: TerritorialFeedChannel) => {
      const tabParam = resolveCommunityFeedQueryTabFromChannel(filter);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!tabParam) {
          next.delete("tab");
        } else {
          next.set("tab", tabParam);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const {
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
    deletePostDialogOpen,
    isDeletingPost,
  } = useComunidadePage();
  const createPostModalData: CreatePostModalData | null =
    modalState.type === "create" &&
    modalState.data &&
    typeof modalState.data === "object" &&
    ("defaultType" in modalState.data || "editPostId" in modalState.data)
      ? modalState.data
      : null;
  const communityTerritoryFilter: TerritoryFilter = useMemo(
    () =>
      resolveCommunityFeedTerritoryFilter({
        baseFilter: territoryFilter,
        locationScope: immediateFilters.locationScope,
        resolved,
        homeCityId: homeCity?.id,
        homeDistrictId: homeDistrict?.id,
      }),
    [
      territoryFilter,
      immediateFilters.locationScope,
      resolved,
      homeCity?.id,
      homeDistrict?.id,
    ],
  );
  const { data: primaryResidence, isLoading: primaryResidenceLoading } =
    useQuery({
      queryKey: ["user-residence", "primary-with-relations", profile?.user_id],
      queryFn: async () => {
        if (!profile?.user_id) return null;
        return residenceService.getPrimaryResidenceWithRelations(
          profile.user_id,
        );
      },
      enabled: !!profile?.user_id,
      staleTime: 2 * 60 * 1000,
    });
  const primaryStreet = primaryResidence?.address?.street?.trim() ?? "";
  const hasPrimaryStreet = primaryStreet.length > 0;

  React.useEffect(() => {
    if (
      !primaryResidenceLoading &&
      immediateFilters.locationScope === "street" &&
      !hasPrimaryStreet
    ) {
      setLocationScope("neighborhood");
    }
  }, [
    hasPrimaryStreet,
    immediateFilters.locationScope,
    primaryResidenceLoading,
    setLocationScope,
  ]);

  const handleScopeChange = useCallback(
    (scope: "city" | "neighborhood" | "street") => {
      if (scope === "street" && !hasPrimaryStreet) {
        toast.info(COMMUNITY_PAGE_COPY.streetScopeMissingAddress);
        navigate(appUrls.profile.addresses);
        return;
      }

      if (scope === "street") {
        toast.info(COMMUNITY_PAGE_COPY.streetScopeBlocked);
        return;
      }

      setLocationScope(scope);
    },
    [appUrls.profile.addresses, hasPrimaryStreet, navigate, setLocationScope],
  );

  const territoryName =
    resolved?.kind === "group"
      ? resolved.group.name
      : resolved?.kind === "location"
        ? resolved.location.name
        : "comunidade";
  const territoryHomeHref = territorialContext?.baseUrl ?? "/ba/salvador";
  const communityBaseHref =
    territorialContext?.communityBaseUrl ??
    buildCommunityTerritoryUrl(territoryHomeHref);
  const communityInterestHref = communityProfileQuery.data
    ? `${communityBaseHref}/interesse`
    : undefined;
  const exploreHref = buildModuleTerritoryUrl(
    MODULE_SLUGS.search,
    territoryHomeHref,
  );
  const activeCommunityHref = buildCommunityTerritoryUrl(
    `/ba/salvador/${SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG}`,
  );
  const communitySurfaceState = resolveCommunitySurfaceState({
    profile: communityProfileQuery.data ?? null,
    isProfileLoading: communityProfileQuery.isLoading,
    isRolloutLoading: communityAccess.isCommunityAvailabilityLoading,
    isRolloutActive: communityAccess.isCommunityAvailable,
    hasError: Boolean(
      communityProfileQuery.error || communityAccess.communityAvailabilityError,
    ),
  });
  const territoryContextLabel =
    resolved?.kind === "group"
      ? "Community territorial de Salvador"
      : resolved?.kind === "location" && resolved.location.type === "city"
        ? "Community em nível de cidade"
        : "Community do território";
  const loginHref = useMemo(() => {
    const redirect = `${location.pathname}${location.search}`;
    return withQueryParams(appUrls.auth.login, { redirect });
  }, [appUrls.auth.login, location.pathname, location.search]);
  const handleRequireLogin = useCallback(() => {
    navigate(loginHref);
  }, [loginHref, navigate]);

  const resolveAccessActionHref = useCallback(() => {
    if (communityAccess.primaryAction === "login") return loginHref;
    if (
      communityAccess.primaryAction === "add_address" ||
      communityAccess.primaryAction === "verify_address"
    ) {
      return appUrls.profile.addresses;
    }
    if (communityAccess.primaryAction === "create_profile")
      return appUrls.profile.manage;
    return appUrls.community.feed;
  }, [
    appUrls.community.feed,
    appUrls.profile.addresses,
    appUrls.profile.manage,
    communityAccess.primaryAction,
    loginHref,
  ]);

  const handleBlockedCommunityAction = useCallback(
    (action: CommunityAction) => {
      toast.info(getBlockedCommunityActionMessage(action));
      navigate(resolveAccessActionHref());
    },
    [navigate, resolveAccessActionHref],
  );

  const handleOpenCreatePostWithAccess = useCallback(
    (defaultType?: Parameters<typeof handleOpenCreatePost>[0]) => {
      if (!communityAccess.can.create_post) {
        handleBlockedCommunityAction("create_post");
        return;
      }

      handleOpenCreatePost(defaultType);
    },
    [
      communityAccess.can.create_post,
      handleBlockedCommunityAction,
      handleOpenCreatePost,
    ],
  );

  const handleCommentClickWithAccess = useCallback(
    (postId: string, authorProfileId?: string, authorName?: string) => {
      if (!communityAccess.can.comment) {
        handleBlockedCommunityAction("comment");
        return;
      }

      handleCommentClick(postId, authorProfileId, authorName);
    },
    [
      communityAccess.can.comment,
      handleBlockedCommunityAction,
      handleCommentClick,
    ],
  );

  const handleLikePostWithAccess = useCallback(
    (postId: string) => {
      if (!communityAccess.can.react) {
        handleBlockedCommunityAction("react");
        return;
      }

      likePost(postId);
    },
    [communityAccess.can.react, handleBlockedCommunityAction, likePost],
  );

  const handleSavePostWithAccess = useCallback(
    (postId: string) => {
      if (!communityAccess.can.save) {
        handleBlockedCommunityAction("save");
        return;
      }

      savePost(postId);
    },
    [communityAccess.can.save, handleBlockedCommunityAction, savePost],
  );

  const handleReportPostWithAccess = useCallback(
    (postId: string) => {
      if (!communityAccess.can.report) {
        handleBlockedCommunityAction("report");
        return;
      }

      handleReportPost(postId);
    },
    [
      communityAccess.can.report,
      handleBlockedCommunityAction,
      handleReportPost,
    ],
  );

  React.useEffect(() => {
    if (searchParams.get("action") !== "publicar") return;
    if (!profile || !communityAccess.can.create_post) return;

    handleOpenCreatePostWithAccess();
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("action");
        return next;
      },
      { replace: true },
    );
  }, [
    communityAccess.can.create_post,
    handleOpenCreatePostWithAccess,
    profile,
    searchParams,
    setSearchParams,
  ]);

  const communityModals = (
    <CommunityModals
      modalState={modalState}
      postId={postId}
      postData={postData}
      isLoadingPost={isLoadingPost}
      profileId={profile?.id}
      onCloseModal={handleCloseModal}
      onClosePostDetail={handleClosePostDetail}
      onLike={handleLikePostWithAccess}
      onSave={handleSavePostWithAccess}
      onShare={sharePost}
      onReport={handleReportPostWithAccess}
      onSubmitReport={handleSubmitPostReport}
      onTagClick={handleTagClick}
      canComment={communityAccess.can.comment}
      commentBlockedMessage={getBlockedCommunityActionMessage("comment")}
    />
  );

  const communityTopbar = (
    <TerritoryTopbar
      territoryName={territoryName}
      contextLabel={territoryContextLabel}
      isAuthenticated={communityAccess.isAuthenticated}
      unreadCount={unreadCount}
      canCreatePost={
        communitySurfaceState === "active" && communityAccess.can.create_post
      }
    />
  );

  if (communitySurfaceState !== "active") {
    return (
      <TooltipProvider>
        <div className="min-h-[100dvh] text-territory-ink">
          {communityTopbar}
          <CommunityAvailabilityState
            state={communitySurfaceState}
            territoryName={territoryName}
            profile={communityProfileQuery.data ?? null}
            territoryHomeHref={territoryHomeHref}
            exploreHref={exploreHref}
            activeCommunityHref={activeCommunityHref}
            interestHref={communityInterestHref}
            onRetry={() => {
              void Promise.all([
                communityProfileQuery.refetch(),
                communityAccess.refreshCommunityAvailability(),
              ]);
            }}
          />
        </div>
      </TooltipProvider>
    );
  }

  if (!profile && resolved) {
    return (
      <TooltipProvider>
        <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden">
          {communityTopbar}
          <CommunityOverviewSurface
            resolved={resolved}
            territoryName={territoryName}
            territoryFilter={territoryFilter}
            onRequireLogin={handleRequireLogin}
            loginHref={loginHref}
            communityId={linkedCommunityId}
            communityProfile={communityProfileQuery.data ?? null}
            mode="public"
            canCreatePost={false}
            activeView={activeView}
            onViewChange={setView}
          />
          {communityModals}
        </div>
      </TooltipProvider>
    );
  }

  // Bloquear se nÃ£o estiver logado
  if (!profile) {
    return (
      <TooltipProvider>
        <div
          className="min-h-screen w-full max-w-full overflow-x-hidden bg-background flex items-center justify-center"
          role="main"
        >
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {COMMUNITY_PAGE_COPY.loginRequiredTitle}
            </h2>
            <p className="text-muted-foreground mb-6">
              {COMMUNITY_PAGE_COPY.loginRequiredDescription}
            </p>
            <Button
              onClick={handleRequireLogin}
              className="bg-primary hover:bg-primary/90"
            >
              {COMMUNITY_PAGE_COPY.loginRequiredAction}
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aguardar resoluÃ§Ã£o do territÃ³rio antes de bloquear
  if (territoryLoading || communityAccess.isLoading) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // SSOT: bloquear por ausÃªncia de user_residence (location_id), nÃ£o por string de perfil
  // Admin e moderadores tem acesso mesmo sem bairro cadastrado
  if (!communityAccess.can.view_member_feed) {
    return (
      <TooltipProvider>
        <div
          className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground"
          role="main"
        >
          <CommunityPortalGate
            resolved={resolved ?? null}
            action="view_member_feed"
          />
        </div>
      </TooltipProvider>
    );
  }

  // Aviso se nÃ£o for verificado (mas permite acesso)
  const showVerificationBanner = !communityAccess.isResidenceVerified;

  return (
    <TooltipProvider>
      <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden">
        {communityTopbar}
        <div className="min-w-0">
          <CommunityOverviewSurface
            resolved={resolved}
            territoryName={territoryName}
            territoryFilter={communityTerritoryFilter}
            onRequireLogin={handleRequireLogin}
            loginHref={loginHref}
            communityId={linkedCommunityId}
            communityProfile={communityProfileQuery.data ?? null}
            mode="member"
            canCreatePost={communityAccess.can.create_post}
            onOpenCreatePost={handleOpenCreatePostWithAccess}
            activeView={activeView}
            onViewChange={setView}
          >
            {isCommunitySocialView(activeView) ? (
              activeView === "groups" ? (
                <Suspense
                  fallback={
                    <div className="flex justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  }
                >
                  <GruposPage embedded />
                </Suspense>
              ) : (
                <div className="space-y-4">
                  {showVerificationBanner && showBanner && (
                    <VerificationBanner
                      onDismiss={() => setShowBanner(false)}
                      onRequestVerification={() => navigate("/conta")}
                    />
                  )}

                  {activeView === "feed" ? (
                    <LocationScopeCards
                      city={homeCity?.name}
                      neighborhood={
                        resolved?.kind === "group"
                          ? resolved.group.name
                          : homeDistrict?.name
                      }
                      isTerritorialGroup={resolved?.kind === "group"}
                      street={primaryStreet}
                      streetAvailable={hasPrimaryStreet}
                      currentScope={immediateFilters.locationScope}
                      onScopeChange={handleScopeChange}
                    />
                  ) : null}
                  <CommunityFeed
                    communityName={territoryName}
                    currentUserId={profile?.id}
                    communityId={linkedCommunityId ?? undefined}
                    onPostClick={handlePostClick}
                    onCommentClick={handleCommentClickWithAccess}
                    onTagClick={handleTagClick}
                    onOpenCreatePost={handleOpenCreatePostWithAccess}
                    onDeletePost={handleDeletePost}
                    onEditPost={handleEditPost}
                    onReportPost={handleReportPostWithAccess}
                    locationScope={immediateFilters.locationScope}
                    territoryFilter={communityTerritoryFilter}
                    initialHeaderFilter={feedHeaderFilter}
                    onHeaderFilterChange={handleFeedHeaderFilterChange}
                    canReact={communityAccess.can.react}
                    canComment={communityAccess.can.comment}
                    canSave={communityAccess.can.save}
                    canReport={communityAccess.can.report}
                    canSendMessage={communityAccess.can.send_message}
                    canCreatePost={communityAccess.can.create_post}
                    onBlockedAction={handleBlockedCommunityAction}
                    contentMode={
                      activeView === "discussions" ? "discussions" : "feed"
                    }
                  />
                </div>
              )
            ) : null}
          </CommunityOverviewSurface>
        </div>

        <CommunityFloatingButtons />

        {/* Modal de Criar Post */}
        <CreatePostModal
          open={modalState.type === "create"}
          onClose={handleCloseModal}
          defaultType={
            createPostModalData && "defaultType" in createPostModalData
              ? createPostModalData.defaultType
              : undefined
          }
          editPostId={
            createPostModalData && "editPostId" in createPostModalData
              ? createPostModalData.editPostId
              : undefined
          }
          initialContent={
            createPostModalData && "initialContent" in createPostModalData
              ? createPostModalData.initialContent
              : undefined
          }
          initialType={
            createPostModalData && "initialType" in createPostModalData
              ? createPostModalData.initialType
              : undefined
          }
          initialReach={
            createPostModalData && "initialReach" in createPostModalData
              ? createPostModalData.initialReach
              : undefined
          }
          resolvedTerritory={resolved}
          canCreatePost={communityAccess.can.create_post}
          canCreateAlert={communityAccess.can.create_alert}
          canCreateIssue={communityAccess.can.create_issue}
          blockedPostMessage={getBlockedCommunityActionMessage("create_post")}
          blockedAlertMessage={getBlockedCommunityActionMessage("create_alert")}
          blockedIssueMessage={getBlockedCommunityActionMessage("create_issue")}
        />

        {/* Modais de Detalhes e Comentarios */}
        {communityModals}

        <ConfirmActionDialog
          open={deletePostDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCancelDeletePost();
          }}
          title={COMMUNITY_PAGE_COPY.deleteDialogTitle}
          description={COMMUNITY_PAGE_COPY.deleteDialogDescription}
          confirmLabel={COMMUNITY_PAGE_COPY.deleteDialogConfirmLabel}
          cancelLabel={COMMUNITY_PAGE_COPY.deleteDialogCancelLabel}
          onConfirm={handleConfirmDeletePost}
          disabled={isDeletingPost}
        />
      </div>
    </TooltipProvider>
  );
}
