import { supabase } from "@/integrations/supabase";

export interface LinkedAuthProviders {
  providers: readonly string[];
  hasGoogle: boolean;
}

/**
 * Read-only authority for identities linked to the authenticated Supabase user.
 * Provider availability and provider linkage are intentionally separate facts.
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
      hasGoogle: providers.includes("google"),
    };
  }
}
