/**
 * ClassifiedsRecentSection - anúncios publicados recentemente.
 */

import { Clock } from "lucide-react";
import { HorizontalSection } from "../components/sections";
import type { ClassifiedsHorizontalSectionProps } from "./types";

export function ClassifiedsRecentSection({
  ads,
  onAdClick,
}: ClassifiedsHorizontalSectionProps) {
  if (ads.length === 0) return null;

  return (
    <HorizontalSection
      title="Últimos anúncios"
      subtitle="Ordenados por data de publicação"
      icon={<Clock className="h-4 w-4 text-primary" />}
      ads={ads}
      badgeText="Anúncio"
      badgeColor="bg-primary/90"
      onAdClick={onAdClick}
    />
  );
}
