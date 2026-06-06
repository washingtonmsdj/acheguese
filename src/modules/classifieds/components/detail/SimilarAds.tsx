import { memo } from "react";
import { Layers, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { formatBrlNoCents } from "@/shared/utils/currency";

interface SimilarAd {
  id: string;
  titulo: string;
  preco: number;
  foto: string;
  bairro?: string;
}

interface SimilarAdsProps {
  ads: SimilarAd[];
  onAdClick: (id: string) => void;
}

export const SimilarAds = memo(function SimilarAds({
  ads,
  onAdClick,
}: SimilarAdsProps) {
  if (ads.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="px-4 mt-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center">
          <Layers className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-bold font-display">Anuncios similares</h2>
          <p className="text-[10px] text-muted-foreground">
            Outros itens que podem te interessar
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {ads.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.05 }}
            onClick={() => onAdClick(ad.id)}
            className="min-w-[140px] max-w-[160px] shrink-0 bg-card rounded-xl border overflow-hidden cursor-pointer group hover:shadow-lg hover:shadow-primary/5 transition-all hover:-translate-y-0.5"
          >
            <div className="relative overflow-hidden">
              <img
                src={ad.foto}
                alt={ad.titulo}
                className="w-full h-24 object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-1.5 left-1.5 text-[11px] font-bold text-white drop-shadow-lg">
                {formatBrlNoCents(ad.preco)}
              </span>
            </div>
            <div className="p-2">
              <p className="text-[11px] font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {ad.titulo}
              </p>
              {ad.bairro && (
                <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {ad.bairro}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
});
