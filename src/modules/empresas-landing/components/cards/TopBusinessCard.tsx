/**
 * TopBusinessCard
 * 
 * Card de empresa no ranking top 3
 */

import { motion } from "framer-motion";
import { Star, ThumbsUp, Navigation } from "lucide-react";
import type { TopBusinessCardProps } from "../../sections/types";

export function TopBusinessCard({ business, rank, onClick }: TopBusinessCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-warning";
    if (rank === 2) return "text-muted-foreground";
    return "text-amber-700";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: rank * 0.1 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getRankColor(rank)}`}>
            #{rank}
          </span>
          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
            {business.name}
          </h4>
        </div>
        <span className="flex items-center gap-0.5 text-xs text-warning">
          <Star className="h-3 w-3 fill-warning" /> {business.rating}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ThumbsUp className="h-3 w-3 text-primary" />
          <span className="font-semibold text-foreground">{business.neighborRecs}</span> recomendações
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          <Navigation className="h-3 w-3" /> {business.distance}
        </span>
      </div>
    </motion.div>
  );
}
