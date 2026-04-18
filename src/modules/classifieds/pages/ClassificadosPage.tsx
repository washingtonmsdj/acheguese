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
} from "lucide-react";
import { useClassificadosPage } from "@/modules/classifieds/hooks/useClassificadosPage";
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
    id: "imóveis",
    label: "Imóveis",
    emoji: "🏠",
    icon: Building2,
    bg: "bg-blue-500/15 border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    id: "veículos",
    label: "Autos",
    emoji: "🚗",
    icon: Car,
    bg: "bg-red-500/15 border-red-500/20",
    iconColor: "text-red-400",
  },
  {
    id: "eletrônicos",
    label: "Eletrônicos",
    emoji: "📱",
    icon: Smartphone,
    bg: "bg-purple-500/15 border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    id: "serviços",
    label: "Serviços",
    emoji: "🔧",
    icon: Wrench,
    bg: "bg-amber-500/15 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    id: "vagas",
    label: "Vagas",
    emoji: "💼",
    icon: Briefcase,
    bg: "bg-emerald-500/15 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    id: "games",
    label: "Games",
    emoji: "🎮",
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
        onClearFilters={handleClearFilters}
        onCategoryChange={handleCategoryChange}
      />

      {/* Em Alta (Trending) */}
      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsTrendingSection
          territoryName={territoryName}
          navigate={() => {}}
          ads={trendingAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Mais Procurados */}
      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsPopularSection
          territoryName={territoryName}
          navigate={() => {}}
          ads={mostWantedAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Destaques Premium */}
      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsFeaturedSection
          territoryName={territoryName}
          navigate={() => {}}
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
        vendedores={vendedores}
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
