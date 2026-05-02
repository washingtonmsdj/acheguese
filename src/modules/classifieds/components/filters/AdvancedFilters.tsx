/**
 * AdvancedFilters - Filtros avançados para classificados
 * 
 * Componente separado para filtros avançados (preço, condição, ordenação)
 * sem duplicar a busca que já está no header.
 */

import React from "react";
import { SlidersHorizontal, ArrowUpDown, Package, Camera, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/utils/cn";
import { SORT_OPTIONS, CONDITION_OPTIONS } from "../../sections/types";
import type { ClassifiedsFilters } from "../../sections/types";

export interface AdvancedFiltersProps {
  readonly filters: ClassifiedsFilters;
  readonly onSortChange: (sort: string) => void;
  readonly onPriceMinChange: (value: string) => void;
  readonly onPriceMaxChange: (value: string) => void;
  readonly onConditionChange: (condition: string) => void;
  readonly onHasPhotoChange: (hasPhoto: boolean) => void;
  readonly onClearFilters: () => void;
}

export function AdvancedFilters({
  filters,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onConditionChange,
  onHasPhotoChange,
  onClearFilters,
}: AdvancedFiltersProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const activeFiltersCount = [
    filters.sort !== "recente" && filters.sort !== "recent" ? 1 : 0,
    filters.priceMin ? 1 : 0,
    filters.priceMax ? 1 : 0,
    filters.condition !== "todos" ? 1 : 0,
    filters.hasPhoto ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Ordenação rápida */}
      <Select value={filters.sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.id} value={opt.id} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtros avançados */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative h-9 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
            Filtros
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span>Filtros Avançados</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClearFilters();
                    setFiltersOpen(false);
                  }}
                  className="text-xs h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Limpar
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Preço */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Faixa de Preço
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={filters.priceMin || ""}
                  onChange={(e) => onPriceMinChange(e.target.value)}
                  className="h-9 text-sm"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={filters.priceMax || ""}
                  onChange={(e) => onPriceMaxChange(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Condição */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Condição
              </label>
              <Select value={filters.condition} onValueChange={onConditionChange}>
                <SelectTrigger className="h-9">
                  <Package className="h-3.5 w-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Apenas com foto */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasPhoto}
                  onChange={(e) => onHasPhotoChange(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Apenas com foto</span>
              </label>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={() => setFiltersOpen(false)}
              className="w-full"
            >
              Aplicar Filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Badge de filtros ativos */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpar ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}
