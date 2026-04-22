/**
 * ExpandedFilters - Painel de filtros expandidos
 * 
 * SSOT: Componente reutilizável
 * Sem gambiarras: Props tipadas
 */

import { motion } from "framer-motion";
import type { VagasFilters, Bairro } from "../../sections/types";
import {
  VAGA_CATEGORIAS,
  CONTRATO_LABELS,
  MODALIDADE_LABELS,
  NIVEL_LABELS,
  type VagaContrato,
  type VagaModalidade,
  type VagaNivel,
} from "../../types/vagas.types";

export interface ExpandedFiltersProps {
  readonly filters: VagasFilters;
  readonly updateFilter: (key: keyof VagasFilters, value: any) => void;
  readonly bairros: readonly Bairro[];
}

export function ExpandedFilters({
  filters,
  updateFilter,
  bairros,
}: ExpandedFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-4"
    >
      {/* Categoria */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Categoria
        </label>
        <div className="flex flex-wrap gap-2">
          {VAGA_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                updateFilter(
                  "categoria",
                  filters.categoria === cat.id ? null : cat.id
                )
              }
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.categoria === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <span className="mr-1">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contrato */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Tipo de Contrato
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CONTRATO_LABELS) as VagaContrato[]).map((tipo) => (
            <button
              key={tipo}
              onClick={() =>
                updateFilter(
                  "contrato",
                  filters.contrato === tipo ? null : tipo
                )
              }
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.contrato === tipo
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {CONTRATO_LABELS[tipo]}
            </button>
          ))}
        </div>
      </div>

      {/* Modalidade */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Modalidade
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODALIDADE_LABELS) as VagaModalidade[]).map((mod) => (
            <button
              key={mod}
              onClick={() =>
                updateFilter(
                  "modalidade",
                  filters.modalidade === mod ? null : mod
                )
              }
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.modalidade === mod
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {MODALIDADE_LABELS[mod]}
            </button>
          ))}
        </div>
      </div>

      {/* Nível */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Nível de Experiência
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(NIVEL_LABELS) as VagaNivel[]).map((nivel) => (
            <button
              key={nivel}
              onClick={() =>
                updateFilter("nivel", filters.nivel === nivel ? null : nivel)
              }
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filters.nivel === nivel
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              {NIVEL_LABELS[nivel]}
            </button>
          ))}
        </div>
      </div>

      {/* Bairro */}
      {bairros.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Bairro
          </label>
          <div className="flex flex-wrap gap-2">
            {bairros.slice(0, 10).map((bairro) => (
              <button
                key={bairro.id}
                onClick={() =>
                  updateFilter(
                    "bairroId",
                    filters.bairroId === bairro.id ? null : bairro.id
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filters.bairroId === bairro.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                {bairro.nome}
                <span className="ml-1 text-xs opacity-70">
                  ({bairro.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Salário */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          Salário
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.hasSalary}
              onChange={(e) =>
                updateFilter("hasSalary", e.target.checked || null)
              }
              className="rounded border-input"
            />
            <span className="text-sm">Apenas com salário informado</span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}
