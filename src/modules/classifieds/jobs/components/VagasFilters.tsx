/**
 * VagasFilters — Painel de filtros para vagas
 */

import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { VAGA_CATEGORIAS, CONTRATO_LABELS, MODALIDADE_LABELS, NIVEL_LABELS } from "../types/vagas.types";
import type { VagaContrato, VagaModalidade, VagaNivel } from "../types/vagas.types";

interface VagasFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  selectedContract: VagaContrato | null;
  onContractChange: (value: VagaContrato | null) => void;
  selectedModality: VagaModalidade | null;
  onModalityChange: (value: VagaModalidade | null) => void;
  selectedLevel: VagaNivel | null;
  onLevelChange: (value: VagaNivel | null) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  resultsCount: number;
}

function FilterChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
        isActive
          ? "bg-primary/15 border-primary/50 text-primary"
          : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function VagasFilters({
  search, onSearchChange,
  selectedCategory, onCategoryChange,
  selectedContract, onContractChange,
  selectedModality, onModalityChange,
  selectedLevel, onLevelChange,
  hasActiveFilters, onClearFilters,
  resultsCount,
}: VagasFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar vaga, empresa ou bairro..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl"
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {VAGA_CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(selectedCategory === cat.id ? null : cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all flex-shrink-0 text-xs font-semibold ${
              selectedCategory === cat.id
                ? "bg-primary/15 border-primary/50 text-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Chips row */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
          <Filter className="h-3 w-3" /> Filtros:
        </span>

        {/* Contrato */}
        {(Object.entries(CONTRATO_LABELS) as [VagaContrato, string][]).map(([key, label]) => (
          <FilterChip
            key={key}
            label={label}
            isActive={selectedContract === key}
            onClick={() => onContractChange(selectedContract === key ? null : key)}
          />
        ))}

        <span className="w-px h-5 bg-border self-center mx-1" />

        {/* Modalidade */}
        {(Object.entries(MODALIDADE_LABELS) as [VagaModalidade, string][]).map(([key, label]) => (
          <FilterChip
            key={key}
            label={label}
            isActive={selectedModality === key}
            onClick={() => onModalityChange(selectedModality === key ? null : key)}
          />
        ))}

        <span className="w-px h-5 bg-border self-center mx-1" />

        {/* Nível */}
        {(Object.entries(NIVEL_LABELS) as [VagaNivel, string][]).map(([key, label]) => (
          <FilterChip
            key={key}
            label={label}
            isActive={selectedLevel === key}
            onClick={() => onLevelChange(selectedLevel === key ? null : key)}
          />
        ))}
      </div>

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
          <span className="text-xs text-foreground">
            <span className="font-bold text-primary">{resultsCount}</span> vaga{resultsCount !== 1 ? "s" : ""} encontrada{resultsCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onClearFilters}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
