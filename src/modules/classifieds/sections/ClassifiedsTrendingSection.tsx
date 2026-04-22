/**
 * ClassifiedsTrendingSection - Anúncios em alta
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { Flame } from "lucide-react";
import { HorizontalSection } from "../components/sections";
import type { ClassifiedsHorizontalSectionProps } from "./types";

export function ClassifiedsTrendingSection({
  ads,
  onAdClick,
}: ClassifiedsHorizontalSectionProps) {
  if (ads.length === 0) return null;

  return (
    <HorizontalSection
      title="Em Alta"
      subtitle="Anúncios mais recentes"
      icon={<Flame className="h-4 w-4 text-orange-400" />}
      ads={ads}
      badgeText="Novo"
      badgeColor="bg-orange-500/90"
      onAdClick={onAdClick}
    />
  );
}
