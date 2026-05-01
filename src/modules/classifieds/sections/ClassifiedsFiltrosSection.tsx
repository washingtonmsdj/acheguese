/**
 * ClassifiedsFiltrosSection - Filtros e busca
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { SearchBar, CategoryChips } from "../components/filters";
import { CLASSIFIED_CATEGORIES } from "@/modules/classifieds/constants/categories";
import type { ClassifiedsFiltrosSectionProps } from "./types";

export function ClassifiedsFiltrosSection({
  filters,
  onSearchChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onConditionChange,
  onHasPhotoChange,
  onStateSlugChange,
  onCitySlugChange,
  onLocationSlugChange,
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
        onStateSlugChange={onStateSlugChange}
        onCitySlugChange={onCitySlugChange}
        onLocationSlugChange={onLocationSlugChange}
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


