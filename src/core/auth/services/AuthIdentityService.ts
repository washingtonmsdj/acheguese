import { supabase } from "@/integrations/supabase";

export interface LinkedAuthProviders {
  providers: readonly string[];
  hasPassword: boolean;
  hasGoogle: boolean;
}

/**
 * Read-only authority for identities linked to the authenticated Supabase user.
 * Provider availability and provider linkage are intentionally separate facts.
 *
 * The `email` identity lets account settings distinguish an existing
 * email/password access method from an OAuth-only account, so the UI can say
 * "Alterar senha" or "Criar senha" truthfully. Password-change verification
 * itself belongs to AuthService/Supabase Auth and uses the project's canonical
 * reauthentication policy; this service never validates credentials.
 */
export class AuthIdentityService {
  static async getLinkedProviders(): Promise<LinkedAuthProviders> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      throw new Error("Authenticated user unavailable while reading linked providers");
    }

    const providers = Array.from(
      new Set(
        (data.user.identities ?? [])
          .map((identity) => identity.provider)
          .filter((provider): provider is string => Boolean(provider)),
      ),
    );

    return {
      providers,
      hasPassword: providers.includes("email"),
      hasGoogle: providers.includes("google"),
    };
  }
}
