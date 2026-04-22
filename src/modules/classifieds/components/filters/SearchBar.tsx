/**
 * SearchBar - Barra de busca com filtros avançados
 * 
 * SSOT: Componente reutilizável de busca e filtros
 * Sem gambiarras: Props tipadas e código limpo
 */

import React from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Package, Camera } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/utils/cn";
import { SORT_OPTIONS, CONDITION_OPTIONS } from "../../sections/types";
import type { ClassifiedsFilters } from "../../sections/types";

// ============================================
// Props
// ============================================

export interface SearchBarProps {
  readonly filters: ClassifiedsFilters;
  readonly onSearchChange: (search: string) => void;
  readonly onSortChange: (sort: string) => void;
  readonly onPriceMinChange: (value: string) => void;
  readonly onPriceMaxChange: (value: string) => void;
  readonly onConditionChange: (condition: string) => void;
  readonly onHasPhotoChange: (hasPhoto: boolean) => void;
  readonly onClearFilters: () => void;
}

// ============================================
// Component
// ============================================

export function SearchBar({
  filters,
  onSearchChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onConditionChange,
  onHasPhotoChange,
  onClearFilters,
}: SearchBarProps) {
  const [localSearch, setLocalSearch] = React.useState(filters.search || "");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const activeFiltersCount = [
    filters.sort !== "recente" && filters.sort !== "recent" ? 1 : 0,
    filters.priceMin ? 1 : 0,
    filters.priceMax ? 1 : 0,
    filters.condition !== "todos" ? 1 : 0,
    filters.hasPhoto ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="px-4 mt-3 mb-2">
      <div className="flex gap-2">
        <div
          className={cn(
            "relative flex-1 transition-all duration-200",
            searchFocused && "scale-[1.01]"
          )}
        >
          <Search
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
              searchFocused ? "text-primary" : "text-muted-foreground"
            )}
          />
          <Input
            placeholder="Buscar sofá, celular, bicicleta, imóvel..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "pl-10 h-11 text-sm rounded-xl border-2 bg-card shadow-sm transition-all",
              searchFocused
                ? "border-primary/40 shadow-primary/10 shadow-md"
                : "border-border"
            )}
            aria-label="Buscar anúncios"
          />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-2 relative shrink-0"
              aria-label="Filtros avançados"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent
            side="bottom"
            className="rounded-t-2xl max-h-[85vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="font-display">Filtros Avançados</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 py-4">
              {/* Ordenar */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Ordenar por
                </label>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onSortChange(opt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        filters.sort === opt.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condição */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Package className="h-3.5 w-3.5" /> Condição
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onConditionChange(opt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        filters.condition === opt.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick filters */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Filtros rápidos
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onHasPhotoChange(!filters.hasPhoto)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                      filters.hasPhoto
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border"
                    )}
                  >
                    <Camera className="h-3 w-3" /> Com foto
                  </button>
                </div>
              </div>

              {/* Preço */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Faixa de preço (R$)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.priceMin}
                    onChange={(e) => onPriceMinChange(e.target.value)}
                    className="h-10 text-sm rounded-xl"
                    min={0}
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input
                    type="number"
                    placeholder="Máximo"
                    value={filters.priceMax}
                    onChange={(e) => onPriceMaxChange(e.target.value)}
                    className="h-10 text-sm rounded-xl"
                    min={0}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    onClearFilters();
                    setFiltersOpen(false);
                  }}
                >
                  Limpar filtros
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={() => setFiltersOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
