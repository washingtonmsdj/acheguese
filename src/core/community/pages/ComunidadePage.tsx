/**
 * ComunidadePage - Página principal da comunidade
 * 
 * SSOT - Usa Services via hooks
 * Arquitetura modular - Componentes isolados
 * Performance - Lazy loading e memoização
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
import { useIsAdmin } from "@/core/auth/hooks/useIsAdmin";
import { useAppUrls } from "@/core/routing/hooks";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { useCommunityRollout } from "@/core/community/hooks/useCommunityRollout";
import { communityRolloutService } from "@/core/community/services";
import { residenceService } from "@/core/residence/services/ResidenceService";
import {
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
  type CommunityDiscoveryTab,
} from "@/core/community/utils/communityFeedTab";
import { useComunidadePage } from "../hooks/page/useComunidadePage";
import { CommunityFeed } from "../components/feed/CommunityFeed";
import { CommunityRightSidebar } from "../components/CommunityRightSidebar";
import { LocationScopeCards } from "../components/page/LocationScopeCards";
import { CommunityFloatingButtons } from "../components/page/CommunityFloatingButtons";
import { CommunityModals } from "../components/page/CommunityModals";
import { CreatePostModal } from "../components/composer/CreatePostModal";
import { CreateAlertModal } from "@/core/community/alerts";
import { CreateIssueModal } from "@/core/community/issues";
import { VerificationBanner } from "@/core/verification";
import { COMMUNITY_PAGE_COPY } from "@/core/community/utils/communityCopy";
import { resolveCommunityFeedTerritoryFilter } from "@/core/community/utils/resolveCommunityFeedTerritoryFilter";
import { cn } from "@/shared/utils/cn";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";
import { buildCommunityTabUrlFromPath } from "@/core/routing/utils/territoryUrls";
import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";

const GruposPage = lazy(() => import("./GruposPage"));

type CommunityTab = "feed" | "grupos";

const TABS: { id: CommunityTab; label: string; icon: React.ElementType }[] = [
  { id: "feed",   label: "Feed",   icon: LayoutList },
  { id: "grupos", label: "Grupos", icon: Users },
];


interface ComunidadePageProps {
  resolved?: ResolvedTerritory;
}

export default function ComunidadePage({ resolved }: ComunidadePageProps) {
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
  const territoryFilter = useTerritoryFilter(resolved);

  // SSOT: guarda de acesso por UUID canônico, não por string de perfil
  const { homeDistrict, homeCity, loading: territoryLoading } = useUserTerritory();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isLoading: rolloutLoading } = useCommunityRollout(resolved);
  const {
    data: isHomeDistrictApproved = false,
    isLoading: homeDistrictRolloutLoading,
  } = useQuery({
    queryKey: ["community-rollout", "district", homeDistrict?.id],
    queryFn: async () => {
      if (!homeDistrict?.id) return false;
      return communityRolloutService.isCommunityActiveForLocation(homeDistrict.id);
    },
    enabled: !!homeDistrict?.id,
    staleTime: 5 * 60 * 1000,
  });
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
    alertModalOpen,
    issueModalOpen,
    immediateFilters,
    likePost,
    savePost,
    sharePost,
    setLocationScope,
    handleOpenCreatePost,
    handleCloseAlertModal,
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
    deletePostDialogOpen,
    isDeletingPost,
    communityLocation,
  } = useComunidadePage();
  const issueLocationId =
    communityLocation.activeLocation?.type === "district"
      ? communityLocation.activeLocation.id
      : homeDistrict?.id;
  const modalCity =
    communityLocation.activeLocation?.type === "city"
      ? communityLocation.activeLocation.name
      : homeCity?.name ?? "";
  const modalNeighborhood =
    communityLocation.activeLocation?.type === "district"
      ? communityLocation.activeLocation.name
      : homeDistrict?.name;
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

  // Bloquear se não estiver logado
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
            <Button onClick={() => navigate(appUrls.auth.login)} className="bg-teal-500 hover:bg-teal-400">
              {COMMUNITY_PAGE_COPY.loginRequiredAction}
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aguardar resolução do território antes de bloquear
  if (territoryLoading || adminLoading || rolloutLoading || homeDistrictRolloutLoading) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // SSOT: bloquear por ausência de user_residence (location_id), não por string de perfil
  // Admin e moderadores tem acesso mesmo sem bairro cadastrado
  if (!homeDistrict && !isAdmin) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              {COMMUNITY_PAGE_COPY.setupDistrictTitle}
            </h2>
            <p className="text-gray-400 mb-6">
              {COMMUNITY_PAGE_COPY.setupDistrictDescription}
            </p>
            <Button onClick={() => navigate(appUrls.profile.addresses)} className="bg-teal-500 hover:bg-teal-400">
              {COMMUNITY_PAGE_COPY.setupDistrictAction}
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  const hasApprovedCommunityAccess = isAdmin || Boolean(homeDistrict && isHomeDistrictApproved);

  if (!hasApprovedCommunityAccess) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">{COMMUNITY_PAGE_COPY.rolloutBlockedTitle}</h2>
            <p className="text-gray-400 mb-6">
              {COMMUNITY_PAGE_COPY.rolloutBlockedDescription}
            </p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aviso se não for verificado (mas permite acesso)
  const showVerificationBanner = !profile?.verified;

  return (
    <TooltipProvider>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B]" role="main">
        <div className="mx-auto w-full max-w-[1600px] min-w-0 px-4 py-6 md:px-6 lg:px-8">
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

          {activeTab !== "feed" && (
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {activeTab === "grupos" && <GruposPage />}
            </Suspense>
          )}

          {activeTab === "feed" && (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <main className="min-w-0 max-w-full overflow-x-hidden" role="feed" aria-label="Feed da comunidade">
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
                onCommentClick={handleCommentClick}
                onTagClick={handleTagClick}
                onOpenCreatePost={handleOpenCreatePost}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                locationScope={immediateFilters.locationScope}
                territoryFilter={communityTerritoryFilter}
                initialHeaderFilter={feedHeaderFilter}
                onHeaderFilterChange={handleFeedHeaderFilterChange}
              />

            </main>

            <aside className="hidden lg:block w-80 flex-shrink-0" aria-label="Widgets da comunidade">
              <div className="sticky top-6">
                <CommunityRightSidebar
                  resolved={resolved}
                  territoryFilter={communityTerritoryFilter}
                />
              </div>
            </aside>
          </div>
          )}
        </div>

        <CommunityFloatingButtons />

        {/* Modal de Criar Post */}
        <CreatePostModal
          open={modalState.type === "create"}
          onClose={handleCloseModal}
          defaultType={(modalState.data as any)?.defaultType}
          editPostId={(modalState.data as any)?.editPostId}
          initialContent={(modalState.data as any)?.initialContent}
          initialType={(modalState.data as any)?.initialType}
          initialReach={(modalState.data as any)?.initialReach}
        />

        {/* Modal de Criar Alerta */}
        <CreateAlertModal
          open={alertModalOpen}
          onClose={handleCloseAlertModal}
          city={modalCity}
          neighborhood={modalNeighborhood}
          locationId={issueLocationId}
        />

        {/* Modal de Criar Problema */}
        <CreateIssueModal
          open={issueModalOpen}
          onClose={handleCloseIssueModal}
          city={modalCity}
          neighborhood={modalNeighborhood}
          locationId={issueLocationId}
        />

        {/* Modais de Detalhes e Comentarios */}
        <CommunityModals
          modalState={modalState as any}
          postId={postId}
          postData={postData as any}
          isLoadingPost={isLoadingPost}
          profileId={profile?.id}
          onCloseModal={handleCloseModal}
          onClosePostDetail={handleClosePostDetail}
          onLike={likePost}
          onSave={savePost}
          onShare={sharePost}
          onReport={handleReportPost}
          onTagClick={handleTagClick}
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


