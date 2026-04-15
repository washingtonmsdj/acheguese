/**
 * Componente das seções de catálogo de comida
 */

import { Star, TrendingUp } from 'lucide-react';
import { FoodSectionCarousel } from '../../../components';
import type { FoodSectionItems } from '../types';

interface FoodCatalogSectionsProps {
  sectionItems: FoodSectionItems;
  sectionScopeLabel: string;
}

export function FoodCatalogSections(props: FoodCatalogSectionsProps) {
  const { sectionItems, sectionScopeLabel } = props;

  return (
    <div className="container mx-auto space-y-10 px-4 py-4">
      <FoodSectionCarousel
        title="Produtos mais vendidos"
        subtitle={`Itens com maior volume de pedidos ${sectionScopeLabel}`}
        icon={TrendingUp}
        items={sectionItems.mostOrdered}
        accentColor="bg-primary/10"
      />
      <FoodSectionCarousel
        title="Produtos melhor avaliados"
        subtitle={`Itens com melhor avaliacao de loja ${sectionScopeLabel}`}
        icon={Star}
        items={sectionItems.topRated}
        accentColor="bg-amber-500/10"
      />
    </div>
  );
}
