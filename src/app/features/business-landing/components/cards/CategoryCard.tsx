/**
 * CategoryCard
 * 
 * Card de categoria com ícone e contador
 */

import { motion } from "framer-motion";
import type { CategoryCardProps } from "../../sections/types";

const EMOJI_BY_CATEGORY_SLUG: Record<string, string> = {
  restaurantes: "🍽️",
  mercados: "🛒",
  saude: "💙",
  educacao: "📚",
  servicos: "🔧",
  outros: "🏪",
};

export function CategoryCard({ category, onClick, index }: CategoryCardProps) {
  const Icon = category.icon;
  const emoji = EMOJI_BY_CATEGORY_SLUG[category.slug];
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index }}
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex shrink-0 min-w-[60px] flex-col items-center gap-1.5 rounded-xl border bg-card/80 p-2.5 backdrop-blur-sm transition-colors duration-200 group ${category.bg}`}
    >
      <motion.div
        whileHover={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
      >
        {emoji ? (
          <span className={category.iconColor} style={{ fontSize: "1.25rem", lineHeight: 1 }}>
            {emoji}
          </span>
        ) : (
          <Icon className={`h-5 w-5 ${category.iconColor}`} />
        )}
      </motion.div>
      <span className="whitespace-nowrap text-center text-[10px] font-semibold leading-tight text-foreground">
        {category.label}
      </span>
    </motion.button>
  );
}
