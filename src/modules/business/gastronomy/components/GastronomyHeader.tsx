/**
 * GastronomyHeader - Header da pagina de gastronomia.
 *
 * Usa ModuleHeader como fonte unica de layout do cabecalho do modulo.
 */

import { UtensilsCrossed } from 'lucide-react';
import { ModuleHeader } from '@/shared/components/module-header';

interface GastronomyHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const GASTRONOMY_TAGLINES = [
  (place: string) => `Sabores que fazem ${place} especial`,
  (place: string) => `O melhor da culinária em ${place}`,
  (place: string) => `Restaurantes, delivery e muito mais em ${place}`,
  (place: string) => `De onde você está em ${place}, tem algo gostoso perto`,
];

export function GastronomyHeader({ searchQuery, onSearchChange }: GastronomyHeaderProps) {
  return (
    <ModuleHeader
      moduleName="Gastronomia"
      moduleIcon={UtensilsCrossed}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar restaurantes, pratos..."
      taglines={GASTRONOMY_TAGLINES}
      favoritesLink="/gastronomia/favoritos"
      showFavorites={true}
    />
  );
}
