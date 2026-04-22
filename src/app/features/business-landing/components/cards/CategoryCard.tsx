/**
 * CategoryCard
 * 
 * Card de categoria com ícone e contador
 */

import { motion } from "framer-motion";
import type { CategoryCardProps } from "../../sections/types";

export function CategoryCard({ category, onClick, index }: CategoryCardProps) {
  const Icon = category.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 group ${category.bg}`}
    >
      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className={`h-7 w-7 ${category.iconColor}`} />
      </motion.div>
      <span className="text-xs font-semibold text-foreground leading-tight text-center">
        {category.label}
      </span>
    </motion.button>
  );
}
