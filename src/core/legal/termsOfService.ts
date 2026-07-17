export const TERMS_OF_SERVICE_VERSION = "2026-07-13";
export const TERMS_OF_SERVICE_UPDATED_LABEL = "13 de julho de 2026";
export {
  TERMS_OF_SERVICE_PATH,
  COMMUNITY_GUIDELINES_ANCHOR,
  COMMUNITY_GUIDELINES_PATH,
} from "@/shared/constants/legal";

export type TermsAcceptance = {
  accepted: true;
  version: typeof TERMS_OF_SERVICE_VERSION;
};

export const COMMUNITY_GUIDELINES = [
  {
    id: "no-unfounded-accusations",
    title: "Não acuse pessoas ou empresas",
    description:
      "Não use a plataforma para acusar terceiros de crime, fraude ou conduta ilegal sem canal oficial e base apropriada. Denúncias formais devem seguir os meios competentes.",
  },
  {
    id: "protect-personal-data",
    title: "Não exponha dados pessoais",
    description:
      "Não publique endereço, telefone, fotos privadas, documentos ou qualquer dado sensível de terceiros sem permissão válida e finalidade legítima.",
  },
  {
    id: "no-abusive-content",
    title: "Sem conteúdo ofensivo ou abusivo",
    description:
      "A comunidade não admite ameaça, discurso de ódio, discriminação, humilhação pública, assédio, intimidação ou ataques pessoais.",
  },
  {
    id: "protect-sensitive-operations",
    title: "Não divulgue operações sensíveis",
    description:
      "Não informe localização de blitz, operações policiais, fiscalização em andamento ou qualquer ação que possa comprometer a segurança pública.",
  },
  {
    id: "no-misinformation",
    title: "Não espalhe desinformação",
    description:
      "Não publique boatos, alertas falsos ou informações sem contexto que possam gerar pânico, dano reputacional ou comportamento de risco na comunidade.",
  },
  {
    id: "respect-law-and-local-context",
    title: "Respeite a lei e o contexto local",
    description:
      "Todo conteúdo precisa respeitar a legislação brasileira, as regras da plataforma e o uso responsável dos módulos de bairro, cidade e comunidade.",
  },
] as const;

export const COMMUNITY_GUIDELINE_ENFORCEMENT_STEPS = [
  "Conteúdo removido e orientação inicial quando houver infração de menor gravidade.",
  "Restrição temporária de interação ou suspensão parcial em caso de reincidência ou risco moderado.",
  "Bloqueio prolongado ou encerramento da conta quando houver abuso grave, fraude, ameaça ou recorrência.",
] as const;

export function isCurrentTermsAcceptance(
  value: { accepted?: unknown; version?: unknown } | null | undefined,
): value is TermsAcceptance {
  return value?.accepted === true && value.version === TERMS_OF_SERVICE_VERSION;
}

export function hasCurrentTermsAcceptance(
  value:
    | {
        consent_type?: string | null;
        granted?: boolean | null;
        terms_version?: string | null;
      }
    | null
    | undefined,
): boolean {
  return Boolean(
    value?.consent_type === "terms_of_service" &&
    value.granted === true &&
    value.terms_version === TERMS_OF_SERVICE_VERSION,
  );
}
