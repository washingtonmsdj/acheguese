/**
 * MobilidadeHeader — Header da página de mobilidade.
 * 
 * Usa ModuleHeader SSOT com customizações específicas de mobilidade.
 */

import { Car } from 'lucide-react';
import { ModuleHeader } from '@/shared/components/module-header';

interface MobilidadeHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const MOBILIDADE_TAGLINES = [
  (place: string) => `Conectando pessoas em ${place}`,
  (place: string) => `Mobilidade local em ${place}`,
  (place: string) => `Motoristas e passageiros de ${place}`,
  (place: string) => `Transporte comunitário em ${place}`,
];

export function MobilidadeHeader({ searchQuery, onSearchChange }: MobilidadeHeaderProps) {
  return (
    <ModuleHeader
      moduleName="Mobilidade"
      moduleIcon={Car}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar motoristas, rotas..."
      taglines={MOBILIDADE_TAGLINES}
      showFavorites={false}
    />
  );
}
