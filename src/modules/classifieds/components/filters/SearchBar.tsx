/**
 * SearchBar - Barra de busca com filtros avançados
 * 
 * SSOT: Componente reutilizável de busca e filtros
 * Sem gambiarras: Props tipadas e código limpo
 */

import React from "react";
import { Search, SlidersHorizontal, ArrowUpDown, Package, Camera, MapPin, X } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
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
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";

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
  readonly onStateSlugChange: (stateSlug: string) => void;
  readonly onCitySlugChange: (citySlug: string) => void;
  readonly onLocationSlugChange: (locationSlug: string) => void;
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
  onStateSlugChange,
  onCitySlugChange,
  onLocationSlugChange,
  onClearFilters,
}: SearchBarProps) {
  const [localSearch, setLocalSearch] = React.useState(filters.search || "");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [territoryOpen, setTerritoryOpen] = React.useState(false);
  const [selectedStateId, setSelectedStateId] = React.useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = React.useState<string | null>(null);
  const { states, cities, neighborhoods } = useLocationCascade(selectedStateId, selectedCityId);

  React.useEffect(() => {
    const state = states.find((item) => item.slug === filters.stateSlug);
    setSelectedStateId(state?.id ?? null);
  }, [filters.stateSlug, states]);

  React.useEffect(() => {
    const city = cities.find((item) => item.slug === filters.citySlug);
    setSelectedCityId(city?.id ?? null);
  }, [filters.citySlug, cities]);

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
    filters.stateSlug ? 1 : 0,
    filters.citySlug ? 1 : 0,
    filters.locationSlug ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const selectedStateName =
    states.find((state) => state.slug === filters.stateSlug)?.name ?? "";
  const selectedCityName =
    cities.find((city) => city.slug === filters.citySlug)?.name ?? "";
  const selectedDistrictName =
    neighborhoods.find((district) => district.slug === filters.locationSlug)?.name ?? "";

  const territorySummary = selectedDistrictName
    ? `${selectedDistrictName}, ${selectedCityName || "Cidade"}`
    : selectedCityName
      ? `${selectedCityName}${selectedStateName ? `, ${selectedStateName}` : ""}`
      : "Perto de você (automático)";

  const hasManualTerritoryFilter = Boolean(filters.stateSlug || filters.citySlug || filters.locationSlug);

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
              className="h-11 rounded-xl border-2 relative shrink-0 px-3 gap-2"
              aria-label="Filtros avançados"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-sm font-medium">Filtros</span>
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
              <SheetTitle className="font-display">Filtros e Ordenação</SheetTitle>
            </SheetHeader>

            <div className="space-y-5 py-4">
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
      <div className="mt-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 shadow-sm flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-primary font-semibold flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Localização ativa
          </p>
          <p className="text-sm font-bold truncate text-foreground">{territorySummary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasManualTerritoryFilter && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                onStateSlugChange("");
                onCitySlugChange("");
                onLocationSlugChange("");
              }}
              aria-label="Limpar localização"
              title="Limpar localização"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            className="h-8 rounded-lg px-3 text-xs font-semibold"
            onClick={() => setTerritoryOpen(true)}
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Alterar local
          </Button>
        </div>
      </div>

      <Dialog open={territoryOpen} onOpenChange={setTerritoryOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-display">Localização dos resultados</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Estado</label>
              <Select
                value={filters.stateSlug || "__all__"}
                onValueChange={(value) => onStateSlugChange(value === "__all__" ? "" : value)}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os estados</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.slug}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Cidade</label>
              <Select
                value={filters.citySlug || "__all__"}
                onValueChange={(value) => onCitySlugChange(value === "__all__" ? "" : value)}
                disabled={!filters.stateSlug}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Todas as cidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as cidades</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.slug}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Bairro</label>
              <Select
                value={filters.locationSlug || "__all__"}
                onValueChange={(value) => onLocationSlugChange(value === "__all__" ? "" : value)}
                disabled={!filters.citySlug}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Todos os bairros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os bairros</SelectItem>
                  {neighborhoods.map((district) => (
                    <SelectItem key={district.id} value={district.slug}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  onStateSlugChange("");
                  onCitySlugChange("");
                  onLocationSlugChange("");
                }}
              >
                Limpar localização
              </Button>
              <Button className="flex-1 rounded-xl" onClick={() => setTerritoryOpen(false)}>
                Aplicar
              </Button>
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
