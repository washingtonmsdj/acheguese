import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { SchoolShift } from "@/core/education";

export interface PublicEducationLeadInput {
  educationProfileId: string;
  fullName: string;
  email: string;
  phone: string;
  childName?: string;
  childAge?: number;
  interestNote?: string;
  guardianName?: string;
  studentName?: string;
  studentAge?: number;
  desiredGrade?: string;
  desiredShift?: SchoolShift;
}

export interface PublicEducationLeadResult {
  id: string;
  created: boolean;
}

function publicLeadError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("public_institution_lead_intake_disabled")) {
    return "Esta instituicao usa somente os canais oficiais para matricula e atendimento.";
  }
  if (normalized.includes("institution_lead_authority_not_enabled")) {
    return "O atendimento deste perfil ainda nao esta habilitado.";
  }
  if (normalized.includes("daily_limit") || normalized.includes("rate")) {
    return "Muitas solicitacoes foram enviadas. Tente novamente mais tarde.";
  }
  if (normalized.includes("not_available")) {
    return "Este perfil nao esta disponivel para receber solicitacoes.";
  }
  if (normalized.includes("invalid_")) {
    return "Revise os dados informados e tente novamente.";
  }
  return "Nao foi possivel registrar seu interesse.";
}

export const PublicEducationLeadService = {
  async create(input: PublicEducationLeadInput): Promise<PublicEducationLeadResult> {
    const { data, error } = await supabase.functions.invoke("education-lead-rpc", {
      body: input,
    });

    if (error) {
      const brokerMessage =
        (await resolveSupabaseFunctionErrorMessage(error)) ?? error.message ?? "";
      logger.warn("[PublicEducationLeadService] broker failed:", {
        message: brokerMessage,
      });
      throw new Error(publicLeadError(brokerMessage));
    }

    const response = data as
      | { leadId?: unknown; created?: unknown; error?: unknown }
      | null;

    if (typeof response?.error === "string") {
      throw new Error(publicLeadError(response.error));
    }
    if (typeof response?.leadId !== "string") {
      throw new Error("Nao foi possivel registrar seu interesse.");
    }

    return {
      id: response.leadId,
      created: response.created === true,
    };
  },
};
