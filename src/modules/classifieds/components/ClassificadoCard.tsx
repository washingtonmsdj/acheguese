/**
 * 💰 CLASSIFICADO CARD COMPONENT (NÍVEL AAA)
 *
 * Card moderno para exibição de classificados
 *
 * Features:
 * - Design moderno com status badges
 * - Animações Framer Motion
 * - Preço destacado
 * - Localização
 * - Botão de mapa
 * - Hover effects
 * - Acessibilidade completa
 *
 * @version 1.0.0
 */

import { memo, forwardRef } from "react";
import { MapPin } from "lucide-react";
import { ViewOnMapButton } from "@/core/maps/components/ViewOnMapButton";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import type { ClassificadoWithVendedor } from "@/modules/classifieds/hooks/useClassificados";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Disponível",
    color: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  reserved: {
    label: "Reservado",
    color: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
  },
  sold: {
    label: "Vendido",
    color: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};

interface ClassificadoCardProps {
  classificado: ClassificadoWithVendedor;
  index: number;
  onClick: () => void;
}

export const ClassificadoCard = memo(
  forwardRef<HTMLDivElement, ClassificadoCardProps>(function ClassificadoCard(
    { classificado, index, onClick },
    ref
  ) {
    const status = STATUS_CONFIG[classificado.status] || STATUS_CONFIG.active;
    const firstImage = classificado.fotos?.[0] || "/placeholder.svg";

    return (
      <motion.div
        ref={ref}
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="group bg-card rounded-2xl border overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
      role="article"
      aria-label={`Classificado: ${classificado.titulo}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={firstImage}
          alt={classificado.titulo}
          className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Status badge */}
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm",
            status.color,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </div>

        {/* Price */}
        <div className="absolute bottom-2 left-2">
          <span className="text-sm font-bold text-white drop-shadow-lg">
            R$ {classificado.preco?.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-xs font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {classificado.titulo}
        </h3>

        {classificado.bairro && (
          <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="text-[10px] truncate">{classificado.bairro}</span>
          </div>
        )}
      </div>
      </motion.div>
    );
  })
);
