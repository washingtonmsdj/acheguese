/**
 * Sections - Barrel export para todas as sections do PerfilHub
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
export { ConfiguracoesSection } from "./ConfiguracoesSection";
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
  ConfiguracoesSectionProps,
  SegurancaSectionProps,
} from "./types";
