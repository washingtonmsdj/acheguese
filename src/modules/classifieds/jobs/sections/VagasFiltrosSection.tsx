/**
 * VagasFiltrosSection - Filtros e busca de vagas
 * 
 * SSOT: Section modular
 * Sem gambiarras: Props tipadas
 */

import { useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { ActiveFilterChip, ExpandedFilters } from "../components/filters";
import type { VagasFiltrosSectionProps } from "./types";
import {
  SORT_OPTIONS,
  CONTRATO_LABELS,
  MODALIDADE_LABELS,
  NIVEL_LABELS,
  VAGA_CATEGORIAS,
} from "../types/vagas.types";

export function VagasFiltrosSection({
  cityName,
  total,
  isLoading,
  filters,
  updateFilter,
  clearFilters,
  hasActiveFilters,
  sort,
  setSort,
  bairros,
}: VagasFiltrosSectionProps) {
  // Labels de filtros ativos
  const activeFilterLabels = useMemo(() => {
    const labels: { key: string; label: string }[] = [];

    if (filters.categoria) {
      const cat = VAGA_CATEGORIAS.find((c) => c.id === filters.categoria);
      if (cat) labels.push({ key: "categoria", label: cat.label });
    }
    if (filters.contrato)
      labels.push({ key: "contrato", label: CONTRATO_LABELS[filters.contrato] });
    if (filters.modalidade)
      labels.push({
        key: "modalidade",
        label: MODALIDADE_LABELS[filters.modalidade],
      });
    if (filters.nivel)
      labels.push({ key: "nivel", label: NIVEL_LABELS[filters.nivel] });
    if (filters.bairroId) {
      const bairro = bairros.find((b) => b.id === filters.bairroId);
      if (bairro) labels.push({ key: "bairroId", label: bairro.nome });
    }
    if (filters.hasSalary)
      labels.push({ key: "hasSalary", label: "Com salário" });

    return labels;
  }, [filters, bairros]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 w-full flex-1">
      {/* Header com busca e ordenação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isLoading
              ? "Carregando vagas..."
              : `${total} vaga${total !== 1 ? "s" : ""} encontrada${
                  total !== 1 ? "s" : ""
                }`}
          </h2>
          <p className="text-sm text-muted-foreground">{cityName} e região</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cargo, empresa..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value || null)}
              className="pl-9 w-full md:w-64"
            />
            {filters.search && (
              <button
                onClick={() => updateFilter("search", null)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Ordenação */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Chips de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Filtros:</span>
          {activeFilterLabels.map(({ key, label }) => (
            <ActiveFilterChip
              key={key}
              label={label}
              onRemove={() => updateFilter(key as keyof typeof filters, null)}
            />
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:underline ml-2"
          >
            Limpar todos
          </button>
        </div>
      )}

      {/* Filtros expandidos */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <ExpandedFilters
          filters={filters}
          updateFilter={updateFilter}
          bairros={bairros}
        />
      </div>
    </section>
  );
}
