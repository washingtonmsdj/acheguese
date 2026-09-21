/**
 * ClassifiedsRecentSection - anúncios publicados recentemente.
 */

import { Clock3 } from "lucide-react";
import { HorizontalSection } from "../components/sections";
import type { ClassifiedsHorizontalSectionProps } from "./types";

export function ClassifiedsRecentSection({
  ads,
  onAdClick,
}: ClassifiedsHorizontalSectionProps) {
  if (ads.length === 0) return null;

  return (
    <HorizontalSection
      title="Novos anúncios"
      subtitle="Publicados recentemente"
      icon={<Clock3 className="h-4 w-4 text-primary" />}
      ads={ads}
      badgeText="Novo"
      badgeColor="bg-primary/90"
      onAdClick={onAdClick}
    />
  );
}
