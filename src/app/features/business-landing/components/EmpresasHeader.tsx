/**
 * EmpresasHeader — Header da página de empresas.
 * 
 * REFATORADO: Agora usa ModuleHeader SSOT.
 * Mantido para compatibilidade e customizações específicas de empresas.
 */

import { Building2 } from 'lucide-react';
import { ModuleHeader } from '@/shared/components/module-header';

interface EmpresasHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const EMPRESAS_TAGLINES = [
  (place: string) => `Negócios locais que fazem ${place} especial`,
  (place: string) => `O melhor do comércio em ${place}`,
  (place: string) => `Empresas, serviços e muito mais em ${place}`,
  (place: string) => `De onde você está em ${place}, tem algo perto`,
];

export function EmpresasHeader({ searchQuery, onSearchChange }: EmpresasHeaderProps) {
  return (
    <ModuleHeader
      moduleName="Empresas"
      moduleIcon={Building2}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar empresas, serviços..."
      taglines={EMPRESAS_TAGLINES}
      showFavorites={false}
    />
  );
}
