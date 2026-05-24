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
import {
  Building2,
  Car,
  Smartphone,
  Wrench,
  Briefcase,
  Sparkles,
  Flame,
  Star,
} from "lucide-react";
import { useClassificadosPage } from "@/modules/classifieds/hooks/useClassificadosPage";
import { CLASSIFIED_CATEGORIES, CLASSIFIED_CATEGORY_LABELS } from "@/config/categories";
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
      {/* Categorias de Destaque (Topo) */}
      <ClassifiedsCategoriesSection
        territoryName={territoryName}
        navigate={() => {}}
        categories={HIGHLIGHT_CATEGORIES}
        selectedCategory={filters.category}
        onCategoryChange={handleCategoryChange}
      />

      {/* Hero */}
      <ClassifiedsHeroSection
        territoryName={territoryName}
        navigate={() => {}}
        activeCount={activeCount}
        onNewClassificado={handleNewClassificado}
      />

      {/* Filtros e Busca */}
      <ClassifiedsFiltrosSection
        territoryName={territoryName}
        navigate={() => {}}
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
      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsTrendingSection
          territoryName={territoryName}
          navigate={() => {}}
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
      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsPopularSection
          territoryName={territoryName}
          navigate={() => {}}
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
      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsFeaturedSection
          territoryName={territoryName}
          navigate={() => {}}
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
      <ClassifiedsFooterSection
        territoryName={territoryName}
        navigate={() => {}}
        onNewClassificado={handleNewClassificado}
      />

      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsSponsoredSection
          territoryName={territoryName}
          navigate={() => {}}
          ads={featuredAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Listagem Principal */}
      <ClassifiedsListagemSection
        territoryName={territoryName}
        navigate={() => {}}
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


