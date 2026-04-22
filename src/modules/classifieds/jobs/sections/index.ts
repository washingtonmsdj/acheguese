/**
 * Sections - Barrel export para todas as sections de Vagas
 * 
 * SSOT: Ponto único de exportação
 * Sem gambiarras: Exports explícitos
 */

export { VagasHeroSection } from "./VagasHeroSection";
export { VagasFiltrosSection } from "./VagasFiltrosSection";
export { VagasListagemSection } from "./VagasListagemSection";
export { VagasFooterSection } from "./VagasFooterSection";

export type {
  VagasSectionId,
  SectionPropsMap,
  VagasHeroSectionProps,
  VagasFiltrosSectionProps,
  VagasListagemSectionProps,
  VagasFooterSectionProps,
  BaseSectionProps,
  Vaga,
  VagasFilters,
  Bairro,
  VagasStats,
  HowItWorksStep,
  PublishPermission,
} from "./types";
