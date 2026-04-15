/**
 * 🏆 HERO SECTION - Usa CanonicalHero do sistema
 */

import { Search, Filter, Plus, Sparkles } from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Briefcase } from "lucide-react";

interface HeroSectionProps {
  cityName: string;
  search: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  onPublishClick: () => void;
}

export function HeroSection({
  cityName,
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onPublishClick,
}: HeroSectionProps) {
  return (
    <CanonicalHero
      moduleName="Vagas"
      moduleIcon={Briefcase}
      territoryName={cityName}
      territoryFallback="Sua Cidade"
      title="Encontre sua"
      titleHighlight="próxima oportunidade"
      subtitle={`Vagas de emprego verificadas em ${cityName} e região. Conectando talentos locais a empresas da comunidade.`}
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: "Cargo, empresa ou habilidade...",
      }}
      primaryCTA={{
        label: "Publicar vaga",
        icon: Plus,
        onClick: onPublishClick,
      }}
      secondaryCTA={{
        label: "Filtros",
        icon: Filter,
        onClick: onToggleFilters,
        variant: "outline",
      }}
      quickFilters={
        hasActiveFilters
          ? [
              {
                label: "Filtros ativos",
                icon: Sparkles,
                isActive: true,
                onClick: onToggleFilters,
              },
            ]
          : undefined
      }
    />
  );
}
