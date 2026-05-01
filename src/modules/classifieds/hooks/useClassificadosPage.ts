import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  useClassificados,
  type ClassificadoWithVendedor,
} from "./useClassificados";
import { useVendedores } from "./useVendedores";
import { useClassifiedUrls } from "./useClassifiedUrls";
import { classifiedUrlService } from "@/modules/classifieds/services";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export type ViewMode = "anuncios" | "vendedores";

export interface ClassificadosFilters {
  category: string;
  search: string;
  sortBy: string;
  sort: string;
  priceMin: string;
  priceMax: string;
  condition: string;      // novo | usado | seminovo | todos
  delivery: string;       // entrega | retirada | todos
  hasPhoto: boolean;
  sellerType: string;     // profissional | particular | todos
  stateSlug: string;
  citySlug: string;
  locationSlug: string;
}

interface UseClassificadosPageOptions {
  routeResolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

const DEFAULT_FILTERS: ClassificadosFilters = {
  category: "todos",
  search: "",
  sortBy: "recent",
  sort: "recent",
  priceMin: "",
  priceMax: "",
  condition: "todos",
  delivery: "todos",
  hasPhoto: false,
  sellerType: "todos",
  stateSlug: "",
  citySlug: "",
  locationSlug: "",
};

export function useClassificadosPage(options: UseClassificadosPageOptions = {}) {
  const { routeResolved, activeMemberIds } = options;
  const navigate = useNavigate();
  const classifiedUrls = useClassifiedUrls();
  const [viewMode, setViewMode] = useState<ViewMode>("anuncios");
  const [filters, setFilters] = useState<ClassificadosFilters>(DEFAULT_FILTERS);

  const { classificados, isLoading } = useClassificados({
    filters: {
      category: filters.category !== "todos" ? filters.category : undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      priceMin: filters.priceMin ? parseFloat(filters.priceMin) : undefined,
      priceMax: filters.priceMax ? parseFloat(filters.priceMax) : undefined,
    },
    routeResolved,
    activeMemberIds,
    uiTerritoryFilter:
      filters.stateSlug && filters.citySlug
        ? {
            stateSlug: filters.stateSlug,
            citySlug: filters.citySlug,
            locationSlug: filters.locationSlug || undefined,
          }
        : undefined,
  });

  const { vendedores, isLoading: isLoadingVendedores } = useVendedores({
    routeResolved,
    activeMemberIds,
    search: filters.search || undefined,
  });

  // Filtros locais adicionais (condição, foto, tipo vendedor)
  const filteredClassificados = classificados.filter((c) => {
    if (filters.hasPhoto && (!c.fotos || c.fotos.length === 0)) return false;
    if (filters.condition !== "todos" && c.condition && c.condition !== filters.condition) return false;
    return true;
  });

  const activeCount = filteredClassificados.filter((c) => c.status === "active").length;

  const handleCategoryChange = useCallback(
    (cat: string) => setFilters((f) => ({ ...f, category: cat })),
    [],
  );
  const handleSearchChange = useCallback(
    (s: string) => setFilters((f) => ({ ...f, search: s })),
    [],
  );
  const handleSortChange = useCallback(
    (s: string) => setFilters((f) => ({ ...f, sortBy: s, sort: s })),
    [],
  );
  const handlePriceMinChange = useCallback(
    (v: string) => setFilters((f) => ({ ...f, priceMin: v })),
    [],
  );
  const handlePriceMaxChange = useCallback(
    (v: string) => setFilters((f) => ({ ...f, priceMax: v })),
    [],
  );
  const handleConditionChange = useCallback(
    (v: string) => setFilters((f) => ({ ...f, condition: v })),
    [],
  );
  const handleDeliveryChange = useCallback(
    (v: string) => setFilters((f) => ({ ...f, delivery: v })),
    [],
  );
  const handleHasPhotoChange = useCallback(
    (v: boolean) => setFilters((f) => ({ ...f, hasPhoto: v })),
    [],
  );
  const handleSellerTypeChange = useCallback(
    (v: string) => setFilters((f) => ({ ...f, sellerType: v })),
    [],
  );
  const handleClearFilters = useCallback(
    () => setFilters(DEFAULT_FILTERS),
    [],
  );
  const handleStateSlugChange = useCallback(
    (value: string) =>
      setFilters((f) => ({
        ...f,
        stateSlug: value,
        citySlug: value === f.stateSlug ? f.citySlug : "",
        locationSlug: "",
      })),
    [],
  );
  const handleCitySlugChange = useCallback(
    (value: string) =>
      setFilters((f) => ({
        ...f,
        citySlug: value,
        locationSlug: "",
      })),
    [],
  );
  const handleLocationSlugChange = useCallback(
    (value: string) => setFilters((f) => ({ ...f, locationSlug: value })),
    [],
  );
  const handleClassificadoClick = useCallback(
    (c: ClassificadoWithVendedor) => {
      if (c.geographic_path && c.category_slug && c.subcategory_slug && c.slug && c.public_id) {
        const urls = classifiedUrlService.buildUrls({
          id: c.id,
          public_id: c.public_id,
          slug: c.slug,
          geographic_path: c.geographic_path,
          category_slug: c.category_slug,
          subcategory_slug: c.subcategory_slug,
        });
        navigate(urls.canonical);
      } else {
        navigate(classifiedUrls.short(c.public_id));
      }
    },
    [navigate, classifiedUrls],
  );
  const handleNewClassificado = useCallback(
    () => navigate(classifiedUrls.new),
    [navigate, classifiedUrls],
  );
  const handleLoadMore = useCallback(() => {}, []);

  return {
    // View mode
    viewMode,
    setViewMode,

    // Data
    classificados: filteredClassificados,
    vendedores,
    activeCount,
    filters,
    
    // Loading
    isLoading: viewMode === "anuncios" ? isLoading : isLoadingVendedores,
    isFetchingNextPage: false,
    hasNextPage: false,

    // Filter handlers
    handleCategoryChange,
    handleSearchChange,
    handleSortChange,
    handlePriceMinChange,
    handlePriceMaxChange,
    handleConditionChange,
    handleDeliveryChange,
    handleHasPhotoChange,
    handleSellerTypeChange,
    handleStateSlugChange,
    handleCitySlugChange,
    handleLocationSlugChange,
    handleClearFilters,

    // Actions
    handleClassificadoClick,
    handleNewClassificado,
    handleLoadMore,
  };
}

