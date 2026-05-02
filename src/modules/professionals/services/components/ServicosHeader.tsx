/**
 * ServicosHeader — Header da página de serviços.
 * 
 * Usa ModuleHeader SSOT com customizações específicas de serviços.
 */

import { Wrench } from 'lucide-react';
import { ModuleHeader } from '@/shared/components/module-header';

interface ServicosHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const SERVICOS_TAGLINES = [
  (place: string) => `Profissionais de confiança em ${place}`,
  (place: string) => `Serviços locais em ${place}`,
  (place: string) => `Encontre especialistas em ${place}`,
  (place: string) => `Prestadores verificados de ${place}`,
];

export function ServicosHeader({ searchQuery, onSearchChange }: ServicosHeaderProps) {
  return (
    <ModuleHeader
      moduleName="Serviços"
      moduleIcon={Wrench}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar profissionais, serviços..."
      taglines={SERVICOS_TAGLINES}
      showFavorites={false}
    />
  );
}
