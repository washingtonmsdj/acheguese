/**
 * ClassifiedCard - Card de anúncio classificado
 * 
 * SSOT: Componente reutilizável para exibir anúncios
 * Sem gambiarras: Props tipadas e código limpo
 */

import React from "react";
import { motion } from "framer-motion";
import {
  MapPin, Camera, Clock, Star, Truck, ChevronRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { getRelativeTime } from "../../utils";
import { STATUS_CONFIG } from "../../sections/types";
import type { Classificado } from "../../sections/types";

// ============================================
// Props
// ============================================

export interface ClassifiedCardProps {
  readonly ad: Classificado;
  readonly index: number;
  readonly onClick: () => void;
}

// ============================================
// Component
// ============================================

export const ClassifiedCard = React.forwardRef<HTMLDivElement, ClassifiedCardProps>(
  ({ ad, index, onClick }, ref) => {
    const status = STATUS_CONFIG[ad.status] || STATUS_CONFIG.active;
    const firstImage = ad.fotos?.[0] || "/placeholder.svg";
    const timeAgo = getRelativeTime(ad.created_at);

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          delay: Math.min(index, 8) * 0.04,
          duration: 0.3,
        }}
        onClick={onClick}
        className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col h-full"
        role="article"
        aria-label={`Anúncio: ${ad.titulo}`}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={firstImage}
            alt={ad.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Status & badges overlays */}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <div
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm",
                status.color
              )}
            >
              {status.label}
            </div>
            {ad.condition && (
              <div
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm",
                  ad.condition === "novo"
                    ? "bg-success/90 text-white"
                    : ad.condition === "seminovo"
                    ? "bg-primary/90 text-primary-foreground"
                    : "bg-muted/90 text-muted-foreground"
                )}
              >
                {ad.condition === "novo"
                  ? "Novo"
                  : ad.condition === "seminovo"
                  ? "Seminovo"
                  : "Usado"}
              </div>
            )}
          </div>

          {/* Photo count */}
          {ad.fotos && ad.fotos.length > 1 && (
            <div className="absolute top-2.5 right-2.5">
              <div className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm flex items-center gap-0.5">
                <Camera className="h-2.5 w-2.5" />
                {ad.fotos.length}
              </div>
            </div>
          )}

          {/* Time ago strip */}
          {timeAgo && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-5">
              <div className="flex items-center gap-3 text-white text-[10px]">
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
                {ad.bairro && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {ad.bairro}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2.5 flex-1 flex flex-col">
          {/* Title + Price */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-foreground text-base leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
              {ad.titulo}
            </h3>
            <div className="text-right shrink-0">
              <span className="text-base font-bold text-primary whitespace-nowrap">
                R$ {ad.preco?.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Description */}
          {ad.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {ad.descricao}
            </p>
          )}

          {/* Category */}
          {ad.categoria && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{ad.categoria}</span>
              {ad.subcategoria && ` · ${ad.subcategoria}`}
            </p>
          )}

          {/* Seller info with rating */}
          {ad.vendedor?.nome && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                  {ad.vendedor.nome[0]?.toUpperCase()}
                </div>
                <span className="font-medium text-foreground/80 truncate">
                  {ad.vendedor.nome}
                </span>
              </div>
              {ad.vendedor.rating && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{ad.vendedor.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Service modes / Features */}
          <div className="flex items-center gap-1.5 flex-wrap mt-auto">
            {ad.condition && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  ad.condition === "novo"
                    ? "bg-success/10 text-success"
                    : ad.condition === "seminovo"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {ad.condition === "novo"
                  ? "Novo"
                  : ad.condition === "seminovo"
                  ? "Seminovo"
                  : "Usado"}
              </span>
            )}
            {ad.aceita_troca && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                Aceita troca
              </span>
            )}
            {ad.entrega_disponivel && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground flex items-center gap-0.5">
                <Truck className="h-2.5 w-2.5" /> Entrega
              </span>
            )}
          </div>

          {/* CTA */}
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-lg gap-1 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Ver detalhes <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </motion.div>
    );
  }
);

ClassifiedCard.displayName = "ClassifiedCard";
