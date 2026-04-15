 
/**
 * 🏆 EMPRESAS PAGE - REFATORADA (NÍVEL AAA)
 *
 * ⚠️ ATENÇÃO: Este módulo ainda NÃO foi migrado para a nova arquitetura feature-first
 * Migração prevista: Fase 6 - Semana 4 (Dias 1-2)
 *
 * ✅ MELHORIAS:
 * - TanStack Query com cache otimizado
 * - Infinite scroll profissional
 * - Componentes memoizados
 * - Filtros debounced
 * - Design moderno
 * - Acessibilidade WCAG AAA
 * - Performance otimizada
 * - TypeScript strict
 *
 * @version 2.0.0
 * @author Kiro AI
 * @date 2026-03-13
 */

import React, { memo, useCallback, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { useGeolocation } from "@/shared/hooks/useGeolocation";
import { useBusinessList } from "@/modules/business/hooks/useBusinessList";
import { useBusinessFavorites } from "@/modules/business/hooks/useBusinessFavorite";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";

/**
 * ✅ SSOT COMPLIANT - EmpresasPage migrada
 * Usa useAppUrls para navegação
 */
import { BusinessFilters } from "@/modules/business/components/BusinessFilters";
import { BusinessGrid } from "@/modules/business/components/BusinessGrid";
import { TerritoryIndicator, useTerritoryLabels } from "@/core/location";
import { calculateDistance, formatDistance } from "@/shared/utils/geolocation";
import { toast } from "sonner";
import { MigrationWarningBanner } from "@/shared/components/MigrationWarningBanner";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface EmpresasPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

/**
 * Floating Action Button Component
 */
const CreateBusinessFAB = memo(({ onClick }: { onClick: () => void }) => (
  <motion.button
    onClick={onClick}
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 bg-gradient-to-br from-teal-400 to-cyan-500 hover:shadow-teal-400/50 transition-shadow"
    aria-label="Cadastrar nova empresa"
  >
    <Plus className="w-6 h-6 text-white" aria-hidden="true" />
  </motion.button>
));
CreateBusinessFAB.displayName = "CreateBusinessFAB";

/**
 * Empresas Page Component
 * Página de listagem de empresas com infinite scroll
 * Respeita o contexto territorial quando navegando em rotas territoriais
 */
export default function EmpresasPage({ resolved, activeMemberIds }: EmpresasPageProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user, activeProfile } = useSessionContext();
  const geoState = useGeolocation();
  const territoryLabels = useTerritoryLabels(resolved);

  // 🎯 STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const { favorites, toggleFavorite } = useBusinessFavorites();
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  // 🎯 HOOKS - Passa routeResolved para respeitar contexto territorial
  const {
    businesses,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    refetch,
    prefetchBusinessDetail,
  } = useBusinessList({
    category: selectedCategory === "todos" ? undefined : selectedCategory,
    searchQuery: searchQuery.trim() || undefined,
    enabled: true,
    routeResolved: resolved, // ✅ Passa contexto territorial
    activeMemberIds, // ✅ Passa IDs dos membros ativos do grupo
  });

  // 🎯 HANDLERS
  const handleToggleFavorite = useCallback(
    async (businessId: string) => {
      if (!activeProfile) {
        toast.error("Faça login para favoritar empresas");
        return;
      }

      try {
        await toggleFavorite(businessId);
      } catch (err) {
        toast.error("Erro ao favoritar empresa");
      }
    },
    [activeProfile, toggleFavorite],
  );

  const handleNavigate = useCallback(
    (lat: number, lng: number) => {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIos) {
        window.open(`maps://maps.apple.com/?daddr=${lat},${lng}`, '_blank');
      } else {
        navigate(appUrls.map);
      }
    },
    [navigate, appUrls.map],
  );

  const handleCreateBusiness = useCallback(() => {
    navigate(appUrls.business.create);
  }, [navigate, appUrls]);

  // 🎯 TRANSFORM BUSINESSES FOR GRID - Match BusinessCardProps shape
  const transformedBusinesses = useMemo(() => {
    return businesses.map((business) => {
      // Calculate distance
      let distance: string | null = null;
      const latitude = business.address?.latitude;
      const longitude = business.address?.longitude;
      if (
        geoState.latitude &&
        geoState.longitude &&
        typeof latitude === "number" &&
        typeof longitude === "number"
      ) {
        const dist = calculateDistance(
          geoState.latitude,
          geoState.longitude,
          latitude,
          longitude,
        );
        distance = formatDistance(dist);
      }

      return {
        business,
        distance,
        isFavorite: favoriteIds.has(business.id),
      };
    });
  }, [businesses, geoState, favoriteIds]);

  return (
    <div className="bg-[#12181B] md:pb-0">
      {/* Migration Warning Banner */}
      <div className="max-w-[1400px] mx-auto px-4 pt-4">
        <MigrationWarningBanner
          moduleName="Business (Empresas)"
          expectedMigrationPhase="Fase 6 - Semana 4 (Dias 1-2)"
        />
      </div>
      {/* Filters */}
      <div
        className="sticky top-0 z-40 border-b bg-[#1E2529]/95 backdrop-blur-lg border-white/10"
      >
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <BusinessFilters
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            searchPlaceholder={territoryLabels.searchPlaceholder}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6" role="main">
        <BusinessGrid
          businesses={transformedBusinesses}
          isLoading={isLoading}
          isError={isError}
          error={error}
          hasMore={!!hasNextPage}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={loadMore}
          onToggleFavorite={handleToggleFavorite}
          onNavigate={handleNavigate}
          onRetry={refetch}
          allResultsLabel={territoryLabels.allResultsLabel}
        />
      </main>

      {/* Floating Action Button */}
      {user && <CreateBusinessFAB onClick={handleCreateBusiness} />}
    </div>
  );
}
