/**
 * EmpresasFiltrosSection
 * 
 * Seção de filtros rápidos
 */

import { QuickFilterChip } from "../components/filters";
import type { EmpresasFiltrosSectionProps } from "./types";

export function EmpresasFiltrosSection({
  filters,
  activeFilters,
  onToggleFilter,
  navigate,
}: EmpresasFiltrosSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4 w-full">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((chip) => (
          <QuickFilterChip
            key={chip.label}
            filter={chip}
            isActive={activeFilters.includes(chip.label)}
            onClick={() => onToggleFilter(chip.label)}
          />
        ))}
      </div>
    </section>
  );
}
