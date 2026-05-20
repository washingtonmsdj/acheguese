/**
 * EmpresasPage
 *
 * Listagem territorial de empresas com filtros, favoritos e infinite scroll.
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

import { BusinessFilters } from "@/modules/business/components/BusinessFilters";
import { BusinessGrid } from "@/modules/business/components/BusinessGrid";
import { TerritoryIndicator, useTerritoryLabels } from "@/core/location";
import { calculateDistance, formatDistance } from "@/shared/utils/geolocation";
import { toast } from "sonner";
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
 * Página de listagem de empresas com infinite scroll.
 * Respeita o contexto territorial quando navegando em rotas territoriais.
 */
export default function EmpresasPage({ resolved, activeMemberIds }: EmpresasPageProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user, activeProfile } = useSessionContext();
  const geoState = useGeolocation();
  const territoryLabels = useTerritoryLabels(resolved);

  // Estado local
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedSortBy, setSelectedSortBy] = useState<"rating" | "recommendations_count" | "name" | "created_at">("rating");
  const { favorites, toggleFavorite } = useBusinessFavorites();
  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  // Dados
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
    sortBy: selectedSortBy,
    enabled: true,
    routeResolved: resolved,
    activeMemberIds,
  });

  // Ações
  const handleToggleFavorite = useCallback(
    async (businessId: string) => {
      if (!activeProfile) {
        toast.error("Fa\u00e7a login para favoritar empresas");
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
    navigate("/empresas/cadastrar");
  }, [navigate]);

  // Normaliza dados para renderização do grid
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
      {/* Filters */}
      <div
        className="sticky top-0 z-40 border-b bg-[#1E2529]/95 backdrop-blur-lg border-white/10"
      >
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <BusinessFilters
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedSortBy={selectedSortBy}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onSortChange={setSelectedSortBy}
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
