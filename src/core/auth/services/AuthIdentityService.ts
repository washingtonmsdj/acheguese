import { SessionService } from "@/core/session/services/SessionService";
import { supabase } from "@/integrations/supabase";

export interface LinkedAuthProviders {
  providers: readonly string[];
  hasPassword: boolean;
  hasGoogle: boolean;
}

type AuthIdentityDbClient = {
  rpc<T>(fn: string): Promise<{
    data: T | null;
    error: unknown;
  }>;
};

const authIdentityDb = supabase as unknown as AuthIdentityDbClient;

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
 * Supabase exposes OAuth providers through user identities and auth-owned
 * app_metadata. Password capability is different: it is read from the
 * actor-bound current_user_has_password RPC so the account UI does not infer a
 * credential from provider metadata.
 */
export class AuthIdentityService {
  static async getLinkedProviders(): Promise<LinkedAuthProviders> {
    const user = await SessionService.getVerifiedAuthUser();
    if (!user) {
      throw new Error("Authenticated user unavailable while reading linked providers");
    }

    const { data: hasPassword, error: passwordCapabilityError } =
      await authIdentityDb.rpc<boolean>("current_user_has_password");

    if (passwordCapabilityError) throw passwordCapabilityError;
    if (typeof hasPassword !== "boolean") {
      throw new Error("Password capability authority returned an invalid response");
    }

    const identityProviders = (user.identities ?? [])
      .map((identity) => identity.provider)
      .filter((provider): provider is string => Boolean(provider));
    const metadataProviders = readMetadataProviders(user.app_metadata ?? {});
    const providers = Array.from(new Set([...identityProviders, ...metadataProviders]));

    return {
      providers,
      hasPassword,
      hasGoogle: providers.includes("google"),
    };
  }
}
