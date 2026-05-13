/**
 * Sections - Barrel export para todas as sections do ContaHub
 * 
 * SSOT: Ponto único de exportação
 * Sem gambiarras: Exports explícitos
 */

export { ResumoSection } from "./ResumoSection";
export { DadosPessoaisSection } from "./DadosPessoaisSection";
export { EmpresasSection } from "./EmpresasSection";
export { MobilidadeSection } from "./MobilidadeSection";
export { DeliverySection } from "./DeliverySection";
export { PlanosSection } from "./PlanosSection";
export { NotificacoesSection } from "./NotificacoesSection";
export { PreferenciasSection } from "./PreferenciasSection";
export { SegurancaSection } from "./SegurancaSection";

export type {
  ProfileSectionId,
  SectionPropsMap,
  ResumoSectionProps,
  DadosPessoaisSectionProps,
  EmpresasSectionProps,
  MobilidadeSectionProps,
  DeliverySectionProps,
  PlanosSectionProps,
  NotificacoesSectionProps,
  PreferenciasSectionProps,
  SegurancaSectionProps,
} from "./types";
