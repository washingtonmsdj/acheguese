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
import {
  LayoutList,
  Users,
} from "lucide-react";
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
} from "@/core/community/access";
import {
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
  type CommunityDiscoveryTab,
} from "@/core/community/utils/communityFeedTab";
import {
  useComunidadePage,
  type CreatePostModalData,
} from "../hooks/page/useComunidadePage";
import { CommunityFeed } from "../components/feed/CommunityFeed";
import { LocationScopeCards } from "../components/page/LocationScopeCards";
import { CommunityFloatingButtons } from "../components/page/CommunityFloatingButtons";
import { CommunityModals } from "../components/page/CommunityModals";
import { CommunityOverviewSurface } from "../components/page/CommunityOverviewSurface";
import { CreatePostModal } from "../components/composer/CreatePostModal";
import { VerificationBanner } from "@/core/verification";
import { COMMUNITY_PAGE_COPY } from "@/core/community/utils/communityCopy";
import { resolveCommunityFeedTerritoryFilter } from "@/core/community/utils/resolveCommunityFeedTerritoryFilter";
import { cn } from "@/shared/utils/cn";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";
import { buildCommunityTabUrlFromPath } from "@/core/routing/utils/territoryUrls";
import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";
import { withQueryParams } from "@/core/landing/utils/landingPresentation";
import { useCommunityProfile } from "@/core/community-experience/hooks/useCommunityProfile";
import { isPersistedCommunityId } from "@/core/community-experience/types";

const GruposPage = lazy(() => import("./GruposPage"));

type CommunityTab = "feed" | "grupos";

const TABS: { id: CommunityTab; label: string; icon: React.ElementType }[] = [
  { id: "feed",   label: "Feed",   icon: LayoutList },
  { id: "grupos", label: "Grupos", icon: Users },
];


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

