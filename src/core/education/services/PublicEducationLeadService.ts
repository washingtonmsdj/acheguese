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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

    if (!isRecord(data)) {
      throw new Error("Nao foi possivel registrar seu interesse.");
    }

    if (typeof data.error === "string") {
      throw new Error(publicLeadError(data.error));
    }

    if (
      typeof data.leadId !== "string" ||
      !UUID_PATTERN.test(data.leadId) ||
      typeof data.created !== "boolean" ||
      data.educationProfileId !== input.educationProfileId ||
      typeof data.businessDataId !== "string" ||
      !UUID_PATTERN.test(data.businessDataId)
    ) {
      logger.warn("[PublicEducationLeadService] invalid broker response contract", {
        educationProfileId: input.educationProfileId,
      });
      throw new Error("Nao foi possivel registrar seu interesse.");
    }

    return {
      id: data.leadId,
      created: data.created,
    };
  },
};
