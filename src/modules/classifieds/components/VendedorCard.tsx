/**
 * VendedorCard - Card de vendedor/loja para modo Vendedores
 */

import { memo } from "react";
import { MapPin, Package, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import { formatBrlNoCents } from "@/shared/utils/currency";
import type { VendedorWithAds } from "@/modules/classifieds/hooks/useVendedores";

interface VendedorCardProps {
  vendedor: VendedorWithAds;
  index: number;
  onClick: () => void;
}

export const VendedorCard = memo(function VendedorCard({
  vendedor,
  index,
  onClick,
}: VendedorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="group bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
      role="article"
      aria-label={`Vendedor: ${vendedor.name}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0 overflow-hidden">
          {vendedor.avatar_url ? (
            <img
              src={vendedor.avatar_url}
              alt={vendedor.name}
              className="w-full h-full object-cover"
            />
          ) : (
            vendedor.name?.[0]?.toUpperCase() || "?"
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {vendedor.name}
            </h3>
          </div>

          <div className="flex items-center gap-3 mt-1 text-muted-foreground">
            {vendedor.neighborhood && (
              <span className="flex items-center gap-0.5 text-[11px]">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{vendedor.neighborhood}</span>
              </span>
            )}
            <span className="text-[11px] font-medium text-primary">
              {vendedor.active_ads_count} {vendedor.active_ads_count === 1 ? 'anúncio' : 'anúncios'}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
      </div>

      {/* Featured ads preview */}
      {vendedor.featured_ads.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-hidden">
          {vendedor.featured_ads.map((ad) => (
            <div
              key={ad.id}
              className="relative w-20 h-16 rounded-lg overflow-hidden bg-secondary shrink-0"
            >
              {ad.photos?.[0] ? (
                <img
                  src={ad.photos[0]}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Package className="h-5 w-5 opacity-40" aria-hidden="true" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                <span className="text-[8px] font-bold text-white">
                  {ad.price != null ? formatBrlNoCents(ad.price) : "Sob consulta"}
                </span>
              </div>
            </div>
          ))}
          {vendedor.active_ads_count > 3 && (
            <div className="w-20 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground">
                +{vendedor.active_ads_count - 3}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});


