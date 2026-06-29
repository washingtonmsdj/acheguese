/**
 * ComunidadePage - Página principal da comunidade
 * 
 * SSOT - Usa Services via hooks
 * Arquitetura modular - Componentes isolados
 * Performance - Lazy loading e memoização
 * Acessibilidade - ARIA labels e roles
 */

import React, { lazy, Suspense, useCallback, useMemo } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  Bookmark,
  Building2,
  Heart,
  LayoutList,
  Lock,
  LogIn,
  MapPin,
  MessageCircle,
  Megaphone,
  Share2,
  Store,
  Tag,
  UtensilsCrossed,
  Users,
  Wrench,
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
import { useCommunityFeedSimple } from "@/core/community/hooks/feed/useCommunityFeed";
import { communityRolloutService } from "@/core/community/services";
import { residenceService } from "@/core/residence/services/ResidenceService";
import {
  COMMUNITY_FEED_HEADER_FILTERS,
  resolveCommunityFeedChannelFromTab,
  resolveCommunityFeedQueryTabFromChannel,
  type CommunityDiscoveryTab,
} from "@/core/community/utils/communityFeedTab";
import { isLaunchCommunityPostEnabled } from "@/config/launchScope";
import {
  useComunidadePage,
  type CreatePostModalData,
} from "../hooks/page/useComunidadePage";
import { CommunityFeed } from "../components/feed/CommunityFeed";
import { CommunityRightSidebar } from "../components/CommunityRightSidebar";
import { LocationScopeCards } from "../components/page/LocationScopeCards";
import { CommunityFloatingButtons } from "../components/page/CommunityFloatingButtons";
import { CommunityModals } from "../components/page/CommunityModals";
import { CreatePostModal } from "../components/composer/CreatePostModal";
import { VerificationBanner } from "@/core/verification";
import { COMMUNITY_PAGE_COPY } from "@/core/community/utils/communityCopy";
import { resolveCommunityFeedTerritoryFilter } from "@/core/community/utils/resolveCommunityFeedTerritoryFilter";
import { cn } from "@/shared/utils/cn";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { TerritoryFilter } from "@/core/location";
import { buildCommunityTabUrlFromPath } from "@/core/routing/utils/territoryUrls";
import type { TerritorialFeedChannel } from "@/core/community/hooks/feed/territorialFeedEngine";
import { getPublicPostPreview } from "@/core/posts/utils/publicPostContent";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import { withQueryParams } from "@/app/pages/CidadeLanding.utils";

const GruposPage = lazy(() => import("./GruposPage"));

type CommunityTab = "feed" | "grupos";

const TABS: { id: CommunityTab; label: string; icon: React.ElementType }[] = [
  { id: "feed",   label: "Feed",   icon: LayoutList },
  { id: "grupos", label: "Grupos", icon: Users },
];

const PUBLIC_FEED_MODULES = [
  { key: "feed", label: "Feed", icon: LayoutList },
  { key: "business", label: "Empresas", icon: Building2 },
  { key: "services", label: "Servicos", icon: Wrench },
  { key: "classifieds", label: "Classificados", icon: Tag },
  { key: "gastronomy", label: "Gastronomia", icon: UtensilsCrossed },
  { key: "map", label: "Mapa", icon: MapPin },
] as const;

interface PublicPostAuthorRecord {
  author_name?: string | null;
  author?: {
    display_name?: string | null;
  } | null;
}

function getPublicPostAuthor(post: unknown): string {
  if (!post || typeof post !== "object") return "Morador";
  const record = post as PublicPostAuthorRecord;
  const authorName = typeof record.author_name === "string" ? record.author_name.trim() : "";
  const authorDisplayName =
    typeof record.author?.display_name === "string" ? record.author.display_name.trim() : "";
  return authorName || authorDisplayName || "Morador";
}

function formatPublicPostDate(value: string | null | undefined): string {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPublicPostTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "alerta":
      return "Alerta";
    case "recomendacao":
      return "Recomendacao";
    case "enquete":
      return "Enquete";
    case "achados":
      return "Achados";
    case "desapego":
      return "Classificado";
    default:
      return "Comunidade";
  }
}

function getPublicPostTypeIcon(type: string | null | undefined) {
  switch (type) {
    case "alerta":
      return Megaphone;
    case "recomendacao":
      return BadgeCheck;
    case "desapego":
      return Tag;
    default:
      return MessageCircle;
  }
}

