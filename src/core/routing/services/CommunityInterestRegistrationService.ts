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
  userAgent: string | null;
  turnstileToken: string | null;
}

export type RegisterCommunityInterestResult =
  | { status: "registered" }
  | { status: "already_registered" }
  | { status: "turnstile_failed" };

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

type InsertResult = {
  error: SupabaseErrorLike | null;
};

type CommunityInterestDbClient = {
  from(table: "community_interest_registrations"): {
    insert(row: Record<string, unknown>): Promise<InsertResult>;
  };
};

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("verify-turnstile-token", {
    body: { token, action: "community-interest" },
  });

  return !error && Boolean((data as { success?: boolean } | null)?.success);
}

export async function registerCommunityInterest(
  input: RegisterCommunityInterestInput,
): Promise<RegisterCommunityInterestResult> {
  const turnstileVerified = input.turnstileToken
    ? await verifyTurnstileToken(input.turnstileToken)
    : false;

  if (input.turnstileToken && !turnstileVerified) {
    return { status: "turnstile_failed" };
  }

  const { error } = await (supabase as unknown as CommunityInterestDbClient)
    .from("community_interest_registrations")
    .insert({
      community_id: input.communityId,
      community_slug: input.communitySlug,
      territory_path: input.territoryPath,
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      role: input.role,
      message: input.message,
      wants_updates: input.wantsUpdates,
      source: input.source,
      user_agent: input.userAgent,
      turnstile_verified: turnstileVerified,
    });

  if (error?.code === "23505") {
    return { status: "already_registered" };
  }

  if (error) {
    throw new Error(error.message ?? "Falha ao registrar interesse.");
  }

  return { status: "registered" };
}
