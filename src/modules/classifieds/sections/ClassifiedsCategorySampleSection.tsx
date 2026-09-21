/**
 * ClassifiedsCategorySampleSection - amostra factual de anúncios por categoria.
 */

import { Tag } from "lucide-react";
import { HorizontalSection } from "../components/sections";
import type { ClassifiedsHorizontalSectionProps } from "./types";

export function ClassifiedsCategorySampleSection({
  ads,
  onAdClick,
}: ClassifiedsHorizontalSectionProps) {
  if (ads.length === 0) return null;

  return (
    <HorizontalSection
      title="Explore categorias"
      subtitle="Uma seleção de anúncios por categoria"
      icon={<Tag className="h-4 w-4 text-primary" />}
      ads={ads}
      badgeText="Categoria"
      badgeColor="bg-primary/90"
      onAdClick={onAdClick}
    />
  );
}
