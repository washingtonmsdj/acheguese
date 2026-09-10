import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any, any, any>>;

export type MfaPolicyReason =
  | "not_enforced"
  | "enrollment_required"
  | "verification_required"
  | "satisfied";

export interface UserMfaPolicyState {
  enforced: boolean;
  required: boolean;
  reason: MfaPolicyReason;
  hasVerifiedFactor: boolean;
  currentLevel: "aal1" | "aal2" | null;
  gracePeriodExpiresAt: string | null;
}

interface MfaTrackerRow {
  id: string;
}

interface VerifiedFactor {
  factor_type?: unknown;
  status?: unknown;
}

function isMfaCapableFactor(factor: VerifiedFactor): boolean {
  return (
    factor.status === "verified" &&
    (factor.factor_type === "totp" ||
      factor.factor_type === "phone" ||
      factor.factor_type === "webauthn")
  );
}

function factorMethod(factor: VerifiedFactor | undefined): string | null {
  if (!factor) return null;
  if (factor.factor_type === "totp") return "totp";
  if (factor.factor_type === "phone") return "sms";
  if (factor.factor_type === "webauthn") return "webauthn";
  return null;
}

async function loadAdminRole(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<"admin" | "super_admin" | null> {
  const { data: roles, error: rolesError } = await supabaseAdmin.rpc(
    "get_user_roles",
    { _user_id: userId },
  );
  if (rolesError) throw rolesError;
  if (!Array.isArray(roles)) {
    throw new Error("Role authority returned an invalid response");
  }

  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("admin")) return "admin";
  return null;
}

async function loadTracker(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<MfaTrackerRow | null> {
  const { data, error } = await supabaseAdmin
    .from("user_mfa_status")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as MfaTrackerRow | null;
}

async function loadVerifiedFactors(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<VerifiedFactor[]> {
  const { data, error } = await supabaseAdmin.auth.admin.mfa.listFactors({
    userId,
  });
  if (error) throw error;
  if (!data || !Array.isArray(data.factors)) {
    throw new Error("Auth MFA factor authority returned an invalid response");
  }

  return (data.factors as VerifiedFactor[]).filter(isMfaCapableFactor);
}

async function reconcileTracker(
  supabaseAdmin: SupabaseClient,
  userId: string,
  tracker: MfaTrackerRow | null,
  verifiedFactors: VerifiedFactor[],
): Promise<void> {
  const firstFactor = verifiedFactors[0];
  const update = {
    mfa_enabled: verifiedFactors.length > 0,
    mfa_method: factorMethod(firstFactor),
    // Achegue-se não habilita recovery codes neste fluxo. Os antigos códigos
    // gerados no browser nunca constituíram uma autoridade real de recuperação.
    backup_codes_generated: false,
    backup_codes_count: 0,
    updated_at: new Date().toISOString(),
  };

  if (tracker?.id) {
    const { error } = await supabaseAdmin
      .from("user_mfa_status")
      .update(update)
      .eq("id", tracker.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabaseAdmin
    .from("user_mfa_status")
    .insert({ user_id: userId, ...update });
  if (error) throw error;
}

async function loadCurrentAal(
  supabaseAdmin: SupabaseClient,
  token: string,
): Promise<"aal1" | "aal2" | null> {
  const { data, error } =
    await supabaseAdmin.auth.mfa.getAuthenticatorAssuranceLevel(token);
  if (error) throw error;

  const level = data?.currentLevel ?? null;
  if (level !== null && level !== "aal1" && level !== "aal2") {
    throw new Error("Auth MFA assurance authority returned an invalid response");
  }
  return level;
}

/**
 * Canonical server-side MFA decision for privileged accounts.
 *
 * Until the pending G42 DDL removes browser DML from `user_mfa_status` and
 * `admin_mfa_enforcement`, neither table is allowed to weaken authorization.
 * Admin/super_admin enforcement is therefore derived solely from the canonical
 * server-owned role read; enrollment comes from verified Auth factors and the
 * current request must carry AAL2. The tracker is written only as a cache.
 *
 * Grace periods and exemptions are intentionally not authorization inputs in
 * this compatibility window. Reintroducing either requires a server-owned,
 * remotely verified source after the pending DDL is promoted.
 */
export async function evaluateUserMfaPolicy(
  supabaseAdmin: SupabaseClient,
  userId: string,
  token: string,
): Promise<UserMfaPolicyState> {
  const adminRole = await loadAdminRole(supabaseAdmin, userId);
  if (!adminRole) {
    return {
      enforced: false,
      required: false,
      reason: "not_enforced",
      hasVerifiedFactor: false,
      currentLevel: null,
      gracePeriodExpiresAt: null,
    };
  }

  const [tracker, verifiedFactors] = await Promise.all([
    loadTracker(supabaseAdmin, userId),
    loadVerifiedFactors(supabaseAdmin, userId),
  ]);
  await reconcileTracker(supabaseAdmin, userId, tracker, verifiedFactors);

  if (verifiedFactors.length === 0) {
    return {
      enforced: true,
      required: true,
      reason: "enrollment_required",
      hasVerifiedFactor: false,
      currentLevel: "aal1",
      gracePeriodExpiresAt: null,
    };
  }

  const currentLevel = await loadCurrentAal(supabaseAdmin, token);
  if (currentLevel !== "aal2") {
    return {
      enforced: true,
      required: true,
      reason: "verification_required",
      hasVerifiedFactor: true,
      currentLevel,
      gracePeriodExpiresAt: null,
    };
  }

  return {
    enforced: true,
    required: false,
    reason: "satisfied",
    hasVerifiedFactor: true,
    currentLevel,
    gracePeriodExpiresAt: null,
  };
}
