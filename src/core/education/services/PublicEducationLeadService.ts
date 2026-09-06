import { supabase } from "@/integrations/supabase";
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
  if (message.includes("public_institution_lead_intake_disabled")) {
    return "Esta instituicao usa somente os canais oficiais para matricula e atendimento.";
  }
  if (message.includes("institution_lead_authority_not_enabled")) {
    return "O atendimento deste perfil ainda nao esta habilitado.";
  }
  if (message.includes("daily_limit") || message.includes("rate")) {
    return "Muitas solicitacoes foram enviadas. Tente novamente mais tarde.";
  }
  if (message.includes("not_available")) {
    return "Este perfil nao esta disponivel para receber solicitacoes.";
  }
  if (message.includes("invalid_")) {
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
      logger.warn("[PublicEducationLeadService] broker failed:", error);
      throw new Error(publicLeadError(error.message));
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
