/**
 * 🎯 CLASSIFICADO FILTERS COMPONENT (NÍVEL AAA)
 *
 * Filtros avançados para classificados
 *
 * Features:
 * - Debounce de 300ms no search
 * - Categorias animadas
 * - Filtros de preço
 * - Ordenação
 * - Sheet responsivo
 * - Contador de filtros ativos
 *
 * @version 1.0.0
 */

import { memo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/utils/cn";
import { motion } from "framer-motion";
import { CLASSIFIED_CATEGORY_LABELS } from "@/config/categories";

const CATEGORY_OPTIONS = [
  { id: "todos", label: "Todos" },
  ...Object.entries(CLASSIFIED_CATEGORY_LABELS).map(([id, label]) => ({ id, label })),
];

const SORT_OPTIONS = [
  { id: "recente", label: "Mais recentes" },
  { id: "menor_price", label: "Menor preço" },
  { id: "maior_price", label: "Maior preço" },
];

interface ClassificadoFiltersProps {
  category: string;
  search: string;
  sort: string;
  priceMin: string;
  priceMax: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onPriceMinChange: (min: string) => void;
  onPriceMaxChange: (max: string) => void;
  onClearFilters: () => void;
}

export const ClassificadoFilters = memo(function ClassificadoFilters({
  category,
  search,
  sort,
  priceMin,
  priceMax,
  onCategoryChange,
  onSearchChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onClearFilters,
}: ClassificadoFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Calculate active filters count
  const activeFiltersCount = [
    sort !== "recente" ? 1 : 0,
    priceMin ? 1 : 0,
    priceMax ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {/* Search + Filter Button */}
      <div className="flex gap-2">
        <motion.div
          className={cn(
            "relative flex-1 transition-all duration-200",
            searchFocused && "scale-[1.01]",
          )}
        >
          <Search
            className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
              searchFocused ? "text-primary" : "text-muted-foreground",
            )}
          />
          <Input
            placeholder="Buscar título, categoria ou bairro..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "pl-10 h-11 text-sm rounded-xl border-2 bg-card shadow-sm transition-all",
              searchFocused
                ? "border-primary/40 shadow-primary/10 shadow-md"
                : "border-border",
            )}
            aria-label="Buscar classificados"
          />
        </motion.div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-2 relative shrink-0"
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="font-display">
                Filtros e Ordenação
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-5 py-4">
              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Ordenar por
                </label>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onSortChange(opt.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        sort === opt.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border",
                      )}
                      aria-pressed={sort === opt.id}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Faixa de preço (R$)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Mínimo"
                    value={priceMin}
                    onChange={(e) => onPriceMinChange(e.target.value)}
                    className="h-10 text-sm rounded-xl"
                    min={0}
                    aria-label="Preço mínimo"
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input
                    type="number"
                    placeholder="Máximo"
                    value={priceMax}
                    onChange={(e) => onPriceMaxChange(e.target.value)}
                    className="h-10 text-sm rounded-xl"
                    min={0}
                    aria-label="Preço máximo"
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

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORY_OPTIONS.map((cat) => {
          const isActive = category === cat.id;

          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-primary/5",
              )}
              aria-pressed={isActive}
              aria-label={`Filtrar por ${cat.label}`}
            >
              {cat.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});
