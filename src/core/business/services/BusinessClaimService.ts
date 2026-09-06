import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export interface BusinessClaimRequest {
  businessId: string;
  userId: string;
  message?: string;
}

export interface BusinessClaimRequestResult {
  id: string;
  status: "pendente" | "aprovada" | "rejeitada";
  created: boolean;
}

export const BusinessClaimService = {
  async requestClaim(input: BusinessClaimRequest): Promise<BusinessClaimRequestResult> {
    const message = input.message?.trim().slice(0, 1000) || null;

    const existing = await supabase
      .from("business_claims")
      .select("id,status")
      .eq("business_id", input.businessId)
      .eq("user_id", input.userId)
      .eq("status", "pendente")
      .maybeSingle();

    if (existing.error) {
      logger.error("[BusinessClaimService] Failed to inspect pending claim:", existing.error);
      throw new Error("Nao foi possivel verificar a reivindicacao.");
    }

    if (existing.data) {
      return {
        id: existing.data.id,
        status: existing.data.status as BusinessClaimRequestResult["status"],
        created: false,
      };
    }

    const created = await supabase
      .from("business_claims")
      .insert({
        business_id: input.businessId,
        user_id: input.userId,
        claimer_id: input.userId,
        mensagem: message,
        status: "pendente",
        documents: [],
      })
      .select("id,status")
      .single();

    if (created.error || !created.data) {
      logger.error("[BusinessClaimService] Failed to create claim:", created.error);
      throw new Error(
        created.error?.message.includes("row-level security")
          ? "Este perfil nao esta disponivel para reivindicacao."
          : "Nao foi possivel enviar a reivindicacao.",
      );
    }

    return {
      id: created.data.id,
      status: created.data.status as BusinessClaimRequestResult["status"],
      created: true,
    };
  },
};
