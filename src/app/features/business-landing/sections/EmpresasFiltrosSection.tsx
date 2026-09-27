import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { QuickFilterChip } from "../components/filters";
import type { BusinessSortOption, EmpresasFiltrosSectionProps } from "./types";

const SORT_LABELS: Record<BusinessSortOption, string> = {
  relevance: "Mais úteis no bairro",
  recommendations: "Mais recomendadas",
  rating: "Melhor avaliadas",
  distance: "Mais próximas",
  recent: "Mais recentes",
};

export function EmpresasFiltrosSection({
  filters,
  activeFilters,
  onToggleFilter,
  resultCount,
  sortBy,
  onSortChange,
}: EmpresasFiltrosSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <p className="text-sm text-territory-muted">{resultCount} empresas encontradas</p>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-territory-muted">
            filtros rápidos
          </span>
        </div>

        <div className="hidden items-center justify-between gap-3 lg:flex">
          <p className="text-sm text-territory-muted">{resultCount} empresas encontradas</p>

          <Select value={sortBy} onValueChange={(value) => onSortChange(value as BusinessSortOption)}>
            <SelectTrigger className="h-11 min-w-[13rem] rounded-2xl border-territory-border bg-territory-raised text-sm text-territory-ink focus:ring-territory-focus focus:ring-offset-0">
              <SelectValue placeholder="Ordenar por">
                {SORT_LABELS[sortBy]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-territory-border bg-territory-surface text-territory-ink">
              {Object.entries(SORT_LABELS)
                .filter(([value]) => value !== "distance")
                .map(([value, label]) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="focus:bg-territory-raised focus:text-territory-ink"
                  >
                    {label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {filters.map((filter) => (
              <QuickFilterChip
                key={filter.id}
                filter={filter}
                isActive={activeFilters.includes(filter.id)}
                onClick={() => onToggleFilter(filter.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
