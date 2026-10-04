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

const SORTABLE_OPTIONS = Object.entries(SORT_LABELS).filter(
  ([value]) => value !== "distance",
) as Array<[BusinessSortOption, string]>;

interface BusinessSortSelectProps {
  sortBy: BusinessSortOption;
  onSortChange: (value: BusinessSortOption) => void;
  compact?: boolean;
}

function BusinessSortSelect({
  sortBy,
  onSortChange,
  compact = false,
}: BusinessSortSelectProps) {
  return (
    <Select
      value={sortBy}
      onValueChange={(value) => onSortChange(value as BusinessSortOption)}
    >
      <SelectTrigger
        aria-label="Ordenar empresas"
        className={
          compact
            ? "h-10 min-w-[10.5rem] rounded-2xl border-territory-on-image/10 bg-territory-on-image/[0.03] text-xs text-territory-on-image focus:ring-territory-action-on-image/30 focus:ring-offset-0"
            : "h-11 min-w-[13rem] rounded-2xl border-territory-on-image/10 bg-territory-on-image/[0.03] text-sm text-territory-on-image focus:ring-territory-action-on-image/30 focus:ring-offset-0"
        }
      >
        <SelectValue placeholder="Ordenar por">{SORT_LABELS[sortBy]}</SelectValue>
      </SelectTrigger>
      <SelectContent className="border-territory-on-image/10 bg-territory-image-overlay text-territory-on-image">
        {SORTABLE_OPTIONS.map(([value, label]) => (
          <SelectItem
            key={value}
            value={value}
            className="focus:bg-territory-on-image/[0.06] focus:text-territory-on-image"
          >
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function EmpresasFiltrosSection({
  filters,
  activeFilters,
  onToggleFilter,
  resultCount,
  sortBy,
  onSortChange,
}: EmpresasFiltrosSectionProps) {
  const resultLabel = `${resultCount} ${resultCount === 1 ? "empresa encontrada" : "empresas encontradas"}`;

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6"
      aria-label="Filtros e ordenação de empresas"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <p
            className="text-sm text-territory-on-image/55"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {resultLabel}
          </p>
          <BusinessSortSelect
            sortBy={sortBy}
            onSortChange={onSortChange}
            compact
          />
        </div>

        <div className="hidden items-center justify-between gap-3 lg:flex">
          <p
            className="text-sm text-territory-on-image/50"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {resultLabel}
          </p>

          <BusinessSortSelect sortBy={sortBy} onSortChange={onSortChange} />
        </div>

        <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2" aria-label="Filtros rápidos">
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
