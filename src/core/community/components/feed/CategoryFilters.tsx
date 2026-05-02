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
    <div className="flex max-w-full flex-wrap gap-2 overflow-hidden px-4 py-3">
      {CATEGORIAS.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onFilterChange(cat.id)}
          className={cn(
            "flex min-w-0 flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all",
            filter === cat.id
              ? "bg-primary/10 border-primary"
              : "bg-card border-border",
          )}
        >
          <span className="text-xl">{cat.icone}</span>
          <span className="max-w-full text-center text-[10px] font-medium leading-tight">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}
