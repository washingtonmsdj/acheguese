/**
 * ClassifiedsFeaturedSection - Anúncios em destaque
 * 
 * SSOT: Section modular e reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { Star } from "lucide-react";
import { HorizontalSection } from "../components/sections";
import type { ClassifiedsHorizontalSectionProps } from "./types";

export function ClassifiedsFeaturedSection({
  ads,
  onAdClick,
}: ClassifiedsHorizontalSectionProps) {
  if (ads.length === 0) return null;

  return (
    <HorizontalSection
      title="Destaques"
      subtitle="Seleção premium"
      icon={<Star className="h-4 w-4 text-warning fill-warning" />}
      ads={ads}
      badgeText="Destaque"
      badgeColor="bg-warning/90 text-warning-foreground"
      onAdClick={onAdClick}
    />
  );
}
