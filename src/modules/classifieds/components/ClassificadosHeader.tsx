/**
 * ClassificadosHeader — Header da página de classificados.
 * 
 * Usa ModuleHeader SSOT com customizações específicas de classificados.
 */

import { Tag } from 'lucide-react';
import { ModuleHeader } from '@/shared/components/module-header';

interface ClassificadosHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const CLASSIFICADOS_TAGLINES = [
  (place: string) => `Compre e venda em ${place}`,
  (place: string) => `Anúncios locais de ${place}`,
  (place: string) => `Produtos e serviços em ${place}`,
  (place: string) => `Marketplace comunitário de ${place}`,
];

export function ClassificadosHeader({ searchQuery, onSearchChange }: ClassificadosHeaderProps) {
  return (
    <ModuleHeader
      moduleName="Classificados"
      moduleIcon={Tag}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar produtos, categorias..."
      taglines={CLASSIFICADOS_TAGLINES}
      showFavorites={false}
    />
  );
}
