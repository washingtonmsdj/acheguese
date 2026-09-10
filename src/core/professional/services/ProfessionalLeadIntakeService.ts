import { supabase } from "@/integrations/supabase";

export type ProfessionalLeadSourceChannel =
  | "public_profile"
  | "service_profile"
  | "central";

export interface CreateProfessionalLeadSubmission {
  professionalId: string;
  requesterName: string;
  requesterPhone?: string;
  requesterEmail?: string;
  serviceNeeded: string;
  description: string;
  preferredDate?: string;
  preferredTimeWindow?: string;
  neighborhood?: string;
  locationId?: string;
  sourceChannel: ProfessionalLeadSourceChannel;
  honeypot: string;
  turnstileToken: string | null;
}

export interface ProfessionalLeadIntakeResult {
  success: boolean;
  data?: { id: string };
  deduplicated?: boolean;
  error?: string;
}

type BrokerPayload =
  | {
      status: "created" | "already_submitted";
      lead?: { id?: unknown };
    }
  | { status: "turnstile_failed" }
  | { error?: unknown };

function leadIdFromPayload(payload: BrokerPayload | null): string | null {
  if (!payload || !("lead" in payload) || !payload.lead) return null;
  return typeof payload.lead.id === "string" ? payload.lead.id : null;
}

export class ProfessionalLeadIntakeService {
  static async createLead(
    input: CreateProfessionalLeadSubmission,
  ): Promise<ProfessionalLeadIntakeResult> {
    const { data, error } = await supabase.functions.invoke<BrokerPayload>(
      "create-professional-lead",
      {
        body: {
          professionalId: input.professionalId,
          requesterName: input.requesterName,
          requesterPhone: input.requesterPhone ?? null,
          requesterEmail: input.requesterEmail ?? null,
          serviceNeeded: input.serviceNeeded,
          description: input.description,
          preferredDate: input.preferredDate ?? null,
          preferredTimeWindow: input.preferredTimeWindow ?? null,
          neighborhood: input.neighborhood ?? null,
          locationId: input.locationId ?? null,
          sourceChannel: input.sourceChannel,
          honeypot: input.honeypot,
          turnstileToken: input.turnstileToken,
        },
      },
    );

    if (error) {
      return {
        success: false,
        error: "Não foi possível registrar o pedido agora. Tente novamente em instantes.",
      };
    }

    if (data?.status === "turnstile_failed") {
      return {
        success: false,
        error: "A verificação anti-spam expirou ou foi rejeitada. Confirme novamente.",
      };
    }

    if (data?.status !== "created" && data?.status !== "already_submitted") {
      return {
        success: false,
        error: "Não foi possível registrar o pedido.",
      };
    }

    const id = leadIdFromPayload(data);
    if (!id) {
      return {
        success: false,
        error: "O pedido foi processado sem um identificador válido.",
      };
    }

    return {
      success: true,
      data: { id },
      deduplicated: data.status === "already_submitted",
    };
  }
}
