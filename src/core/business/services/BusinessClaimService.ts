import { supabase } from "@/integrations/supabase";
import { SessionService } from "@/core/session/services/SessionService";
import { logger } from "@/shared/utils/logger";

export interface BusinessClaimRequest {
  businessId: string;
  message?: string;
  /**
   * Referencias publicas verificaveis usadas na revisao humana.
   * Nao e upload de documento sensivel e nao concede autoridade automaticamente.
   */
  officialEvidenceUrls?: string[];
}

export interface BusinessClaimRequestResult {
  id: string;
  status: "pendente" | "aprovada" | "rejeitada";
  created: boolean;
}

type BusinessClaimDocument = {
  kind: "official_source_url";
  url: string;
};

function normalizeOfficialEvidenceUrls(
  values: string[] | undefined,
): BusinessClaimDocument[] {
  const normalized = Array.from(
    new Set(
      (values ?? [])
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (normalized.length > 5) {
    throw new Error("Envie no maximo 5 referencias oficiais.");
  }

  return normalized.map((value) => {
    if (value.length > 1200) {
      throw new Error("Uma referencia oficial excede o tamanho permitido.");
    }

    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error("Informe uma URL oficial valida.");
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("A referencia oficial deve usar http ou https.");
    }

    return {
      kind: "official_source_url" as const,
      url: parsed.toString(),
    };
  });
}

export const BusinessClaimService = {
  async requestClaim(
    input: BusinessClaimRequest,
  ): Promise<BusinessClaimRequestResult> {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("Entre na sua conta para solicitar a administracao.");
    }

    const message = input.message?.trim().slice(0, 1000) || null;
    const documents = normalizeOfficialEvidenceUrls(input.officialEvidenceUrls);

    const existing = await supabase
      .from("business_claims")
      .select("id,status")
      .eq("business_id", input.businessId)
      .eq("user_id", user.id)
      .eq("status", "pendente")
      .maybeSingle();

    if (existing.error) {
      logger.error(
        "[BusinessClaimService] Failed to inspect pending claim:",
        existing.error,
      );
      throw new Error("Nao foi possivel verificar a reivindicacao.");
    }

    if (existing.data) {
      if (message || documents.length > 0) {
        const updated = await supabase
          .from("business_claims")
          .update({
            ...(message ? { mensagem: message } : {}),
            ...(documents.length > 0 ? { documents } : {}),
          })
          .eq("id", existing.data.id)
          .eq("user_id", user.id)
          .eq("status", "pendente");

        if (updated.error) {
          logger.error(
            "[BusinessClaimService] Failed to update pending claim evidence:",
            updated.error,
          );
          throw new Error(
            "Nao foi possivel atualizar a comprovacao da reivindicacao.",
          );
        }
      }

      return {
        id: existing.data.id,
        status:
          existing.data.status as BusinessClaimRequestResult["status"],
        created: false,
      };
    }

    const created = await supabase
      .from("business_claims")
      .insert({
        business_id: input.businessId,
        user_id: user.id,
        claimer_id: user.id,
        mensagem: message,
        status: "pendente",
        documents,
      })
      .select("id,status")
      .single();

    if (created.error || !created.data) {
      logger.error(
        "[BusinessClaimService] Failed to create claim:",
        created.error,
      );
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
