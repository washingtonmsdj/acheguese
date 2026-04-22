/**
 * ClassifiedsCategoriesSection - Categorias de destaque
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import type { ClassifiedsCategoriesSectionProps } from "./types";

export function ClassifiedsCategoriesSection({
  categories,
  selectedCategory,
  onCategoryChange,
}: ClassifiedsCategoriesSectionProps) {
  return (
    <section className="w-full bg-card/50 border-b border-border py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCategoryChange(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group",
                  cat.bg,
                  selectedCategory === cat.id && "ring-2 ring-primary shadow-lg"
                )}
              >
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <Icon className={cn("h-7 w-7", cat.iconColor)} />
                </motion.div>
                <span className="text-xs font-semibold text-foreground leading-tight text-center">
                  {cat.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
