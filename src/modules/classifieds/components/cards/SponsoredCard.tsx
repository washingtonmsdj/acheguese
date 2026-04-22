/**
 * SponsoredCard - Card de anúncio patrocinado
 * 
 * SSOT: Componente reutilizável para anúncios patrocinados
 * Sem gambiarras: Props tipadas e código limpo
 */

import { motion } from "framer-motion";
import { MapPin, Megaphone } from "lucide-react";
import type { Classificado } from "../../sections/types";

// ============================================
// Props
// ============================================

export interface SponsoredCardProps {
  readonly ad: Classificado;
  readonly index: number;
  readonly onClick: () => void;
}

// ============================================
// Component
// ============================================

export function SponsoredCard({ ad, index, onClick }: SponsoredCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      onClick={onClick}
      className="relative bg-card rounded-xl border border-primary/20 overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all"
    >
      <div className="relative overflow-hidden">
        <img
          src={ad.fotos?.[0] || "/placeholder.svg"}
          alt={ad.titulo}
          className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[8px] font-bold bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-full">
          <Megaphone className="h-2 w-2" />
          Patrocinado
        </span>
        <span className="absolute bottom-2 left-2 text-sm font-bold text-white drop-shadow-lg">
          R$ {ad.preco?.toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="text-[11px] font-semibold line-clamp-1 text-foreground group-hover:text-primary transition-colors">
          {ad.titulo}
        </h3>
        {ad.bairro && (
          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground mt-1">
            <MapPin className="h-2.5 w-2.5" /> {ad.bairro}
          </span>
        )}
      </div>
    </motion.div>
  );
}
