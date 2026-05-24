/**
 * ClassifiedsPopularSection - Anúncios mais procurados
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { Eye } from "lucide-react";
import { HorizontalSection } from "../components/sections";
import type { ClassifiedsHorizontalSectionProps } from "./types";

export function ClassifiedsPopularSection({
  ads,
  onAdClick,
}: ClassifiedsHorizontalSectionProps) {
  if (ads.length === 0) return null;

  return (
    <HorizontalSection
      title="Mais Procurados"
      subtitle="Populares na região"
      icon={<Eye className="h-4 w-4 text-accent" />}
      ads={ads}
      badgeText="Popular"
      badgeColor="bg-accent/90"
      onAdClick={onAdClick}
    />
  );
}
