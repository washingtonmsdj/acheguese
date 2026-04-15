import React from "react";
import { cn } from "@/shared/utils/cn";

const CATEGORIAS = [
  { id: "todos", name: "Todos", icone: "🔍" },
  { id: "traffic", name: "Trânsito", icone: "🚗" },
  { id: "crime", name: "Segurança", icone: "🚨" },
  { id: "utility", name: "Utilidade", icone: "💡" },
  { id: "event", name: "Evento", icone: "📅" },
  { id: "other", name: "Outros", icone: "⚠️" },
];

interface CategoryFiltersProps {
  filter: string;
  onFilterChange: (filter: string) => void;
}

export function CategoryFilters({
  filter,
  onFilterChange,
}: CategoryFiltersProps) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto">
      {CATEGORIAS.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onFilterChange(cat.id)}
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all flex-shrink-0",
            filter === cat.id
              ? "bg-primary/10 border-primary"
              : "bg-card border-border",
          )}
        >
          <span className="text-xl">{cat.icone}</span>
          <span className="text-[10px] font-medium whitespace-nowrap">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}
