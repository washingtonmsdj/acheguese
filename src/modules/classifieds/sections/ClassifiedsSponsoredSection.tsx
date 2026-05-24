/**
 * ClassifiedsSponsoredSection - Anúncios patrocinados
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { Megaphone } from "lucide-react";
import { SponsoredCard } from "../components/cards";
import type { ClassifiedsSponsoredSectionProps } from "./types";

export function ClassifiedsSponsoredSection({
  ads,
  onAdClick,
}: ClassifiedsSponsoredSectionProps) {
  if (ads.length === 0) return null;

  return (
    <section className="px-4 mt-5" aria-label="Anúncios patrocinados">
      <div className="flex items-center gap-1.5 mb-3">
        <Megaphone className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold font-display text-foreground">
          Patrocinados
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ads.slice(0, 4).map((ad, i) => (
          <SponsoredCard
            key={`sponsored-${ad.id}`}
            ad={ad}
            index={i}
            onClick={() => onAdClick(ad)}
          />
        ))}
      </div>
    </section>
  );
}
