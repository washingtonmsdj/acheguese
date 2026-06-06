/**
 * HorizontalSection - Seção horizontal scrollável de anúncios
 * 
 * SSOT: Componente reutilizável para seções horizontais
 * Sem gambiarras: Props tipadas e código limpo
 */

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Camera, Zap } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { formatBrlNoCents } from "@/shared/utils/currency";
import type { Classificado } from "../../sections/types";

// ============================================
// Props
// ============================================

export interface HorizontalSectionProps {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: React.ReactNode;
  readonly ads: readonly Classificado[];
  readonly badgeText: string;
  readonly badgeColor: string;
  readonly onAdClick: (ad: Classificado) => void;
}

// ============================================
// Component
// ============================================

export function HorizontalSection({
  title,
  subtitle,
  icon,
  ads,
  onAdClick,
  badgeText,
  badgeColor,
}: HorizontalSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="px-4 mt-5"
      aria-label={title}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {icon}
          <div>
            <span className="text-xs font-bold font-display text-foreground">
              {title}
            </span>
            <span className="text-[9px] text-muted-foreground ml-2 hidden sm:inline">
              {subtitle}
            </span>
          </div>
        </div>
        <button className="flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline">
          Ver todos <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {ads.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => onAdClick(ad)}
            className="shrink-0 w-[160px] sm:w-[180px] bg-card rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="relative overflow-hidden">
              <img
                src={ad.fotos?.[0] || "/placeholder.svg"}
                alt={ad.titulo}
                className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <span
                className={cn(
                  "absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white",
                  badgeColor
                )}
              >
                <Zap className="h-2 w-2" />
                {badgeText}
              </span>
              <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-white drop-shadow-lg">
                {ad.preco != null ? formatBrlNoCents(ad.preco) : "Sob consulta"}
              </span>
              {ad.fotos && ad.fotos.length > 1 && (
                <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm text-[8px] font-bold text-white px-1 py-0.5 rounded-full">
                  <Camera className="h-2 w-2" /> {ad.fotos.length}
                </span>
              )}
            </div>
            <div className="p-2.5">
              <p className="text-[11px] font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
                {ad.titulo}
              </p>
              <div className="flex items-center gap-1 mt-1.5">
                {ad.bairro && (
                  <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate max-w-[80px]">{ad.bairro}</span>
                  </span>
                )}
              </div>
              {ad.vendedor?.nome && (
                <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/50">
                  <div className="h-3.5 w-3.5 rounded-full bg-primary/10 flex items-center justify-center text-[7px] font-bold text-primary shrink-0">
                    {ad.vendedor.nome[0]?.toUpperCase()}
                  </div>
                  <span className="text-[8px] text-muted-foreground truncate">
                    {ad.vendedor.nome}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
