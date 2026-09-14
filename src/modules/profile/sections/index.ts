/**
 * Sections - Barrel export para sections legadas ainda mantidas.
 *
 * Segurança, privacidade e dados da conta já pertencem às superfícies
 * canônicas em /conta e não são reexportados por este barrel.
 */

export { ResumoSection } from "./ResumoSection";
export { DadosPessoaisSection } from "./DadosPessoaisSection";
export { EmpresasSection } from "./EmpresasSection";
export { MobilidadeSection } from "./MobilidadeSection";
export { DeliverySection } from "./DeliverySection";
export { PlanosSection } from "./PlanosSection";
export { NotificacoesSection } from "./NotificacoesSection";
export { PreferenciasSection } from "./PreferenciasSection";

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
} from "./types";
