/**
 * ComunidadePage - Página principal da comunidade
 * 
 * ✅ SSOT - Usa Services via hooks
 * ✅ Arquitetura Modular - Componentes isolados
 * ✅ Performance - Lazy loading e memoização
 * ✅ Acessibilidade - ARIA labels e roles
 */

import React, { lazy, Suspense, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  LayoutList,
  Loader2,
  MapPin,
  MessageSquare,
  Users,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useIsAdmin } from "@/core/auth/hooks/useIsAdmin";
import { useAppUrls } from "@/core/routing/hooks";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { useCommunityRollout } from "@/core/community/hooks/useCommunityRollout";
import { communityRolloutService } from "@/core/community/services";
import { TerritorialSelector } from "@/core/location/components/TerritorialSelector";
import { residenceService } from "@/core/residence/services/ResidenceService";
import { useComunidadePage } from "../hooks/page/useComunidadePage";
import { CommunityFeed } from "../components/feed/CommunityFeed";
import { CommunityRightSidebar } from "../components/CommunityRightSidebar";
import { LocationScopeCards } from "../components/page/LocationScopeCards";
import { CommunityFloatingButtons } from "../components/page/CommunityFloatingButtons";
import { CommunityModals } from "../components/page/CommunityModals";
import { CreatePostModal } from "../components/composer/CreatePostModal";
import { AlertFeedSection, CreateAlertModal } from "@/core/community/alerts";
import { IssueFeedSection, CreateIssueModal } from "@/core/community/issues";
import { VerificationBanner } from "@/core/verification";
import { cn } from "@/shared/utils/cn";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";

const GruposPage = lazy(() => import("./GruposPage"));

type CommunityTab = "feed" | "grupos";
type FeedView = "posts" | "alerts" | "issues" | "all";

const TABS: { id: CommunityTab; label: string; icon: React.ElementType }[] = [
  { id: "feed",   label: "Feed",   icon: LayoutList },
  { id: "grupos", label: "Grupos", icon: Users },
];

const FEED_VIEWS: { id: FeedView; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: "posts",
    label: "Publicacoes",
    description: "Moradores e empresas",
    icon: MessageSquare,
  },
  {
    id: "alerts",
    label: "Alertas",
    description: "Urgente e validado",
    icon: AlertTriangle,
  },
  {
    id: "issues",
    label: "Problemas",
    description: "Zeladoria local",
    icon: MapPin,
  },
  {
    id: "all",
    label: "Tudo",
    description: "Fluxo completo",
    icon: LayoutList,
  },
];

interface ComunidadePageProps {
  resolved?: ResolvedTerritory;
}

