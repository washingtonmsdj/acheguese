/**
 * ClassifiedsFiltrosSection - Filtros e busca
 * 
 * SSOT: Section modular e reutilizÃ¡vel
 * Sem gambiarras: Props tipadas e cÃ³digo limpo
 */

import { SearchBar, CategoryChips } from "../components/filters";
import { CLASSIFIED_CATEGORIES } from "@/core/classifieds/constants/categories";
import type { ClassifiedsFiltrosSectionProps } from "./types";

export function ClassifiedsFiltrosSection({
  filters,
  onSearchChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onConditionChange,
  onHasPhotoChange,
  onClearFilters,
  onCategoryChange,
}: ClassifiedsFiltrosSectionProps) {
  return (
    <>
      {/* Search Bar */}
      <SearchBar
        filters={filters}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onPriceMinChange={onPriceMinChange}
        onPriceMaxChange={onPriceMaxChange}
        onConditionChange={onConditionChange}
        onHasPhotoChange={onHasPhotoChange}
        onClearFilters={onClearFilters}
      />

      {/* Category Chips */}
      <CategoryChips
        categories={CLASSIFIED_CATEGORIES}
        selectedCategory={filters.category}
        onCategoryChange={onCategoryChange}
      />
    </>
  );
}

