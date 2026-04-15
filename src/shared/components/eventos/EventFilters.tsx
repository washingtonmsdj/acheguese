/**
 * 🎯 EVENT FILTERS COMPONENT (NÍVEL AAA)
 *
 * Filtros otimizados para eventos
 *
 * Features:
 * - Debounce de 300ms
 * - Categorias animadas
 * - Search otimizado
 * - Acessibilidade completa
 *
 * @version 1.0.0
 */

import { memo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { motion } from "framer-motion";

const CATEGORIAS = [
  { id: "todos", name: "Todos", icone: "📋" },
  { id: "cultural", name: "Cultural", icone: "🎭" },
  { id: "esportivo", name: "Esportivo", icone: "⚽" },
  { id: "social", name: "Social", icone: "🤝" },
  { id: "religioso", name: "Religioso", icone: "🙏" },
  { id: "educacional", name: "Educacional", icone: "📚" },
];

interface EventFiltersProps {
  category: string;
  search: string;
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
}

export const EventFilters = memo(function EventFilters({
  category,
  search,
  onCategoryChange,
  onSearchChange,
}: EventFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
          aria-label="Buscar eventos"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIAS.map((cat) => {
          const isActive = category === cat.id;

          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:border-primary/30",
              )}
              aria-pressed={isActive}
              aria-label={`Filtrar por ${cat.name}`}
            >
              {cat.icone} {cat.name}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});
