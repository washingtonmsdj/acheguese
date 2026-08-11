import { supabase } from "@/integrations/supabase";

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

export async function registerCommunityInterest(
  input: RegisterCommunityInterestInput,
): Promise<RegisterCommunityInterestResult> {
  const { data, error } = await supabase.functions.invoke("register-community-interest", {
    body: input,
  });
  if (error) {
    throw new Error("Falha ao registrar interesse.");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Resposta invalida ao registrar interesse.");
  }

  const status = Reflect.get(data, "status");
  if (
    status === "registered" ||
    status === "already_registered" ||
    status === "turnstile_failed"
  ) {
    return { status };
  }

  throw new Error("Resposta invalida ao registrar interesse.");
}
