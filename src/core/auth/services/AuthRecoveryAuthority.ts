import { supabase } from "@/integrations/supabase";

function hasRecoveryAuthenticationMethod(claims: unknown): boolean {
  if (!claims || typeof claims !== "object") return false;

  const amr = Reflect.get(claims, "amr");
  if (!Array.isArray(amr)) return false;

  return amr.some(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      Reflect.get(entry, "method") === "recovery",
  );
}

/**
 * Canonical authority for deciding whether the current verified Supabase JWT
 * belongs to an account-recovery authentication flow.
 *
 * URL markers are routing hints only. Authorization comes from getClaims(),
 * which verifies the access token before exposing the signed AMR claims.
 */
export class AuthRecoveryAuthority {
  static async isCurrentSessionRecovery(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getClaims();
      if (error || !data?.claims) return false;
      return hasRecoveryAuthenticationMethod(data.claims);
    } catch {
      return false;
    }
  }
}
