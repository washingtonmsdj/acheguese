/**
 * ComunidadePage - Página principal da comunidade
 * 
 * ✅ SSOT - Usa Services via hooks
 * ✅ Arquitetura Modular - Componentes isolados
 * ✅ Performance - Lazy loading e memoização
 * ✅ Acessibilidade - ARIA labels e roles
 */

import React, { lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Users, LayoutList } from "lucide-react";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { useIsAdmin } from "@/core/auth/hooks/useIsAdmin";
import { useAppUrls } from "@/core/routing/hooks";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { useComunidadePage } from "../hooks/page/useComunidadePage";
import { CommunityFeed } from "../components/feed/CommunityFeed";
import { CommunityRightSidebar } from "../components/CommunityRightSidebar";
import { LocationScopeCards } from "../components/page/LocationScopeCards";
import { CommunityFloatingButtons } from "../components/page/CommunityFloatingButtons";
import { CommunityModals } from "../components/page/CommunityModals";
import { CreatePostModal } from "../components/composer/CreatePostModal";
import { CreateAlertModal } from "@/core/community/alerts";
import { IssueFeedSection, CreateIssueModal } from "@/core/community/issues";
import { VerificationBanner } from "@/core/verification";
import { cn } from "@/shared/utils/cn";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as CommunityTab) || "feed";
  const [showBanner, setShowBanner] = React.useState(true);
  const appUrls = useAppUrls(resolved); // ✅ SSOT URLs com contexto territorial
  const territoryFilter = useTerritoryFilter(resolved);

  // ✅ SSOT: guarda de acesso por UUID canônico, não por string de perfil
  const { hasHome, homeDistrict, homeCity, loading: territoryLoading } = useUserTerritory();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  const setTab = (tab: CommunityTab) => {
    setSearchParams(tab === "feed" ? {} : { tab });
  };

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
    communityLocation,
  } = useComunidadePage();
  const issueLocationId =
    communityLocation.activeLocation?.type === "district"
      ? communityLocation.activeLocation.id
      : homeDistrict?.id;
  const modalCity =
    communityLocation.activeLocation?.type === "city"
      ? communityLocation.activeLocation.name
      : homeCity?.name ?? profile?.city ?? "";
  const modalNeighborhood =
    communityLocation.activeLocation?.type === "district"
      ? communityLocation.activeLocation.name
      : homeDistrict?.name ?? profile?.neighborhood;

  // Bloquear se não estiver logado
  if (!profile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Faça login para acessar a comunidade
            </h2>
            <p className="text-gray-400 mb-6">
              A comunidade é exclusiva para moradores cadastrados do bairro.
            </p>
            <Button onClick={() => window.location.href = appUrls.auth.login} className="bg-teal-500 hover:bg-teal-400">
              Fazer Login
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aguardar resolução do território antes de bloquear
  if (territoryLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-[#12181B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ✅ SSOT: bloquear por ausência de user_residence (location_id), não por string de perfil
  // Admin e moderadores têm acesso mesmo sem bairro cadastrado
  if (!hasHome && !isAdmin) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Complete seu cadastro
            </h2>
            <p className="text-gray-400 mb-6">
              Para acessar a comunidade, você precisa cadastrar seu bairro no perfil.
            </p>
            <Button onClick={() => window.location.href = appUrls.profile.central} className="bg-teal-500 hover:bg-teal-400">
              Completar Perfil
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aviso se não for verificado (mas permite acesso)
  const showVerificationBanner = !profile.verified;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#12181B]" role="main">
        <div className="container mx-auto max-w-[1600px] px-4 py-6">

          {/* Tabs de subcategoria */}
          <nav className="flex gap-1 mb-5 border-b border-white/10 pb-0" aria-label="Subcategorias da comunidade">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === id
                    ? "border-teal-400 text-teal-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-white/20"
                )}
                aria-current={activeTab === id ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          {/* Subcategorias standalone */}
          {activeTab !== "feed" && (
            <Suspense fallback={
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              {activeTab === "grupos" && <GruposPage />}
            </Suspense>
          )}

          {/* Feed principal */}
          {activeTab === "feed" && (
          <div className="flex gap-6">
            <main className="flex-1 min-w-0" role="feed" aria-label="Feed da comunidade">
              {/* Banner de verificação para usuários não verificados */}
              {showVerificationBanner && showBanner && (
                <VerificationBanner
                  onDismiss={() => setShowBanner(false)}
                  onRequestVerification={() => window.location.href = '/perfil'}
                />
              )}

              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Acessos da Comunidade
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setTab("grupos")}>
                    Grupos
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(appUrls.community.recommendations)}>
                    Recomendações
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(appUrls.community.lostAndFound)}>
                    Achados e Perdidos
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(appUrls.community.alerts)}>
                    Alertas
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(appUrls.community.issues)}>
                    Problemas
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(appUrls.community.events)}>
                    Eventos
                  </Button>
                </div>
              </div>

              {/* Cards de escopo sempre baseados no bairro do usuário — dados do SSOT */}
              <LocationScopeCards
                city={homeCity?.name ?? profile.city}
                neighborhood={homeDistrict?.name ?? profile.neighborhood}
                currentScope={immediateFilters.locationScope}
                onScopeChange={setLocationScope}
              />
              <CommunityFeed
                currentUserId={profile?.id}
                onPostClick={handlePostClick}
                onCommentClick={handleCommentClick}
                onTagClick={handleTagClick}
                onOpenCreatePost={handleOpenCreatePost}
                onOpenAlertModal={handleOpenAlertModal}
                onOpenIssueModal={handleOpenIssueModal}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                onReportClick={handleReportClick}
                locationScope={immediateFilters.locationScope}
              />

              {/* Problemas urbanos do bairro do usuário */}
              <div className="mt-6">
                <IssueFeedSection
                  territoryFilter={territoryFilter}
                  city={homeCity?.name ?? profile.city}
                  neighborhood={homeDistrict?.name ?? profile.neighborhood}
                  locationId={homeDistrict?.id}
                  profileId={profile.id}
                />
              </div>
            </main>

            <aside className="hidden lg:block w-80 flex-shrink-0" aria-label="Widgets da comunidade">
              <div className="sticky top-6">
                <CommunityRightSidebar />
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
          defaultType={modalState.data?.defaultType}
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

        {/* Modais de Detalhes e Comentários */}
        <CommunityModals
          modalState={modalState}
          postId={postId}
          postData={postData}
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
      </div>
    </TooltipProvider>
  );
}


