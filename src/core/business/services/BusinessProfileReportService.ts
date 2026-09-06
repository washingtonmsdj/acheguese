import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export const BUSINESS_PROFILE_REPORT_REASONS = [
  "fraud",
  "impersonation",
  "misleading",
  "harmful",
  "privacy_or_safety",
  "duplicate",
  "closed_or_not_here",
  "policy_violation",
  "other",
] as const;

export type BusinessProfileReportReason =
  (typeof BUSINESS_PROFILE_REPORT_REASONS)[number];

export interface BusinessProfileReportRecord {
  id: string;
  business_id: string;
  reason: BusinessProfileReportReason;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  created_at: string;
}

export const BusinessProfileReportService = {
  async report(input: {
    businessId: string;
    reason: BusinessProfileReportReason;
    description?: string;
  }): Promise<BusinessProfileReportRecord> {
    const description = input.description?.trim() || null;

    const { data, error } = await supabase.rpc("create_business_profile_report", {
      p_business_id: input.businessId,
      p_reason: input.reason,
      p_description: description,
    });

    if (error) {
      logger.error("[BusinessProfileReportService] report failed:", error);
      throw new Error(
        error.message.includes("self_report_not_allowed")
          ? "Quem administra este perfil deve corrigir os dados pela Central."
          : error.message.includes("rate_limit")
            ? "Limite de denuncias atingido. Tente novamente mais tarde."
            : error.message.includes("active_profile_required")
              ? "Selecione um perfil ativo antes de enviar a denuncia."
              : "Nao foi possivel enviar a denuncia.",
      );
    }

    if (!data) {
      throw new Error("Nao foi possivel registrar a denuncia.");
    }

    return data as unknown as BusinessProfileReportRecord;
  },
};
