/**
 * TopBusinessCard - Estilo compacto para ranking
 * 
 * Padronizado com GastronomyCard:
 * - Layout horizontal compacto
 * - Marcador visual consistente
 * - Informações essenciais
 */

import { motion } from "framer-motion";
import { Star, MapPin, Crown, BadgeCheck, Store, ThumbsUp } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { TopBusinessCardProps } from "../../sections/types";

export function TopBusinessCard({ business, rank, onClick }: TopBusinessCardProps) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-amber-500 to-yellow-500";
    if (rank === 2) return "from-gray-400 to-gray-500";
    return "from-amber-700 to-amber-800";
  };

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: rank * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-row overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md cursor-pointer h-[88px]"
      role="article"
      aria-label={`${business.name} - Posição ${rank}`}
    >
      {/* Categoria/Rank à esquerda */}
      <div className="relative h-full w-[88px] shrink-0 overflow-hidden">
        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
          <Store className="h-7 w-7 mb-1 text-primary/80" />
          <span className="text-xs font-bold text-primary">#{rank}</span>
        </div>

        {/* Premium badge */}
        {business.premium && (
          <div className="absolute top-1 right-1">
            <Crown className="h-3.5 w-3.5 text-warning fill-warning" />
          </div>
        )}
      </div>

      {/* Conteúdo à direita */}
      <div className="flex min-w-0 flex-1 flex-col justify-between px-2.5 py-2">
        {/* Rank + Nome */}
        <div className="flex items-start gap-1.5">
          <div className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
            getRankColor(rank)
          )}>
            {rank}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {business.name}
              {business.is_verified && (
                <BadgeCheck className="ml-1 inline h-3.5 w-3.5 text-primary" />
              )}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">{business.category}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-[11px] font-semibold">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {business.rating.toFixed(1)}
            <span className="text-muted-foreground">({business.reviews})</span>
          </span>
        </div>

        {/* Recomendações + Distância */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5 font-medium text-primary">
            <ThumbsUp className="h-2.5 w-2.5" />
            {business.neighborRecs} vizinhos
          </span>
          {business.distance !== "N/A" && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {business.distance}
            </span>
          )}
        </div>
      </div>

      {/* Hover Glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
      </div>
    </motion.article>
  );
}
