import React from "react";
import { cn } from "@/shared/utils/cn";

const CATEGORIAS = [
  { id: "todos", label: "Todos", icon: "🔍" },
  { id: "services", label: "Serviços", icon: "🔧" },
  { id: "restaurantes", label: "Restaurantes", icon: "🍽️" },
  { id: "manutencao", label: "Manutenção", icon: "🏠" },
  { id: "saude", label: "Saúde", icon: "🏥" },
  { id: "pets", label: "Pets", icon: "🐾" },
  { id: "compras", label: "Compras", icon: "🛒" },
  { id: "outros", label: "Outros", icon: "📌" },
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
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex-shrink-0",
            filter === cat.id
              ? "bg-primary/10 border-primary text-primary"
              : "bg-card border-border",
          )}
        >
          <span>{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
