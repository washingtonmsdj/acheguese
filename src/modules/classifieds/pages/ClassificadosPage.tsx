/**
 * ClassificadosPage - Página pública de classificados (REFATORADA)
 * 
 * SSOT: Usa sections modulares e layout reutilizável
 * Sem gambiarras: Código limpo e organizado
 * 
 * Responsabilidades:
 * - Carregar dados via hooks
 * - Processar dados derivados (trending, popular, featured)
 * - Construir props específicas por section
 * - Renderizar layout + sections
 */

import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Car,
  Smartphone,
  Wrench,
  Briefcase,
  Sparkles,
  Flame,
  Star,
  LayoutList,
  Tag,
  UtensilsCrossed,
  MapPin,
  Plus,
} from "lucide-react";
import { useClassificadosPage } from "@/modules/classifieds/hooks/useClassificadosPage";
import { CLASSIFIED_CATEGORIES, CLASSIFIED_CATEGORY_LABELS } from "@/config/categories";
import { isLaunchClassifiedCategoryEnabled } from "@/config/launchScope";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import { ClassificadosLayout } from "./ClassificadosLayout";
import {
  ClassifiedsHeroSection,
  ClassifiedsCategoriesSection,
  ClassifiedsFiltrosSection,
  ClassifiedsTrendingSection,
  ClassifiedsPopularSection,
  ClassifiedsFeaturedSection,
  ClassifiedsSponsoredSection,
  ClassifiedsListagemSection,
  ClassifiedsFooterSection,
} from "../sections";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type { HighlightCategory } from "../sections/types";

// ============================================
// Constants
// ============================================

const HIGHLIGHT_CATEGORIES: readonly HighlightCategory[] = [
  {
    id: CLASSIFIED_CATEGORIES.REAL_ESTATE,
    label: CLASSIFIED_CATEGORY_LABELS[CLASSIFIED_CATEGORIES.REAL_ESTATE],
    icon: Building2,
    bg: "bg-blue-500/15 border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    id: CLASSIFIED_CATEGORIES.VEHICLES,
    label: CLASSIFIED_CATEGORY_LABELS[CLASSIFIED_CATEGORIES.VEHICLES],
    icon: Car,
    bg: "bg-red-500/15 border-red-500/20",
    iconColor: "text-red-400",
  },
  {
    id: CLASSIFIED_CATEGORIES.ELECTRONICS,
    label: CLASSIFIED_CATEGORY_LABELS[CLASSIFIED_CATEGORIES.ELECTRONICS],
    icon: Smartphone,
    bg: "bg-purple-500/15 border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    id: CLASSIFIED_CATEGORIES.SERVICES,
    label: CLASSIFIED_CATEGORY_LABELS[CLASSIFIED_CATEGORIES.SERVICES],
    icon: Wrench,
    bg: "bg-amber-500/15 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    id: CLASSIFIED_CATEGORIES.JOBS,
    label: CLASSIFIED_CATEGORY_LABELS[CLASSIFIED_CATEGORIES.JOBS],
    icon: Briefcase,
    bg: "bg-emerald-500/15 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: CLASSIFIED_CATEGORIES.FURNITURE,
    label: CLASSIFIED_CATEGORY_LABELS[CLASSIFIED_CATEGORIES.FURNITURE],
    icon: Sparkles,
    bg: "bg-pink-500/15 border-pink-500/20",
    iconColor: "text-pink-400",
  },
] as const;

const COMMUNITY_MODULE_TABS = [
  { key: "feed", label: "Feed", icon: LayoutList },
  { key: "business", label: "Empresas", icon: Building2 },
  { key: "services", label: "Servicos", icon: Wrench },
  { key: "classifieds", label: "Classificados", icon: Tag },
  { key: "gastronomy", label: "Gastronomia", icon: UtensilsCrossed },
  { key: "map", label: "Mapa", icon: MapPin },
] as const;