export default function ComunidadePage({ resolved }: ComunidadePageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeTab = location.pathname.endsWith("/grupos")
    ? "grupos"
    : location.pathname.endsWith("/feed")
      ? "feed"
      : null;
  const activeTab = routeTab ?? ((searchParams.get("tab") as CommunityTab) || "feed");
  const [feedView, setFeedView] = React.useState<FeedView>("posts");
  const [showBanner, setShowBanner] = React.useState(true);
  const [chooseDistrictOpen, setChooseDistrictOpen] = React.useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = React.useState<string | null>(null);
  const [selectedDistrictLabel, setSelectedDistrictLabel] = React.useState("");
  const [savingDistrict, setSavingDistrict] = React.useState(false);
  const appUrls = useAppUrls(resolved); // ✅ SSOT URLs com contexto territorial
  const territoryFilter = useTerritoryFilter(resolved);

  // ✅ SSOT: guarda de acesso por UUID canônico, não por string de perfil
  const { hasHome, homeDistrict, homeCity, loading: territoryLoading } = useUserTerritory();
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
    const match = location.pathname.match(/^\/comunidade\/([^/]+)\/([^/]+)\/([^/]+)/);
    if (match) {
      const [, state, city, territory] = match;
      const canonicalPath = tab === "feed"
        ? `/comunidade/${state}/${city}/${territory}/feed`
        : `/comunidade/${state}/${city}/${territory}/grupos`;
      navigate(canonicalPath);
      return;
    }

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
    handleCancelDeletePost,
    handleConfirmDeletePost,
    handleEditPost,
    handleReportClick,
    handleCloseModal,
    deletePostDialogOpen,
    isDeletingPost,
    communityLocation,
  } = useComunidadePage();
  const {
    data: hasPrimaryStreet = false,
    isLoading: streetCheckLoading,
  } = useQuery({
    queryKey: ["community-access", "primary-street", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return false;
      const residence = await residenceService.getPrimaryResidenceWithRelations(profile.user_id);
      const street = residence?.address?.street ?? "";
      return street.trim().length > 0;
    },
    enabled: !!profile?.user_id,
    staleTime: 5 * 60 * 1000,
  });
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
  const communityTerritoryFilter: TerritoryFilter = homeDistrict
    ? { scope: "location", location_id: homeDistrict.id }
    : territoryFilter;
  const handleDistrictSelectionChange = useCallback(
    (
      locationId: string | null,
      locationData: { cityName: string; neighborhoodName: string } | null,
    ) => {
      setSelectedDistrictId(locationId);
      setSelectedDistrictLabel(
        locationData
          ? `${locationData.neighborhoodName}, ${locationData.cityName}`
          : "",
      );
    },
    [],
  );

  const handleSaveCommunityDistrict = useCallback(async () => {
    if (!profile?.user_id || !selectedDistrictId) return;

    setSavingDistrict(true);
    try {
      const residence = await residenceService.getPrimaryResidence(profile.user_id);

      if (!residence?.id) {
        toast.error(
          "Nao foi encontrada uma residencia canonica para atualizar. Cadastre um endereco antes de escolher o bairro da comunidade.",
        );
        return;
      }

      await residenceService.updateResidence(residence.id, {
        location_id: selectedDistrictId,
        is_primary: true,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["user-residence", "primary", profile.user_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["user-territory-resolved"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["user-residences", profile.user_id],
        }),
      ]);

      toast.success("Bairro da comunidade atualizado");
      setChooseDistrictOpen(false);
      setSelectedDistrictId(null);
    } catch {
      toast.error("Nao foi possivel salvar o bairro da comunidade");
    } finally {
      setSavingDistrict(false);
    }
  }, [profile?.user_id, queryClient, selectedDistrictId]);

  // Bloquear se não estiver logado
  if (!profile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Faça login para acessar a comunidade
            </h2>
            <p className="text-gray-400 mb-6">
              A comunidade é exclusiva para moradores cadastrados do bairro.
            </p>
            <Button onClick={() => navigate(appUrls.auth.login)} className="bg-teal-500 hover:bg-teal-400">
              Fazer Login
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aguardar resolução do território antes de bloquear
  if (territoryLoading || adminLoading || rolloutLoading || homeDistrictRolloutLoading || streetCheckLoading) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ✅ SSOT: bloquear por ausência de user_residence (location_id), não por string de perfil
  // Admin e moderadores têm acesso mesmo sem bairro cadastrado
  if (!hasHome && !isAdmin) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Escolha seu bairro
            </h2>
            <p className="text-gray-400 mb-6">
              A comunidade e hiperlocal. Selecione seu bairro principal para ver feed,
              alertas, grupos e problemas da sua regiao.
            </p>
            <Button onClick={() => setChooseDistrictOpen(true)} className="bg-teal-500 hover:bg-teal-400">
              Escolher meu bairro
            </Button>
          </div>
          <Dialog open={chooseDistrictOpen} onOpenChange={setChooseDistrictOpen}>
            <DialogContent className="border-white/10 bg-[#172126] text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Escolher meu bairro</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Este bairro sera usado como base da sua comunidade.
                </DialogDescription>
              </DialogHeader>
              <TerritorialSelector
                initialLocationId={homeDistrict?.id}
                allowCityOnly={false}
                labels={{
                  state: "Estado",
                  city: "Cidade",
                  neighborhood: "Bairro",
                }}
                onLocationChange={handleDistrictSelectionChange}
              />
              {selectedDistrictLabel && (
                <p className="text-sm text-gray-300">
                  Minha comunidade: {selectedDistrictLabel}
                </p>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setChooseDistrictOpen(false)}
                  disabled={savingDistrict}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveCommunityDistrict}
                  disabled={!selectedDistrictId || savingDistrict}
                  className="bg-teal-500 hover:bg-teal-400"
                >
                  {savingDistrict && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar bairro
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    );
  }

  const hasApprovedCommunityAccess = isAdmin || (hasHome && isHomeDistrictApproved);

  if (!hasApprovedCommunityAccess) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">Comunidade ainda nao liberada</h2>
            <p className="text-gray-400 mb-6">
              Seu bairro ainda nao foi aprovado no rollout da comunidade. Quando for liberado, os atalhos
              e conteudos locais serao ativados automaticamente.
            </p>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  if (!isAdmin && !hasPrimaryStreet) {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <MapPin className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">Informe sua rua para entrar</h2>
            <p className="text-gray-400 mb-6">
              Para acessar a comunidade do bairro, complete o endereco com rua no seu perfil.
            </p>
            <Button onClick={() => navigate(appUrls.profile.settings())} className="bg-teal-500 hover:bg-teal-400">
              Atualizar endereco
            </Button>
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
        {/* Bloco legado desativado: hero expandido da comunidade */}

        <div className="mx-auto w-full max-w-[1600px] min-w-0 px-4 py-6 md:px-6 lg:px-8">
          <nav className="mb-6 flex min-w-0 flex-wrap gap-1 border-b border-white/10 pb-0" aria-label="Subcategorias da comunidade">
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
                  onRequestVerification={() => navigate("/perfil/verificacao-morador")}
                />
              )}

              <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/10 md:p-5" aria-label="Publicar no feed">
                <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Feed da comunidade</p>
                    <h2 className="break-words text-2xl font-semibold text-white">O que esta acontecendo no Complexo</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">
                      Publicacoes de moradores, empresas locais, pedidos, indicacoes e conversas do dia a dia.
                    </p>
                  </div>
                  <Button
                    onClick={handleOpenCreatePost}
                    className="h-auto min-h-10 w-full whitespace-normal bg-teal-500 px-5 py-2 font-semibold text-white hover:bg-teal-400 md:w-auto"
                  >
                    Publicar no feed
                  </Button>
                </div>

                <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Filtros do feed">
                  {FEED_VIEWS.map(({ id, label, description, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={feedView === id}
                      onClick={() => setFeedView(id)}
                      className={cn(
                        "flex min-h-16 min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/60",
                        feedView === id
                          ? "border-teal-300/50 bg-teal-300/15 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-white",
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{label}</span>
                        <span className="mt-0.5 block truncate text-xs text-white/45">{description}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {(feedView === "posts" || feedView === "all") && (
                <>
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
                    territoryFilter={communityTerritoryFilter}
                  />
                </>
              )}

              {(feedView === "alerts" || feedView === "all") && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.04] p-4 md:p-5">
                  <AlertFeedSection
                    territoryFilter={communityTerritoryFilter}
                    city={homeCity?.name ?? profile.city}
                    neighborhood={homeDistrict?.name ?? profile.neighborhood}
                    locationId={issueLocationId}
                  />
                </div>
              )}

              {(feedView === "issues" || feedView === "all") && (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4 md:p-5">
                  <IssueFeedSection
                    territoryFilter={communityTerritoryFilter}
                    city={homeCity?.name ?? profile.city}
                    neighborhood={homeDistrict?.name ?? profile.neighborhood}
                    locationId={homeDistrict?.id}
                    profileId={profile.id}
                  />
                </div>
              )}





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

        <ConfirmActionDialog
          open={deletePostDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCancelDeletePost();
          }}
          title="Excluir publicacao?"
          description="Esta acao remove a publicacao do feed. Use apenas quando tiver certeza de que ela nao deve continuar visivel."
          confirmLabel="Excluir publicacao"
          cancelLabel="Manter publicacao"
          onConfirm={handleConfirmDeletePost}
          disabled={isDeletingPost}
        />
      </div>
    </TooltipProvider>
  );
}


