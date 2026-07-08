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
  relevance: "Mais uteis no bairro",
  recommendations: "Mais recomendadas",
  rating: "Melhor avaliadas",
  distance: "Mais proximas",
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
          <p className="text-sm text-white/48">{resultCount} empresas encontradas</p>
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/38">
            filtros rapidos
          </span>
        </div>

        <div className="hidden items-center justify-between gap-3 lg:flex">
          <p className="text-sm text-white/48">{resultCount} empresas encontradas</p>

          <Select value={sortBy} onValueChange={(value) => onSortChange(value as BusinessSortOption)}>
            <SelectTrigger className="h-11 min-w-[13rem] rounded-2xl border-white/10 bg-white/[0.03] text-sm text-white focus:ring-teal-400/30 focus:ring-offset-0">
              <SelectValue placeholder="Ordenar por">
                {SORT_LABELS[sortBy]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0c141b] text-white">
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="focus:bg-white/[0.06] focus:text-white"
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
