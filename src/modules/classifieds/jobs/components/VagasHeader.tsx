/**
 * VagasHeader — Header da página de vagas.
 * 
 * Usa ModuleHeader SSOT com customizações específicas de vagas/empregos.
 */

import { Briefcase } from 'lucide-react';
import { ModuleHeader } from '@/shared/components/module-header';

interface VagasHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const VAGAS_TAGLINES = [
  (place: string) => `Oportunidades de trabalho em ${place}`,
  (place: string) => `Vagas de emprego em ${place}`,
  (place: string) => `Encontre sua próxima oportunidade em ${place}`,
  (place: string) => `Empresas contratando em ${place}`,
];

export function VagasHeader({ searchQuery, onSearchChange }: VagasHeaderProps) {
  return (
    <ModuleHeader
      moduleName="Vagas"
      moduleIcon={Briefcase}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar vagas, cargos, empresas..."
      taglines={VAGAS_TAGLINES}
      showFavorites={false}
    />
  );
}
