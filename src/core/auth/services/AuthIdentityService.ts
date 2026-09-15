import { supabase } from "@/integrations/supabase";

export interface LinkedAuthProviders {
  providers: readonly string[];
  hasPassword: boolean;
  hasGoogle: boolean;
}

function readMetadataProviders(appMetadata: Record<string, unknown>): string[] {
  const providers = appMetadata.providers;
  const primaryProvider = appMetadata.provider;
  const values = [
    ...(Array.isArray(providers) ? providers : []),
    ...(typeof primaryProvider === "string" ? [primaryProvider] : []),
  ];

  return values.filter(
    (provider): provider is string =>
      typeof provider === "string" && provider.trim().length > 0,
  );
}

/**
 * Read-only authority for authentication methods linked to the authenticated
 * Supabase user. Provider availability and provider linkage are intentionally
 * separate facts.
 *
 * Supabase exposes providers both through user identities and auth-owned
 * app_metadata. Reading both keeps the account UI truthful immediately after an
 * OAuth account gains email/password login via updateUser({ password }).
 * Password verification itself remains owned by AuthService/Supabase Auth.
 */
export class AuthIdentityService {
  static async getLinkedProviders(): Promise<LinkedAuthProviders> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) {
      throw new Error("Authenticated user unavailable while reading linked providers");
    }

    const identityProviders = (data.user.identities ?? [])
      .map((identity) => identity.provider)
      .filter((provider): provider is string => Boolean(provider));
    const metadataProviders = readMetadataProviders(data.user.app_metadata ?? {});
    const providers = Array.from(new Set([...identityProviders, ...metadataProviders]));

    return {
      providers,
      hasPassword: providers.includes("email"),
      hasGoogle: providers.includes("google"),
    };
  }
}
