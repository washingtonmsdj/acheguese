import React from "react";
import { ClassificadoFilters } from "./ClassificadoFilters";
import { ClassificadoGrid } from "./ClassificadoGrid";
import type { ClassificadoWithVendedor } from "@/core/classifieds/hooks/useClassificados";
import type { ClassificadosFilters as FiltersType } from "@/modules/classifieds/hooks/useClassificadosPage";

interface ClassificadosContentProps {
  // Data
  classificados: ClassificadoWithVendedor[];
  filters: FiltersType;

  // Loading states
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;

  // Filter handlers
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onPriceMinChange: (priceMin: string) => void;
  onPriceMaxChange: (priceMax: string) => void;
  onClearFilters: () => void;

  // Actions
  onClassificadoClick: (classificado: ClassificadoWithVendedor) => void;
  onLoadMore: () => void;
}

export function ClassificadosContent({
  classificados,
  filters,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onCategoryChange,
  onSearchChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onClearFilters,
  onClassificadoClick,
  onLoadMore,
}: ClassificadosContentProps) {
  return (
    <>
      {/* Filters */}
      <div className="px-4 mt-3">
        <ClassificadoFilters
          category={filters.category}
          search={filters.search}
          sort={filters.sort}
          priceMin={filters.priceMin}
          priceMax={filters.priceMax}
          onCategoryChange={onCategoryChange}
          onSearchChange={onSearchChange}
          onSortChange={onSortChange}
          onPriceMinChange={onPriceMinChange}
          onPriceMaxChange={onPriceMaxChange}
          onClearFilters={onClearFilters}
        />
      </div>

      {/* Grid */}
      <div className="px-4 pb-4 flex-1">
        <ClassificadoGrid
          classificados={classificados}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onLoadMore={onLoadMore}
          onClassificadoClick={onClassificadoClick}
        />
      </div>
    </>
  );
}
