/**
 * 🏆 FILTERS PANEL - Painel de filtros de vagas
 */

import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  JOB_CATEGORIES,
  CONTRACT_LABELS,
  MODALITY_LABELS,
  type JobContractType,
  type JobModality,
} from "../types/job.types";

interface FiltersPanelProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedContract: JobContractType | null;
  onContractChange: (contract: JobContractType | null) => void;
  selectedModality: JobModality | null;
  onModalityChange: (modality: JobModality | null) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FiltersPanel({
  selectedCategory,
  onCategoryChange,
  selectedContract,
  onContractChange,
  selectedModality,
  onModalityChange,
  hasActiveFilters,
  onClearFilters,
}: FiltersPanelProps) {
  return (
    <motion.section
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="border-b border-border bg-card/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Categoria
          </p>
          <div className="flex flex-wrap gap-2">
            {JOB_CATEGORIES.slice(0, 12).map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  onCategoryChange(selectedCategory === cat.id ? null : cat.id)
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary/15 border-primary/50 text-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span>{cat.icone}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contract + Modality */}
        <div className="flex flex-wrap gap-6">
          {/* Contract */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Contrato
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CONTRACT_LABELS) as [JobContractType, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    onClick={() =>
                      onContractChange(selectedContract === key ? null : key)
                    }
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      selectedContract === key
                        ? "bg-accent/15 border-accent/50 text-accent"
                        : "bg-card border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Modality */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Modalidade
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(MODALITY_LABELS) as [JobModality, string][]).map(
                ([key, label]) => (
                  <button
                    key={key}
                    onClick={() =>
                      onModalityChange(selectedModality === key ? null : key)
                    }
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      selectedModality === key
                        ? "bg-success/15 border-success/50 text-success"
                        : "bg-card border-border text-muted-foreground hover:border-success/30"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-destructive hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        )}
      </div>
    </motion.section>
  );
}
