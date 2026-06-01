import { memo } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ClassificadoCard } from "./ClassificadoCard";
import type { ClassificadoWithVendedor } from "@/core/classifieds/hooks/useClassificados";

interface SuggestedAdsProps {
  ads: ClassificadoWithVendedor[];
  title?: string;
  onAdClick: (ad: ClassificadoWithVendedor) => void;
}

export const SuggestedAds = memo(function SuggestedAds({
  ads,
  title = "Também podem te interessar",
  onAdClick,
}: SuggestedAdsProps) {
  if (ads.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-bold font-display">{title}</h2>
          <p className="text-[10px] text-muted-foreground">
            Baseado no que você está vendo
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {ads.slice(0, 8).map((ad, index) => (
          <div key={ad.id} className="min-w-[160px] max-w-[180px] shrink-0">
            <ClassificadoCard
              classificado={ad}
              index={index}
              onClick={() => onAdClick(ad)}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
});
