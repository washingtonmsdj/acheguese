/* eslint-disable react-refresh/only-export-components */
/**
 * Filtros para anúncios na página de perfil do vendedor
 * ✅ SSOT: usa CLASSIFIED_CATEGORIES de constants/categories
 */

import React from "react";
import { Filter, X, ArrowUpDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { CLASSIFIED_CATEGORIES } from "@/modules/classifieds/constants/categories";
import { Badge } from "@/shared/components/ui/badge";

export interface AdFilters {
  category: string;
  condition: string;
  priceRange: [number, number] | null;
  sortBy: 'recent' | 'price_asc' | 'price_desc' | 'relevant';
}

const CONDITIONS = [
  { id: "todos", label: "Todos" },
  { id: "Novo", label: "Novo" },
  { id: "Seminovo", label: "Seminovo" },
  { id: "Usado", label: "Usado" },
] as const;

const PRICE_RANGES = [
  { id: null, label: "Qualquer" },
  { id: [0, 500] as [number, number], label: "Até R$ 500" },
  { id: [500, 1500] as [number, number], label: "R$ 500–1.500" },
  { id: [1500, 5000] as [number, number], label: "R$ 1.500–5.000" },
  { id: [5000, Infinity] as [number, number], label: "Acima de R$ 5.000" },
] as const;

const SORT_OPTIONS = [
  { id: 'recent' as const, label: "Mais recentes" },
  { id: 'price_asc' as const, label: "Menor preço" },
  { id: 'price_desc' as const, label: "Maior preço" },
  { id: 'relevant' as const, label: "Mais relevantes" },
] as const;

interface VendedorAdFiltersProps {
  filters: AdFilters;
  onFiltersChange: (filters: AdFilters) => void;
  totalAds: number;
  filteredCount: number;
}

export function VendedorAdFilters({
  filters,
  onFiltersChange,
  totalAds,
  filteredCount,
}: VendedorAdFiltersProps) {
  const hasActiveFilters =
    filters.category !== "todos" ||
    filters.condition !== "todos" ||
    filters.priceRange !== null ||
    filters.sortBy !== 'recent';

  const clearFilters = () =>
    onFiltersChange({ category: "todos", condition: "todos", priceRange: null, sortBy: 'recent' });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>
            {filteredCount === totalAds
              ? `${totalAds} anúncios`
              : `${filteredCount} de ${totalAds} anúncios`}
          </span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Category chips — SSOT: CLASSIFIED_CATEGORIES */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Categoria
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CLASSIFIED_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFiltersChange({ ...filters, category: cat.id })}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                filters.category === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Condition chips */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Condição
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((cond) => (
            <button
              key={cond.id}
              onClick={() => onFiltersChange({ ...filters, condition: cond.id })}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                filters.condition === cond.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              {cond.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range chips */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Faixa de preço
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_RANGES.map((range, i) => {
            const isActive =
              range.id === null
                ? filters.priceRange === null
                : filters.priceRange !== null &&
                  filters.priceRange[0] === range.id[0] &&
                  filters.priceRange[1] === range.id[1];
            return (
              <button
                key={i}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    priceRange: range.id as [number, number] | null,
                  })
                }
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort options */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" /> Ordenar por
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onFiltersChange({ ...filters, sortBy: option.id })}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                filters.sortBy === option.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Aplica filtros e ordenação à lista de anúncios
 */
export function applyAdFilters(
  ads: Array<{ category: string; condition: string; price: number; created_at: string }>,
  filters: AdFilters
) {
  // Filtrar
  let filtered = ads.filter((ad) => {
    if (filters.category !== "todos") {
      if (ad.category.toLowerCase() !== filters.category.toLowerCase()) return false;
    }
    if (filters.condition !== "todos") {
      if (ad.condition !== filters.condition) return false;
    }
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (ad.price < min || ad.price > max) return false;
    }
    return true;
  });

  // Ordenar
  switch (filters.sortBy) {
    case 'recent':
      filtered = filtered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case 'price_asc':
      filtered = filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filtered = filtered.sort((a, b) => b.price - a.price);
      break;
    case 'relevant':
      // Relevância: combina recência e preço (anúncios mais recentes e mais caros primeiro)
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        const recencyScore = (dateB - dateA) / (1000 * 60 * 60 * 24); // dias
        const priceScore = (b.price - a.price) / 1000; // normalizado
        return (recencyScore * 0.6 + priceScore * 0.4);
      });
      break;
  }

  return filtered;
}