function NeighborhoodClassifiedsHero({
  territoryName,
  activeCount,
  sellersCount,
  moduleUrls,
  onNewClassificado,
}: {
  territoryName: string;
  activeCount: number;
  sellersCount: number;
  moduleUrls: ReturnType<typeof useFriendlyModuleUrls>;
  onNewClassificado: () => void;
}) {
  const moduleLinks = [
    { ...COMMUNITY_MODULE_TABS[3], href: moduleUrls.classifieds, isActive: true },
    { ...COMMUNITY_MODULE_TABS[0], href: moduleUrls.community, isActive: false },
    { ...COMMUNITY_MODULE_TABS[1], href: moduleUrls.business, isActive: false },
    { ...COMMUNITY_MODULE_TABS[2], href: moduleUrls.services, isActive: false },
    { ...COMMUNITY_MODULE_TABS[4], href: moduleUrls.gastronomy, isActive: false },
    { ...COMMUNITY_MODULE_TABS[5], href: moduleUrls.map, isActive: false },
  ] as const;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 md:py-5">
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,30,0.98),rgba(7,17,24,0.98))] text-white shadow-xl shadow-black/10">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {moduleLinks.map((item) => {
              const Icon = item.icon;
              return item.isActive ? (
                <span
                  key={item.key}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-pink-300/35 bg-pink-300/12 px-4 text-xs font-semibold text-pink-100"
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

        <div className="grid gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-pink-200">
              {territoryName}
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[2rem]">
              Classificados do bairro
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
              Compre, venda e encontre oportunidades dentro do territorio, com anuncios ligados ao contexto da comunidade.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-pink-300/30 bg-pink-300/10 px-3 text-xs font-semibold text-pink-100">
                Leitura publica
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-3 text-xs font-semibold text-amber-100">
                Anuncios locais
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:max-w-xl sm:grid-cols-2 sm:gap-3">
              <button
                type="button"
                onClick={onNewClassificado}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-pink-400 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-pink-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Publicar anuncio
              </button>
              <Link
                to={moduleUrls.map}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/14 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Ver mapa do bairro
              </Link>
            </div>
          </div>

          <div className="hidden gap-3 rounded-[20px] border border-white/10 bg-black/20 p-4 sm:grid">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Mercado local
              </p>
              <p className="mt-1 text-sm leading-5 text-white/65">
                {activeCount} anuncios ativos e {sellersCount} vendedores no territorio.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-lg font-semibold text-white">{activeCount}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Anuncios</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-lg font-semibold text-white">{sellersCount}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Vendedores</p>
              </div>
            </div>
            <div className="rounded-2xl border border-pink-300/15 bg-pink-300/[0.05] px-3 py-3 text-sm text-white/68">
              A listagem usa o SSOT territorial, mantendo busca, filtros e reputacao dentro do bairro.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// Props
// ============================================

interface ClassificadosPageProps {
  readonly resolved?: ResolvedTerritory;
  readonly activeMemberIds?: string[];
}

// ============================================
// Component
// ============================================

export default function ClassificadosPage({
  resolved,
  activeMemberIds,
}: ClassificadosPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const moduleUrls = useFriendlyModuleUrls();
  const isCommunityScopedSurface = location.pathname.includes("/comunidade/");
  const {
    viewMode,
    setViewMode,
    classificados,
    vendedores,
    activeCount,
    filters,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    handleCategoryChange,
    handleSearchChange,
    handleSortChange,
    handlePriceMinChange,
    handlePriceMaxChange,
    handleConditionChange,
    handleHasPhotoChange,
    handleStateSlugChange,
    handleCitySlugChange,
    handleLocationSlugChange,
    handleClearFilters,
    handleClassificadoClick,
    handleNewClassificado,
    handleLoadMore,
  } = useClassificadosPage({ routeResolved: resolved, activeMemberIds });

  // Extrair nome do território
  const territoryName = useMemo(() => {
    if (!resolved) return "Sua Região";
    const name =
      resolved.kind === "location"
        ? resolved.location.name
        : resolved.group.name;
    return name;
  }, [resolved]);

  // Em alta: recém-criados
  const trendingAds = useMemo(() => {
    return [...classificados]
      .filter((c) => c.status === "active")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 8);
  }, [classificados]);

  // Mais procurados: diversidade de categorias
  const mostWantedAds = useMemo(() => {
    const seen = new Set<string>();
    return classificados
      .filter((c) => c.status === "active")
      .filter((c) => {
        if (seen.has(c.categoria)) return false;
        seen.add(c.categoria);
        return true;
      })
      .slice(0, 6);
  }, [classificados]);

  // Destaques premium: mais caros
  const featuredAds = useMemo(() => {
    return [...classificados]
      .filter((c) => c.status === "active")
      .sort((a, b) => (b.preco || 0) - (a.preco || 0))
      .slice(0, 6);
  }, [classificados]);

  return (
    <ClassificadosLayout>
      {isCommunityScopedSurface ? (
        <NeighborhoodClassifiedsHero
          territoryName={territoryName}
          activeCount={activeCount}
          sellersCount={vendedores.length}
          moduleUrls={moduleUrls}
          onNewClassificado={handleNewClassificado}
        />
      ) : (
        <>
          {/* Categorias de Destaque (Topo) */}
          <ClassifiedsCategoriesSection
            territoryName={territoryName}
            navigate={navigate}
            categories={HIGHLIGHT_CATEGORIES.filter((category) =>
              isLaunchClassifiedCategoryEnabled(category.id)
            )}
            selectedCategory={filters.category}
            onCategoryChange={handleCategoryChange}
          />

          {/* Hero */}
          <ClassifiedsHeroSection
            territoryName={territoryName}
            navigate={navigate}
            activeCount={activeCount}
            onNewClassificado={handleNewClassificado}
          />
        </>
      )}

      {isCommunityScopedSurface ? (
        <ClassifiedsCategoriesSection
          territoryName={territoryName}
          navigate={navigate}
          categories={HIGHLIGHT_CATEGORIES.filter((category) =>
            isLaunchClassifiedCategoryEnabled(category.id)
          )}
          selectedCategory={filters.category}
          onCategoryChange={handleCategoryChange}
        />
      ) : null}

      {/* Filtros e Busca */}
      <ClassifiedsFiltrosSection
        territoryName={territoryName}
        navigate={navigate}
        filters={filters}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onPriceMinChange={handlePriceMinChange}
        onPriceMaxChange={handlePriceMaxChange}
        onConditionChange={handleConditionChange}
        onHasPhotoChange={handleHasPhotoChange}
        onStateSlugChange={handleStateSlugChange}
        onCitySlugChange={handleCitySlugChange}
        onLocationSlugChange={handleLocationSlugChange}
        onClearFilters={handleClearFilters}
        onCategoryChange={handleCategoryChange}
      />

      {/* Em Alta (Trending) */}
      {!isCommunityScopedSurface && !isLoading && viewMode === "anuncios" && (
        <ClassifiedsTrendingSection
          territoryName={territoryName}
          navigate={navigate}
          title="Em alta"
          subtitle="Anúncios com maior tração"
          icon={<Flame className="h-4 w-4 text-orange-400" />}
          badgeText="Alta"
          badgeColor="bg-orange-500/90"
          ads={trendingAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Mais Procurados */}
      {!isCommunityScopedSurface && !isLoading && viewMode === "anuncios" && (
        <ClassifiedsPopularSection
          territoryName={territoryName}
          navigate={navigate}
          title="Mais procurados"
          subtitle="Categorias com maior procura"
          icon={<Sparkles className="h-4 w-4 text-emerald-400" />}
          badgeText="Popular"
          badgeColor="bg-emerald-500/90"
          ads={mostWantedAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Destaques Premium */}
      {!isCommunityScopedSurface && !isLoading && viewMode === "anuncios" && (
        <ClassifiedsFeaturedSection
          territoryName={territoryName}
          navigate={navigate}
          title="Destaques"
          subtitle="Itens premium selecionados"
          icon={<Star className="h-4 w-4 text-amber-400" />}
          badgeText="Premium"
          badgeColor="bg-amber-500/90"
          ads={featuredAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Mini Banner + Patrocinados */}
      {!isCommunityScopedSurface ? (
        <ClassifiedsFooterSection
          territoryName={territoryName}
          navigate={navigate}
          onNewClassificado={handleNewClassificado}
        />
      ) : null}

      {!isCommunityScopedSurface && !isLoading && viewMode === "anuncios" && (
        <ClassifiedsSponsoredSection
          territoryName={territoryName}
          navigate={navigate}
          ads={featuredAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Listagem Principal */}
      <ClassifiedsListagemSection
        territoryName={territoryName}
        navigate={navigate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        classificados={classificados}
        vendedores={vendedores.map((v) => ({ ...v, nome: v.name ?? "" }))}
        adsCount={activeCount}
        sellersCount={vendedores.length}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        onLoadMore={handleLoadMore}
        onClassificadoClick={handleClassificadoClick}
      />
    </ClassificadosLayout>
  );
}