export default function ComunidadePage({ resolved, activeMemberIds }: ComunidadePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeTab = location.pathname.endsWith("/grupos")
    ? "grupos"
    : location.pathname.endsWith("/feed")
      ? "feed"
      : null;
  const requestedTab = (searchParams.get("tab") as CommunityDiscoveryTab | null) ?? null;
  const activeTab: CommunityTab =
    routeTab ?? (requestedTab === "grupos" ? "grupos" : "feed");
  const feedHeaderFilter: TerritorialFeedChannel =
    resolveCommunityFeedChannelFromTab(requestedTab);
  const [showBanner, setShowBanner] = React.useState(true);
  const appUrls = useAppUrls(resolved); // SSOT URLs com contexto territorial
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved, activeMemberIds });
  const territoryFilter = moduleTerritory.territoryFilter;

  // SSOT: guarda de acesso por UUID canÃ´nico, nÃ£o por string de perfil
  const { homeDistrict, homeCity, loading: territoryLoading } = useUserTerritory();
  const communityAccess = useCommunityAccess({ resolved: resolved ?? null, activeMemberIds });
  const communityProfileQuery = useCommunityProfile(resolved ?? null);
  const linkedCommunityId = isPersistedCommunityId(communityProfileQuery.data?.id)
    ? communityProfileQuery.data.id
    : communityAccess.communityId;
  const setTab = (tab: CommunityTab) => {
    const canonicalPath = buildCommunityTabUrlFromPath(location.pathname, tab);
    if (canonicalPath) {
      navigate(canonicalPath);
      return;
    }

    setSearchParams(tab === "feed" ? {} : { tab });
  };

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
    [territoryFilter, immediateFilters.locationScope, resolved, homeCity?.id, homeDistrict?.id],
  );
  const {
    data: primaryResidence,
    isLoading: primaryResidenceLoading,
  } = useQuery({
    queryKey: ["user-residence", "primary-with-relations", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      return residenceService.getPrimaryResidenceWithRelations(profile.user_id);
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
  }, [hasPrimaryStreet, immediateFilters.locationScope, primaryResidenceLoading, setLocationScope]);

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

  const territoryName = resolved?.kind === "group"
    ? resolved.group.name
    : resolved?.kind === "location"
      ? resolved.location.name
      : "comunidade";
  const loginHref = useMemo(() => {
    const redirect = `${location.pathname}${location.search}`;
    return withQueryParams(appUrls.auth.login, { redirect });
  }, [appUrls.auth.login, location.pathname, location.search]);
  const publishRedirectHref = useMemo(() => {
    const targetPath = withQueryParams(location.pathname, { action: "publicar" });
    return withQueryParams(appUrls.auth.login, { redirect: targetPath });
  }, [appUrls.auth.login, location.pathname]);
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
    if (communityAccess.primaryAction === "create_profile") return appUrls.profile.manage;
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
    [communityAccess.can.comment, handleBlockedCommunityAction, handleCommentClick],
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
    [communityAccess.can.report, handleBlockedCommunityAction, handleReportPost],
  );

  React.useEffect(() => {
    if (searchParams.get("action") !== "publicar") return;
    if (!profile || !communityAccess.can.create_post) return;

    handleOpenCreatePostWithAccess();
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete("action");
      return next;
    }, { replace: true });
  }, [
    communityAccess.can.create_post,
    handleOpenCreatePostWithAccess,
    profile,
    searchParams,
    setSearchParams,
  ]);

  if (!profile && resolved && activeTab === "feed") {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B]" role="main">
          <CommunityOverviewSurface
            resolved={resolved}
            territoryName={territoryName}
            territoryFilter={territoryFilter}
            activeHeaderFilter={feedHeaderFilter}
            onHeaderFilterChange={handleFeedHeaderFilterChange}
            onRequireLogin={handleRequireLogin}
            loginHref={loginHref}
            publishHref={publishRedirectHref}
            communityId={linkedCommunityId}
            communityProfile={communityProfileQuery.data ?? null}
            mode="public"
          />
        </div>
      </TooltipProvider>
    );
  }

  // Bloquear se nÃ£o estiver logado
  if (!profile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              {COMMUNITY_PAGE_COPY.loginRequiredTitle}
            </h2>
            <p className="text-gray-400 mb-6">
              {COMMUNITY_PAGE_COPY.loginRequiredDescription}
            </p>
            <Button onClick={handleRequireLogin} className="bg-teal-500 hover:bg-teal-400">
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
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // SSOT: bloquear por ausÃªncia de user_residence (location_id), nÃ£o por string de perfil
  // Admin e moderadores tem acesso mesmo sem bairro cadastrado
  if (!communityAccess.can.view_member_feed) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] text-white" role="main">
          <CommunityPortalGate resolved={resolved ?? null} action="view_member_feed" />
        </div>
      </TooltipProvider>
    );
  }

  // Aviso se nÃ£o for verificado (mas permite acesso)
  const showVerificationBanner = !communityAccess.isResidenceVerified;

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B]" role="main">
        <div className={cn(
          activeTab === "feed"
            ? "min-w-0"
            : "mx-auto w-full max-w-[1600px] min-w-0 px-4 py-6 md:px-6 lg:px-8",
        )}>
          {activeTab !== "feed" && (
            <nav
              className="mb-6 flex min-w-0 flex-wrap gap-1 border-b border-white/10 pb-0"
              aria-label={COMMUNITY_PAGE_COPY.subcategoryNavAriaLabel}
            >
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                      "flex min-w-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                    activeTab === id
                      ? "border-teal-400 text-teal-300"
                      : "border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20"
                  )}
                  aria-current={activeTab === id ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </nav>
          )}

          {activeTab !== "feed" && (
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {activeTab === "grupos" && (
                <CommunityPortalGate resolved={resolved ?? null} action="join_group">
                  <GruposPage />
                </CommunityPortalGate>
              )}
            </Suspense>
          )}

          {activeTab === "feed" && (
            <CommunityOverviewSurface
              resolved={resolved}
              territoryName={territoryName}
              territoryFilter={communityTerritoryFilter}
              activeHeaderFilter={feedHeaderFilter}
              onHeaderFilterChange={handleFeedHeaderFilterChange}
              onRequireLogin={handleRequireLogin}
              loginHref={loginHref}
              publishHref={publishRedirectHref}
              communityId={linkedCommunityId}
              communityProfile={communityProfileQuery.data ?? null}
              mode="member"
              onOpenCreatePost={handleOpenCreatePostWithAccess}
            >
              <div className="space-y-4">
                {showVerificationBanner && showBanner && (
                  <VerificationBanner
                    onDismiss={() => setShowBanner(false)}
                    onRequestVerification={() => navigate("/conta")}
                  />
                )}

                <LocationScopeCards
                  city={homeCity?.name}
                  neighborhood={resolved?.kind === "group" ? resolved.group.name : homeDistrict?.name}
                  isTerritorialGroup={resolved?.kind === "group"}
                  street={primaryStreet}
                  streetAvailable={hasPrimaryStreet}
                  currentScope={immediateFilters.locationScope}
                  onScopeChange={handleScopeChange}
                />
                <CommunityFeed
                  currentUserId={profile?.id}
                  onPostClick={handlePostClick}
                  onCommentClick={handleCommentClickWithAccess}
                  onTagClick={handleTagClick}
                  onOpenCreatePost={handleOpenCreatePostWithAccess}
                  onDeletePost={handleDeletePost}
                  onEditPost={handleEditPost}
                  locationScope={immediateFilters.locationScope}
                  territoryFilter={communityTerritoryFilter}
                  initialHeaderFilter={feedHeaderFilter}
                  onHeaderFilterChange={handleFeedHeaderFilterChange}
                  canReact={communityAccess.can.react}
                  canComment={communityAccess.can.comment}
                  canSave={communityAccess.can.save}
                  canReport={communityAccess.can.report}
                  canSendMessage={communityAccess.can.send_message}
                  onBlockedAction={handleBlockedCommunityAction}
                />
              </div>
            </CommunityOverviewSurface>
          )}
        </div>

        <CommunityFloatingButtons />

        {/* Modal de Criar Post */}
        <CreatePostModal
          open={modalState.type === "create"}
          onClose={handleCloseModal}
          defaultType={createPostModalData && "defaultType" in createPostModalData ? createPostModalData.defaultType : undefined}
          editPostId={createPostModalData && "editPostId" in createPostModalData ? createPostModalData.editPostId : undefined}
          initialContent={createPostModalData && "initialContent" in createPostModalData ? createPostModalData.initialContent : undefined}
          initialType={createPostModalData && "initialType" in createPostModalData ? createPostModalData.initialType : undefined}
          initialReach={createPostModalData && "initialReach" in createPostModalData ? createPostModalData.initialReach : undefined}
          canCreatePost={communityAccess.can.create_post}
          canCreateAlert={communityAccess.can.create_alert}
          canCreateIssue={communityAccess.can.create_issue}
          blockedPostMessage={getBlockedCommunityActionMessage("create_post")}
          blockedAlertMessage={getBlockedCommunityActionMessage("create_alert")}
          blockedIssueMessage={getBlockedCommunityActionMessage("create_issue")}
        />

        {/* Modais de Detalhes e Comentarios */}
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
          onTagClick={handleTagClick}
          canComment={communityAccess.can.comment}
          commentBlockedMessage={getBlockedCommunityActionMessage("comment")}
        />

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


