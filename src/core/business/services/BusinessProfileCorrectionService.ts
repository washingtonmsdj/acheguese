import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export const BUSINESS_PROFILE_CORRECTION_FIELDS = [
  { id: "name", label: "Nome", autoApply: true },
  { id: "address", label: "Endereco", autoApply: false },
  { id: "map_location", label: "Localizacao no mapa", autoApply: false },
  { id: "phone", label: "Telefone", autoApply: false },
  { id: "whatsapp", label: "WhatsApp", autoApply: false },
  { id: "website", label: "Site", autoApply: true },
  { id: "opening_hours", label: "Horario de funcionamento", autoApply: false },
  { id: "category", label: "Categoria", autoApply: true },
  { id: "school_type", label: "Tipo de escola", autoApply: true },
  { id: "school_network", label: "Rede escolar", autoApply: true },
  { id: "inep_code", label: "Codigo INEP", autoApply: true },
  { id: "education_levels", label: "Etapas de ensino", autoApply: true },
  { id: "shifts", label: "Turnos", autoApply: true },
  { id: "enrollment_status", label: "Situacao de matricula", autoApply: true },
  { id: "infrastructure", label: "Infraestrutura", autoApply: false },
  { id: "operating_status", label: "Situacao de funcionamento", autoApply: false },
  { id: "other", label: "Outro dado factual", autoApply: false },
] as const;

export type BusinessProfileCorrectionField =
  (typeof BUSINESS_PROFILE_CORRECTION_FIELDS)[number]["id"];

export type BusinessProfileCorrectionStatus =
  | "pending"
  | "under_review"
  | "applied"
  | "rejected";

export interface BusinessProfileCorrectionRecord {
  id: string;
  business_id: string;
  reporter_profile_id?: string;
  field_code: BusinessProfileCorrectionField;
  proposed_value: string;
  source_url: string | null;
  explanation: string | null;
  status: BusinessProfileCorrectionStatus;
  created_at: string;
}

export interface BusinessProfileCorrectionQueueItem {
  id: string;
  business_id: string;
  profile_id: string;
  business_name: string;
  field_code: BusinessProfileCorrectionField;
  proposed_value: string;
  source_url: string | null;
  explanation: string | null;
  status: BusinessProfileCorrectionStatus;
  created_at: string;
}

function correctionErrorMessage(message: string): string {
  if (message.includes("managed_profile_should_be_edited_directly")) {
    return "Quem administra este perfil deve corrigir o dado diretamente pela Central.";
  }
  if (message.includes("rate_limit")) {
    return "Limite de sugestoes atingido. Tente novamente mais tarde.";
  }
  if (message.includes("active_profile_required")) {
    return "Selecione um perfil ativo antes de sugerir a correcao.";
  }
  if (message.includes("requires_manual_application")) {
    return "Este campo exige revisao manual antes de ser aplicado.";
  }
  if (message.includes("not_authorized")) {
    return "Voce nao tem permissao para esta acao.";
  }
  return "Nao foi possivel concluir a correcao de dados.";
}

export const BusinessProfileCorrectionService = {
  async suggest(input: {
    businessId: string;
    fieldCode: BusinessProfileCorrectionField;
    proposedValue: string;
    sourceUrl?: string;
    explanation?: string;
  }): Promise<BusinessProfileCorrectionRecord> {
    const { data, error } = await supabase.rpc(
      "create_business_profile_correction",
      {
        p_business_id: input.businessId,
        p_field_code: input.fieldCode,
        p_proposed_value: input.proposedValue.trim(),
        p_source_url: input.sourceUrl?.trim() || null,
        p_explanation: input.explanation?.trim() || null,
      },
    );

    if (error) {
      logger.error("[BusinessProfileCorrectionService] suggest failed:", error);
      throw new Error(correctionErrorMessage(error.message));
    }
    if (!data) throw new Error("Nao foi possivel registrar a sugestao.");

    return data as unknown as BusinessProfileCorrectionRecord;
  },

  async listQueue(
    status: BusinessProfileCorrectionStatus | null = "pending",
    limit = 50,
  ): Promise<BusinessProfileCorrectionQueueItem[]> {
    const { data, error } = await supabase.rpc(
      "list_business_profile_correction_queue",
      { p_status: status, p_limit: limit },
    );

    if (error) {
      logger.error("[BusinessProfileCorrectionService] listQueue failed:", error);
      throw new Error(correctionErrorMessage(error.message));
    }

    return (data ?? []) as unknown as BusinessProfileCorrectionQueueItem[];
  },

  async resolve(input: {
    correctionId: string;
    status: Exclude<BusinessProfileCorrectionStatus, "pending">;
    adminNotes?: string;
  }): Promise<BusinessProfileCorrectionRecord> {
    const { data, error } = await supabase.rpc(
      "resolve_business_profile_correction",
      {
        p_correction_id: input.correctionId,
        p_status: input.status,
        p_admin_notes: input.adminNotes?.trim() || null,
      },
    );

    if (error) {
      logger.error("[BusinessProfileCorrectionService] resolve failed:", error);
      throw new Error(correctionErrorMessage(error.message));
    }
    if (!data) throw new Error("Nao foi possivel atualizar a sugestao.");

    return data as unknown as BusinessProfileCorrectionRecord;
  },

  async apply(correctionId: string): Promise<BusinessProfileCorrectionRecord> {
    const { data, error } = await supabase.rpc(
      "apply_business_profile_correction",
      { p_correction_id: correctionId },
    );

    if (error) {
      logger.error("[BusinessProfileCorrectionService] apply failed:", error);
      throw new Error(correctionErrorMessage(error.message));
    }
    if (!data) throw new Error("Nao foi possivel aplicar a sugestao.");

    return data as unknown as BusinessProfileCorrectionRecord;
  },

  canAutoApply(fieldCode: BusinessProfileCorrectionField): boolean {
    return (
      BUSINESS_PROFILE_CORRECTION_FIELDS.find((field) => field.id === fieldCode)
        ?.autoApply ?? false
    );
  },
};
