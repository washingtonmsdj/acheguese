import { type SupabaseClient as SupabaseClientBase } from "https://esm.sh/@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
type SupabaseClient = SupabaseClientBase<any, any, any>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hasAuthenticatedAudience(audience: unknown): boolean {
  if (audience === "authenticated") return true;
  return Array.isArray(audience) && audience.includes("authenticated");
}

/**
 * Verifies the caller JWT cryptographically and returns only the identity
 * needed by authenticated brokers.
 *
 * Supabase getClaims() verifies asymmetric JWTs against the project's JWKS
 * (cached by the SDK/runtime) instead of calling /auth/v1/user for every
 * request. It still fails closed when the token cannot be verified.
 */
export async function verifyAuthenticatedSubject(
  supabase: SupabaseClient,
  token: string,
): Promise<{ userId: string } | null> {
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;

  const subject = data.claims.sub;
  if (
    typeof subject !== "string" ||
    !UUID_PATTERN.test(subject) ||
    data.claims.role !== "authenticated" ||
    !hasAuthenticatedAudience(data.claims.aud)
  ) {
    return null;
  }

  return { userId: subject };
}
