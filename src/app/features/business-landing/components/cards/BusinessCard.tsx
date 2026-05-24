/**
 * BusinessCard - Estilo compacto horizontal
 * 
 * Padronizado com GastronomyCard:
 * - Layout horizontal (88px altura)
 * - Marcador visual à esquerda
 * - Informações compactas à direita
 * - Badges e status no mesmo padrão
 */

import { motion } from "framer-motion";
import {
  Crown, BadgeCheck, MapPin, Star, Store, Clock,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { BusinessCardProps } from "../../sections/types";

export function BusinessCard({
  business,
  onClick,
  onToggleSave,
  isSaved,
  nearbyMode,
  index,
}: BusinessCardProps) {
  const hasDistance = business.distanceMeters !== undefined && nearbyMode;
  const distanceKm = hasDistance ? (business.distanceMeters! / 1000).toFixed(1) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 10) * 0.05 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-row overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md cursor-pointer h-[88px]",
        business.premium && "ring-2 ring-primary/20"
      )}
      role="article"
      aria-label={`${business.name} - ${business.category}`}
    >
      {/* Marcador visual à esquerda */}
      <div className="relative h-full w-[88px] shrink-0 overflow-hidden">
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
          <Store className="h-8 w-8 text-primary/80" />
        </div>

        {/* Premium/Verified badge */}
        {(business.premium || business.is_verified) && (
          <div className="absolute top-1 left-1">
            {business.premium ? (
              <Crown className="h-3.5 w-3.5 text-warning fill-warning" />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </div>
        )}
      </div>

      {/* Conteúdo à direita */}
      <div className="flex min-w-0 flex-1 flex-col justify-between px-2.5 py-2">
        {/* Nome + verificado */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="line-clamp-1 text-sm font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {business.name}
          </h3>
          {business.is_verified && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
          )}
        </div>

        {/* Categoria */}
        <p className="text-[11px] text-muted-foreground truncate">{business.category}</p>

        {/* Rating + badges */}
        <div className="flex items-center gap-2">
          {business.rating > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {business.rating.toFixed(1)}
              <span className="text-muted-foreground">({business.reviews})</span>
            </span>
          )}
          {business.neighborRecs > 0 && (
            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px] font-medium">
              {business.neighborRecs} recomendações
            </Badge>
          )}
        </div>

        {/* Status + Distância/Localização */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className={cn(
            "flex items-center gap-0.5 font-medium shrink-0",
            business.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
          )}>
            <Clock className="h-2.5 w-2.5" />
            {business.isOpen ? "Aberto" : "Fechado"}
          </span>
          
          {hasDistance && distanceKm ? (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {distanceKm} km
            </span>
          ) : business.distance !== "N/A" ? (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {business.distance}
            </span>
          ) : null}

          {business.walkTime !== "N/A" && (
            <span className="flex items-center gap-0.5 shrink-0">
              <MapPin className="h-2.5 w-2.5" />
              {business.walkTime}
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
