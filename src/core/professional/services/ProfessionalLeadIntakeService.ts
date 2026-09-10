import {
  readSupabaseFunctionHttpErrorBody,
  supabase,
} from "@/integrations/supabase";

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

type BrokerSuccessStatus = "created" | "already_submitted";
type BrokerFailureStatus =
  | "turnstile_failed"
  | "invalid_payload"
  | "professional_unavailable"
  | "verification_unavailable"
  | "configuration_unavailable"
  | "database_failed";

type BrokerPayload =
  | {
      status: BrokerSuccessStatus;
      lead?: { id?: unknown };
    }
  | { status: BrokerFailureStatus }
  | { error?: unknown };

function leadIdFromPayload(payload: BrokerPayload | null): string | null {
  if (!payload || !("lead" in payload) || !payload.lead) return null;
  return typeof payload.lead.id === "string" ? payload.lead.id : null;
}

function brokerFailureMessage(status: BrokerFailureStatus): string {
  switch (status) {
    case "turnstile_failed":
      return "A verificação anti-spam expirou ou foi rejeitada. Confirme novamente.";
    case "invalid_payload":
      return "Revise os dados do pedido antes de enviar novamente.";
    case "professional_unavailable":
      return "Este profissional não está recebendo novos pedidos no momento.";
    case "verification_unavailable":
      return "A verificação anti-spam está temporariamente indisponível. Tente novamente em instantes.";
    case "configuration_unavailable":
      return "O envio de pedidos está temporariamente indisponível. Tente novamente mais tarde.";
    case "database_failed":
      return "Não foi possível registrar o pedido agora. Tente novamente em instantes.";
  }
}

function isBrokerFailureStatus(value: unknown): value is BrokerFailureStatus {
  return (
    value === "turnstile_failed" ||
    value === "invalid_payload" ||
    value === "professional_unavailable" ||
    value === "verification_unavailable" ||
    value === "configuration_unavailable" ||
    value === "database_failed"
  );
}

function errorCodeFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const code = Reflect.get(payload, "error");
  return typeof code === "string" ? code : null;
}

function httpFailureMessage(code: string | null): string | null {
  if (!code) return null;
  if (isBrokerFailureStatus(code)) return brokerFailureMessage(code);

  switch (code) {
    case "lead_creation_failed":
      return "Não foi possível registrar o pedido agora. Tente novamente em instantes.";
    case "invalid_or_expired_token":
      return "Sua sessão expirou ou não é mais válida. Entre novamente e reenvie o pedido.";
    case "requester_identity_unavailable":
      return "Não foi possível validar seu perfil agora. Tente novamente em instantes.";
    case "origin_not_allowed":
      return "Não foi possível validar a origem deste pedido.";
    case "Rate limit exceeded":
      return "Muitas tentativas foram feitas em pouco tempo. Aguarde um instante antes de tentar novamente.";
    default:
      return null;
  }
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
      const errorPayload = await readSupabaseFunctionHttpErrorBody(error);
      return {
        success: false,
        error:
          httpFailureMessage(errorCodeFromPayload(errorPayload)) ??
          "Não foi possível registrar o pedido agora. Tente novamente em instantes.",
      };
    }

    if (data && "status" in data && isBrokerFailureStatus(data.status)) {
      return {
        success: false,
        error: brokerFailureMessage(data.status),
      };
    }

    if (
      !data ||
      !("status" in data) ||
      (data.status !== "created" && data.status !== "already_submitted")
    ) {
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
