/**
 * ClassificadosPage - Página pública de classificados (REFATORADA)
 * 
 * SSOT: Usa sections modulares e layout reutilizável
 * Sem gambiarras: Código limpo e organizado
 * 
 * Responsabilidades:
 * - Carregar dados via hooks
 * - Processar somente coleções derivadas de sinais reais
 * - Construir props específicas por section
 * - Renderizar layout + sections
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Car,
  Smartphone,
  Wrench,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useClassificadosPage } from "@/modules/classifieds/hooks/useClassificadosPage";
import { CLASSIFIED_CATEGORIES, CLASSIFIED_CATEGORY_LABELS } from "@/core/taxonomy/categories";
import { ClassificadosLayout } from "./ClassificadosLayout";
import {
  ClassifiedsHeroSection,
  ClassifiedsCategoriesSection,
  ClassifiedsFiltrosSection,
  ClassifiedsRecentSection,
  ClassifiedsCategorySampleSection,
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
  const navigate = useNavigate();
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

  // Coleção factual: anúncios ativos ordenados pela data de publicação.
  const recentAds = useMemo(() => {
    return [...classificados]
      .filter((c) => c.status === "active")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 8);
  }, [classificados]);

  // Coleção factual: uma amostra de anúncios ativos, no máximo um por categoria.
  const categorySampleAds = useMemo(() => {
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

  return (
    <ClassificadosLayout>
      {/* Categorias de Destaque (Topo) */}
      <ClassifiedsCategoriesSection
        territoryName={territoryName}
        navigate={navigate}
        categories={HIGHLIGHT_CATEGORIES}
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

      {/* Coleções derivadas somente de sinais disponíveis no dado real */}
      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsRecentSection
          territoryName={territoryName}
          navigate={navigate}
          ads={recentAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {!isLoading && viewMode === "anuncios" && (
        <ClassifiedsCategorySampleSection
          territoryName={territoryName}
          navigate={navigate}
          ads={categorySampleAds}
          onAdClick={handleClassificadoClick}
        />
      )}

      {/* Mini Banner */}
      <ClassificadosFooterSection
        territoryName={territoryName}
        navigate={navigate}
        onNewClassificado={handleNewClassificado}
      />

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


