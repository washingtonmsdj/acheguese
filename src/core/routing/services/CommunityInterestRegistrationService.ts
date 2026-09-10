import {
  resolveSupabaseFunctionErrorMessage,
  supabase,
} from "@/integrations/supabase";

export type CommunityInterestRole =
  | "morador"
  | "comerciante"
  | "prestador"
  | "visitante"
  | "outro";

export interface RegisterCommunityInterestInput {
  communityId: string | null;
  communitySlug: string | null;
  territoryPath: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: CommunityInterestRole;
  message: string | null;
  wantsUpdates: boolean;
  source: string;
  honeypot: string;
  turnstileToken: string | null;
}

export type RegisterCommunityInterestResult =
  | { status: "registered" }
  | { status: "already_registered" }
  | { status: "turnstile_failed" };

function registrationError(message: string | null): string {
  switch (message) {
    case "invalid_payload":
      return "Revise os dados informados antes de enviar novamente.";
    case "verification_unavailable":
      return "A verificação anti-spam está temporariamente indisponível.";
    case "configuration_unavailable":
      return "O cadastro de interesse está temporariamente indisponível.";
    case "origin_not_allowed":
      return "Não foi possível validar a origem deste cadastro.";
    case "registration_failed":
      return "Não foi possível registrar seu interesse agora.";
    case "Rate limit exceeded":
      return "Muitas tentativas foram feitas em pouco tempo. Tente novamente mais tarde.";
    default:
      return "Falha ao registrar interesse.";
  }
}

export async function registerCommunityInterest(
  input: RegisterCommunityInterestInput,
): Promise<RegisterCommunityInterestResult> {
  const { data, error } = await supabase.functions.invoke("register-community-interest", {
    body: input,
  });
  if (error) {
    const message = await resolveSupabaseFunctionErrorMessage(error);
    throw new Error(registrationError(message));
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Resposta inválida ao registrar interesse.");
  }

  const status = Reflect.get(data, "status");
  if (
    status === "registered" ||
    status === "already_registered" ||
    status === "turnstile_failed"
  ) {
    return { status };
  }

  const applicationError = Reflect.get(data, "error");
  if (typeof applicationError === "string") {
    throw new Error(registrationError(applicationError));
  }

  throw new Error("Resposta inválida ao registrar interesse.");
}