function PublicTerritorialFeed({
  resolved,
  territoryName,
  territoryFilter,
  activeHeaderFilter,
  onHeaderFilterChange,
  onRequireLogin,
  loginHref,
  publishHref,
}: {
  resolved?: ResolvedTerritory;
  territoryName: string;
  territoryFilter: TerritoryFilter;
  activeHeaderFilter: TerritorialFeedChannel;
  onHeaderFilterChange: (filter: TerritorialFeedChannel) => void;
  onRequireLogin: () => void;
  loginHref: string;
  publishHref: string;
}) {
  const { posts, isLoading, isError, error, hasNextPage, isFetchingNextPage, loadMore } =
    useCommunityFeedSimple({
      locationScope: "neighborhood",
      territoryFilter,
      limit: 12,
    });
  const moduleUrls = useFriendlyModuleUrls();
  const visiblePosts = posts.filter(isLaunchCommunityPostEnabled);
  const alertCount = visiblePosts.filter((post) => post.type === "alerta").length;
  const moduleLinks = [
    { ...PUBLIC_FEED_MODULES[0], href: moduleUrls.community, isActive: true },
    { ...PUBLIC_FEED_MODULES[1], href: moduleUrls.business, isActive: false },
    { ...PUBLIC_FEED_MODULES[2], href: moduleUrls.services, isActive: false },
    { ...PUBLIC_FEED_MODULES[3], href: moduleUrls.classifieds, isActive: false },
    { ...PUBLIC_FEED_MODULES[4], href: moduleUrls.gastronomy, isActive: false },
    { ...PUBLIC_FEED_MODULES[5], href: moduleUrls.map, isActive: false },
  ] as const;

  const handleShare = useCallback((postId: string) => {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?post=${encodeURIComponent(postId)}`
      : "";

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      void navigator.share({ title: territoryName, url: shareUrl }).catch(() => undefined);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
      void navigator.clipboard.writeText(shareUrl).then(() => toast.success("Link copiado"));
    }
  }, [territoryName]);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <main className="min-w-0 max-w-full overflow-x-hidden" role="feed" aria-label="Feed publico da comunidade">
        <section className="mb-4 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,24,32,0.98),rgba(7,17,24,0.98))] text-white shadow-xl shadow-black/10">
          <div className="border-b border-white/10 px-4 py-3 sm:px-5">
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {moduleLinks.map((item) => {
                const Icon = item.icon;
                return item.isActive ? (
                  <span
                    key={item.key}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/12 px-4 text-xs font-semibold text-teal-100"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={item.key}
                    to={item.href}
                    className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-teal-300">
                {territoryName}
              </p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[2rem]">
                Feed publico do bairro
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                Veja publicacoes, avisos e recomendacoes locais. Para publicar, comentar e participar dos grupos, e preciso entrar e verificar a moradia.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex min-h-8 items-center rounded-full border border-teal-300/30 bg-teal-300/10 px-3 text-xs font-semibold text-teal-100">
                  Leitura publica
                </span>
                <span className="inline-flex min-h-8 items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-3 text-xs font-semibold text-amber-100">
                  Interacao para moradores verificados
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3 sm:max-w-xl">
                <Link
                  to={loginHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar no bairro
                </Link>
                <Link
                  to={publishHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/14 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Publicar no bairro
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                  Agora no territorio
                </p>
                <p className="mt-1 text-sm text-white/65">
                  {visiblePosts.length} publicacoes publicas e {alertCount} alertas recentes em {territoryName}.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <p className="text-lg font-semibold text-white">{visiblePosts.length}</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Posts</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <p className="text-lg font-semibold text-white">{alertCount}</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Alertas</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                  <p className="text-lg font-semibold text-white">{COMMUNITY_FEED_HEADER_FILTERS.length}</p>
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Canais</p>
                </div>
              </div>
              <Link
                to={moduleUrls.map}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                <MapPin className="mr-2 h-4 w-4 text-teal-300" />
                Ver mapa do bairro
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-white/10 bg-[#0f171a] p-4 text-white shadow-xl shadow-black/10">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Explorar o feed</p>
              <p className="mt-1 text-sm text-white/55">
                Filtre o que aparece no stream publico do bairro sem sair desta pagina.
              </p>
            </div>
            <Button onClick={onRequireLogin} className="shrink-0 bg-teal-500 text-slate-950 hover:bg-teal-400">
              <LogIn className="mr-2 h-4 w-4" />
              Entrar para interagir
            </Button>
          </div>

          <div
            className="mt-4 flex min-w-0 flex-wrap gap-2 border-t border-white/10 pt-4"
            role="tablist"
            aria-label="Filtros publicos do feed"
          >
            {COMMUNITY_FEED_HEADER_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeHeaderFilter === id}
                onClick={() => onHeaderFilterChange(id)}
                className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  activeHeaderFilter === id
                    ? "border-teal-300/50 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
            Erro ao carregar feed: {error?.message ?? "tente novamente em instantes."}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-gray-400">
            <p className="text-sm font-semibold text-white/75">Nenhuma postagem publica encontrada</p>
            <p className="mt-1 text-xs text-white/45">Quando houver publicacoes deste bairro, elas aparecem aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-white/10 bg-[#10191d] p-4 text-white shadow-xl shadow-black/10">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-teal-200">
                    {React.createElement(getPublicPostTypeIcon(post.type), { className: "h-5 w-5" })}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wide text-teal-300">
                      {getPublicPostTypeLabel(post.type)}
                    </span>
                    <h2 className="mt-1 text-base font-semibold leading-snug">
                      {getPublicPostPreview(post.content, 96)}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      {getPublicPostPreview(post.content, 220)}
                    </p>
                    <p className="mt-3 text-xs text-white/45">
                      {getPublicPostAuthor(post)} · {formatPublicPostDate(post.created_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-white/55">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {post.likes_count ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments_count ?? 0}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={onRequireLogin} className="h-9 rounded-full px-3 text-xs text-white/70 hover:bg-white/5 hover:text-white">
                      <Lock className="mr-1 h-3.5 w-3.5" />
                      Comentar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onRequireLogin} className="h-9 rounded-full px-3 text-xs text-white/70 hover:bg-white/5 hover:text-white">
                      <Bookmark className="mr-1 h-3.5 w-3.5" />
                      Salvar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleShare(post.id)} className="h-9 rounded-full px-3 text-xs text-white/70 hover:bg-white/5 hover:text-white">
                      <Share2 className="mr-1 h-3.5 w-3.5" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasNextPage ? (
          <div className="mt-5 flex justify-center">
            <Button variant="outline" onClick={loadMore} disabled={isFetchingNextPage} className="border-white/15 bg-white/[0.03] text-white hover:bg-white/10">
              {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
            </Button>
          </div>
        ) : null}
      </main>

      <aside className="hidden lg:block w-80 flex-shrink-0" aria-label="Widgets da comunidade">
        <div className="sticky top-6 space-y-3">
          <section className="rounded-2xl border border-white/10 bg-[#0f171a] p-4 text-white shadow-xl shadow-black/10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              Participacao local
            </p>
            <h2 className="mt-2 text-lg font-semibold leading-tight">
              Morar aqui libera publicacao e grupos
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Entre com sua conta e confirme o endereco para comentar, publicar e participar da comunidade do bairro.
            </p>
            <div className="mt-4 grid gap-2">
              <Link
                to={loginHref}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400"
              >
                Entrar agora
              </Link>
              <Link
                to={publishHref}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/14 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                Tentar publicar
              </Link>
            </div>
          </section>
          <CommunityRightSidebar resolved={resolved} territoryFilter={territoryFilter} />
        </div>
      </aside>
    </div>
  );
}


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

  const hasApprovedCommunityAccess = isAdmin || Boolean(homeDistrict && isHomeDistrictApproved);

  React.useEffect(() => {
    if (searchParams.get("action") !== "publicar") return;
    if (!profile || !hasApprovedCommunityAccess) return;

    handleOpenCreatePost();
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete("action");
      return next;
    }, { replace: true });
  }, [handleOpenCreatePost, hasApprovedCommunityAccess, profile, searchParams, setSearchParams]);

  if (!profile && resolved && activeTab === "feed") {
    return (
      <TooltipProvider>
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#12181B]" role="main">
          <div className="mx-auto w-full max-w-[1600px] min-w-0 px-4 py-6 md:px-6 lg:px-8">
            <PublicTerritorialFeed
              resolved={resolved}
              territoryName={territoryName}
              territoryFilter={territoryFilter}
              activeHeaderFilter={feedHeaderFilter}
              onHeaderFilterChange={handleFeedHeaderFilterChange}
              onRequireLogin={handleRequireLogin}
              loginHref={loginHref}
              publishHref={publishRedirectHref}
            />
          </div>
        </div>
      </TooltipProvider>
    );
  }

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
            <Button onClick={handleRequireLogin} className="bg-teal-500 hover:bg-teal-400">
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
          defaultType={createPostModalData && "defaultType" in createPostModalData ? createPostModalData.defaultType : undefined}
          editPostId={createPostModalData && "editPostId" in createPostModalData ? createPostModalData.editPostId : undefined}
          initialContent={createPostModalData && "initialContent" in createPostModalData ? createPostModalData.initialContent : undefined}
          initialType={createPostModalData && "initialType" in createPostModalData ? createPostModalData.initialType : undefined}
          initialReach={createPostModalData && "initialReach" in createPostModalData ? createPostModalData.initialReach : undefined}
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


