/**
 * TouristPointHero — Usa CanonicalHero canônico
 */

import { Camera } from 'lucide-react';
import { CanonicalHero } from '@/shared/components/hero/CanonicalHero';

interface TouristPointHeroProps {
  territoryName: string;
}

export function TouristPointHero({ territoryName }: TouristPointHeroProps) {
  return (
    <CanonicalHero
      moduleName="Pontos Turísticos"
      moduleIcon={Camera}
      territoryName={territoryName}
      territoryFallback="Sua Região"
      title="Descubra os melhores"
      titleHighlight="pontos turísticos"
      subtitle="Monumentos históricos, praias, mirantes e atrações culturais para visitar."
    />
  );
}
