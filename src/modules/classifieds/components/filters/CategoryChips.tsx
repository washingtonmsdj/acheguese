/**
 * CategoryChips - Chips de categorias scrolláveis
 * 
 * SSOT: Componente reutilizável de categorias
 * Sem gambiarras: Props tipadas e código limpo
 */

import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";

// ============================================
// Props
// ============================================

export interface Category {
  readonly id: string;
  readonly label: string;
  readonly emoji: string;
}

export interface CategoryChipsProps {
  readonly categories: readonly Category[];
  readonly selectedCategory: string | null;
  readonly onCategoryChange: (categoryId: string) => void;
}

// ============================================
// Component
// ============================================

export function CategoryChips({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryChipsProps) {
  return (
    <section className="px-4 mt-4" aria-label="Categorias">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all duration-200 shrink-0",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "bg-card text-foreground border-border hover:border-primary/30 hover:bg-primary/5"
              )}
              aria-pressed={isActive}
            >
              <span className="text-xs">{cat.emoji}</span>
              {cat.label}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
